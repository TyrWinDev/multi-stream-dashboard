import React from 'react';
import { Bug } from 'lucide-react';

const DebugPanel = ({ onSimulate, isOpen, onClose }) => {
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

    if (!isOpen) return null;

    return (
        <div ref={panelRef} className="fixed bottom-14 right-4 w-72 bg-[#1a1a1a] border border-gray-700 rounded-lg shadow-xl p-4 z-50 animate-fade-in">
            <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                <h3 className="font-bold text-white flex items-center">
                    <Bug className="w-4 h-4 mr-2 text-green-400" />
                    Simulation
                </h3>
                <button onClick={onClose} className="text-gray-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-3">
                <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Activity Feed</p>
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            onClick={() => onSimulate('activity', { type: 'follow', platform: 'twitch', user: 'NewFollower' })}
                            className="p-2 bg-blue-900/30 text-blue-400 border border-blue-900 rounded hover:bg-blue-900/50 text-sm transition"
                        >
                            Follow
                        </button>
                        <button
                            onClick={() => onSimulate('activity', { type: 'sub', platform: 'twitch', user: 'TechEnthusiast', details: 'Tier 1' })}
                            className="p-2 bg-purple-900/30 text-purple-400 border border-purple-900 rounded hover:bg-purple-900/50 text-sm transition"
                        >
                            Sub
                        </button>
                        <button
                            onClick={() => onSimulate('activity', { type: 'tip', platform: 'streamelements', user: 'BigDonator', details: '$50.00' })}
                            className="p-2 bg-yellow-900/30 text-yellow-400 border border-yellow-900 rounded hover:bg-yellow-900/50 text-sm transition"
                        >
                            Tip
                        </button>
                        <button
                            onClick={() => onSimulate('activity', { type: 'gift', platform: 'tiktok', user: 'Gifteee', details: 'Sent Rose x10' })}
                            className="p-2 bg-pink-900/30 text-pink-400 border border-pink-900 rounded hover:bg-pink-900/50 text-sm transition"
                        >
                            Gift
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Activity Theme</p>
                    <div className="flex space-x-2">
                        <button
                            onClick={() => onSimulate('theme', 'minimal')}
                            className="flex-1 p-2 bg-gray-800 text-gray-300 border border-gray-600 rounded hover:bg-gray-700 text-xs transition"
                        >
                            Minimal
                        </button>
                        <button
                            onClick={() => onSimulate('theme', 'colorful')}
                            className="flex-1 p-2 bg-gradient-to-r from-blue-900/50 to-purple-900/50 text-blue-200 border border-blue-800 rounded hover:opacity-80 text-xs transition"
                        >
                            Colorful
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Chat</p>
                    <button
                        onClick={() => onSimulate('chat', { platform: 'kick', user: 'KickChatter', text: 'This dashboard is amazing! POG', color: '#53fc18' })}
                        className="w-full p-2 bg-green-900/30 text-green-400 border border-green-900 rounded hover:bg-green-900/50 text-sm transition text-left px-3"
                    >
                        Simulate Kick Msg
                    </button>
                    <button
                        onClick={() => onSimulate('chat', { platform: 'twitch', user: 'EmoteFan', text: 'Kappa Keepo PogChamp', color: '#a020f0', emotes: { '25': ['0-4'], '1902': ['6-10'] } })}
                        className="w-full p-2 bg-purple-900/30 text-purple-400 border border-purple-900 rounded hover:bg-purple-900/50 text-sm transition text-left px-3"
                    >
                        Simulate Emote Msg
                    </button>
                    <button
                        onClick={() => onSimulate('chat', { platform: 'youtube', user: 'YTFan', text: 'Hello from YouTube!', color: '#ff0000' })}
                        className="w-full p-2 bg-red-900/30 text-red-400 border border-red-900 rounded hover:bg-red-900/50 text-sm transition text-left px-3"
                    >
                        Simulate YT Msg
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DebugPanel;
