import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { MessageSquare, Gift, Heart, UserPlus, Zap, Reply } from 'lucide-react';
import DebugPanel from './components/DebugPanel';
import ChatInput from './components/ChatInput';
import LoginModal from './components/LoginModal';
import SettingsPanel from './components/SettingsPanel';
import StreamManager from './components/StreamManager';
import StatusBar from './components/StatusBar';
import AlertOverlay from './components/AlertOverlay';

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
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'default');
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
    const [currentAlert, setCurrentAlert] = useState(null); // Active Alert
    const [alertQueue, setAlertQueue] = useState([]); // Queue of pending alerts
    const [areAlertsEnabled, setAreAlertsEnabled] = useState(localStorage.getItem('alerts_enabled') !== 'false');

    const chatEndRef = useRef(null);
    const activityEndRef = useRef(null);
    const socketRef = useRef(null);

    // Persistence: Theme
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    // Persistence: Alerts
    useEffect(() => {
        localStorage.setItem('alerts_enabled', areAlertsEnabled);
    }, [areAlertsEnabled]);

    // Initial Auth Check
    useEffect(() => {
        // ... existing auth ...
        fetch('https://localhost:3001/api/auth/status')
            .then(res => res.json())
            .then(data => { setAuthStatus({ ...data, loading: false }); })
            .catch(err => setAuthStatus({ twitch: false, kick: false, loading: false }));
    }, []);

    // ... Connect Handlers ...
    const handleConnectTwitch = () => window.location.assign('https://localhost:3001/api/auth/twitch');
    const handleConnectKick = () => window.location.assign('https://localhost:3001/api/auth/kick');
    const handleConnectYoutube = () => window.location.assign('https://localhost:3001/api/auth/youtube');
    const handleTikTokConnect = (u) => u && window.location.assign(`https://localhost:3001/api/auth/tiktok?username=${u.replace('@', '')}`);
    const handleReply = (msg) => setReplyingTo({ user: msg.user, platform: msg.platform });


    // --- Alert Queue Logic ---
    const addToAlertQueue = (act) => {
        if (!areAlertsEnabled) return;
        setAlertQueue(prev => [...prev, act]);
    };

    // Clear alerts if toggled off
    useEffect(() => {
        if (!areAlertsEnabled) {
            setCurrentAlert(null);
            setAlertQueue([]);
        }
    }, [areAlertsEnabled]);

    // Watch Queue
    useEffect(() => {
        if (!currentAlert && alertQueue.length > 0) {
            // Show next alert
            const nextAlert = alertQueue[0];
            setCurrentAlert(nextAlert); // Start showing
            setAlertQueue(prev => prev.slice(1)); // Remove from queue
        }
    }, [currentAlert, alertQueue]);

    const handleAlertComplete = () => {
        setCurrentAlert(null); // This triggers the useEffect to pick the next one
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
            addToAlertQueue(act); // Use Queue
        }
    };

    const getActivityStyle = (type) => {
        // Restore colorful alerts but keep them vaguely theme-compatible (using base tailwind colors is consistent)
        switch (type) {
            case 'follow': return 'bg-blue-900/20 border-blue-900/50 hover:border-blue-500';
            case 'sub': return 'bg-purple-900/20 border-purple-900/50 hover:border-purple-500';
            case 'tip': return 'bg-yellow-900/20 border-yellow-900/50 hover:border-yellow-500';
            case 'gift': return 'bg-pink-900/20 border-pink-900/50 hover:border-pink-500';
            default: return 'bg-tertiary border-border';
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
            addToAlertQueue(act); // Add to Queue
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
        <div className={`flex h-screen w-full bg-primary text-main font-sans overflow-hidden relative flex-col theme-${theme}`}>

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
                areAlertsEnabled={areAlertsEnabled}
                onToggleAlerts={setAreAlertsEnabled}
                currentTheme={theme}
                onSetTheme={setTheme}
            />


            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Column: Chat */}
                <div className="w-1/2 flex flex-col border-r border-border">
                    <div className="p-4 border-b border-border bg-tertiary flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-main" />
                        <h2 className="font-bold text-lg text-main">Unified Chat</h2>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                        {messages.map((msg, idx) => {
                            const isTwitchMention = authStatus.twitch?.username && msg.text.toLowerCase().includes(`@${authStatus.twitch.username.toLowerCase()}`);
                            const isKickMention = authStatus.kick?.username && msg.text.toLowerCase().includes(`@${authStatus.kick.username.toLowerCase()}`);
                            const isYouTubeMention = authStatus.youtube?.username && msg.text.toLowerCase().includes(`@${authStatus.youtube.username.toLowerCase()}`);
                            const isTikTokMention = authStatus.tiktok?.username && msg.text.toLowerCase().includes(`@${authStatus.tiktok.username.toLowerCase()}`);

                            const isSelf = msg.user === (authStatus[msg.platform]?.username || 'Me');

                            // Universal mention check
                            const isMention = !isSelf && (isTwitchMention || isKickMention || isYouTubeMention || isTikTokMention);

                            return (
                                <div
                                    key={msg.id || idx}
                                    className={`
                                        group flex items-start animate-slide-in relative transition-all
                                        ${isMention
                                            ? 'bg-accent/10 -mx-2 px-2 py-1 border-l-2 border-accent rounded-r'
                                            : ''}
                                    `}
                                >
                                    {msg.avatar && (
                                        <img src={msg.avatar} alt={msg.user} className="w-8 h-8 rounded-full mr-3 mt-1 bg-gray-700" />
                                    )}

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-baseline mb-0.5">
                                            <PlatformIcon platform={msg.platform} />
                                            <span className="font-bold mr-2 text-sm truncate" style={{ color: msg.color }}>{msg.user}</span>
                                            <span className="text-xs text-muted ml-auto flex-shrink-0">{new Date(msg.timestamp).toLocaleTimeString()}</span>
                                        </div>
                                        <div className={`text-sm leading-relaxed break-words ${isMention ? 'text-accent font-bold' : 'text-main'}`}>
                                            {msg.platform === 'twitch' ? renderMessageText(msg) : msg.text}
                                        </div>
                                    </div>

                                    {/* Reply Button (Hover) */}
                                    <button
                                        onClick={() => handleReply(msg)}
                                        className="absolute right-2 top-2 p-1.5 bg-tertiary rounded-md text-muted opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent hover:text-white"
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
                <div className="w-1/2 flex flex-col bg-secondary">

                    {/* 1. Activity Feed Header */}
                    <div className="p-4 border-b border-border bg-tertiary flex items-center justify-between">
                        <div className="flex items-center">
                            <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                            <h2 className="font-bold text-lg text-main">Activity Feed</h2>
                        </div>
                    </div>

                    {/* 2. Activity Feed Content */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {activities.map((act, idx) => (
                            <div key={act.id || idx} className={`flex items-center p-3 rounded-lg border shadow-sm animate-fade-in transition-all duration-300 ${getActivityStyle(act.type)}`}>
                                <div className="mr-4 p-2 bg-primary rounded-full">
                                    {getActivityIcon(act.type)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center">
                                            <PlatformIcon platform={act.platform} />
                                            <span className="font-bold text-main">{act.user}</span>
                                        </div>
                                        <span className="text-xs text-muted">{new Date(act.timestamp).toLocaleTimeString()}</span>
                                    </div>
                                    <div className="text-sm">
                                        <span className="font-medium text-muted capitalize">{act.type}</span>
                                        {act.details && <span className="text-muted mx-1">•</span>}
                                        <span className="text-accent font-medium">{act.details}</span>
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

            {/* Event Alert Overlay */}
            <AlertOverlay
                latestEvent={currentAlert}
                onComplete={handleAlertComplete}
            />
        </div >
    );
}

export default App;
