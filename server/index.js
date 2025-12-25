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

    // Update Widget State History
    if (widgetState && widgetState.recentEvents) {
        widgetState.recentEvents.unshift(activity);
        if (widgetState.recentEvents.length > 10) widgetState.recentEvents.pop();
    }

    if (io) {
        io.emit('activity-event', activity);
        io.emit('widget-event', { type: 'activity', payload: activity }); // Sync standalone widgets if they use state
    }
};

// --- Platform Connectors ---

const { getTokens, setToken, startTwitchAuth, handleTwitchCallback, refreshTwitchToken, startKickAuth, handleKickCallback, startYoutubeAuth, handleYoutubeCallback } = require('./auth');

// ... (config) ...

// --- Auth Routes ---
// --- Auth Routes ---
app.get('/api/auth/twitch', (req, res) => startTwitchAuth(res));
app.get('/api/auth/twitch/callback', handleTwitchCallback);

app.get('/api/auth/kick', (req, res) => startKickAuth(res));
app.get('/api/auth/kick/callback', handleKickCallback);

app.get('/api/auth/youtube', (req, res) => startYoutubeAuth(res));
app.get('/api/auth/youtube/callback', handleYoutubeCallback);

// Diagnostic Endpoint
app.get('/api/diag', (req, res) => {
    res.json({
        status: 'ok',
        time: new Date().toISOString(),
        env: {
            NODE_ENV: process.env.NODE_ENV || 'development',
            PORT: process.env.PORT || 3001,
            CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:5173',
            SERVER_URL: process.env.SERVER_URL || 'https://localhost:3001 (auto)',
        },
        platforms: {
            twitch: !!process.env.TWITCH_CLIENT_ID,
            kick: !!process.env.KICK_CLIENT_ID,
            youtube: !!process.env.YOUTUBE_CLIENT_ID,
            tiktok: !!process.env.TIKTOK_USER
        }
    });
});

// In-memory session store (simple)
let kickSession = { chatroomId: null, username: null };

// --- Widget State Store ---
const storage = require('./storage');
let widgetState = storage.loadState();

// Global Timer Interval
setInterval(() => {
    if (widgetState.timer.isRunning) {
        if (widgetState.timer.mode === 'countup') {
            widgetState.timer.remaining++; // In countup, 'remaining' acts as 'elapsed'
        } else {
            // Countdown
            if (widgetState.timer.remaining > 0) {
                widgetState.timer.remaining--;
            }
            // Auto-stop at 0
            if (widgetState.timer.remaining === 0) {
                widgetState.timer.isRunning = false;
                if (io) io.emit('widget-event', { type: 'timer-msg', payload: 'Timer Finished!' }); // Signal for alarm
            }
        }

        // Broadcast update every second
        if (io) {
            io.emit('widget-event', { type: 'timer-update', payload: { remaining: widgetState.timer.remaining, isRunning: widgetState.timer.isRunning } });
        }
    }
}, 1000);

