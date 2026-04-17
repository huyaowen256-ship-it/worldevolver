const fs = require('fs');
const path = require('path');

const TRACKING_DIR = path.join(__dirname, '../../spec/tracking/players');
const TEMPLATE_PATH = path.join(TRACKING_DIR, 'template.json');

/**
 * Handle /join command
 * Generates a JSON file for the new user based on the template.
 */
function handleJoin(userId, userName) {
    if (!fs.existsSync(TRACKING_DIR)) {
        fs.mkdirSync(TRACKING_DIR, { recursive: true });
    }
    
    const userFile = path.join(TRACKING_DIR, `${userId}.json`);
    if (fs.existsSync(userFile)) {
        console.log(`User ${userId} already exists.`);
        return { success: false, message: "User already exists" };
    }

    const template = JSON.parse(fs.readFileSync(TEMPLATE_PATH, 'utf-8'));
    const newUser = {
        ...template,
        id: userId,
        name: userName || `Player_${userId}`,
        joined_at: new Date().toISOString()
    };
    
    fs.writeFileSync(userFile, JSON.stringify(newUser, null, 2), 'utf-8');
    console.log(`Successfully created player state for ${userId}.`);
    return { success: true, state: newUser };
}

/**
 * Handle /explore command
 * Updates the location field in the user's JSON file.
 */
function handleExplore(userId, locationName) {
    const userFile = path.join(TRACKING_DIR, `${userId}.json`);
    if (!fs.existsSync(userFile)) {
        console.log(`User ${userId} does not exist. They must /join first.`);
        return { success: false, message: "User not found" };
    }

    const userData = JSON.parse(fs.readFileSync(userFile, 'utf-8'));
    userData.location = locationName;
    userData.last_explored_at = new Date().toISOString();
    
    fs.writeFileSync(userFile, JSON.stringify(userData, null, 2), 'utf-8');
    console.log(`Updated location of ${userId} to ${locationName}.`);
    return { success: true, state: userData };
}

module.exports = {
    handleJoin,
    handleExplore
};
