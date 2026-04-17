// World state generation — rebuild world snapshot from historical logs
// Author does NOT maintain structured world data; this is all auto-computed

import { supabase } from '../lib/supabase.js';
import { callAI } from './router.js';

export async function generateWorldState() {
  // 1. Collect recent player states
  const { data: activePlayers } = await supabase
    .from('players')
    .select('character_name, level, location, status')
    .eq('status', 'active');

  // 2. Collect recent logs
  const { data: recentLogs } = await supabase
    .from('personal_logs')
    .select('player_id, content')
    .order('created_at', { ascending: false })
    .limit(200);

  // 3. Collect recent world bulletins
  const { data: recentBulletins } = await supabase
    .from('world_bulletins')
    .select('title, content')
    .order('created_at', { ascending: false })
    .limit(10);

  const players = activePlayers || [];
  const logs = recentLogs || [];
  const bulletins = recentBulletins || [];

  // Build summary strings for AI
  const playerSummary = players
    .map(p => `[${p.level}]${p.character_name} @ ${p.location}`)
    .join('\n') || '无';

  const logSummary = logs
    .map(l => `[${l.player_id}] ${l.content}`)
    .join('\n') || '无';

  const eventSummary = bulletins
    .map(b => `#${b.title}\n${b.content}`)
    .join('\n\n') || '无';

  const prompt = `你是一个黑暗修仙世界的叙事者。基于以下玩家近期行为日志和世界事件，生成一段当前世界状态的综述。

## 活跃玩家（${players.length}人）
${playerSummary}

## 近7日玩家日志摘要
${logSummary}

## 近期世界事件公报
${eventSummary}

请生成一段200-400字的世界状态综述，包含：
1. 各区域当前局势（危险程度、势力分布）
2. 近期重要事件对世界的影响
3. 潜在的危机或机遇
4. 修为等级分布概览

直接输出综述文字，不需要额外格式。`;

  try {
    const stateText = await callAI([
      { role: 'system', content: '你是一个黑暗修仙世界的叙事者。' },
      { role: 'user', content: prompt },
    ]);

    // Cache to world_state table
    await supabase.from('world_state').upsert({
      key: 'latest',
      value: stateText,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });

    return stateText;
  } catch (err) {
    console.error('[generateWorldState] AI failed, returning empty state:', err.message);
    return '世界状态暂时无法生成，请稍后再试。';
  }
}

// Quick read of cached world state (no AI call)
export async function getCachedWorldState() {
  const { data } = await supabase
    .from('world_state')
    .select('value')
    .eq('key', 'latest')
    .maybeSingle();

  return data?.value || null;
}
