# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> ⚠️ **启动必读**：每次新对话开始前，必须先用 Read 工具读取以下文件，了解当前项目状态：
> - `memory/project-status.md` — 项目状态快照（技术栈、进度、版本历史、已知坑点）
> - `memory/MEMORY.md` — 项目记忆索引
>
> 不读取就直接动手干活，会因为不了解上下文而重复踩坑或破坏已有成果。这是硬性要求。

## Project Overview

**WorldEvolver · 世界演化者** is an AI-driven reader co-creation web novel ecosystem with two distinct components:

1. **Novel Writing System** (`spec/`, `.specify/`, `.gemini/`, `plugins/`) — a spec-driven novel创作 workflow
2. **Reader Web App** (`web/`) — a Next.js website where readers interact with the story

---

## Development Commands

### Web App (`web/`)
```bash
cd web
npm run dev      # Start dev server at http://localhost:3000
npm run build    # Production build
npm run start    # Start production server
```

### Spec/Novel Workflow (Novel Writer 技能命令)

本项目使用 **novel-writer** (github.com/wordflowlab/novel-writer) 的 spec-driven 方法论。所有创作命令已注册为 Claude Code Skill，可直接通过 `/novel:xxx` 或 `/speckit:xxx` 斜杠命令调用。

#### 七步方法论命令（核心）

| 命令 | 说明 |
|------|------|
| `/novel:constitution` | 创建或更新小说创作宪法（定义核心原则） |
| `/novel:specify` | 定义故事规格，支持渐进式层级（Logline→完整规格） |
| `/novel:clarify` | 通过交互式问答澄清故事大纲中的模糊决策点 |
| `/novel:plan` | 基于故事规格制定技术实现方案（创作计划） |
| `/novel:tasks` | 将创作计划分解为可执行的任务清单 |
| `/novel:write` | 执行章节写作，基于任务清单和环境感知自动加载上下文 |
| `/novel:analyze` | 智能综合分析：自动选择框架分析或内容分析 |

#### 追踪管理命令

| 命令 | 说明 |
|------|------|
| `/novel:checklist` | 写作前的系统化检查（规格/计划/任务一致性） |
| `/novel:track` | 综合追踪：写作进度、情节状态、伏笔管理、时间线 |
| `/novel:track-init` | 初始化追踪系统，基于故事规格设置追踪数据 |
| `/novel:relations` | 管理人物关系网络和派系状态 |
| `/novel:timeline` | 管理故事时间线和事件时间节点 |
| `/novel:plot-check` | 执行情节逻辑检查，验证故事发展的因果一致性 |
| `/novel:world-check` | 执行世界观一致性检查，验证设定自洽性 |
| `/novel:expert` | 激活专家模式，获取深度创作指导（world/character/plot/style/system） |

#### speckit 工作流命令（方法论基础设施）

| 命令 | 说明 |
|------|------|
| `/speckit:specify` | speckit 版故事规格定义 |
| `/speckit:clarify` | speckit 版澄清决策 |
| `/speckit:plan` | speckit 版创作计划 |
| `/speckit:tasks` | speckit 版任务分解 |
| `/speckit:analyze` | speckit 版综合分析 |
| `/speckit:checklist` | speckit 版质量检查清单 |
| `/speckit:implement` | speckit 版实现入口（调用 novel 命令执行） |
| `/speckit:constitution` | speckit 版创作宪法 |
| `/speckit:git-initialize` | 初始化项目 git 仓库和 hooks |
| `/speckit:git-remote` | 配置 git 远程仓库 |
| `/speckit:git-commit` | 创建 git 提交并推送 |
| `/speckit:git-feature` | 创建功能分支并切换 |
| `/speckit:git-validate` | 验证 git 仓库状态和提交历史 |
| `/speckit:taskstoissues` | 将任务清单导出为 GitHub Issues |

#### 推荐工作流

```
1. /novel:constitution   → 建立创作原则
2. /novel:specify        → 定义故事规格（渐进式，支持从一句话开始）
3. /novel:clarify        → 澄清关键决策（交互式问答）
4. /novel:plan          → 制定创作计划
5. /novel:track-init    → 初始化追踪系统
6. /novel:tasks         → 生成任务清单
7. /novel:write         → 执行章节写作
   （每5章）/novel:analyze  → 质量检查
```

