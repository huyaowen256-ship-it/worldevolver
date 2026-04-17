// Intersection Injector — injects player context into novel chapter writing
// Adapted from plugins/sandbox-engine/intersection_engine.js for database use

import { db, schema } from '../db/index.js';
import { sql } from 'drizzle-orm';

const { players, personalLogs } = schema;

/**
 * Find active players in a given zone.
 * @param {string} zoneName  — e.g. "荒灵原", "幽冥山脉"
 * @param {number} limit     — max players to return
 */
export function getActivePlayersInZone(zoneName, limit = 5) {
  const playersInZone = db.select({
    id: players.id,
    characterName: players.characterName,
    level: players.level,
  })
    .from(players)
    .where(sql`location LIKE ${'%' + zoneName + '%'} AND status = 'active'`)
    .orderBy(sql`joined_at ASC`)
    .limit(limit)
    .all();

  return playersInZone;
}

/**
 * Build a Chinese context paragraph describing active players in a zone.
 * Used by novel writing to inject reader characters as extras in the world.
 *
 * @param {string} zoneName
 * @returns {string} Chinese context paragraph, or empty string if no players
 */
export function buildIntersectionContext(zoneName) {
  const playersInZone = getActivePlayersInZone(zoneName, 5);

  if (playersInZone.length === 0) return '';

  const names = playersInZone.map(p => p.characterName).join('、');
  const levels = playersInZone.map(p => `[${p.level}]`).join('');
  const first = playersInZone[0];

  // Build a vivid context paragraph
  const context = `此间另有${names}等${playersInZone.length}位修士游历于此，修为不等，皆在${zoneName}中寻求机缘。`;

  return context;
}

/**
 * Get player context for a specific chapter scene.
 * Loads recent logs for each player in zone to build richer context.
 */
export function getPlayerContextForScene(zoneName, limitLogs = 3) {
  const playersInZone = getActivePlayersInZone(zoneName, 5);

  const context = playersInZone.map(p => {
    const logs = db.select()
      .from(personalLogs)
      .where(sql`player_id = ${p.id}`)
      .orderBy(sql`created_at DESC`)
      .limit(limitLogs)
      .all();

    const logSummary = logs.map(l => l.content).join('；');

    return {
      characterName: p.characterName,
      level: p.level,
      recentLog: logSummary || '暂无记录',
    };
  });

  return context;
}
