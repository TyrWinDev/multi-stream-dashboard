const axios = require('axios');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, 'tokens.json');

// --- Token Management ---
let tokens = {};
if (fs.existsSync(TOKEN_PATH)) {
    try {
        tokens = JSON.parse(fs.readFileSync(TOKEN_PATH, 'utf8'));
    } catch (e) {
        console.error("Failed to load tokens:", e);
    }
}

const saveTokens = () => {
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));
};

const getTokens = (platform) => tokens[platform];

const SERVER_BASE_URL = process.env.SERVER_URL || `https://localhost:${process.env.PORT || 3001}`;
const CLIENT_BASE_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// --- Twitch OAuth ---
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';
const TWITCH_TOKEN_URL = 'https://id.twitch.tv/oauth2/token';
const TWITCH_SCOPES = 'chat:read chat:edit channel:read:subscriptions channel:manage:broadcast';

const startTwitchAuth = (res) => {
    const params = new URLSearchParams({
        client_id: process.env.TWITCH_CLIENT_ID,
        redirect_uri: `${SERVER_BASE_URL}/api/auth/twitch/callback`,
        response_type: 'code',
        scope: TWITCH_SCOPES
    });
    res.redirect(`${TWITCH_AUTH_URL}?${params.toString()}`);
};

const handleTwitchCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const resp = await axios.post(TWITCH_TOKEN_URL, null, {
            params: {
                client_id: process.env.TWITCH_CLIENT_ID,
                client_secret: process.env.TWITCH_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: `${SERVER_BASE_URL}/api/auth/twitch/callback`
            }
        });

        tokens.twitch = {
            accessToken: resp.data.access_token,
            refreshToken: resp.data.refresh_token,
            expiry: Date.now() + (resp.data.expires_in * 1000)
        };
        saveTokens();

        // Redirect back to frontend
        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?auth=twitch_success`);

    } catch (e) {
        console.error('Twitch Auth Error:', e.response?.data || e.message);
        res.status(500).send('Authentication Failed');
    }
};

// --- Kick OAuth (PKCE) ---
const KICK_AUTH_URL = 'https://id.kick.com/oauth/authorize';
const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token';
const crypto = require('crypto');

// In-memory store for PKCE verifiers (Map<state, verifier>)
// In prod, use Redis or DB
const pkceStore = new Map();

const base64URLEncode = (str) => {
    return str.toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
};

const sha256 = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest();
};

const startKickAuth = (res) => {
    const state = crypto.randomBytes(16).toString('hex');
    const codeVerifier = base64URLEncode(crypto.randomBytes(32));
    const codeChallenge = base64URLEncode(sha256(codeVerifier));

    pkceStore.set(state, codeVerifier);

    // Clean store periodically (simple TTL implementation)
    setTimeout(() => pkceStore.delete(state), 300000); // 5 min TTL

    const params = new URLSearchParams({
        client_id: process.env.KICK_CLIENT_ID,
        redirect_uri: `${SERVER_BASE_URL}/api/auth/kick/callback`,
        response_type: 'code',
        scope: 'user:read channel:read channel:write chat:write events:subscribe',
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        state: state
    });

    res.redirect(`${KICK_AUTH_URL}?${params.toString()}`);
};

const handleKickCallback = async (req, res) => {
    const { code, state } = req.query;

    if (!state || !pkceStore.has(state)) {
        return res.status(400).send("Invalid or expired state");
    }

    const codeVerifier = pkceStore.get(state);
    pkceStore.delete(state); // Consume verifier

    try {
        const params = new URLSearchParams({
            client_id: process.env.KICK_CLIENT_ID,
            client_secret: process.env.KICK_CLIENT_SECRET,
            code,
            grant_type: 'authorization_code',
            redirect_uri: `${SERVER_BASE_URL}/api/auth/kick/callback`,
            code_verifier: codeVerifier
        });

        const resp = await axios.post(KICK_TOKEN_URL, params, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        tokens.kick = {
            accessToken: resp.data.access_token,
            refreshToken: resp.data.refresh_token,
            expiry: Date.now() + (resp.data.expires_in * 1000)
        };
        saveTokens();
        res.redirect(`${CLIENT_BASE_URL}?auth=kick_success`);
    } catch (e) {
        console.error("Kick Auth Error Data:", JSON.stringify(e.response?.data, null, 2));
        res.status(500).send(`Kick Auth Failed: ${e.response?.data?.error_description || e.message}`);
    }
};

// --- YouTube OAuth ---
const oauth2Client = new google.auth.OAuth2(
    process.env.YOUTUBE_CLIENT_ID,
    process.env.YOUTUBE_CLIENT_SECRET,
    `${SERVER_BASE_URL}/api/auth/youtube/callback`
);

const YOUTUBE_SCOPES = [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl'
];

const startYoutubeAuth = (res) => {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline', // Required for refresh_token
        scope: YOUTUBE_SCOPES,
        prompt: 'consent' // Force consent to ensure refresh token is returned
    });
    res.redirect(authUrl);
};

const handleYoutubeCallback = async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send('No code provided');

    try {
        const { tokens: newTokens } = await oauth2Client.getToken(code);
        // OAuth2Client handles token exchange

        // Save tokens
        tokens.youtube = {
            accessToken: newTokens.access_token,
            refreshToken: newTokens.refresh_token, // Only exists if access_type=offline & prompt=consent
            expiry: newTokens.expiry_date
        };
        saveTokens();

        res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}?auth=youtube_success`);
    } catch (e) {
        console.error('YouTube Auth Error:', e.message);
        res.status(500).send('YouTube Authentication Failed');
    }
};

const setToken = (platform, data) => {
    tokens[platform] = data;
    saveTokens();
};

module.exports = {
    getTokens,
    setToken,
    startTwitchAuth,
    handleTwitchCallback,
    startKickAuth,
    handleKickCallback,
    startYoutubeAuth,
    handleYoutubeCallback
};
