const fs = require('fs');
const path = require('path');

const TRACKING_DIR = path.join(__dirname, '../../spec/tracking/players');

/**
 * Finds up to `limit` active players in a given zone, sorted by joined date.
 */
function getTopPlayersForZone(zoneName, limit = 5) {
    if (!fs.existsSync(TRACKING_DIR)) {
        return [];
    }

    const files = fs.readdirSync(TRACKING_DIR).filter(f => f.endsWith('.json') && f !== 'template.json');
    let matchedPlayers = [];

    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(TRACKING_DIR, file), 'utf-8'));
        if (data.location === zoneName && data.status === 'active') {
            matchedPlayers.push(data);
        }
    }

    // Sort by joined_at to determine "Top" (longest active)
    matchedPlayers.sort((a, b) => {
        if (!a.joined_at) return 1;
        if (!b.joined_at) return -1;
        return new Date(a.joined_at) - new Date(b.joined_at);
    });

    return matchedPlayers.slice(0, limit);
}

/**
 * Builds the Context String to be injected into the main chapter generation prompt.
 */
function buildIntersectionContext(zoneName) {
    const players = getTopPlayersForZone(zoneName, 5);
    
    if (players.length === 0) {
        return "";
    }

    let contextText = "【玩家群演注入】以下真实玩家当前正在该区域活动，可根据剧情需要将其以路人、炮灰或寻宝者的身份自然融入正文中：\n";
    for (const p of players) {
        contextText += `- 姓名：${p.name} | 境界：${p.level} | 状态：活跃中\n`;
    }
    
    return contextText + "\n";
}

module.exports = {
    getTopPlayersForZone,
    buildIntersectionContext
};
