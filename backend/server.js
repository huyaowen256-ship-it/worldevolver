// WorldEvolver Backend Server
// Express + Supabase + AI Router + Daily Batch Scheduler

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '.env') });

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cron from 'node-cron';

import { supabase } from './lib/supabase.js';
import { runDailyBatch } from './batch/runDaily.js';
import { callAI } from './ai/router.js';
import { readFileSync } from 'fs';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'worldevolver-secret-key-change-in-production';

// Level ordering for cultivation world (higher = stronger)
const LEVEL_ORDER = {
  '凡人': 0,
  '蛰渊境': 1,
  '蛰渊境初期': 1,
  '蛰渊境中期': 1.5,
  '蛰渊境后期': 2,
  '蛰渊境巅峰': 2.5,
  '汲泉境': 3,
  '汲泉境初期': 3,
  '汲泉境中期': 3.5,
  '汲泉境后期': 4,
  '汲泉境巅峰': 4.5,
  '凝丹境': 5,
  '凝丹境初期': 5,
  '凝丹境中期': 5.5,
  '凝丹境后期': 6,
  '凝丹境巅峰': 6.5,
  '通玄境': 7,
  '通玄境初期': 7,
  '通玄境中期': 7.5,
  '通玄境后期': 8,
  '通玄境巅峰': 8.5,
  '化神境': 9,
  '化神境初期': 9,
  '化神境中期': 9.5,
  '化神境后期': 10,
  '化神境巅峰': 10.5,
  '超凡境': 11,
  '大乘期': 12,
  '渡劫期': 13,
  '真仙': 14,
};

function getLevelScore(level) {
  return LEVEL_ORDER[level] ?? 0;
}

function orderPlayersByRank(players) {
  // Sort by actual rank field (from players table), then by level for players without rank
  return [...players]
    .sort((a, b) => {
      // Players with rank field come first (NPCs), sorted by rank ascending
      const rankA = a.rank ?? 999;
      const rankB = b.rank ?? 999;
      if (rankA !== rankB) return rankA - rankB;
      // For players without rank (new registrations), sort by level score
      const scoreA = getLevelScore(a.level);
      const scoreB = getLevelScore(b.level);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(a.joined_at || 0) - new Date(b.joined_at || 0);
    })
    .map((p, i) => ({ ...p, displayRank: i + 1 }));
}

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json());

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================
// Auth Middleware
// ============================================================
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    req.playerId = decoded.playerId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效' });
  }
}

function adminAuthMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未授权' });
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.isAdmin) {
      return res.status(403).json({ error: '需要管理员权限' });
    }
    req.playerId = decoded.playerId;
    next();
  } catch {
    return res.status(401).json({ error: 'Token 无效' });
  }
}

// ============================================================
// Auth Routes
// ============================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, characterName } = req.body;

    if (!username || !password || !characterName) {
      return res.status(400).json({ error: '用户名、密码和角色名不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('username', username)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { data: result, error } = await supabase
      .from('players')
      .insert({
        username,
        password_hash: passwordHash,
        character_name: characterName,
        level: '蛰渊境初期',
        location: '天机宗外门',
        inventory: '[]',
        status: 'active',
        karma_rank: 0,
        rebirth_count: 0,
        meridian_count: Math.floor(Math.random() * 3) + 4,
      })
      .select()
      .single();

    if (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: '注册失败: ' + error.message });
    }

    const token = jwt.sign({ playerId: result.id, isAdmin: false }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      player: {
        id: result.id,
        username: result.username,
        characterName: result.character_name,
        level: result.level,
        location: result.location,
        status: result.status,
      }
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: '注册失败' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('username', username)
      .maybeSingle();

    if (error || !player) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const valid = await bcrypt.compare(password, player.password_hash);
    if (!valid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    await supabase
      .from('players')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', player.id);

    const token = jwt.sign({ playerId: player.id, isAdmin: false }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      token,
      player: {
        id: player.id,
        username: player.username,
        characterName: player.character_name,
        level: player.level,
        location: player.location,
        status: player.status,
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: '登录失败' });
  }
});

// ============================================================
// Player Routes
// ============================================================

