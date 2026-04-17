const fs = require('fs');
const path = require('path');

const LOGS_DIR = path.join(__dirname, '../../spec/tracking/logs');

/**
 * Generates the LLM prompt for evaluating a user's action.
 */
function getActionPrompt(userId, playerState, actionText, worldEvents) {
    return `
You are the AI Game Master for WorldEvolver. 
A player has submitted an action. Evaluate the outcome based on their state and current world events.

Player State:
${JSON.stringify(playerState, null, 2)}

Active World Events:
${JSON.stringify(worldEvents, null, 2)}

Player's Action:
"${actionText}"

Please provide a thrilling, in-character description of the outcome (in Chinese, 2-3 sentences), detailing what happened to the player in the Tianyan Continent.
If their stats or location change, please append a JSON block at the end with the updates.
`;
}

/**
 * Appends the LLM generated log entry to the user's personal log file.
 */
function appendLog(userId, outcomeText) {
    if (!fs.existsSync(LOGS_DIR)) {
        fs.mkdirSync(LOGS_DIR, { recursive: true });
    }

    const logFile = path.join(LOGS_DIR, `${userId}.md`);
    const timestamp = new Date().toISOString();
    
    const entry = `\n## [${timestamp}]\n\n${outcomeText}\n`;
    
    fs.appendFileSync(logFile, entry, 'utf-8');
    return { success: true, logFile };
}

module.exports = {
    getActionPrompt,
    appendLog
};
