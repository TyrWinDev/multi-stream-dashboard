require('dotenv').config();
const { google } = require('googleapis');

const express = require('express');
const axios = require('axios');
const http = require('http');
const { Server } = require('socket.io');
const ioClient = require('socket.io-client');
const cors = require('cors');
const tmi = require('tmi.js');
const { TikTokLiveConnection, WebcastEvent } = require('tiktok-live-connector');

// ...


// @retconned/kick-js uses createClient
const { createClient } = require('@retconned/kick-js');


// --- Configuration ---
const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json()); // Enable JSON body parsing

app.get('/', (req, res) => {
    res.send('<h1>Unified Stream Hub Server is Running! 🚀</h1><p>Go to <a href="' + CLIENT_URL + '">' + CLIENT_URL + '</a> to use the dashboard.</p>');
});

const https = require('https');
const selfsigned = require('selfsigned');

// ... (config) ...

// ... (config) ...

// --- Global IO Reference ---
let io;

// --- State & Helpers ---
const chatHistory = []; // In-memory buffer (optional, for connecting clients)
const normalizeMsg = (platform, user, text, color = null, avatar = null, emotes = null) => {
    const msg = {
        id: Date.now() + Math.random().toString(),
        platform,
        user,
        text,
        color: color || '#888888',
        avatar,
        emotes, // { 'emoteID': ['start-end', 'start-end'] }
        timestamp: new Date().toISOString()
    };
    // Keep last 100 in memory
    if (chatHistory.length > 100) chatHistory.shift();
    chatHistory.push(msg);
    if (io) io.emit('chat-message', msg);
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
    if (io) io.emit('activity-event', activity);
    console.log(`[ACTIVITY] ${platform} ${type} by ${user} (${details})`);
};

// --- Platform Connectors ---

const { getTokens, setToken, startTwitchAuth, handleTwitchCallback, startKickAuth, handleKickCallback, startYoutubeAuth, handleYoutubeCallback } = require('./auth');

// ... (config) ...

// --- Auth Routes ---
// --- Auth Routes ---
app.get('/api/auth/twitch', (req, res) => startTwitchAuth(res));
app.get('/api/auth/twitch/callback', handleTwitchCallback);

app.get('/api/auth/kick', (req, res) => startKickAuth(res));
app.get('/api/auth/kick', (req, res) => startKickAuth(res));
app.get('/api/auth/kick/callback', handleKickCallback);

app.get('/api/auth/youtube', (req, res) => startYoutubeAuth(res));
app.get('/api/auth/youtube/callback', handleYoutubeCallback);

// In-memory session store (simple)
let kickSession = { chatroomId: null, username: null };

app.get('/api/auth/status', async (req, res) => {
    // Debug Log
    const tLog = getTokens('twitch');
    const kLog = getTokens('kick');
    console.log("Status Check - Tokens:", {
        twitch: tLog ? (tLog.accessToken ? 'YES' : 'NO') : 'MISSING',
        kick: kLog ? (kLog.accessToken ? 'YES' : 'NO') : 'MISSING'
    });

    const status = {
        twitch: { connected: false },
        kick: { connected: false }
    };

    // Twitch Check
    const twitchToken = getTokens('twitch');
    if (twitchToken && twitchToken.accessToken) {
        try {
            const resp = await axios.get('https://api.twitch.tv/helix/users', {
                headers: {
                    'Authorization': `Bearer ${twitchToken.accessToken}`,
                    'Client-Id': process.env.TWITCH_CLIENT_ID
                }
            });
            const user = resp.data.data[0];
            status.twitch = {
                connected: true,
                username: user.display_name,
                avatar: user.profile_image_url
            };
        } catch (e) {
            console.error("Twitch Profile Fetch Error:", e.message);
            status.twitch = { connected: true };
        }
    }

    // Kick Check
    const kickToken = getTokens('kick');
    if (kickToken && kickToken.accessToken) {
        try {
            // Use /users (plural) - Verification confirmed this works for Auth User
            const resp = await axios.get('https://api.kick.com/public/v1/users', {
                headers: { 'Authorization': `Bearer ${kickToken.accessToken}` }
            });

            // Response format: { data: [ { user_id: 123, ... } ] }
            const userData = resp.data.data ? resp.data.data[0] : resp.data;
            // console.log("Kick User Data:", JSON.stringify(userData, null, 2)); // Reduced log spam

            // Store User ID for sending messages (broadcaster_user_id)
            if (userData.user_id) {
                kickSession.userId = userData.user_id;
                kickSession.username = userData.name;
            }

            status.kick = {
                connected: true,
                username: userData.name,
                avatar: userData.profile_picture
            };

        } catch (e) {
            console.error("Kick Profile Fetch Error:", e.response?.data || e.message);
            status.kick = { connected: true };
        }
    }

    // TikTok Check (Simple)
    const tiktokToken = getTokens('tiktok');
    if (tiktokToken && tiktokToken.username) {
        status.tiktok = {
            connected: true,
            username: tiktokToken.username
        };
    } else {
        status.tiktok = { connected: false };
    }

    // YouTube Check
    const youtubeToken = getTokens('youtube');
    if (youtubeToken && youtubeToken.accessToken) {
        status.youtube = { connected: true, username: 'YouTube' };
    } else {
        status.youtube = { connected: false };
    }

    res.json(status);
});