// Get current player profile
app.get('/api/player/me', authMiddleware, async (req, res) => {
  try {
    const { data: player, error } = await supabase
      .from('players')
      .select('*')
      .eq('id', req.playerId)
      .maybeSingle();

    if (error || !player) {
      return res.status(404).json({ error: '玩家不存在' });
    }

    // Compute rank
    const { data: activePlayers } = await supabase
      .from('players')
      .select('id, level, joined_at')
      .eq('status', 'active');

    const ranked = orderPlayersByRank(activePlayers || []);
    const myEntry = ranked.find(p => p.id === req.playerId);
    const rank = myEntry?.rank ?? ranked.length + 1;

    res.json({
      id: player.id,
      username: player.username,
      characterName: player.character_name,
      level: player.level,
      location: player.location,
      inventory: JSON.parse(player.inventory || '[]'),
      status: player.status,
      joinedAt: player.joined_at,
      karmaRank: player.karma_rank || 0,
      inheritedFrom: player.inherited_from || null,
      rebirthCount: player.rebirth_count || 0,
      meridianCount: player.meridian_count || 0,
      rank,
    });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: '获取玩家信息失败' });
  }
});

// Submit daily command
app.post('/api/command', authMiddleware, async (req, res) => {
  try {
    const { actionText, supplementaryIntent } = req.body;

    if (!actionText || actionText.trim().length === 0) {
      return res.status(400).json({ error: '指令不能为空' });
    }

    const today = new Date().toISOString().slice(0, 10);

    const { data: existing } = await supabase
      .from('commands')
      .select('id')
      .eq('player_id', req.playerId)
      .gte('created_at', today)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: '今日已提交指令', existingCommand: existing });
    }

    const { data: result, error } = await supabase
      .from('commands')
      .insert({
        player_id: req.playerId,
        action_text: actionText.trim(),
        supplementary_intent: supplementaryIntent?.trim() || null,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Submit command error:', error);
      return res.status(500).json({ error: '提交指令失败' });
    }

    res.json({ success: true, command: result });
  } catch (err) {
    console.error('Submit command error:', err);
    res.status(500).json({ error: '提交指令失败' });
  }
});

// Get today's command
app.get('/api/command/today', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().slice(0, 10);

    const { data: cmd } = await supabase
      .from('commands')
      .select('*')
      .eq('player_id', req.playerId)
      .gte('created_at', today)
      .maybeSingle();

    if (!cmd) {
      return res.json({ hasSubmitted: false, command: null });
    }

    const { data: result } = await supabase
      .from('daily_results')
      .select('*')
      .eq('command_id', cmd.id)
      .maybeSingle();

    res.json({ hasSubmitted: true, command: cmd, result });
  } catch (err) {
    console.error('Get today command error:', err);
    res.status(500).json({ error: '获取今日指令失败' });
  }
});

// Get personal logs
app.get('/api/logs', authMiddleware, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;

    const { data: logs, error } = await supabase
      .from('personal_logs')
      .select('*')
      .eq('player_id', req.playerId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get logs error:', error);
      return res.status(500).json({ error: '获取日志失败' });
    }

    res.json({ logs: logs || [] });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: '获取日志失败' });
  }
});

// ============================================================
// World Routes
// ============================================================

// Get world bulletins (public)
app.get('/api/world/bulletins', async (_req, res) => {
  try {
    const limit = parseInt(_req.query.limit) || 20;

    const { data: bulletins, error } = await supabase
      .from('world_bulletins')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Get bulletins error:', error);
      return res.status(500).json({ error: '获取世界公报失败' });
    }

    res.json({ bulletins: bulletins || [] });
  } catch (err) {
    console.error('Get bulletins error:', err);
    res.status(500).json({ error: '获取世界公报失败' });
  }
});

// Get leaderboard
app.get('/api/ranking', async (req, res) => {
  try {
    // Get current player ID from auth header for isMe flag
    let currentPlayerId = null;
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = jwt.verify(token, JWT_SECRET);
        currentPlayerId = decoded.playerId;
      } catch {}
    }

    const { data: allPlayers, error } = await supabase
      .from('players')
      .select('*')
      .eq('status', 'active')
      .limit(100);

    if (error) {
      console.error('Get ranking error:', error);
      return res.status(500).json({ error: '获取排行榜失败' });
    }

    const ranked = orderPlayersByRank(allPlayers || []);
    const ranking = ranked.map(p => ({
      rank: p.rank ?? p.displayRank,
      id: p.id,
      characterName: p.character_name,
      level: p.level,
      location: p.location,
      karmaRank: p.karma_rank || 0,
      meridianCount: p.meridian_count || 0,
      rebirthCount: p.rebirth_count || 0,
      isMe: p.id === currentPlayerId,
    }));

    res.json({ ranking });
  } catch (err) {
    console.error('Get ranking error:', err);
    res.status(500).json({ error: '获取排行榜失败' });
  }
});

