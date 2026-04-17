const fs = require('fs');
const path = require('path');

const TRACKING_DIR = path.join(__dirname, '../../spec/tracking/players');
const GLOBAL_EVENTS_PATH = path.join(__dirname, '../../spec/tracking/global-events.json');

/**
 * Aggregates player counts by location and triggers events if thresholds are met.
 */
function checkAndTriggerEvents() {
    if (!fs.existsSync(TRACKING_DIR)) {
        return { success: true, messages: [] };
    }

    const files = fs.readdirSync(TRACKING_DIR).filter(f => f.endsWith('.json') && f !== 'template.json');
    const locationCounts = {};

    for (const file of files) {
        const data = JSON.parse(fs.readFileSync(path.join(TRACKING_DIR, file), 'utf-8'));
        if (data.location && data.status === 'active') {
            locationCounts[data.location] = (locationCounts[data.location] || 0) + 1;
        }
    }

    if (!fs.existsSync(GLOBAL_EVENTS_PATH)) {
        return { success: false, message: "global-events.json missing" };
    }

    let globalEvents = JSON.parse(fs.readFileSync(GLOBAL_EVENTS_PATH, 'utf-8'));
    let messages = [];
    let updated = false;

    for (const [eventId, eventData] of Object.entries(globalEvents.events)) {
        const currentHeat = locationCounts[eventData.zone] || 0;
        
        if (eventData.ruins_exploration_heat !== currentHeat) {
            eventData.ruins_exploration_heat = currentHeat;
            updated = true;
        }

        if (eventData.status === 'dormant' || eventData.status === 'active') {
            if (currentHeat >= eventData.threshold && eventData.status !== 'triggered') {
                eventData.status = 'triggered';
                messages.push(`【世界公告】${eventData.name}已触发！位于：${eventData.zone}`);
                updated = true;
            }
        }
    }

    if (updated) {
        fs.writeFileSync(GLOBAL_EVENTS_PATH, JSON.stringify(globalEvents, null, 2), 'utf-8');
    }

    return { success: true, locationCounts, messages };
}

module.exports = {
    checkAndTriggerEvents
};
