import React from 'react';
import { Settings, Lock, X } from 'lucide-react';

const SettingsPanel = ({ authStatus, isOpen, onClose }) => {
    // Click Outside Handler
    const panelRef = React.useRef(null);
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    // If not open, render nothing (toggle is now in StatusBar)
    if (!isOpen) return null;

    // ... (rest of component) ...
    // If authStatus is not passed from parent (e.g. standalone test), simple fallback
    const status = authStatus || { twitch: false, kick: false };

    // ... (connect handlers remain the same) ...
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

    const handleDisconnect = async (platform) => {
        if (!confirm(`Are you sure you want to disconnect ${platform}?`)) return;
        try {
            await fetch(`https://localhost:3001/api/auth/${platform}/disconnect`, { method: 'POST' });
            window.location.reload();
        } catch (e) {
            console.error("Disconnect Error:", e);
        }
    };

    // Helper to render button content
    const renderButtonContent = (platformKey, label, colorClass) => {
        const platformData = status[platformKey] || {};
        const isConnected = platformData.connected;

        return (
            <div className={`flex items-center justify-between w-full group ${isConnected ? 'cursor-pointer' : 'cursor-pointer'}`}>
                <div className="flex items-center gap-3">
                    {/* Avatar or Icon */}
                    {isConnected && platformData.avatar ? (
                        <img src={platformData.avatar} alt="" className="w-6 h-6 rounded-full border border-gray-600" />
                    ) : (
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isConnected ? 'bg-black/20' : 'bg-black/40 group-hover:bg-black/60'}`}>
                            <Lock className={`w-3 h-3 transition-opacity ${isConnected ? 'opacity-50' : 'opacity-70 group-hover:opacity-100'}`} />
                        </div>
                    )}

                    <div className="flex flex-col items-start text-left">
                        <span className="text-sm font-medium leading-none transition-colors group-hover:text-white">{label}</span>
                        {isConnected && platformData.username && (
                            <span className={`text-[10px] opacity-70 mt-0.5 ${colorClass}`}>
                                {platformData.username}
                            </span>
                        )}
                    </div>
                </div>

                <div className="relative flex items-center">
                    {isConnected ? (
                        <>
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded font-bold border border-green-500/30 transition-all duration-300 opacity-100 group-hover:opacity-0 group-hover:absolute group-hover:top-0 group-hover:right-0">
                                LINKED
                            </span>
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded font-bold border border-red-500/30 transition-all duration-300 opacity-0 absolute top-0 right-0 group-hover:opacity-100 group-hover:relative">
                                DISCONNECT
                            </span>
                        </>
                    ) : (
                        <span className="text-[10px] bg-gray-700/50 text-gray-400 px-2 py-1 rounded font-bold border border-gray-600/30 transition-all duration-300 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 shadow-sm">
                            CONNECT
                        </span>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div ref={panelRef} className="fixed bottom-14 right-4 w-72 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl p-4 z-[100] animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-white flex items-center">
                    <Settings className="w-4 h-4 mr-2 text-gray-400" />
                    Connection Manager
                </h3>
                <button
                    onClick={onClose}
                    className="relative p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors z-[110] cursor-pointer"
                >
                    <X className="w-5 h-5 pointer-events-none" />
                </button>
            </div>

            <div className="space-y-4">
                <div>
                    <div className="space-y-2">
                        {/* Kick Button */}
                        <button
                            onClick={() => status.kick?.connected ? handleDisconnect('kick') : connectKick()}
                            className={`w-full p-2 rounded transition border ${status.kick?.connected
                                ? 'bg-green-900/10 border-green-900/50 text-green-100'
                                : 'bg-green-900/20 border-green-900 hover:bg-green-900/40 text-green-300'
                                }`}
                        >
                            {renderButtonContent('kick', 'Kick', 'text-green-300')}
                        </button>

                        {/* Twitch Button */}
                        <button
                            onClick={() => status.twitch?.connected ? handleDisconnect('twitch') : connectTwitch()}
                            className={`w-full p-2 rounded transition border ${status.twitch?.connected
                                ? 'bg-purple-900/10 border-purple-900/50 text-purple-100'
                                : 'bg-purple-900/20 border-purple-900 hover:bg-purple-900/40 text-purple-300'
                                }`}
                        >
                            {renderButtonContent('twitch', 'Twitch', 'text-purple-300')}
                        </button>

                        {/* YouTube Button */}
                        <button
                            onClick={() => status.youtube?.connected ? handleDisconnect('youtube') : connectYoutube()}
                            className={`w-full p-2 rounded transition border ${status.youtube?.connected
                                ? 'bg-red-900/10 border-red-900/50 text-red-100'
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
                                        onClick={() => handleDisconnect('tiktok')}
                                        className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded hover:bg-red-500/40 border border-red-500/30 transition"
                                    >
                                        DISCONNECT
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2 items-center w-full">
                                    <input
                                        type="text"
                                        placeholder="@username"
                                        id="tiktok-input"
                                        style={{ minWidth: 0 }}
                                        className="flex-1 bg-black/30 border border-pink-900/50 rounded px-2 py-1 text-sm text-pink-100 focus:outline-none focus:border-pink-500"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleTikTokConnect(e.target.value);
                                        }}
                                    />
                                    <button
                                        onClick={() => handleTikTokConnect(document.getElementById('tiktok-input').value)}
                                        className="bg-pink-600 hover:bg-pink-700 text-white text-xs px-2 py-1 rounded transition whitespace-nowrap"
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
