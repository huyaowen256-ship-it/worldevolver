// ── Seed script for WorldEvolver
// Populates Supabase with real novel world state, NPC rankings, and world bulletins
// Run with: node seed.js
//
// Prerequisites:
// 1. Create tables in Supabase SQL Editor using the schema in lib/supabase.js
// 2. Ensure SUPABASE_URL and SUPABASE_ANON_KEY are set in .env

import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// ── Real novel data from spec/ ──────────────────────────
//
// NPC disciple rankings from the novel:
// 1. 林昊: 蛰渊境巅峰, 9脉极品灵根, 外门第一
// 2. 叶无痕: 蛰渊境后期, 6脉中品灵根, 外门第89名 (protagonist)
// 3. 秦铁: 蛰渊境巅峰, 7脉上品灵根, 外门第七
// 4. 韩师妹: 蛰渊境中期, 5脉中品灵根, 外门
// 5. 周师兄: 蛰渊境中期, 5脉中品灵根, 外门
//
// From spec/knowledge/characters/lin-hao.md and spec/tracking/character-state.json

const npcRankings = [
  // Top disciples from the novel (sorted by rank as per plan)
  { rank: 1,  characterName: '林昊',   level: '蛰渊境巅峰', location: '天机宗外门',   meridianCount: 9, karmaRank: 0 },
  { rank: 89, characterName: '叶无痕', level: '蛰渊境后期', location: '后山石林',    meridianCount: 6, karmaRank: 0 }, // protagonist
  { rank: 3,  characterName: '秦铁',   level: '蛰渊境巅峰', location: '天机宗外门',   meridianCount: 7, karmaRank: 0 },
  { rank: 4,  characterName: '韩师妹', level: '蛰渊境中期', location: '天机宗外门',   meridianCount: 5, karmaRank: 0 },
  { rank: 5,  characterName: '周师兄', level: '蛰渊境中期', location: '天机宗外门',   meridianCount: 5, karmaRank: 0 },
  { rank: 6,  characterName: '赵无极', level: '蛰渊境巅峰', location: '天机宗外门',   meridianCount: 7, karmaRank: 0 },
  { rank: 7,  characterName: '钱多多', level: '蛰渊境巅峰', location: '天机宗外门',   meridianCount: 7, karmaRank: 0 },
  { rank: 8,  characterName: '孙鹏',   level: '蛰渊境巅峰', location: '天机宗外门',   meridianCount: 7, karmaRank: 0 },
  { rank: 9,  characterName: '李青峰', level: '蛰渊境后期', location: '天机宗外门',   meridianCount: 6, karmaRank: 0 },
  { rank: 10, characterName: '陈墨',   level: '蛰渊境后期', location: '天机宗外门',   meridianCount: 6, karmaRank: 0 },
];

const worldStateEntries = [
  { key: 'world_day', value: '倒数第10天' },
  { key: 'world_season', value: '春季' },
  { key: 'protagonist_level', value: '蛰渊境后期' },
  { key: 'protagonist_rank', value: '外门第89名' },
  { key: 'protagonist_location', value: '后山石林' },
  { key: 'world_event', value: '月度大比倒计时：不足10天' },
  { key: 'completed_chapters', value: '1-5' },
  { key: 'pending_threat', value: '大比进不了前15%者将被逐出宗门！' },
  { key: 'main_plot', value: '外门求存与大比逆袭' },
  { key: 'protagonist_skills', value: '液态水银灵力,古碑阵纹,崩雷绝影步' },
];