// Get graveyard (dead players)
app.get('/api/graveyard', async (_req, res) => {
  try {
    const { data: dead, error } = await supabase
      .from('players')
      .select('*')
      .in('status', ['dead', '残魂'])
      .order('last_active_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Get graveyard error:', error);
      return res.status(500).json({ error: '获取墓场失败' });
    }

    res.json({ deadPlayers: dead || [] });
  } catch (err) {
    console.error('Get graveyard error:', err);
    res.status(500).json({ error: '获取墓场失败' });
  }
});

// ============================================================
// Rebirth / Karma Inheritance Routes
// ============================================================

// Get dead players available for karma inheritance (public)
app.get('/api/rebirth/options', async (_req, res) => {
  try {
    const { data: deadPlayers, error } = await supabase
      .from('players')
      .select('id, character_name, level, location, karma_rank, last_active_at')
      .in('status', ['dead', '残魂'])
      .order('karma_rank', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Get rebirth options error:', error);
      return res.status(500).json({ error: '获取可继承角色失败' });
    }

    const options = (deadPlayers || []).map(p => ({
      id: p.id,
      characterName: p.character_name,
      level: p.level,
      location: p.location,
      karmaRank: p.karma_rank || 0,
      lastActiveAt: p.last_active_at,
    }));

    res.json({ options });
  } catch (err) {
    console.error('Get rebirth options error:', err);
    res.status(500).json({ error: '获取可继承角色失败' });
  }
});

// Perform karma inheritance rebirth (auth required)
app.post('/api/rebirth/inherit', authMiddleware, async (req, res) => {
  try {
    const { inheritedPlayerId, newUsername, newPassword, newCharacterName } = req.body;

    if (!inheritedPlayerId || !newUsername || !newPassword || !newCharacterName) {
      return res.status(400).json({ error: '缺少必填字段' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: '密码至少6位' });
    }

    const { data: inherited, error: inheritErr } = await supabase
      .from('players')
      .select('*')
      .eq('id', inheritedPlayerId)
      .maybeSingle();

    if (inheritErr || !inherited) {
      return res.status(404).json({ error: '被继承的角色不存在' });
    }
    if (inherited.status !== 'dead' && inherited.status !== '残魂') {
      return res.status(400).json({ error: '只能继承陨落或残魂状态的角色' });
    }

    const { data: existing } = await supabase
      .from('players')
      .select('id')
      .eq('username', newUsername)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ error: '用户名已存在' });
    }

    // Calculate karma bonus
    const karmaLevel = inherited.karma_rank || 0;
    const inheritedLevel = getLevelScore(inherited.level);
    const bonusKarma = Math.floor(inheritedLevel * 10) + karmaLevel;

    const passwordHash = await bcrypt.hash(newPassword, 10);

    const { data: newPlayer, error: insertErr } = await supabase
      .from('players')
      .insert({
        username: newUsername,
        password_hash: passwordHash,
        character_name: newCharacterName,
        level: inherited.level || '蛰渊境初期',
        location: inherited.location || '未定',
        inventory: '[]',
        status: 'active',
        inherited_from: inheritedPlayerId,
        karma_rank: bonusKarma,
        rebirth_count: 1,
      })
      .select()
      .single();

    if (insertErr) {
      console.error('Rebirth inherit error:', insertErr);
      return res.status(500).json({ error: '因果继承失败' });
    }

    // Mark inherited player as lingering soul
    await supabase
      .from('players')
      .update({ status: '残魂' })
      .eq('id', inheritedPlayerId);

    // Log the rebirth event
    await supabase.from('personal_logs').insert({
      player_id: newPlayer.id,
      content: `【因果继承】${newCharacterName} 继承陨落者 ${inherited.character_name} 之因果，携 ${bonusKarma} 级因果之力重返修行路。`,
    });

    const token = jwt.sign({ playerId: newPlayer.id, isAdmin: false }, JWT_SECRET, { expiresIn: '30d' });

    res.json({
      success: true,
      token,
      player: {
        id: newPlayer.id,
        username: newPlayer.username,
        characterName: newPlayer.character_name,
        level: newPlayer.level,
        location: newPlayer.location,
        karmaRank: bonusKarma,
        inheritedFrom: inherited.character_name,
      }
    });
  } catch (err) {
    console.error('Rebirth inherit error:', err);
    res.status(500).json({ error: '因果继承失败: ' + err.message });
  }
});

