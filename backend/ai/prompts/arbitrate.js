// Arbitration prompts for daily AI adjudication
// Used by batch/runDaily.js — called for each pending player command

/**
 * Build the full prompt for arbitrating a player's daily command.
 * @param {object} ctx
 * @param {string} ctx.playerName
 * @param {string} ctx.playerLevel
 * @param {string} ctx.playerLocation
 * @param {array}  ctx.inventory
 * @param {string} ctx.playerHistory  — recent personal logs, plain text
 * @param {string} ctx.worldState     — AI-generated world state summary
 * @param {string} ctx.actionText     — player's submitted command
 * @param {string|null} ctx.supplementaryIntent
 */
export function arbiratePrompt({ playerName, playerLevel, playerLocation, inventory, playerHistory, worldState, actionText, supplementaryIntent }) {
  const systemPrompt = `你是一个黑暗修仙世界的AI裁定者（Game Master）。

## 核心原则
- 严格遵循因果定律：无努力无收获，有机遇必有风险
- 禁止剧情护盾：即使是主角，若修为尚浅也可能在危险中陨落
- 死亡是真实的：角色死亡后无法复活，除非触发特殊因果继承机制
- 机遇与危机并存：高风险区域有珍稀资源，也有致命危险

## 修为等级（从低到高）
凡人 → 炼气期 → 筑基期 → 金丹期 → 元婴期 → 化神期 → 渡劫期 → 大乘期 → 真仙

## 输出格式要求
先输出一段中文叙事（2-4句），描述该角色的行动结果，要有细节和画面感。
然后在最后一行输出JSON：
{
  "resultText": "【叙事内容】",
  "statusChanges": {
    "level": "新修为（如无变化则不写此字段）",
    "location": "新地点（如无变化则不写此字段）",
    "inventory": ["物品列表（如有变化则替换整个数组，否则不写此字段）"],
    "status": "dead 或 残魂（仅当角色陨落时填写，正常情况不写此字段）"
  }
}

注意：statusChanges中只有真正发生变化的字段才写入JSON，无变化则省略该字段。
`;

  const userPrompt = `## 当前世界状态
${worldState || '（暂无世界状态）'}

## 角色信息
- 角色名：${playerName}
- 当前修为：${playerLevel}
- 当前位置：${playerLocation}
- 物品栏：${inventory?.length ? inventory.join('、') : '空'}

## 近期个人日志
${playerHistory || '（暂无日志）'}

## 今日行动指令
${actionText}
${supplementaryIntent ? `\n## 补充说明\n${supplementaryIntent}` : ''}

请裁定该角色的今日行动结果。`;

  return [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ];
}

/**
 * Build prompt for generating the daily world bulletin.
 * @param {object} ctx
 * @param {string} ctx.worldState  — current world state summary
 * @param {array}  ctx.todayResults — [{ player, result }, ...]
 */
export function worldBulletinPrompt({ worldState, todayResults }) {
  const resultsText = todayResults.length > 0
    ? todayResults.map(r => `- ${r.player}：${r.result}`).join('\n')
    : '今日无玩家行动。';

  return [
    { role: 'system', content: '你是一个黑暗修仙世界的官方公报撰写者。文笔简洁、有气势，用第三人称叙事。' },
    {
      role: 'user',
      content: `## 当前世界状态
${worldState}

## 今日玩家行动裁定结果
${resultsText}

请撰写今日的世界公报，包含：
1. 一句话标题
2. 200-400字的世界动态综述
3. 可以包含重要事件提示、势力变化、危机预警等

直接输出一段文字，不需要JSON格式。`,
    },
  ];
}