const worldBulletins = [
  {
    title: '外门月度大比倒计时',
    content: '距下月外门大比不足十日！根据宗门新规，连续两个月排名末位15%者将被逐出宗门。当前处于第89名的叶无痕若再无突破，将被永远逐出天机宗。',
    category: 'event',
    daysAgo: 0,
  },
  {
    title: '叶无痕荒灵原越阶击杀铁鳞豹',
    content: '第127天，外门弟子叶无痕于荒灵原北侧以蛰渊境后期修为越阶斩杀五阶铁鳞豹，展现惊人战力！此事在外门底层弟子间引发轩然大波。',
    category: 'event',
    daysAgo: 2,
  },
  {
    title: '林昊当众孤立叶无痕',
    content: '外门第一人林昊于露天饭堂公开宣布对叶无痕实施资源封杀，勒令其他弟子不得与叶无痕来往。此举令叶无痕反而获得了绝佳的隐秘修炼时间。',
    category: 'general',
    daysAgo: 3,
  },
  {
    title: '荒灵原遗迹古碑发现',
    content: '叶无痕在荒灵原北侧深处发现散发暗红波动的神秘古碑，碑上残缺阵纹与叶无痕体内封印产生强烈共鸣。叶无痕拓印碑纹后将其重新掩埋。',
    category: 'discovery',
    daysAgo: 5,
  },
  {
    title: '叶无痕精进第五条经脉',
    content: '叶无痕以血描古碑阵纹，冒着经脉崩溃的风险强行精进第五条经脉，成功踏入五脉修士行列。同日，其于藏经阁换取残缺身法《崩雷绝影步》。',
    category: 'event',
    daysAgo: 6,
  },
  {
    title: '外门格局：林昊稳居榜首',
    content: '外门排行榜显示，林昊以蛰渊境巅峰、九脉极品灵根稳居第一，独占鳌头。外门前十名均已达蛰渊境巅峰，底层弟子晋升空间日趋逼仄。',
    category: 'general',
    daysAgo: 7,
  },
];

// ── Helpers ──────────────────────────────────────────────────────

async function upsertWorldState(key, value) {
  const { error } = await supabase
    .from('world_state')
    .upsert({ key, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
  if (error) console.error(`  ❌ world_state.${key}:`, error.message);
  else console.log(`  ✅ 世界状态: ${key} = ${value}`);
}

async function insertBulletin(bulletin) {
  const createdAt = new Date(Date.now() - bulletin.daysAgo * 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase.from('world_bulletins').insert({
    title: bulletin.title,
    content: bulletin.content,
    category: bulletin.category,
    created_at: createdAt,
  });
  if (error) console.error(`  ❌ bulletin: ${bulletin.title}:`, error.message);
  else console.log(`  📰 公报: ${bulletin.title}`);
}

async function upsertWorldStateEntries() {
  console.log('\n🌍 同步世界状态...');
  for (const entry of worldStateEntries) {
    await upsertWorldState(entry.key, entry.value);
  }
}

async function seedWorldBulletins() {
  console.log('\n📰 同步世界公报...');
  for (const b of worldBulletins) {
    await insertBulletin(b);
  }
}

async function seedPlayers() {
  console.log('\n⚔️  同步天机宗弟子排名（小说真实NPC）...');
  // Delete all existing players first (avoids upsert rank-field issues)
  await supabase.from('players').delete().neq('id', 0);
  const { error } = await supabase.from('players').insert(
    npcRankings.map(npc => ({
      username: npc.characterName,
      password_hash: '',
      character_name: npc.characterName,
      level: npc.level,
      location: npc.location,
      status: 'active',
      inventory: '[]',
      karma_rank: npc.karmaRank,
      meridian_count: npc.meridianCount,
      rebirth_count: 0,
      inherited_from: null,
      rank: npc.rank,
    }))
  );
  if (error) console.error('  ❌ seedPlayers error:', error.message);
  else {
    npcRankings.forEach(p => {
      const marker = p.characterName === '叶无痕' ? ' [主角]' : '';
      console.log(`  ⚔️  #${p.rank} ${p.characterName} | ${p.level} | ${p.meridianCount}脉${marker}`);
    });
  }
}

// ── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('🌱 开始同步真实小说世界数据到 Supabase...\n');
  console.log(`📡 Supabase: ${supabaseUrl}`);

  await upsertWorldStateEntries();
  await seedWorldBulletins();
  await seedPlayers();

  console.log('\n✅ 同步完成！');
  console.log('\n📊 当前天机宗外门弟子排名（小说真实数据）:');

  npcRankings.slice(0, 10).forEach((p) => {
    const marker = p.characterName === '叶无痕' ? ' [主角]' : '';
    console.log(`  ${String(p.rank).padStart(2, ' ')}. ${p.characterName} | ${p.level} | ${p.meridianCount}脉${marker}`);
  });

  console.log('\n🔑 排行榜展示的是小说世界真实弟子格局（NPC数据）');
  console.log('   注册玩家的排名将与NPC一同竞争');
  console.log('\n📝 下一步: 在 Supabase SQL Editor 中运行 lib/supabase.js 中的建表语句');
}

main().catch(err => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