// --- Platform Connectors (Dynamic) ---

// 1. Twitch
let twitchClient;
const initTwitch = async () => {
    const tokens = getTokens('twitch');
    const channels = [process.env.TWITCH_CHANNEL];

    if (!tokens || !tokens.accessToken) {
        console.log("Twitch: No OAuth token found. Skipping connection.");
        return;
    }

    console.log("Twitch: Initializing with OAuth Token");

    const opts = {
        options: { debug: true, messagesLogLevel: "info" },
        connection: { reconnect: true, secure: true },
        identity: {
            username: process.env.TWITCH_USERNAME || 'justinfan123', // User should really have this in env or we fetch it
            password: `oauth:${tokens.accessToken}`
        },
        channels: channels
    };

    try {
        twitchClient = new tmi.Client(opts);
        await twitchClient.connect();

        twitchClient.on('message', (channel, tags, message, self) => {
            if (self) return;
            normalizeMsg('twitch', tags['display-name'] || tags['username'], message, tags['color'], null, tags['emotes']);
        });
        console.log("Twitch Connected!");
    } catch (e) {
        console.error("Twitch Connection Error:", e);
    }
};

// 2. Kick Init
let kickClient;
const initKick = async () => {
    if (process.env.KICK_CHANNEL_ID) {
        try {
            kickClient = createClient(process.env.KICK_CHANNEL_ID, { logger: false, readOnly: true });

            if (process.env.KICK_EMAIL && process.env.KICK_PASSWORD) {
                kickClient.login({
                    type: 'login',
                    credentials: {
                        username: process.env.KICK_EMAIL,
                        password: process.env.KICK_PASSWORD,
                        otp_secret: process.env.KICK_2FA_SECRET
                    }
                }).catch(e => console.warn('Kick Login failed', e.message));
            }

            kickClient.on('ChatMessage', (message) => {
                const user = message.sender.username;
                const text = message.content;
                const color = message.sender.identity?.color || '#53fc18';
                normalizeMsg('kick', user, text, color);
            });
            console.log(`Listening to Kick channel: ${process.env.KICK_CHANNEL_ID}`);
        } catch (e) {
            console.error("Kick Setup Error:", e.message);
        }
    }
};

