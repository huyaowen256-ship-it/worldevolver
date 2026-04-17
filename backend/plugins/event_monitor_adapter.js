// Event Monitor Adapter — DB layer for world event triggering
// Bridges plugins/sandbox-engine/event_monitor.js logic with Supabase

import { supabase } from '../lib/supabase.js';
import { callAI } from '../ai/router.js';

// Zone thresholds: how many players in a zone triggers an event
const ZONE_THRESHOLDS = {
  '荒灵原': 5,    // matches spec: 荒灵原 危险等级：5（符合 spec）
  '幽冥山脉': 3,
  '天道遗迹': 5,
  '虚空裂隙': 4,
};

// Event templates per zone
const ZONE_EVENT_TEMPLATES = {
  '荒灵原': '荒灵原灵气异动，遗迹显现',
  '幽冥山脉': '幽冥异动，血月降临',
  '天道遗迹': '天道遗迹显现，万年封印动摇',
  '虚空裂隙': '虚空裂隙扩大，魔气外泄',
};

/**
 * Count active players currently in a given zone.
 */
async function countPlayersInZone(zoneName) {
  const { data, count } = await supabase
    .from('players')
    .select('id', { count: 'exact' })
    .like('location', `%${zoneName}%`)
    .eq('status', 'active');

  return count || 0;
}

/**
 * Check all zones and trigger events if thresholds are met.
 * Called at the end of each daily batch run.
 */
export async function triggerWorldEvents() {
  const triggered = [];

  for (const [zone, threshold] of Object.entries(ZONE_THRESHOLDS)) {
    const count = await countPlayersInZone(zone);

    if (count >= threshold) {
      console.log(`🔥 世界事件触发: ${zone} (${count}/${threshold} 人)`);

      const eventTitle = ZONE_EVENT_TEMPLATES[zone] || `${zone}异变`;

      const eventPrompt = [
        { role: 'system', content: '你是一个黑暗修仙世界的叙事者。' },
        {
          role: 'user',
          content: `在${zone}区域，有${count}名修士聚集。触发了一次世界事件：${eventTitle}。

请撰写该事件的详细描述（100-200字），包括：
1. 事件发生的经过
2. 对区域的影响
3. 对在场修士的潜在影响

直接输出事件描述文字。`,
        },
      ];

      try {
        const eventContent = await callAI(eventPrompt);

        await supabase.from('world_bulletins').insert({
          title: eventTitle,
          content: eventContent,
          category: 'event',
        });

        triggered.push({ zone, eventTitle });
        console.log(`✅ 世界事件已记录: ${eventTitle}`);
      } catch (err) {
        console.error(`❌ 世界事件生成失败 (${zone}):`, err.message);
      }
    }
  }

  return triggered;
}

/**
 * Get all configured zone thresholds (for admin display).
 */
export function getZoneThresholds() {
  return ZONE_THRESHOLDS;
}

/**
 * Update a zone threshold (for admin config).
 */
export function setZoneThreshold(zoneName, threshold) {
  ZONE_THRESHOLDS[zoneName] = threshold;
  console.log(`[EventMonitor] 区域阈值已更新: ${zoneName} → ${threshold}`);
}
