// Database initialization for WorldEvolver
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { sql } from 'drizzle-orm';
import * as schema from './schema.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/worldevolver.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const sqlite = new Database(DB_PATH);
sqlite.pragma('journal_mode = WAL');

export const db = drizzle(sqlite, { schema });

// ── Safe migration helper: add column only if it doesn't exist ──
function addColumnIfNotExists(sqlite, table, column, definition) {
  const existing = sqlite.prepare(`PRAGMA table_info(${table})`).all();
  if (!existing.find(c => c.name === column)) {
    sqlite.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

// Initialize tables
export function initDb() {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      character_name TEXT NOT NULL,
      level TEXT DEFAULT '凡人',
      location TEXT DEFAULT '未定',
      inventory TEXT DEFAULT '[]',
      status TEXT DEFAULT 'active',
      joined_at TEXT DEFAULT CURRENT_TIMESTAMP,
      last_active_at TEXT,
      inherited_from INTEGER,
      karma_rank INTEGER DEFAULT 0,
      rebirth_count INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      action_text TEXT NOT NULL,
      supplementary_intent TEXT,
      status TEXT DEFAULT 'pending',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS daily_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      command_id INTEGER REFERENCES commands(id),
      result_text TEXT NOT NULL,
      status_changes TEXT,
      status TEXT DEFAULT 'published',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS personal_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      player_id INTEGER NOT NULL REFERENCES players(id),
      content TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS world_bulletins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      category TEXT DEFAULT 'general',
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS world_state (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS author_config (
      key TEXT PRIMARY KEY,
      value TEXT,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Safe migrations for existing databases (pre-0.2 that lack the new columns)
  addColumnIfNotExists(sqlite, 'players', 'inherited_from', 'INTEGER');
  addColumnIfNotExists(sqlite, 'players', 'karma_rank', 'INTEGER DEFAULT 0');
  addColumnIfNotExists(sqlite, 'players', 'rebirth_count', 'INTEGER DEFAULT 0');
  addColumnIfNotExists(sqlite, 'players', 'meridian_count', 'INTEGER DEFAULT 0');

  console.log('✅ Database initialized');
  return db;
}

export { schema };
