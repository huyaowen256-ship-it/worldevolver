// Daily Batch Processor for WorldEvolver
// Runs at 00:00 every day (called by scheduler or admin trigger)

import { supabase } from '../lib/supabase.js';
import { generateWorldState } from '../ai/generate.js';
import { callAI } from '../ai/router.js';
import { arbiratePrompt, worldBulletinPrompt } from '../ai/prompts/arbitrate.js';
import { triggerWorldEvents } from '../plugins/event_monitor_adapter.js';

export async function runDailyBatch() {
  console.log('=== 每日批处理开始 ===');

  // Step 1: Rebuild world state from historical logs
  console.log('📊 步骤1: 重建世界状态...');
  const worldStateSnapshot = await generateWorldState();
  console.log('世界状态快照已生成');

  // Step 2: Get all pending commands with player info
  const { data: pendingCommands, error: cmdError } = await supabase
    .from('commands')
    .select('*, players(*)')
    .eq('status', 'pending');

  if (cmdError) {
    console.error('获取待处理指令失败:', cmdError);
    throw cmdError;
  }

  console.log(`📋 找到 ${(pendingCommands || []).length} 条待处理指令`);

  if (!pendingCommands || pendingCommands.length === 0) {
    console.log('无待处理指令，跳过 AI 裁定');
    await generateWorldBulletinOnly();
    return { processed: 0 };
  }

  // Step 3: Process each command with AI
  const results = [];
  for (const cmd of pendingCommands) {
    const player = cmd.players;
    try {
      console.log(`⚙️  裁定中: ${player.character_name} - ${cmd.action_text}`);

      const prompt = arbiratePrompt({
        playerName: player.character_name,
        playerLevel: player.level,
        playerLocation: player.location,
        inventory: JSON.parse(player.inventory || '[]'),
        playerHistory: await getPlayerHistory(player.id),
        worldState: worldStateSnapshot,
        actionText: cmd.action_text,
        supplementaryIntent: cmd.supplementary_intent,
      });

      const aiResult = await callAI(prompt);
      const parsed = parseAIResult(aiResult);

      // Save result
      const { error: resultErr } = await supabase
        .from('daily_results')
        .insert({
          player_id: player.id,
          command_id: cmd.id,
          result_text: parsed.resultText,
          status_changes: parsed.statusChanges ? JSON.stringify(parsed.statusChanges) : null,
          status: 'published',
        });

      if (resultErr) console.error('保存裁定结果失败:', resultErr);

      // Save personal log
      await supabase.from('personal_logs').insert({
        player_id: player.id,
        content: parsed.resultText,
      });

      // Update player state
      if (parsed.statusChanges) {
        const updates = { last_active_at: new Date().toISOString() };
        if (parsed.statusChanges.level) updates.level = parsed.statusChanges.level;
        if (parsed.statusChanges.location) updates.location = parsed.statusChanges.location;
        if (parsed.statusChanges.inventory) updates.inventory = JSON.stringify(parsed.statusChanges.inventory);
        if (parsed.statusChanges.status) updates.status = parsed.statusChanges.status;

        await supabase.from('players').update(updates).eq('id', player.id);
      }

      // Mark command as completed
      await supabase.from('commands').update({ status: 'completed' }).eq('id', cmd.id);

      results.push({ player: player.character_name, result: parsed.resultText });
      console.log(`✅ 裁定完成: ${player.character_name}`);
    } catch (err) {
      console.error(`❌ 裁定失败 (${player?.character_name}):`, err.message);
      await supabase.from('commands').update({ status: 'failed' }).eq('id', cmd.id);
    }
  }

  // Step 4: Trigger world events
  console.log('🔥 步骤4: 检查世界事件触发...');
  await triggerWorldEvents();

  // Step 5: Generate world bulletin
  console.log('📰 步骤5: 生成世界公报...');
  await generateWorldBulletin(worldStateSnapshot, results);

  console.log(`=== 每日批处理完成: ${results.length} 条裁定 ===`);
  return { processed: results.length };
}

async function generateWorldBulletin(worldStateSnapshot, results) {
  try {
    const prompt = worldBulletinPrompt({
      worldState: worldStateSnapshot,
      todayResults: results,
    });

    const bulletinText = await callAI(prompt);

    const lines = bulletinText.trim().split('\n');
    const title = lines[0].replace(/^#+\s*/, '').trim() || '今日世界动态';
    const content = lines.slice(1).join('\n').trim() || bulletinText.trim();

    let category = 'general';
    if (bulletinText.includes('死亡') || bulletinText.includes('陨落')) category = 'death';
    else if (bulletinText.includes('遗迹') || bulletinText.includes('秘境')) category = 'discovery';
    else if (bulletinText.includes('战争') || bulletinText.includes('围杀')) category = 'war';
    else if (bulletinText.includes('事件') || bulletinText.includes('触发')) category = 'event';

    const { error } = await supabase.from('world_bulletins').insert({ title, content, category });
    if (error) console.error('发布世界公报失败:', error);
    else console.log(`📰 世界公报已发布: ${title}`);
  } catch (err) {
    console.error('生成世界公报失败:', err.message);
  }
}

async function generateWorldBulletinOnly() {
  const worldStateSnapshot = await generateWorldState();
  await generateWorldBulletin(worldStateSnapshot, []);
}

async function getPlayerHistory(playerId) {
  const { data: logs } = await supabase
    .from('personal_logs')
    .select('content')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(7);

  return (logs || []).map(l => l.content).join('\n');
}

function parseAIResult(text) {
  const jsonMatch = text.match(/\{[\s\S]*"resultText"[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        resultText: parsed.resultText || text.replace(jsonMatch[0], '').trim(),
        statusChanges: parsed.statusChanges || null,
      };
    } catch {}
  }
  return { resultText: text.trim(), statusChanges: null };
}