// ============================================================
// Admin Routes (Author Dashboard)
// ============================================================

app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin-change-me';

    const valid = await bcrypt.compare(password, await bcrypt.hash(adminPassword, 10));
    if (!valid) {
      return res.status(401).json({ error: '管理员密码错误' });
    }

    const token = jwt.sign({ playerId: 0, isAdmin: true }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token });
  } catch (err) {
    console.error('Admin login error:', err);
    res.status(500).json({ error: '管理员登录失败' });
  }
});

// Get all commands (admin view)
app.get('/api/admin/commands', adminAuthMiddleware, async (_req, res) => {
  try {
    const { data: cmds, error } = await supabase
      .from('commands')
      .select('*, players(id, character_name, level, location)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Admin get commands error:', error);
      return res.status(500).json({ error: '获取指令列表失败' });
    }

    const commands = (cmds || []).map(cmd => ({
      id: cmd.id,
      player_id: cmd.player_id,
      action_text: cmd.action_text,
      supplementary_intent: cmd.supplementary_intent,
      status: cmd.status,
      created_at: cmd.created_at,
      player: cmd.players ? {
        id: cmd.players.id,
        characterName: cmd.players.character_name,
        level: cmd.players.level,
        location: cmd.players.location,
      } : null,
    }));

    res.json({ commands });
  } catch (err) {
    console.error('Admin get commands error:', err);
    res.status(500).json({ error: '获取指令列表失败' });
  }
});

// Get world state (admin view)
app.get('/api/admin/world-state', adminAuthMiddleware, async (_req, res) => {
  try {
    const { data: state, error } = await supabase
      .from('world_state')
      .select('*');

    if (error) {
      console.error('Admin get world state error:', error);
      return res.status(500).json({ error: '获取世界状态失败' });
    }

    res.json({ state: state || [] });
  } catch (err) {
    console.error('Admin get world state error:', err);
    res.status(500).json({ error: '获取世界状态失败' });
  }
});

// Update author config
app.put('/api/admin/config/:key', adminAuthMiddleware, async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;

    const { error } = await supabase
      .from('author_config')
      .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() }, { onConflict: 'key' });

    if (error) {
      console.error('Admin update config error:', error);
      return res.status(500).json({ error: '更新配置失败' });
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Admin update config error:', err);
    res.status(500).json({ error: '更新配置失败' });
  }
});

// Get author config
app.get('/api/admin/config/:key', adminAuthMiddleware, async (req, res) => {
  try {
    const { key } = req.params;

    const { data: config, error } = await supabase
      .from('author_config')
      .select('*')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.error('Admin get config error:', error);
      return res.status(500).json({ error: '获取配置失败' });
    }

    res.json({ config: config ? { key: config.key, value: JSON.parse(config.value) } : null });
  } catch (err) {
    console.error('Admin get config error:', err);
    res.status(500).json({ error: '获取配置失败' });
  }
});

// Manually trigger daily batch
app.post('/api/admin/batch/trigger', adminAuthMiddleware, async (req, res) => {
  try {
    console.log('🔔 Manual batch triggered by admin');
    const result = await runDailyBatch();
    res.json({ success: true, result });
  } catch (err) {
    console.error('Manual batch error:', err);
    res.status(500).json({ error: '批处理失败: ' + err.message });
  }
});