app.get('/api/auth/status', async (req, res) => {
    // Debug Log
    const tLog = getTokens('twitch');
    const kLog = getTokens('kick');

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
            // Use /users (plural) - Verification confirmed            // Msg 1: Get User Info
            const resp = await axios.get('https://api.kick.com/public/v1/users', {
                headers: { 'Authorization': `Bearer ${kickToken.accessToken}` }
            });

            // Debug: Introspect Token (Check Scopes)
            try {
                const introResp = await axios.post('https://api.kick.com/public/v1/token/introspect', {}, {
                    headers: { 'Authorization': `Bearer ${kickToken.accessToken}` }
                });
            } catch (introErr) {
                console.error("Kick Introspect Error:", introErr.message);
            }

            // Response format: { data: [ { user_id: 123, ... } ] }
            const userData = resp.data.data ? resp.data.data[0] : resp.data;

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
        return;
    }



    // Fetch username from API to ensure we have the correct identity
    let username = process.env.TWITCH_USERNAME || 'justinfan123';
    try {
        const resp = await axios.get('https://api.twitch.tv/helix/users', {
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
                'Client-Id': process.env.TWITCH_CLIENT_ID
            }
        });
        if (resp.data.data?.[0]) {
            username = resp.data.data[0].login; // Use login name (lowercase)
            // Update token with username if needed or just use it here
        }
    } catch (e) {
        console.warn("Twitch: Failed to fetch username from token, defaulting to env/anon:", e.message);
    }

    const opts = {
        options: { debug: true, messagesLogLevel: "info" },
        connection: { reconnect: true, secure: true },
        identity: {
            username: username,
            password: `oauth:${tokens.accessToken}`
        },
        channels: channels
    };

    const logToFile = (msg) => {
        try { fs.appendFileSync('server_debug.log', `[${new Date().toISOString()}] ${msg}\n`); } catch (e) { }
    };

    logToFile(`Twitch: Attempting to connect. Channels: ${JSON.stringify(channels)}`);
    logToFile(`Twitch: Token present? ${!!tokens.accessToken}`);

    try {
        twitchClient = new tmi.Client(opts);

        twitchClient.on('connecting', (address, port) => {
            logToFile(`Twitch: Connecting to ${address}:${port}...`);
        });

        twitchClient.on('connected', (address, port) => {
            logToFile(`Twitch: Connected to ${address}:${port}`);
        });

        twitchClient.on('disconnected', (reason) => {
            logToFile(`Twitch: Disconnected! Reason: ${reason}`);
            // If disconnected, maybe token expired? (Simplistic retry)
            // tmi.js auto-reconnects, but if auth fails it might stop.
        });

        // Handle specifics
        twitchClient.on('notice', async (channel, msgid, message) => {
            if (msgid === 'msg_channel_suspended' || msgid === 'login_authentication_failed') {
                console.error("Twitch Auth Failed (Notice):", message);
                // Trigger refresh ??
                await refreshTwitchToken().catch(e => console.error("Refresh failed"));
            }
        });

        await twitchClient.connect();

        twitchClient.on('message', (channel, tags, message, self) => {
            logToFile(`[Twitch RAW] ${tags['display-name']}: ${message}`);
            if (self) return;
            normalizeMsg('twitch', tags['display-name'] || tags['username'], message, tags['color'], null, tags['emotes']);
        });

    } catch (e) {
        logToFile(`Twitch Connection Error: ${e.message}`);
        console.error("Twitch Connection Error:", e.message);

        // RETRY WITH REFRESH

        try {
            await refreshTwitchToken();
            initTwitch(); // Recursively call init (dangerous if loop, but refresh throws if fails)
        } catch (refreshErr) {
            console.error("Twitch: Critical Auth Failure. Please re-login.");
        }
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
        } catch (e) { /* ignore */ }
    }

    if (!username) return;

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
        });

        tiktokConnection.on('disconnected', () => {
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
        return;
    }

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
            return;
        }

        const broadcast = broadcastResp.data.items[0];
        youtubeLiveChatId = broadcast.snippet.liveChatId;

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

    // Kick
    if (targets.includes('kick') && getTokens('kick')) {
        // Use gameName for auto-match
        promises.push(
            require('./metadata').updateKickMetadata(title, req.body.gameName)
                .then(() => results.kick = 'Success')
                .catch(e => {
                    console.error("Kick Update Error:", e.message);
                    results.kick = 'Failed';
                })
        );
    }

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
        // --- HYBRID SERVER SETUP ---
        const HTTPS_PORT = process.env.PORT || 3001;
        const HTTP_PORT = parseInt(HTTPS_PORT) + 1; // 3002 usually

        // 1. Prepare HTTPS (Self-Signed)
        console.log('Generating Self-Signed Certs for HTTPS...');
        const attrs = [{ name: 'commonName', value: 'localhost' }];
        const pems = await selfsigned.generate(attrs, { days: 365, keySize: 2048, algorithm: 'sha256' });

        const httpsServer = https.createServer({
            key: pems.private,
            cert: pems.cert
        }, app);

        // 2. Prepare HTTP
        const httpServer = http.createServer(app);

        // 3. Setup Socket.IO (Bind to BOTH)
        io = new Server({
            cors: {
                origin: CLIENT_URL,
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        io.attach(httpsServer);
        io.attach(httpServer);

        // Connection handling
        io.on('connection', (socket) => {
            socket.emit('history', chatHistory);
            socket.emit('widget-state', widgetState);

            // SIMULATION HANDLER
            socket.on('simulate-event', ({ type, data }) => {
                if (type === 'chat' && data) {
                    normalizeMsg(data.platform, data.user, data.text, data.color);
                } else if (type === 'activity' && data) {
                    emitActivity(data.type, data.platform, data.user, data.details);
                }
            });

            // WIDGET HANDLER
            socket.on('widget-action', ({ type, payload }) => {
                // Update State
                if (type === 'global-update') widgetState.global = { ...widgetState.global, ...payload };
                if (type === 'counter-update') widgetState.counter = { ...widgetState.counter, ...payload };
                if (type === 'timer-update') widgetState.timer = { ...widgetState.timer, ...payload };
                if (type === 'social-update') widgetState.social = { ...widgetState.social, ...payload };
                if (type === 'progress-update') widgetState.progress = { ...widgetState.progress, ...payload };
                if (type === 'goals-update') widgetState.goals = { ...widgetState.goals, ...payload };
                if (type === 'wheel-update') {
                    widgetState.wheel = { ...widgetState.wheel, ...payload };
                    if (payload.winner) widgetState.wheel.winner = payload.winner;
                }
                if (type === 'highlight-update') widgetState.highlight = { ...widgetState.highlight, ...payload };
                if (type === 'activity-update') widgetState.activity = { ...widgetState.activity, ...payload };
                if (type === 'highlight-message') widgetState.highlight = { message: payload };

                // Persist State
                storage.saveState(widgetState);

                // Broadcast
                io.emit('widget-event', { type, payload });
            });


            // Handle sending messages (Duplicated internal logic, but shared IO scope)
            socket.on('send-message', async ({ platform, text }) => {
                let sentToLoopback = false;

                try {
                    // TWITCH
                    if ((platform === 'twitch' || platform === 'all') && twitchClient) {
                        twitchClient.say(process.env.TWITCH_CHANNEL, text).catch(err => {
                            console.error("Twitch Send Error:", err);
                        });
                        if (!sentToLoopback) {
                            const twitchUser = getTokens('twitch')?.username || process.env.TWITCH_CHANNEL || 'Me';
                            normalizeMsg('twitch', twitchUser, text, '#FFFFFF', null, null);
                            sentToLoopback = true;
                        }
                    }

                    // KICK (Public v1 API)
                    if (platform === 'kick' || platform === 'all') {
                        const kTokens = getTokens('kick');

                        // Docs: broadcaster_user_id is required for type="user". It's the ID of the channel to post to.
                        // We assume we are posting to our own channel (authenticated user).
                        const targetId = kickSession.userId;

                        if (kTokens && kTokens.accessToken && targetId) {
                            try {
                                const payload = {
                                    broadcaster_user_id: parseInt(targetId, 10),
                                    content: text,
                                    type: "user"
                                };
                                // console.log("Kick: Sending Payload:", JSON.stringify(payload));
                                await axios.post('https://api.kick.com/public/v1/chat', payload, {
                                    headers: {
                                        'Authorization': `Bearer ${kTokens.accessToken}`,
                                        'Content-Type': 'application/json',
                                        'Accept': 'application/json'
                                    }
                                });

                                // console.log("Kick Message Sent (v1/chat)!");
                                if (!sentToLoopback) {
                                    normalizeMsg('kick', kickSession.username || 'Me', text, '#00FF00', null, null);
                                    sentToLoopback = true;
                                }
                            } catch (kErr) {
                                console.error("Kick Send v1 Error:", kErr.response?.data || kErr.message);
                            }
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

        // 4. Start Listeners
        httpsServer.listen(HTTPS_PORT, () => {
            console.log(`\n🔒 HTTPS Server running on port ${HTTPS_PORT} (FOR AUTH)`);
            console.log(`   URL: https://localhost:${HTTPS_PORT}`);
        });

        httpServer.listen(HTTP_PORT, () => {
            console.log(`\n🔓 HTTP Server running on port ${HTTP_PORT} (FOR OBS/CLIENT)`);
            console.log(`   URL: http://localhost:${HTTP_PORT}`);
        });

        console.log(`\n⚠️  SSL NOTICE: You may need to visit https://localhost:${HTTPS_PORT}/api/diag to accept the certificate for Auth to work.`);

        // Initialize Platforms
        initTwitch();
        initKick();
        initTikTok();
        initYoutube();

    } catch (e) {
        console.error("Failed to start server:", e);
    }
})();