#### analyze 命令专项参数

| 参数 | 说明 |
|------|------|
| `--type=framework` | 强制框架分析（写作前） |
| `--type=content` | 强制内容分析（写作后） |
| `--focus=opening` | 开篇专项分析（检查黄金开篇法则） |
| `--focus=pacing` | 节奏专项分析（爽点/冲突分布） |
| `--focus=character` | 人物专项分析（弧光/一致性） |
| `--focus=foreshadow` | 伏笔专项分析（埋设与回收） |
| `--focus=logic` | 逻辑专项分析（时间线/因果/能力） |
| `--focus=style` | 风格专项分析（AI腔/文风一致性） |

#### track 命令参数

| 参数 | 说明 |
|------|------|
| `--brief` | 显示简要信息 |
| `--stats` | 仅显示统计数据 |
| `--plot` | 仅显示情节追踪 |
| `--check` | 深度一致性检查（含角色验证） |
| `--fix` | 自动修复发现的简单问题 |

---

## Architecture

### Web App (`web/`)
Standard Next.js 16 / React 19 app with App Router:
- `web/app/` — App Router pages (`page.js`, `dashboard/`, `ranking/`, `graveyard/`)
- `web/app/globals.css` — Global styles (CSS variables, glass-panel, text effects)
- `web/next.config.mjs` — Next.js config
- `web/jsconfig.json` — Path aliases

The web app is a **reader-facing interface** for the novel — it displays the story world, player rankings, and graveyard. It is NOT the writing tool.

### Spec System (`spec/`)
Organized into four layers with strict upgrade/safety semantics:

| Layer | Directory | Can be overwritten on upgrade? |
|---|---|---|
| 方法预设 | `spec/presets/` | Yes — safe to overwrite |
| 质量检查 | `spec/checklists/` | Yes |
| 知识库 | `spec/knowledge/` | **Never** |
| 追踪数据 | `spec/tracking/` | **Never** |

Key files:
- `spec/stories/worldevolver/specification.md` — 故事规格 (StorySpec), defines the world, characters, rules
- `spec/stories/worldevolver/creative-plan.md` — 创作计划
- `spec/tracking/*.json` — runtime state: plot, timeline, relationships, character state
- `spec/knowledge/world/world-setting.md` — world lore
- `spec/knowledge/characters/` — character profiles (林昊, 叶无痕, etc.)
- `spec/presets/anti-ai-detection.md` — 反AI检测 writing guidelines
- `spec/presets/golden-opening.md` — 黄金开篇法则

### Constitution (`.specify/memory/novel-constitution.md`)
The **创作宪法** is the highest-priority document — it defines immutable writing rules:
- Strict protagonist-only third-person limited POV (no omniscient narrator)
- Causal world rules (no plot armor)
- Reader information is semi-transparent (public vs. hidden state)
- Death is final; inheritance is dramatic and heavy
- World time: 1 world day per 1 real day (1:1 ratio, standardized)

Rule priority order: user instruction > constitution > style reference > story spec > presets > knowledge/tracking.

> 💡 Tip: Use `/novel:constitution` command to create or update the constitution.

### Gemini Integration (`.gemini/`) — Gemini CLI 原生命令
- `.gemini/commands/novel/*.toml` — Gemini CLI 格式的命令定义（用于 Gemini CLI）
- `.gemini/GEMINI.md` — Gemini CLI 项目配置
- **注意**：Claude Code 使用 `.claude/commands/` 中的 skill 命令，两者均可工作

### Claude Code Skill Commands (`.claude/commands/`) — Claude Code 技能命令
- `.claude/commands/novel/` — 14 个 novel 创作命令（`/novel:xxx`）
- `.claude/commands/speckit/` — 14 个 speckit 工作流命令（`/speckit:xxx`）
- **注意**：这些是 Claude Code 的 skill 命令，通过斜杠 `/novel:xxx` 或 `/speckit:xxx` 调用