// 3. TikTok Init
let tiktokConnection;
const initTikTok = async () => {
    const tokens = getTokens('tiktok');
    const username = tokens?.username || process.env.TIKTOK_USER;

    // Disconnect existing if any
    if (tiktokConnection) {
        try {
            tiktokConnection.disconnect();
            console.log("TikTok: Disconnected previous session.");
        } catch (e) { /* ignore */ }
    }

    if (!username) return;

    console.log(`TikTok: Connecting to @${username}...`);
    try {
        tiktokConnection = new TikTokLiveConnection(username, {
            processInitialData: false,      // Skip fetching old messages to avoid spam/load
            enableExtendedGiftInfo: true,   // Get better gift data
            requestPollingIntervalMs: 500,  // Aggressive polling (500ms)
            clientParams: {                 // Ensure standard client params
                app_language: 'en-US',
                device_platform: 'web'
            }
        });

        tiktokConnection.on('chat', data => {
            const user = data.uniqueId || data.user?.uniqueId || data.nickname || 'Unknown';
            const avatar = data.profilePictureUrl || data.user?.profilePictureUrl || null;
            normalizeMsg('tiktok', user, data.comment, null, avatar);
        });

        tiktokConnection.on('gift', data => {
            const user = data.uniqueId || data.user?.uniqueId || 'Unknown';
            // Fallback for gift name
            const giftName = data.giftName || data.extendedGiftInfo?.name || "Gift";
            // console.log(`[TikTok Gift] ${user} sent ${giftName} x${data.repeatCount} (Type: ${data.giftType})`);

            if (data.giftType === 1 && !data.repeatEnd) {
                // streak
            } else {
                emitActivity('gift', 'tiktok', user, `Sent ${giftName} x${data.repeatCount}`);
            }
        });

        tiktokConnection.on('connected', state => {
            console.info(`TikTok: Connected to roomId ${state.roomId}`);
        });

        tiktokConnection.on('disconnected', () => {
            console.info('TikTok: Disconnected');
        });

        tiktokConnection.on('error', err => {
            console.error('TikTok Error:', err);
        });

        await tiktokConnection.connect();

    } catch (err) {
        console.error('TikTok Connection Failed:', err.message);
        // Don't retry endlessly to avoid bans, just log
    }
};

// 4. YouTube Init
let youtubeLiveChatId = null;
let youtubeNextPageToken = null;
let youtubeIntervalId = null;
let youtubeClient = null; // Stored for sending messages

const initYoutube = async () => {
    const tokens = getTokens('youtube');
    if (!tokens || !tokens.accessToken) {
        console.log("YouTube: No OAuth token found.");
        return;
    }

    console.log("YouTube: Initializing...");
    const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken
    });

    // Handle Token Refresh Updates
    oauth2Client.on('tokens', (newTokens) => {
        console.log("YouTube: Token Refreshed!");
        if (newTokens.refresh_token) {
            tokens.refreshToken = newTokens.refresh_token;
        }
        tokens.accessToken = newTokens.access_token;
        tokens.expiry = newTokens.expiry_date;
        setToken('youtube', tokens);
    });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });
    youtubeClient = youtube;

    try {
        // Find active broadcast
        const broadcastResp = await youtube.liveBroadcasts.list({
            part: 'snippet',
            broadcastStatus: 'active',
            broadcastType: 'all'
        });

        if (broadcastResp.data.items.length === 0) {
            console.log("YouTube: No active broadcast found.");
            return;
        }

        const broadcast = broadcastResp.data.items[0];
        youtubeLiveChatId = broadcast.snippet.liveChatId;
        console.log(`YouTube: Connected to Live Chat ID: ${youtubeLiveChatId} (Broadcasting: ${broadcast.snippet.title})`);

        // Start Polling
        startYoutubePolling(youtube);
    } catch (e) {
        console.error("YouTube Init Error:", e.message);
    }
};

const startYoutubePolling = (youtube) => {
    if (youtubeIntervalId) clearTimeout(youtubeIntervalId);

    const poll = async () => {
        try {
            const resp = await youtube.liveChatMessages.list({
                liveChatId: youtubeLiveChatId,
                part: 'snippet,authorDetails',
                pageToken: youtubeNextPageToken
            });

            youtubeNextPageToken = resp.data.nextPageToken;
            const pollingInterval = Math.max(resp.data.pollingIntervalMillis || 5000, 3000); // Respect limit, min 3s

            if (resp.data.items) {
                resp.data.items.forEach(item => {
                    // Deduplicate logic or rely on pageToken works?
                    // YouTube pageToken ensures we only get *new* items usually, 
                    // but on first fetch (no pageToken) it returns history.
                    // We might want to filter by timestamp > boot time if we want to skip history,
                    // but chat buffer handles history gracefully usually.

                    const user = item.authorDetails.displayName;
                    const avatar = item.authorDetails.profileImageUrl;
                    const text = item.snippet.displayMessage;

                    // Simple logging/emission
                    normalizeMsg('youtube', user, text, '#FF0000', avatar);
                });
            }

            youtubeIntervalId = setTimeout(poll, pollingInterval);
        } catch (e) {
            console.error("YouTube Polling Error:", e.message);
            youtubeIntervalId = setTimeout(poll, 30000); // Backoff on error
        }
    };

    poll();
};

