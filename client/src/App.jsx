import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare, Gift, Heart, UserPlus, Zap } from 'lucide-react';
import DebugPanel from './components/DebugPanel';

const SOCKET_URL = 'http://localhost:3000';

const PlatformIcon = ({ platform }) => {
    const colors = {
        twitch: 'text-purple-500',
        youtube: 'text-red-500',
        tiktok: 'text-pink-500',
        kick: 'text-green-500',
        streamelements: 'text-blue-400'
    };
    // Simple letter icon for now, replace with SVGs if needed
    return <span className={`font-bold uppercase text-xs ${colors[platform] || 'text-gray-400'} mr-2`}>{platform.slice(0, 2)}</span>;
};

function App() {
    const [messages, setMessages] = useState([]);
    const [activities, setActivities] = useState([]);
    const [theme, setTheme] = useState('minimal');
    const chatEndRef = useRef(null);
    const activityEndRef = useRef(null);

    // Simulation Handler
    const handleSimulation = (type, data) => {
        if (type === 'theme') {
            setTheme(data);
            return;
        }
        if (type === 'chat') {
            const msg = {
                id: 'sim-' + Date.now(),
                platform: data.platform,
                user: data.user,
                text: data.text,
                color: data.color,
                timestamp: new Date().toISOString()
            };
            setMessages((prev) => [...prev, msg].slice(-100));
        } else if (type === 'activity') {
            const act = {
                id: 'sim-' + Date.now(),
                type: data.type,
                platform: data.platform,
                user: data.user,
                details: data.details,
                timestamp: new Date().toISOString()
            };
            setActivities((prev) => [...prev, act].slice(-50));
        }
    };

    // ... useEffects ...

    // Helper for Activity Styles
    const getActivityStyle = (type) => {
        if (theme === 'minimal') {
            return 'bg-[#1e1e1e] border-gray-800';
        }
        // Colorful Theme
        switch (type) {
            case 'follow': return 'bg-blue-900/20 border-blue-900';
            case 'sub': return 'bg-purple-900/20 border-purple-900';
            case 'tip': return 'bg-yellow-900/20 border-yellow-900';
            case 'gift': return 'bg-pink-900/20 border-pink-900';
            default: return 'bg-gray-900/20 border-gray-700';
        }
    };


    useEffect(() => {
        const socket = io(SOCKET_URL);

        socket.on('connect', () => {
            console.log('Connected to backend');
        });

        socket.on('chat-message', (msg) => {
            setMessages((prev) => {
                const newState = [...prev, msg];
                if (newState.length > 100) return newState.slice(newState.length - 100);
                return newState;
            });
        });

        socket.on('activity-event', (act) => {
            setActivities((prev) => {
                const newState = [...prev, act];
                if (newState.length > 50) return newState.slice(newState.length - 50);
                return newState;
            });
        });

        socket.on('history', (history) => {
            setMessages(history);
        });

        return () => socket.disconnect();
    }, []);

    // Auto-scroll
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        // Only scroll if new activity, simple check
        activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activities]);

    // Activity Icon Helper
    const getActivityIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-5 h-5 text-blue-400" />;
            case 'sub': return <Heart className="w-5 h-5 text-red-500" />;
            case 'tip': return <Zap className="w-5 h-5 text-yellow-400" />;
            case 'gift': return <Gift className="w-5 h-5 text-pink-400" />;
            default: return <UserPlus className="w-5 h-5 text-gray-400" />;
        }
    };

    return (
        <div className="flex h-screen w-full bg-[#0f0f0f] text-gray-200 font-sans overflow-hidden relative">
            <DebugPanel onSimulate={handleSimulation} />

            {/* Left Column: Chat */}
            <div className="w-1/2 flex flex-col border-r border-gray-800">
                <div className="p-4 border-b border-gray-800 bg-[#1a1a1a] flex items-center">
                    <MessageSquare className="w-5 h-5 mr-2 text-white" />
                    <h2 className="font-bold text-lg text-white">Unified Chat</h2>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {messages.map((msg, idx) => (
                        <div key={msg.id || idx} className="group flex items-start animate-slide-in">
                            {/* Optional Avatar */}
                            {msg.avatar && (
                                <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full mr-3 mt-1 bg-gray-700" />
                            )}

                            <div className="flex-1">
                                <div className="flex items-baseline">
                                    <PlatformIcon platform={msg.platform} />
                                    <span className="font-bold mr-2 text-sm" style={{ color: msg.color }}>{msg.user}</span>
                                    <span className="text-xs text-gray-500 ml-auto">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <p className="text-gray-300 text-sm leading-relaxed break-words">{msg.text}</p>
                            </div>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>
            </div>

            {/* Right Column: Activity Feed */}
            <div className="w-1/2 flex flex-col bg-[#141414]">
                <div className="p-4 border-b border-gray-800 bg-[#1a1a1a] flex items-center justify-between">
                    <div className="flex items-center">
                        <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                        <h2 className="font-bold text-lg text-white">Activity Feed</h2>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {activities.map((act, idx) => (
                        <div key={act.id || idx} className={`flex items-center p-3 rounded-lg border shadow-sm animate-fade-in transition-all duration-300 ${getActivityStyle(act.type)}`}>
                            <div className="mr-4 p-2 bg-[#2a2a2a] rounded-full">
                                {getActivityIcon(act.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center">
                                        <PlatformIcon platform={act.platform} />
                                        <span className="font-bold text-white">{act.user}</span>
                                    </div>
                                    <span className="text-xs text-gray-500">{new Date(act.timestamp).toLocaleTimeString()}</span>
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-gray-300 capitalize">{act.type}</span>
                                    {act.details && <span className="text-gray-400 mx-1">•</span>}
                                    <span className="text-blue-300 font-medium">{act.details}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    <div ref={activityEndRef} />
                </div>
            </div>
        </div>
    );
}

export default App;