### Specify System (`.specify/`)
Templates and config for the spec-writing workflow:
- `.specify/memory/novel-constitution.md` — **project's active constitution** (authoritative, not the one in `spec/memory/`)
- `.specify/memory/style-reference.md` — 风格参考（由 `/book-internalize` 生成）
- `.specify/templates/` — file templates (story, outline, constitution, etc.)
- `.specify/integrations/speckit.manifest.json` — speckit CLI integration manifest
- `.specify/scripts/` — bash scripts for workflow automation (specify-story.sh, plan-story.sh, etc.)
- `.specify/experts/core/` — 核心专家知识库（world.md, character.md, plot.md, style.md）

### Plugins (`plugins/`, `experts/`)
- `plugins/authentic-voice/` — authenticity editing plugin (authentic-editor expert mode)
- `experts/` — AI writing expert agents

---

## Conventions

### Web App
- React 19, Next.js 16 App Router — no TypeScript
- CSS custom properties in `globals.css` (e.g., `--text-primary`, `--text-secondary`, `--bg-dark`)
- Glass-panel aesthetic with glow effects (`text-glow`, `text-gradient-magic`, `text-glow-danger`)
- Pages are `.js` files, not `.tsx`

### Novel Writing
- All writing content is in `spec/stories/worldevolver/content/` (chapter files)
- Chapters use traditional Chinese numerals for naming (e.g., `第一章.md`)
- Character profiles in `spec/knowledge/characters/` as `.md` files
- Tracking JSON files are updated by the spec workflow, not manually

### Web App `AGENTS.md`
The `web/AGENTS.md` notes: **"This is NOT the Next.js you know"** — Next.js 16 has breaking changes from the version you may have trained on. Read `node_modules/next/dist/docs/` before writing Next.js code.

---

## Backend

**后端位于 `backend/`，已迁移至 Supabase（不再是 SQLite/Drizzle）**

- `backend/server.js` — Express + Supabase 主服务器，监听 3001 端口
- `backend/lib/supabase.js` — Supabase 客户端单例
- `backend/seed.js` — 同步真实小说数据到 Supabase
- 启动命令: `cd backend && node server.js`
- seed 命令: `cd backend && node seed.js`

**dotenv 路径规则（必须遵守）**：
所有 backend 文件必须用 `config({ path: path.join(__dirname, '.env') })` 加载 dotenv，不能用 `import 'dotenv/config'`（会从当前工作目录找 .env，服务器从根目录启动时会失败）

**players 表必须有 rank 列**（小说真实排名）：
```sql
ALTER TABLE players ADD COLUMN IF NOT EXISTS rank INTEGER DEFAULT NULL;
```

**数据库连接字符串**：
- SUPABASE_URL: `https://cdmbarsgcitbzvgfouyz.supabase.co`
- SUPABASE_ANON_KEY: JWT 格式（`eyJ...`，不是 `sb_publishable_...`）

**API 端点**：
- `GET /api/ranking` — 返回 NPC 排名（林昊#1, 叶无痕#89 等）
- `GET /api/world/state` — 返回世界状态（大比倒计时、境界等）
- `GET /api/world/bulletins` — 返回小说事件公报

**seed.js players 表写入方式**：必须用 `DELETE + INSERT`，不能用 `upsert`（upsert 有 bug，rank 字段无法正确写入）

**当前状态记录**：详见 `memory/project-status.md`（技术栈、进度、坑点全覆盖）

---

## Important Notes

- The spec system and the web app are **independent** — editing one does not affect the other
- The constitution file has TWO copies: `.specify/memory/novel-constitution.md` (active) and `spec/memory/novel-constitution.md` (backup); the one in `.specify/memory/` is authoritative
- Do NOT run `npm install` or other package managers in the root — only within `web/`
- The `web/.next/` build build is gitignored

## 经验记录命令（必读）

**`/memo`** — 踩坑记录命令。每次修复 bug 或学到重要经验后，调用 `/memo` 将其存档：

```bash
/memo <问题描述>                          # 自动推断结构存档
/memo --problem X --fix Y --cause Z     # 结构化参数
/memo --status fixed                     # 修复完成后升级记录
```

调用 `/memo` 时，它会：
1. 提取根因 + 修复方案 + 经验教训
2. 存入 `memory/lessons/` 目录
3. **同时更新 `memory/project-status.md` 的「版本历史」和「坑点」部分**
4. 更新 `memory/MEMORY.md` 索引

经验文档路径：`memory/lessons/*.md`
项目状态文档：`memory/project-status.md`
