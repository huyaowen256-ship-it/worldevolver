import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
});

// ── SQL schema to run in Supabase SQL editor to create tables ───────────────
// Run this in Supabase Dashboard → SQL Editor:
//
// CREATE TABLE players (
//   id SERIAL PRIMARY KEY,
//   username TEXT NOT NULL UNIQUE,
//   password_hash TEXT NOT NULL,
//   character_name TEXT NOT NULL,
//   level TEXT DEFAULT '蛰渊境后期',
//   location TEXT DEFAULT '未定',
//   inventory TEXT DEFAULT '[]',
//   status TEXT DEFAULT 'active',
//   joined_at TIMESTAMPTZ DEFAULT NOW(),
//   last_active_at TIMESTAMPTZ,
//   inherited_from INTEGER REFERENCES players(id),
//   karma_rank INTEGER DEFAULT 0,
//   rebirth_count INTEGER DEFAULT 0,
//   meridian_count INTEGER DEFAULT 0
// );
//
// CREATE TABLE commands (
//   id SERIAL PRIMARY KEY,
//   player_id INTEGER NOT NULL REFERENCES players(id),
//   action_text TEXT NOT NULL,
//   supplementary_intent TEXT,
//   status TEXT DEFAULT 'pending',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE daily_results (
//   id SERIAL PRIMARY KEY,
//   player_id INTEGER NOT NULL REFERENCES players(id),
//   command_id INTEGER REFERENCES commands(id),
//   result_text TEXT NOT NULL,
//   status_changes TEXT,
//   status TEXT DEFAULT 'published',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE personal_logs (
//   id SERIAL PRIMARY KEY,
//   player_id INTEGER NOT NULL REFERENCES players(id),
//   content TEXT NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE world_bulletins (
//   id SERIAL PRIMARY KEY,
//   title TEXT NOT NULL,
//   content TEXT NOT NULL,
//   category TEXT DEFAULT 'general',
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE world_state (
//   key TEXT PRIMARY KEY,
//   value TEXT,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// CREATE TABLE author_config (
//   key TEXT PRIMARY KEY,
//   value TEXT,
//   updated_at TIMESTAMPTZ DEFAULT NOW()
// );
//
// -- Disable RLS for now (development), enable later
// ALTER TABLE players ENABLE ROW LEVEL SECURITY;
// ALTER TABLE commands ENABLE ROW LEVEL SECURITY;
// ALTER TABLE daily_results ENABLE ROW LEVEL SECURITY;
// ALTER TABLE personal_logs ENABLE ROW LEVEL SECURITY;
// ALTER TABLE world_bulletins DISABLE ROW LEVEL SECURITY;
// ALTER TABLE world_state DISABLE ROW LEVEL SECURITY;
// ALTER TABLE author_config DISABLE ROW LEVEL SECURITY;
