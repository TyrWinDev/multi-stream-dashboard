import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare, Gift, Heart, UserPlus, Zap, Reply } from 'lucide-react';
import DebugPanel from './components/DebugPanel';
import ChatInput from './components/ChatInput';
import LoginModal from './components/LoginModal';
import SettingsPanel from './components/SettingsPanel';
import StreamManager from './components/StreamManager';
import StatusBar from './components/StatusBar';

const SOCKET_URL = 'https://localhost:3001';

const PlatformIcon = ({ platform }) => {
    const colors = {
        twitch: 'text-purple-500',
        youtube: 'text-red-500',
        tiktok: 'text-pink-500',
        kick: 'text-green-500',
        streamelements: 'text-blue-400'
    };
    return <span className={`font-bold uppercase text-xs ${colors[platform] || 'text-gray-400'} mr-2`}>{platform.slice(0, 2)}</span>;
};


function App() {
    const [messages, setMessages] = useState([]);
    const [activities, setActivities] = useState([]);
    const [theme, setTheme] = useState('minimal');
    const [authStatus, setAuthStatus] = useState({
        twitch: { connected: false },
        kick: { connected: false },
        youtube: { connected: false },
        tiktok: { connected: false },
        loading: true
    });
    const [isManagerExpanded, setIsManagerExpanded] = useState(true);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const [replyingTo, setReplyingTo] = useState(null);

    const chatEndRef = useRef(null);
    const activityEndRef = useRef(null);
    const socketRef = useRef(null);

    // Initial Auth Check
    useEffect(() => {
        fetch('https://localhost:3001/api/auth/status')
            .then(res => res.json())
            .then(data => {
                setAuthStatus({ ...data, loading: false });
            })
            .catch(err => {
                console.error("Failed to check auth status:", err);
                setAuthStatus({ twitch: { connected: false }, kick: { connected: false }, loading: false });
            });
    }, []);

    // Handlers for Modal
    const handleConnectTwitch = () => window.location.assign('https://localhost:3001/api/auth/twitch');
    const handleConnectKick = () => window.location.assign('https://localhost:3001/api/auth/kick');
    const handleConnectYoutube = () => window.location.assign('https://localhost:3001/api/auth/youtube');

    const handleTikTokConnect = (rawUsername) => {
        if (!rawUsername) return;
        const username = rawUsername.replace('@', '');
        // Use redirect to ensure cert acceptance
        window.location.assign(`https://localhost:3001/api/auth/tiktok?username=${username}`);
    };

    const handleReply = (msg) => {
        setReplyingTo({ user: msg.user, platform: msg.platform });
    };


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

    const getActivityIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-5 h-5 text-blue-400" />;
            case 'sub': return <Heart className="w-5 h-5 text-red-500" />;
            case 'tip': return <Zap className="w-5 h-5 text-yellow-400" />;
            case 'gift': return <Gift className="w-5 h-5 text-pink-400" />;
            default: return <UserPlus className="w-5 h-5 text-gray-400" />;
        }
    };

    const renderMessageText = (msg) => {
        if (!msg.emotes) return msg.text;

        const replacements = [];
        Object.entries(msg.emotes).forEach(([id, positions]) => {
            positions.forEach(pos => {
                const [start, end] = pos.split('-').map(Number);
                replacements.push({ start, end: end + 1, id });
            });
        });

        replacements.sort((a, b) => a.start - b.start);

        const nodes = [];
        let lastIdx = 0;

        replacements.forEach(({ start, end, id }, idx) => {
            if (start > lastIdx) {
                nodes.push(msg.text.substring(lastIdx, start));
            }
            nodes.push(
                <img
                    key={`${id}-${idx}`}
                    src={`https://static-cdn.jtvnw.net/emoticons/v2/${id}/default/dark/1.0`}
                    alt=""
                    className="inline-block mx-1 w-[20px] h-[20px] align-middle"
                />
            );
            lastIdx = end;
        });

        if (lastIdx < msg.text.length) {
            nodes.push(msg.text.substring(lastIdx));
        }

        return nodes;
    };


    // Send Message
    const sendMessage = (platform, text) => {
        if (socketRef.current) {
            socketRef.current.emit('send-message', { platform, text });
        }
    };

    useEffect(() => {
        socketRef.current = io(SOCKET_URL);
        const socket = socketRef.current;

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

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        activityEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activities]);

    return (
        <div className="flex h-screen w-full bg-[#0f0f0f] text-gray-200 font-sans overflow-hidden relative flex-col">

            {/* Login Modal if not connected */}
            {!authStatus.loading &&
                !authStatus.twitch?.connected &&
                !authStatus.kick?.connected &&
                !authStatus.youtube?.connected &&
                !authStatus.tiktok?.connected && (
                    <LoginModal
                        onConnectTwitch={handleConnectTwitch}
                        onConnectKick={handleConnectKick}
                        onConnectYoutube={handleConnectYoutube}
                        onConnectTikTok={handleTikTokConnect}
                    />
                )}

            {/* Modals - Controlled */}
            <DebugPanel
                onSimulate={handleSimulation}
                isOpen={isDebugOpen}
                onClose={() => setIsDebugOpen(false)}
            />
            <SettingsPanel
                authStatus={authStatus}
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Chat */}
                <div className="w-1/2 flex flex-col border-r border-gray-800">
                    <div className="p-4 border-b border-gray-800 bg-[#1a1a1a] flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-white" />
                        <h2 className="font-bold text-lg text-white">Unified Chat</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => {
                            const isTwitchMention = authStatus.twitch?.username && msg.text.toLowerCase().includes(`@${authStatus.twitch.username.toLowerCase()}`);
                            const isKickMention = authStatus.kick?.username && msg.text.toLowerCase().includes(`@${authStatus.kick.username.toLowerCase()}`);
                            const isSelf = msg.user === (authStatus[msg.platform]?.username || 'Me');

                            const isMention = !isSelf && (isTwitchMention || isKickMention);

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`group flex items-start animate-slide-in relative ${isMention ? 'bg-yellow-500/10 -mx-2 px-2 py-1 border-l-2 border-yellow-500 rounded-r' : ''}`}
                                >
                                    {msg.avatar && (
                                        <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full mr-3 mt-1 bg-gray-700" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline mb-0.5">
                                            <PlatformIcon platform={msg.platform} />
                                            <span className="font-bold mr-2 text-sm truncate" style={{ color: msg.color }}>{msg.user}</span>
                                            <span className="text-xs text-gray-500 ml-auto flex-shrink-0">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={`text-sm leading-relaxed break-words ${isMention ? 'text-yellow-100 font-bold italic' : 'text-gray-300'}`}>
                                            {msg.platform === 'twitch' ? renderMessageText(msg) : msg.text}
                                        </div>
                                    </div>

                                    {/* Reply Button (Hover) */}
                                    <button
                                        onClick={() => handleReply(msg)}
                                        className="absolute right-2 top-2 p-1.5 bg-gray-700/80 rounded-md text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-blue-600 hover:text-white"
                                        title="Reply"
                                    >
                                        <Reply className="w-3 h-3" />
                                    </button>
                                </div>
                            );
                        })}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Chat Input */}
                    <ChatInput
                        onSend={sendMessage}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>

                {/* Right Column: Activity Feed + Stream Manager */}
                <div className="w-1/2 flex flex-col bg-[#141414]">

                    {/* 1. Activity Feed Header */}
                    <div className="p-4 border-b border-gray-800 bg-[#1a1a1a] flex items-center justify-between">
                        <div className="flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                            <h2 className="font-bold text-lg text-white">Activity Feed</h2>
                        </div>
                    </div>

                    {/* 2. Activity Feed Content (Flex 1 to take remaining space) */}
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

                    {/* 3. Stream Manager (Bottom) */}
                    <StreamManager
                        authStatus={authStatus}
                        isExpanded={isManagerExpanded}
                        onToggleExpand={() => setIsManagerExpanded(!isManagerExpanded)}
                    />
                </div>
            </div>

            {/* Global Status Bar */}
            <StatusBar
                onOpenSettings={() => setIsSettingsOpen(true)}
                onOpenDebug={() => setIsDebugOpen(true)}
            />
        </div>
    );
}

export default App;
