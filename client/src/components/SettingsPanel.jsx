import React from 'react';
import { Settings, Lock } from 'lucide-react';

const SettingsPanel = ({ authStatus }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    // If authStatus is not passed from parent (e.g. standalone test), simple fallback
    const status = authStatus || { twitch: false, kick: false };

    const connectTwitch = () => {
        // Force fully qualified URL to avoid any relative path ambiguity
        window.location.assign('https://localhost:3001/api/auth/twitch');
    };

    const connectKick = () => {
        window.location.assign('https://localhost:3001/api/auth/kick');
    };

    const connectYoutube = () => {
        window.location.assign('https://localhost:3001/api/auth/youtube');
    };

    const handleTikTokConnect = (rawUsername) => {
        if (!rawUsername) return;
        const username = rawUsername.replace('@', '');
        window.location.assign(`https://localhost:3001/api/auth/tiktok?username=${username}`);
    };

    const handleTikTokDisconnect = async () => {
        try {
            await fetch('https://localhost:3001/api/auth/tiktok/disconnect', { method: 'POST' });
            window.location.reload();
        } catch (e) {
            console.error("TikTok Disconnect Error:", e);
        }
    };

    // Helper to render button content
    const renderButtonContent = (platformKey, label, colorClass) => {
        const platformData = status[platformKey] || {};
        const isConnected = platformData.connected;

        return (
            <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                    {/* Avatar or Icon */}
                    {isConnected && platformData.avatar ? (
                        <img src={platformData.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-600" />
                    ) : (
                        <span className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center">
                            <Lock className="w-3 h-3 opacity-50" />
                        </span>
                    )}

                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium leading-none">{label}</span>
                        {isConnected && platformData.username && (
                            <span className={`text-[10px] opacity-70 mt-0.5 ${colorClass}`}>
                                {platformData.username}
                            </span>
                        )}
                    </div>
                </div>

                {isConnected && (
                    <span className="text-[10px] bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded font-bold border border-green-500/30">
                        LINKED
                    </span>
                )}
            </div>
        );
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-4 left-4 p-3 bg-gray-800 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white transition-all shadow-lg border border-gray-700 z-50"
                title="Open Settings"
            >
                <Settings className="w-6 h-6" />
                {/* Optional Status Indicator Dot */}
                {(status.twitch?.connected || status.kick?.connected) && (
                    <span className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#0f0f0f]"></span>
                )}
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 w-72 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl p-4 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-white flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-gray-400" />
                    Connection Manager
                </h3>
                <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="space-y-2">
                        {/* Kick Button */}
                        <button
                            onClick={connectKick}
                            disabled={status.kick?.connected}
                            className={`w-full p-2 rounded transition border ${status.kick?.connected
                                ? 'bg-green-900/10 border-green-900/50 text-green-100 cursor-default'
                                : 'bg-green-900/20 border-green-900 hover:bg-green-900/40 text-green-300'
                                }`}
                        >
                            {renderButtonContent('kick', 'Kick', 'text-green-300')}
                        </button>

                        {/* Twitch Button */}
                        <button
                            onClick={connectTwitch}
                            disabled={status.twitch?.connected}
                            className={`w-full p-2 rounded transition border ${status.twitch?.connected
                                ? 'bg-purple-900/10 border-purple-900/50 text-purple-100 cursor-default'
                                : 'bg-purple-900/20 border-purple-900 hover:bg-purple-900/40 text-purple-300'
                                }`}
                        >
                            {renderButtonContent('twitch', 'Twitch', 'text-purple-300')}
                        </button>

                        {/* YouTube Button */}
                        <button
                            onClick={connectYoutube}
                            disabled={status.youtube?.connected}
                            className={`w-full p-2 rounded transition border ${status.youtube?.connected
                                ? 'bg-red-900/10 border-red-900/50 text-red-100 cursor-default'
                                : 'bg-red-900/20 border-red-900 hover:bg-red-900/40 text-red-300'
                                }`}
                        >
                            {renderButtonContent('youtube', 'YouTube', 'text-red-300')}
                        </button>

                        {/* TikTok Section (Custom Input) */}
                        <div className={`w-full p-2 rounded border ${status.tiktok?.connected
                            ? 'bg-pink-900/10 border-pink-900/50'
                            : 'bg-pink-900/20 border-pink-900'
                            }`}>
                            {status.tiktok?.connected ? (
                                <div className="flex items-center justify-between w-full">
                                    <div className="flex items-center gap-3">
                                        {/* TikTok Icon/Avatar */}
                                        <span className="w-6 h-6 rounded-full bg-pink-600 flex items-center justify-center text-xs font-bold text-white">Tk</span>

                                        <div className="flex flex-col items-start">
                                            <span className="text-sm font-medium leading-none text-pink-200">TikTok</span>
                                            <span className="text-[10px] opacity-70 mt-0.5 text-pink-300">
                                                @{status.tiktok.username}
                                            </span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleTikTokDisconnect}
                                        className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40 border border-red-500/30 transition"
                                    >
                                        DISCONNECT
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="@username"
                                        id="tiktok-input"
                                        className="flex-1 bg-black/30 border border-pink-900/50 rounded px-2 py-1 text-sm text-pink-100 focus:outline-none focus:border-pink-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleTikTokConnect(e.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={() => handleTikTokConnect(document.getElementById('tiktok-input').value)}
                                        className="bg-pink-600 hover:bg-pink-700 text-white text-xs px-3 py-1 rounded transition"
                                    >
                                        Connect
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SettingsPanel;
