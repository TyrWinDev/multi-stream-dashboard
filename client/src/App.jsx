import React, { useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { Routes, Route } from 'react-router-dom';
import { MessageSquare, Gift, Heart, UserPlus, Zap, Reply } from 'lucide-react';
import DashboardLayout from './components/DashboardLayout';
import ChatDock from './components/ChatDock';
import ActivityDock from './components/ActivityDock';
import AlertsDock from './components/AlertsDock';
import WidgetDashboard from './pages/WidgetDashboard';
import WidgetStandalone from './pages/WidgetStandalone';

const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002';

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
    const [widgetState, setWidgetState] = useState(null);

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

    // Initial Auth Check & Emote Init
    useEffect(() => {
        // ... existing auth ...
        fetch(`${SOCKET_URL}/api/auth/status`)
            .then(res => res.json())
            .then(data => {
                setAuthStatus({ ...data, loading: false });
            })
            .catch(err => setAuthStatus({ twitch: false, kick: false, loading: false }));

        // HARDCODED FALLBACK FOR TESTING until we have dynamic ID:
        // Use a known channel or user's provided channel if we had it.
        // I'll leave this commented out until we confirm ID source.
    }, []);

    // ... Connect Handlers ...
    const handleConnectTwitch = () => window.location.assign(`${SOCKET_URL}/api/auth/twitch`);
    const handleConnectKick = () => window.location.assign(`${SOCKET_URL}/api/auth/kick`);
    const handleConnectYoutube = () => window.location.assign(`${SOCKET_URL}/api/auth/youtube`);
    const handleTikTokConnect = (u) => u && window.location.assign(`${SOCKET_URL}/api/auth/tiktok?username=${u.replace('@', '')}`);
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

        // Broadcast simulation to backend so it goes to all windows (popouts)
        if (socketRef.current) {
            socketRef.current.emit('simulate-event', { type, data });
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
        // If native emotes exist, we could try to mix them, but simple approach:
        // 1. If text has native emotes, they are usually handled by Twitch/Kick parsers before hitting here?
        // Actually, msg.emotes comes from the backend. 
        // We initially just parsed native emotes. 
        // Now we want to run EmoteParser.parse() on the remaining text.

        // This gets complex: Native emotes rely on indices. 7TV relies on string matching.
        // Easiest path:
        // 1. Build a "parts" array from Native Emotes.
        // 2. Iterate "string" parts of that array and run EmoteParser over them.

        let nodes = [];

        // --- Step 1: Handle Native Emotes ---
        if (msg.emotes) {
            const replacements = [];
            Object.entries(msg.emotes).forEach(([id, positions]) => {
                positions.forEach(pos => {
                    const [start, end] = pos.split('-').map(Number);
                    replacements.push({ start, end: end + 1, id });
                });
            });
            replacements.sort((a, b) => a.start - b.start);

            let lastIdx = 0;
            replacements.forEach(({ start, end, id }, idx) => {
                // Text before emote
                if (start > lastIdx) {
                    nodes.push(msg.text.substring(lastIdx, start));
                }
                // Native Emote
                nodes.push({ type: 'native-emote', id, key: `native-${id}-${idx}` });
                lastIdx = end;
            });
            // Text after last emote
            if (lastIdx < msg.text.length) {
                nodes.push(msg.text.substring(lastIdx));
            }
        } else {
            nodes = [msg.text];
        }

        // --- Step 2: Render Nodes ---
        const finalNodes = [];
        nodes.forEach(node => {
            if (typeof node === 'string') {
                finalNodes.push(node);
            } else if (node.type === 'native-emote') {
                finalNodes.push(
                    <img
                        key={node.key}
                        src={`https://static-cdn.jtvnw.net/emoticons/v2/${node.id}/default/dark/1.0`}
                        alt=""
                        className="inline-block mx-1 w-[20px] h-[20px] align-middle"
                    />
                );
            }
        });

        return finalNodes;
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

        socket.on('widget-state', (state) => {
            setWidgetState(state);
        });

        socket.on('widget-event', ({ type, payload }) => {
            setWidgetState((prev) => {
                if (!prev) return prev;
                let next = { ...prev };
                if (type === 'global-update') next.global = { ...next.global, ...payload };
                if (type === 'counter-update') next.counter = { ...next.counter, ...payload };
                if (type === 'timer-update') next.timer = { ...next.timer, ...payload };
                if (type === 'social-update') next.social = { ...next.social, ...payload };
                if (type === 'progress-update') next.progress = { ...next.progress, ...payload };
                if (type === 'goals-update') next.goals = { ...next.goals, ...payload };
                if (type === 'wheel-update') {
                    next.wheel = { ...next.wheel, ...payload };
                    if (payload.winner) next.wheel.winner = payload.winner;
                }
                if (type === 'highlight-update') next.highlight = { ...next.highlight, ...payload };
                if (type === 'activity-update') next.activity = { ...next.activity, ...payload };
                if (type === 'activity') {
                    // Ensure unique IDs if possible, or just prepend
                    const current = next.recentEvents || [];
                    // Check dupe
                    if (!current.find(e => e.id === payload.id)) {
                        next.recentEvents = [payload, ...current].slice(0, 50); // Keep more in memory, widget filters display
                    }
                }
                return next;
            });
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
        <div className={`h-screen w-full text-main font-sans overflow-hidden theme-${theme}`}>
            <Routes>
                {/* Main Dashboard Route */}
                <Route path="/" element={
                    <DashboardLayout
                        messages={messages}
                        activities={activities}
                        authStatus={authStatus}
                        theme={theme}
                        setTheme={setTheme}
                        isSettingsOpen={isSettingsOpen}
                        setIsSettingsOpen={setIsSettingsOpen}
                        isDebugOpen={isDebugOpen}
                        setIsDebugOpen={setIsDebugOpen}
                        currentAlert={currentAlert}
                        handleAlertComplete={handleAlertComplete}
                        handleSimulation={handleSimulation}
                        handleConnectTwitch={handleConnectTwitch}
                        handleConnectKick={handleConnectKick}
                        handleConnectYoutube={handleConnectYoutube}
                        handleTikTokConnect={handleTikTokConnect}
                        areAlertsEnabled={areAlertsEnabled}
                        setAreAlertsEnabled={setAreAlertsEnabled}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                        sendMessage={sendMessage}
                        getActivityStyle={getActivityStyle}
                        getActivityIcon={getActivityIcon}
                        chatEndRef={chatEndRef}
                        activityEndRef={activityEndRef}
                        renderMessageText={renderMessageText}
                        handleReply={handleReply}
                        isManagerExpanded={isManagerExpanded}
                        setIsManagerExpanded={setIsManagerExpanded}
                    />
                } />

                {/* Standalone Chat Dock / OBS Source */}
                <Route path="/chat" element={
                    <ChatDock
                        messages={messages}
                        authStatus={authStatus}
                        sendMessage={sendMessage}
                        replyingTo={replyingTo}
                        setReplyingTo={setReplyingTo}
                    />
                } />

                {/* Standalone Activity Dock / OBS Source */}
                <Route path="/activity" element={
                    <ActivityDock
                        activities={activities}
                        getActivityStyle={getActivityStyle}
                    />
                } />

                {/* Standalone Alerts Dock / OBS Source */}
                <Route path="/alerts" element={
                    <AlertsDock />
                } />

                {/* Widget Control Deck */}
                <Route path="/dashboard/widgets" element={
                    <WidgetDashboard socket={socketRef.current} widgetState={widgetState} />
                } />

                {/* Individual Widgets (Browser Sources) */}
                <Route path="/widgets/:type" element={
                    <WidgetStandalone socket={socketRef.current} widgetState={widgetState} />
                } />
            </Routes>
        </div>
    );
}

export default App;