// --- API: TikTok Auth (Redirect Flow for Cert Acceptance) ---
app.get('/api/auth/tiktok', (req, res) => {
    const { username } = req.query;
    if (!username) return res.status(400).send("Username required");

    // Use auth.js helper to update tokens (memory + disk)
    setToken('tiktok', { username });

    // Initialize immediately
    initTikTok();

    // Redirect back to client
    res.redirect(`${CLIENT_URL}?auth=tiktok_success`);
});

const { updateTwitchMetadata, searchTwitchGame, updateYoutubeMetadata } = require('./metadata');

// ... (previous routes) ...

// --- API: Stream Metadata ---
app.post('/api/stream/metadata', async (req, res) => {
    const { title, twitchGameId, platforms } = req.body;
    const results = {};

    // Parallel execution
    const promises = [];

    // Valid platforms array check
    const targets = Array.isArray(platforms) ? platforms : ['twitch', 'youtube', 'kick'];

    // Twitch
    if (targets.includes('twitch') && getTokens('twitch')) {
        promises.push(
            updateTwitchMetadata(title, twitchGameId)
                .then(() => results.twitch = 'Success')
                .catch(e => {
                    console.error("Twitch Update Error:", e.response?.data || e.message);
                    results.twitch = e.response?.status === 401 ? 'Auth Error (Reconnect)' : 'Failed';
                })
        );
    }

    // YouTube (Only Title for now)
    if (targets.includes('youtube') && getTokens('youtube')) {
        promises.push(
            updateYoutubeMetadata(title)
                .then(res => results.youtube = res ? 'Success' : 'No Active Stream')
                .catch(e => {
                    console.error("YouTube Update Error:", e.message);
                    results.youtube = 'Failed';
                })
        );
    }

    // Kick (Placeholder)
    // promises.push(...)

    await Promise.all(promises);
    res.json(results);
});

// --- API: Game Search (Proxy to Twitch) ---
app.get('/api/stream/search-game', async (req, res) => {
    const { query } = req.query;
    if (!query) return res.json([]);
    try {
        const games = await searchTwitchGame(query);
        res.json(games);
    } catch (e) {
        console.error("Game Search Error:", e.message);
        res.status(500).json({ error: "Search failed" });
    }
});

// --- API: Disconnect Platform ---
app.post('/api/auth/:platform/disconnect', (req, res) => {
    const { platform } = req.params;

    if (platform === 'tiktok') {
        if (tiktokConnection) {
            tiktokConnection.disconnect();
            tiktokConnection = null;
        }
    }

    setToken(platform, null);
    console.log(`[Auth] Disconnected ${platform}`);
    res.json({ success: true });
});

// --- API: Game Search (Proxy to Twitch) ---

// --- API: TikTok Auth (Redirect Flow) ---
// (Already defined above)

// --- API: TikTok Auth (Redirect Flow) ---
// (Already defined above)

// 4. StreamElements
if (process.env.STREAMELEMENTS_JWT) {
    const seSocket = ioClient('https://realtime.streamelements.com', { transports: ['websocket'] });
    seSocket.on('connect', () => { seSocket.emit('authenticate', { method: 'jwt', token: process.env.STREAMELEMENTS_JWT }); });
    seSocket.on('event', (data) => {
        if (!data || !data.type) return;
        const type = data.type;
        const name = data.data.username;
        const amount = data.data.amount;
        let actType = 'unknown';
        let details = '';

        if (type === 'follower') { actType = 'follow'; }
        if (type === 'subscriber') { actType = 'sub'; details = `Tier ${data.data.tier || 1}`; }
        if (type === 'tip') { actType = 'tip'; details = `${data.data.currency} ${amount}`; }
        if (type === 'cheer') { actType = 'cheer'; details = `${amount} bits`; }

        emitActivity(actType, data.provider || 'twitch', name, details);
    });
}


