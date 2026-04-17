// Database schema for WorldEvolver
// Uses Drizzle ORM with better-sqlite3

import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

// Players table
export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  characterName: text('character_name').notNull(),
  level: text('level').default('凡人'),
  location: text('location').default('未定'),
  inventory: text('inventory').default('[]'),
  status: text('status').default('active'), // 'active', 'dead', '残魂'
  joinedAt: text('joined_at').default(sql`CURRENT_TIMESTAMP`),
  lastActiveAt: text('last_active_at'),
  // Rebirth / karma inheritance fields
  inheritedFrom: integer('inherited_from').references(() => players.id),
  karmaRank: integer('karma_rank').default(0), // inherited karma level
  rebirthCount: integer('rebirth_count').default(0), // how many times reborn
  meridianCount: integer('meridian_count').default(0), // meridians — affects cultivation potential
});

// Daily commands from players
export const commands = sqliteTable('commands', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: integer('player_id').notNull().references(() => players.id),
  actionText: text('action_text').notNull(),
  supplementaryIntent: text('supplementary_intent'), // optional extra context
  status: text('status').default('pending'), // 'pending', 'processing', 'completed', 'failed'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Daily results from AI arbitration
export const dailyResults = sqliteTable('daily_results', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: integer('player_id').notNull().references(() => players.id),
  commandId: integer('command_id').references(() => commands.id),
  resultText: text('result_text').notNull(), // Chinese result description
  statusChanges: text('status_changes'), // JSON: { level, location, inventory, status }
  status: text('status').default('published'), // 'draft', 'published'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// Personal log entries (extracted from daily results for fast lookup)
export const personalLogs = sqliteTable('personal_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerId: integer('player_id').notNull().references(() => players.id),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// World bulletin (public to all players)
export const worldBulletins = sqliteTable('world_bulletins', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  category: text('category').default('general'), // 'event', 'death', 'discovery', 'war', 'general'
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

// World state cache (auto-rebuilt each batch run, but cached for quick access)
export const worldState = sqliteTable('world_state', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});

// Author config: world rules, main plot settings, dungeon configs
export const authorConfig = sqliteTable('author_config', {
  key: text('key').primaryKey(),
  value: text('value'),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`),
});
