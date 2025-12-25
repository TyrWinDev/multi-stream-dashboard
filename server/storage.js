const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'widgets.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Default State (Fallback)
const defaultState = {
    global: { theme: 'default', transparent: false, font: 'sans', animation: 'fade-in' },
    counter: { count: 0, title: 'Counter', step: 1, sound: false },
    timer: { 
        seconds: 300, 
        isRunning: false, 
        mode: 'countdown', 
        showCircle: true, 
        alarm: false 
    },
    social: { 
        handles: [
            { platform: 'twitter', handle: '@Streamer' },
            { platform: 'twitch', handle: 'StreamerLive' }
        ],
        duration: 10,
        layout: 'horizontal',
        showIcons: true
    },
    progress: { 
        current: 0, 
        max: 100, 
        title: 'Subscriber Goal',
        gradientStart: '#4f46e5',
        gradientEnd: '#ec4899',
        showPercentage: true,
        showFraction: true
    },
    goals: { 
        items: [
            { id: 1, text: 'Start Stream', completed: true },
            { id: 2, text: 'Just Chatting', completed: false },
            { id: 3, text: 'Game Time', completed: false }
        ], 
        title: 'Stream Goals',
        showCompleted: true
    },
    wheel: { 
        segments: [
             { id: 1, text: 'Prize 1', color: '#ef4444' },
             { id: 2, text: 'Prize 2', color: '#3b82f6' },
             { id: 3, text: 'Prize 3', color: '#10b981' },
             { id: 4, text: 'Prize 4', color: '#f59e0b' }
        ],
        winner: null, 
        isSpinning: false,
        title: 'Spin Wheel'
    },
    highlight: { message: null, style: 'modern', autoHide: 0 },
    activity: { 
        limit: 5, 
        filter: ['follow', 'sub', 'cheer', 'raid', 'donation'], 
        layout: 'list', 
        title: 'Recent Activity' 
    },
    recentEvents: [] 
};

/**
 * Load state from disk
 * @returns {Object} Widget State
 */
function loadState() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const raw = fs.readFileSync(DATA_FILE, 'utf8');
            const data = JSON.parse(raw);
            // Merge with default to ensure new fields exists if file is old
            return { ...defaultState, ...data };
        }
    } catch (err) {
        console.error('Failed to load widget state:', err);
    }
    return defaultState;
}

// Debounce timer
let saveTimer = null;

/**
 * Save state to disk (Debounced)
 * @param {Object} state 
 */
function saveState(state) {
    if (saveTimer) clearTimeout(saveTimer);

    saveTimer = setTimeout(() => {
        try {
            fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2));
            console.log('Widget state saved to disk.');
        } catch (err) {
            console.error('Failed to save widget state:', err);
        }
    }, 1000); // 1 second debounce
}

module.exports = { loadState, saveState };