// --- ASYNC STARTUP (Moved to Bottom) ---
(async () => {
    try {
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, { days: 365 });

        // Create HTTPS Server
        const server = https.createServer({
            key: pems.private,
            cert: pems.cert
        }, app);

        io = new Server(server, {
            cors: {
                origin: CLIENT_URL,
                methods: ["GET", "POST"],
                credentials: true
            }
        });

        // Connection handling
        io.on('connection', (socket) => {
            console.log('Frontend connected');
            socket.emit('history', chatHistory);

            // Handle sending messages
            socket.on('send-message', async ({ platform, text }) => {
                console.log(`Sending to ${platform}: ${text}`);
                let sentToLoopback = false;

                try {
                    // TWITCH
                    if ((platform === 'twitch' || platform === 'all') && twitchClient) {
                        // Send to Twitch
                        twitchClient.say(process.env.TWITCH_CHANNEL, text).catch(err => {
                            console.error("Twitch Send Error:", err);
                        });

                        // Manually loopback message to UI (since tmi.js doesn't emit 'message' for self)
                        if (!sentToLoopback) {
                            const twitchUser = getTokens('twitch')?.username || process.env.TWITCH_CHANNEL || 'Me';
                            normalizeMsg('twitch', twitchUser, text, '#FFFFFF', null, null);
                            sentToLoopback = true; // Avoid double-echo if sending to multiple
                        }
                    }

                    // KICK (Public v1 API)
                    if (platform === 'kick' || platform === 'all') {
                        const kTokens = getTokens('kick');

                        if (kTokens && kTokens.accessToken && kickSession.userId) {
                            try {
                                await axios.post('https://api.kick.com/public/v1/chat', {
                                    broadcaster_user_id: kickSession.userId,
                                    content: text,
                                    type: "user"
                                }, {
                                    headers: {
                                        'Authorization': `Bearer ${kTokens.accessToken}`,
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json'
                                    }
                                });
                                console.log("Kick Message Sent (v1/chat)!");

                                if (!sentToLoopback) {
                                    normalizeMsg('kick', kickSession.username || 'Me', text, '#00FF00', null, null);
                                    sentToLoopback = true;
                                }
                            } catch (kErr) {
                                console.error("Kick Send v1 Error:", kErr.response?.data || kErr.message);
                            }
                        } else {
                            console.warn("Kick: Cannot send. Missing Token or User ID. (Try refreshing page).");
                        }
                    }

                    // YOUTUBE
                    if ((platform === 'youtube' || platform === 'all') && youtubeClient && youtubeLiveChatId) {
                        try {
                            await youtubeClient.liveChatMessages.insert({
                                part: 'snippet',
                                resource: {
                                    snippet: {
                                        liveChatId: youtubeLiveChatId,
                                        type: 'textMessageEvent',
                                        textMessageDetails: {
                                            messageText: text
                                        }
                                    }
                                }
                            });
                            console.log("YouTube Message Sent!");
                            if (!sentToLoopback) {
                                normalizeMsg('youtube', 'Me', text, '#FF0000', null, null);
                                sentToLoopback = true;
                            }
                        } catch (yErr) {
                            console.error("YouTube Send Error:", yErr.message);
                        }
                    }

                } catch (e) {
                    console.error("Send Message Error:", e);
                }
            });
        });

        server.listen(PORT, () => {
            console.log(`Unified Stream Hub running on port ${PORT} (HTTPS)`);
            console.log(`Accept self-signed cert at: https://localhost:${PORT}`);
        });

        // Initialize Platforms
        initTwitch();
        initKick();
        initTikTok();
        initYoutube();

    } catch (e) {
        console.error("Failed to start server:", e);
    }
})();
