import React, { useState, useEffect } from 'react';
import { Save, Search, RefreshCw, Gamepad2, Type } from 'lucide-react';

const MetadataPanel = ({ authStatus }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [title, setTitle] = useState('');
    const [gameQuery, setGameQuery] = useState('');
    const [gameResults, setGameResults] = useState([]);
    const [selectedGame, setSelectedGame] = useState(null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateStatus, setUpdateStatus] = useState(null);

    // Debounced Search for Twitch Categories
    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (gameQuery.length > 2) {
                try {
                    const res = await fetch(`https://localhost:3001/api/stream/search-game?query=${encodeURIComponent(gameQuery)}`);
                    const data = await res.json();
                    setGameResults(data || []);
                } catch (e) {
                    console.error("Search error", e);
                }
            } else {
                setGameResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [gameQuery]);

    const [selectedPlatforms, setSelectedPlatforms] = useState({
        twitch: false,
        youtube: false,
        kick: false
    });

    // Initialize checkboxes based on connection status
    useEffect(() => {
        setSelectedPlatforms({
            twitch: !!authStatus.twitch?.connected,
            youtube: !!authStatus.youtube?.connected,
            kick: !!authStatus.kick?.connected
        });
    }, [authStatus]);

    const handleUpdate = async () => {
        setIsUpdating(true);
        setUpdateStatus(null);

        // Filter keys where value is true
        const targets = Object.keys(selectedPlatforms).filter(k => selectedPlatforms[k]);

        try {
            const res = await fetch('https://localhost:3001/api/stream/metadata', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: title,
                    twitchGameId: selectedGame?.id,
                    platforms: targets
                })
            });
            const result = await res.json();
            setUpdateStatus(result);
        } catch (e) {
            console.error(e);
            setUpdateStatus({ error: "Failed to connect to server" });
        } finally {
            setIsUpdating(false);
        }
    };

    const connectedPlatforms = [
        authStatus.twitch?.connected && 'Twitch',
        authStatus.kick?.connected && 'Kick (Soon)',
        authStatus.youtube?.connected && 'YouTube',
    ].filter(Boolean).join(', ');

    // Toggle Helper
    const togglePlatform = (p) => setSelectedPlatforms(prev => ({ ...prev, [p]: !prev[p] }));

    // Click Outside Handler
    const panelRef = React.useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (panelRef.current && !panelRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <>
            {/* Toggle Button (Hidden when open to avoid click conflicts, optional but cleaner) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-4 left-24 p-3 bg-[#1a1a1a] border border-gray-800 rounded-full hover:bg-gray-800 transition z-[60] text-indigo-400 shadow-lg"
                    title="Update Stream Info"
                >
                    <RefreshCw className={`w-6 h-6 ${isUpdating ? 'animate-spin' : ''}`} />
                </button>
            )}

            {/* Panel Overlay */}
            {isOpen && (
                <div ref={panelRef} className="fixed bottom-20 left-4 w-96 z-50 animate-slide-up">
                    <div className="bg-[#1a1a1a] rounded-xl p-6 border border-gray-800 shadow-2xl relative">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 text-gray-500 hover:text-white"
                        >
                            ✕
                        </button>

                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center">
                                    <RefreshCw className="w-5 h-5 mr-2 text-indigo-400" />
                                    Stream Metadata
                                </h2>
                                <p className="text-xs text-gray-500 mt-1">
                                    Select platforms to update
                                </p>
                            </div>
                        </div>

                        <div className="space-y-6">

                            {/* Platform Toggles */}
                            <div className="flex flex-wrap gap-2">
                                {['twitch', 'youtube', 'kick'].map(p => {
                                    const isConnected = authStatus[p]?.connected;
                                    return (
                                        <button
                                            key={p}
                                            onClick={() => isConnected && togglePlatform(p)}
                                            disabled={!isConnected}
                                            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors flex items-center capitalize ${selectedPlatforms[p]
                                                ? 'bg-indigo-600 border-indigo-500 text-white'
                                                : 'bg-[#0f0f0f] border-gray-700 text-gray-500'
                                                } ${!isConnected ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-400'}`}
                                        >
                                            {selectedPlatforms[p] && <span className="mr-1.5 text-white">✓</span>}
                                            {p}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Title Input */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-300 flex items-center">
                                    <Type className="w-4 h-4 mr-2" /> Stream Title
                                </label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Enter an engaging title..."
                                    className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                />
                            </div>

                            {/* Game/Category Search */}
                            <div className="space-y-2 relative">
                                <label className="text-sm font-medium text-gray-300 flex items-center">
                                    <Gamepad2 className="w-4 h-4 mr-2" /> Category / Game (Twitch)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={gameQuery}
                                        onChange={(e) => { setGameQuery(e.target.value); setSelectedGame(null); }}
                                        placeholder="Search for a game..."
                                        className="w-full bg-[#0f0f0f] border border-gray-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-indigo-500 transition-colors"
                                    />
                                    <Search className="w-4 h-4 text-gray-500 absolute left-3 top-3.5" />
                                </div>

                                {/* Results Dropdown (Positioned UPWARDS) */}
                                {gameResults.length > 0 && !selectedGame && (
                                    <div className="absolute bottom-full mb-2 left-0 w-full bg-[#252525] border border-gray-700 rounded-lg max-h-60 overflow-y-auto shadow-2xl z-50">
                                        {gameResults.map(game => (
                                            <div
                                                key={game.id}
                                                className="p-3 hover:bg-indigo-900/30 cursor-pointer flex items-center transition-colors border-b border-gray-800 last:border-0"
                                                onClick={() => {
                                                    setSelectedGame(game);
                                                    setGameQuery(game.name);
                                                    setGameResults([]);
                                                }}
                                            >
                                                <img src={game.box_art_url.replace('{width}', '40').replace('{height}', '54')} alt="" className="w-8 h-10 mr-3 rounded" />
                                                <span className="text-sm text-white font-medium">{game.name}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Update Button */}
                            <button
                                onClick={handleUpdate}
                                disabled={isUpdating || (!title && !selectedGame)}
                                className={`w-full py-3 rounded-lg font-bold text-white flex items-center justify-center transition-all transform hover:scale-[1.02] ${isUpdating ? 'bg-indigo-900 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg hover:shadow-indigo-500/20'
                                    }`}
                            >
                                {isUpdating ? (
                                    <>
                                        <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> Updating...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 mr-3" /> Update All Platforms
                                    </>
                                )}
                            </button>

                            {/* Status Feedback */}
                            {updateStatus && (
                                <div className="mt-4 p-4 rounded-lg bg-[#0f0f0f] border border-gray-800 animate-fade-in">
                                    <h4 className="border-b border-gray-800 pb-2 mb-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Status Report</h4>
                                    <div className="space-y-2 text-sm">
                                        {Object.entries(updateStatus).map(([platform, status]) => (
                                            <div key={platform} className="flex justify-between items-center">
                                                <span className="capitalize text-gray-300">{platform}</span>
                                                <span className={`font-bold px-2 py-0.5 rounded text-xs ${status === 'Success' ? 'bg-green-900/30 text-green-400' :
                                                    status === 'No Active Stream' ? 'bg-yellow-900/30 text-yellow-400' : 'bg-red-900/30 text-red-400'
                                                    }`}>
                                                    {status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default MetadataPanel;

