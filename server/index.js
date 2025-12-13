require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const cors = require('cors');
const tmi = require('tmi.js');
const { WebcastPushConnection } = require('tiktok-live-connector');


const Kick = require('@retconned/kick-js');

// --- Configuration ---
const PORT = process.env.PORT || 3000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: CLIENT_URL,
        methods: ["GET", "POST"]
    }
});

// --- State & Helpers ---
const chatHistory = []; // In-memory buffer (optional, for connecting clients)
const normalizeMsg = (platform, user, text, color = null, avatar = null) => {
    const msg = {
        id: Date.now() + Math.random().toString(),
        platform,
        user,
        text,
        color: color || '#888888',
        avatar,
        timestamp: new Date().toISOString()
    };
    // Keep last 100 in memory
    if (chatHistory.length > 100) chatHistory.shift();
    chatHistory.push(msg);
    io.emit('chat-message', msg);
    console.log(`[${platform}] ${user}: ${text}`);
};

const emitActivity = (type, platform, user, details) => {
    const activity = {
        id: Date.now() + Math.random().toString(),
        type, // 'follow', 'sub', 'tip', 'gift'
        platform,
        user,
        details,
        timestamp: new Date().toISOString()
    };
    io.emit('activity-event', activity);
    console.log(`[ACTIVITY] ${platform} ${type} by ${user}`);
};

// --- Platform Connectors ---

// 1. Twitch (using tmi.js)
if (process.env.TWITCH_CHANNEL) {
    const twitchClient = new tmi.Client({
        options: { debug: true, messagesLogLevel: "info" },
        connection: {
            reconnect: true,
            secure: true
        },
        channels: [process.env.TWITCH_CHANNEL]
    });

    twitchClient.connect().catch(console.error);

    twitchClient.on('message', (channel, tags, message, self) => {
        if (self) return;
        normalizeMsg('twitch', tags['display-name'] || tags['username'], message, tags['color']);
    });
}

// 2. TikTok (using tiktok-live-connector)
if (process.env.TIKTOK_USER) {
    const tiktokConnection = new WebcastPushConnection(process.env.TIKTOK_USER);

    tiktokConnection.connect().then(state => {
        console.info(`Connected to TikTok roomId ${state.roomId}`);
    }).catch(err => {
        console.error('Failed to connect to TikTok', err);
    });

    tiktokConnection.on('chat', data => {
        normalizeMsg('tiktok', data.uniqueId, data.comment, null, data.profilePictureUrl);
    });

    tiktokConnection.on('gift', data => {
        if (data.giftType === 1 && !data.repeatEnd) {
            // Streak gift, only log at end or ignore simple ones to reduce spam?
            // For now logging all non-repeating or end of repeat
        } else {
            emitActivity('gift', 'tiktok', data.uniqueId, `Sent ${data.giftName} x${data.repeatCount}`);
        }
    });
}


// 3. YouTube (Disabled as per request)
// The 'youtube-chat' package was removed.
// Future implementation could use 'youtube-live-chat-ts' or official API.
console.log("YouTube integration is currently disabled.");



// 4. Kick (using @retconned/kick-js)
if (process.env.KICK_CHANNEL_ID) {
    // kick-js usually takes a channel ID or slug. Verification needed on implementation.
    // Assuming constructor takes channel slug/id
    try {
        const kick = new Kick({
            channel: process.env.KICK_CHANNEL_ID
        });

        kick.on('ChatMessage', (data) => {
            // Structure depends on library version, mocking standard access
            const user = data.sender.username;
            const text = data.content;
            normalizeMsg('kick', user, text, data.sender.identity?.color);
        });

        // kick.connect(); // Check if connect is needed or auto
    } catch (e) {
        console.error("Kick connection setup failed", e);
    }
}


// 5. StreamElements (Activity Feed for Twitch/YT/Kick)
if (process.env.STREAMELEMENTS_JWT) {
    const seSocket = ioClient('https://realtime.streamelements.com', {
        transports: ['websocket']
    });

    seSocket.on('connect', () => {
        console.log('Connected to StreamElements');
        seSocket.emit('authenticate', { method: 'jwt', token: process.env.STREAMELEMENTS_JWT });
    });

    seSocket.on('authenticated', () => {
        console.log('StreamElements Authenticated');
    });

    seSocket.on('event', (data) => {
        if (!data || !data.type) return;
        // Event types: follower, subscriber, tip, cheer
        const type = data.type; // e.g. 'follower'
        const name = data.data.username;
        const amount = data.data.amount; // for tips

        // Normalize event type naming
        let actType = 'unknown';
        let details = '';

        if (type === 'follower') { actType = 'follow'; }
        if (type === 'subscriber') { actType = 'sub'; details = `Tier ${data.data.tier || 1}`; }
        if (type === 'tip') { actType = 'tip'; details = `${data.data.currency} ${amount}`; }
        if (type === 'cheer') { actType = 'cheer'; details = `${amount} bits`; }

        eventPlatform = data.provider || 'twitch'; // usually 'twitch', 'youtube'

        emitActivity(actType, eventPlatform, name, details);
    });
}

// Connection handling
io.on('connection', (socket) => {
    console.log('Frontend connected');
    // Send history
    socket.emit('history', chatHistory);
});

server.listen(PORT, () => {
    console.log(`Unified Stream Hub running on port ${PORT}`);
});