// Get batch status
app.get('/api/admin/batch/status', adminAuthMiddleware, async (_req, res) => {
  try {
    const { data: lastBulletin } = await supabase
      .from('world_bulletins')
      .select('created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: pendingCommands } = await supabase
      .from('commands')
      .select('id', { count: 'exact' })
      .eq('status', 'pending');

    res.json({
      lastBatchAt: lastBulletin?.created_at || null,
      pendingCommands: pendingCommands?.length || 0,
    });
  } catch (err) {
    console.error('Get batch status error:', err);
    res.status(500).json({ error: '获取批处理状态失败' });
  }
});

// ─── Novel Writing ──────────────────────────────────────────────

function readSpecFile(relativePath) {
  try {
    const fullPath = path.join(__dirname, '../../spec', relativePath);
    return readFileSync(fullPath, 'utf-8');
  } catch {
    return null;
  }
}

app.post('/api/admin/novel/generate', adminAuthMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt?.trim()) {
      return res.status(400).json({ error: 'prompt 不能为空' });
    }

    const specText = readSpecFile('stories/worldevolver/specification.md') || '';
    const creativePlan = readSpecFile('stories/worldevolver/creative-plan.md') || '';
    const characterState = readSpecFile('tracking/character-state.json') || '';
    const plotTracker = readSpecFile('tracking/plot-tracker.json') || '';
    const worldSetting = readSpecFile('knowledge/world-setting.md') || '';

    const systemPrompt = `你是一个黑暗修仙小说作家，严格遵循以下写作宪法：

## 核心原则
- 严格第三人称限制视角（仅跟随主角叶无痕）
- 禁止剧情护盾：高风险等于真实危险
- 因果闭环：每个结果必须有前因
- 死亡真实，复活艰难
- 世界1:1时间流速（1现实日=1世界日）

## 文风要求
- 中国古典仙侠风格
- 动作描写简洁有力
- 心理描写克制
- 环境描写服务于氛围
- 禁止AI腔调：不用"值得注意的是"等套话
- 控制节奏：冲突→转折→新冲突

## 当前世界状态
${worldSetting.slice(0, 2000)}

## 当前情节状态
${plotTracker.slice(0, 1000)}

## 角色状态
${characterState.slice(0, 2000)}

## 创作计划
${creativePlan.slice(0, 1000)}

请严格以主角叶无痕视角创作，输出简体中文，不使用markdown代码块。`;

    const completion = await callAI(systemPrompt, prompt);
    res.json({ completion });
  } catch (err) {
    console.error('Novel generate error:', err);
    res.status(500).json({ error: '生成失败: ' + err.message });
  }
});

// ─── World State Routes (Public) ──────────────────────────────────

app.get('/api/world/state', async (_req, res) => {
  try {
    const { data: state, error } = await supabase
      .from('world_state')
      .select('*');

    if (error) {
      console.error('Get world state error:', error);
      return res.status(500).json({ error: '获取世界状态失败' });
    }

    const stateObj = {};
    (state || []).forEach(row => { stateObj[row.key] = row.value; });
    res.json({ state: stateObj });
  } catch (err) {
    console.error('Get world state error:', err);
    res.status(500).json({ error: '获取世界状态失败' });
  }
});

// ─── Novel Character Routes (Public) ────────────────────────────────

app.get('/api/characters', async (req, res) => {
  try {
    const { data: characters, error } = await supabase
      .from('novel_characters')
      .select('*')
      .order('rank_position', { ascending: true, nullsFirst: false });

    if (error) {
      console.error('Get characters error:', error);
      return res.status(500).json({ error: '获取角色列表失败' });
    }

    res.json({ characters: characters || [] });
  } catch (err) {
    console.error('Get characters error:', err);
    res.status(500).json({ error: '获取角色列表失败' });
  }
});

app.get('/api/characters/:name', async (req, res) => {
  try {
    const { name } = req.params;

    const { data: character, error } = await supabase
      .from('novel_characters')
      .select('*')
      .ilike('name', name)
      .maybeSingle();

    if (error) {
      console.error('Get character error:', error);
      return res.status(500).json({ error: '获取角色信息失败' });
    }

    if (!character) {
      return res.status(404).json({ error: '角色不存在' });
    }

    res.json({ character });
  } catch (err) {
    console.error('Get character error:', err);
    res.status(500).json({ error: '获取角色信息失败' });
  }
});

// ─── Start server ─────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`✅ WorldEvolver backend running on http://localhost:${PORT}`);
  console.log(`📡 Supabase: ${process.env.SUPABASE_URL}`);
});
