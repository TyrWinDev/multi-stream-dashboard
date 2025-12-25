const axios = require('axios');
const { google } = require('googleapis');
const { getTokens } = require('./auth');

// --- Helper: Update Twitch ---
const updateTwitchMetadata = async (title, gameId) => {
    const tokens = getTokens('twitch');
    if (!tokens || !tokens.accessToken) throw new Error("Twitch not connected");

    // 1. Get Broadcaster ID (if not stored, fetch it)
    // For efficiency, we assume the token belongs to the broadcaster. 
    // We can fetch the ID from the validation endpoint or cache it.
    // Let's fetch it quickly to be safe.
    const userResp = await axios.get('https://api.twitch.tv/helix/users', {
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    });
    const broadcasterId = userResp.data.data[0].id;

    // 2. Perform Update
    const body = {};
    if (title) body.title = title;
    if (gameId) body.game_id = gameId;

    await axios.patch(`https://api.twitch.tv/helix/channels?broadcaster_id=${broadcasterId}`, body, {
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID,
            'Content-Type': 'application/json'
        }
    });
    return true;
};

// --- Helper: Search Twitch Game ID ---
const searchTwitchGame = async (query) => {
    const tokens = getTokens('twitch');
    if (!tokens || !tokens.accessToken) return [];

    const resp = await axios.get(`https://api.twitch.tv/helix/games?name=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    });
    // Fallback to fuzzy search if exact match fails? Twitch API "get games" is exact match or ID.
    // Actually "search categories" is better for user input:
    const searchResp = await axios.get(`https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(query)}`, {
        headers: {
            'Authorization': `Bearer ${tokens.accessToken}`,
            'Client-Id': process.env.TWITCH_CLIENT_ID
        }
    });

    return searchResp.data.data.map(g => ({ id: g.id, name: g.name, box_art_url: g.box_art_url }));
};


// --- Helper: Update YouTube ---
const updateYoutubeMetadata = async (title, categoryId) => {
    const tokens = getTokens('youtube');
    if (!tokens || !tokens.accessToken) throw new Error("YouTube not connected");

    const oauth2Client = new google.auth.OAuth2(
        process.env.YOUTUBE_CLIENT_ID,
        process.env.YOUTUBE_CLIENT_SECRET
    );
    oauth2Client.setCredentials({ access_token: tokens.accessToken, refresh_token: tokens.refreshToken });

    const youtube = google.youtube({ version: 'v3', auth: oauth2Client });

    // 1. Find Active Broadcast
    const broadcastResp = await youtube.liveBroadcasts.list({
        part: 'id,snippet',
        broadcastStatus: 'active',
        broadcastType: 'all'
    });

    if (!broadcastResp.data.items || broadcastResp.data.items.length === 0) {
        return false;
    }

    const broadcast = broadcastResp.data.items[0];

    // 2. Update Broadcast Snippet
    const updateBody = {
        id: broadcast.id,
        snippet: {
            ...broadcast.snippet,
            title: title || broadcast.snippet.title,
            // categoryId is actually on the 'video' resource, not broadcast, usually. 
            // But liveBroadcasts.update docs say we can update title/description/scheduledTime.
            // Changing 'Game' (Category) usually requires updating the associated video.
            // Let's stick to Title for now for reliability.
        }
    };

    await youtube.liveBroadcasts.update({
        part: 'snippet',
        resource: updateBody
    });
    return true;
};

// --- Helper: Search Kick Category ---
const searchKickCategory = async (query) => {
    // Public API v1: GET /categories?q={query}
    try {
        const tokens = getTokens('kick');
        if (!tokens || !tokens.accessToken) return [];

        const res = await axios.get(`https://api.kick.com/public/v1/categories?q=${encodeURIComponent(query)}`, {
            headers: { 'Authorization': `Bearer ${tokens.accessToken}` }
        });

        if (res.data && res.data.data) {
            return res.data.data.map(c => ({ id: c.id, name: c.name, thumbnail: c.banner }));
        }
        return [];
    } catch (e) {
        console.error("[Kick] Category Search Error:", e.message);
        return [];
    }
};

// --- Helper: Update Kick ---
const updateKickMetadata = async (title, gameName) => {
    const tokens = getTokens('kick');
    if (!tokens || !tokens.accessToken) throw new Error("Kick not connected");

    // 1. Resolve Category ID from Game Name
    let categoryId = null;
    if (gameName) {
        const categories = await searchKickCategory(gameName);
        if (categories.length > 0) {
            // Simple exact match or first result
            const match = categories.find(c => c.name.toLowerCase() === gameName.toLowerCase()) || categories[0];
            categoryId = match.id;
        } else {
            console.warn(`[Kick] Could not find category for '${gameName}'`);
        }
    }

    // 2. Update Channel
    // Endpoint: PATCH https://api.kick.com/public/v1/channels (No ID in path, infers from token)
    // Keys: stream_title, category_id
    const body = {};
    if (title) body.stream_title = title;
    if (categoryId) body.category_id = categoryId;

    try {
        await axios.patch(`https://api.kick.com/public/v1/channels`, body, {
            headers: {
                'Authorization': `Bearer ${tokens.accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return true;
    } catch (e) {
        console.error("[Kick] Update Failed:", e.response?.data?.message || e.message);
        throw e;
    }
};


module.exports = {
    updateTwitchMetadata,
    searchTwitchGame,
    updateYoutubeMetadata,
    updateKickMetadata
};
