// utils/emoteMap.js
// Simple static mapping of emote shortcodes to image URLs for each platform.
// In a real app this could be fetched from APIs or a CDN.

const emoteMap = {
    twitch: {
        // Example Twitch emotes
        'Kappa': 'https://static-cdn.jtvnw.net/emoticons/v1/25/1.0',
        'PogChamp': 'https://static-cdn.jtvnw.net/emoticons/v1/88/1.0',
        'LUL': 'https://static-cdn.jtvnw.net/emoticons/v1/425618/1.0',
    },
    youtube: {
        // Example YouTube emotes (using custom images)
        ':)': 'https://example.com/youtube-smile.png',
        ':D': 'https://example.com/youtube-grin.png',
    },
    kick: {
        // Example Kick emotes
        'KickLove': 'https://example.com/kick-love.png',
        'KickHype': 'https://example.com/kick-hype.png',
    },
    streamelements: {
        // Example StreamElements emotes
        'se:smile': 'https://example.com/se-smile.png',
    },
};

export default emoteMap;
