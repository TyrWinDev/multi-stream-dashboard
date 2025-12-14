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
    console.log(`[Twitch] Updated Metadata: ${title} / GameID: ${gameId}`);
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
        console.log("[YouTube] No active broadcast found to update.");
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
    console.log(`[YouTube] Updated Broadcast Title: ${title}`);
    return true;
};

// --- Helper: Update Kick (Placeholder) ---
const updateKickMetadata = async (title, categoryId) => {
    // Kick API is private/undocumented for updates. 
    // We would need to inspect network traffic to find the endpoint.
    // Likely: POST https://kick.com/api/v2/channels/{slug}
    // For now, we log it as "Not Implemented Safety".
    console.log("[Kick] Metadata update not yet implemented (Private API barrier).");
    return false;
};


module.exports = {
    updateTwitchMetadata,
    searchTwitchGame,
    updateYoutubeMetadata,
    updateKickMetadata
};
