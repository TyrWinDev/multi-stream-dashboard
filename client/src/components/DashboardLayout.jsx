import React from 'react';
import { MessageSquare, Zap, Reply, UserPlus, Heart, Gift, Camera, ExternalLink, Settings2 } from 'lucide-react';
import ChatInput from './ChatInput';
import StreamManager from './StreamManager';
import StatusBar from './StatusBar';
import AlertOverlay from './AlertOverlay';
import LoginModal from './LoginModal';
import DebugPanel from './DebugPanel';
import SettingsPanel from './SettingsPanel';

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

const DashboardLayout = ({
    messages,
    activities,
    authStatus,
    theme,
    isSettingsOpen,
    setIsSettingsOpen,
    isDebugOpen,
    setIsDebugOpen,
    currentAlert,
    handleAlertComplete,
    handleSimulation,
    handleConnectTwitch,
    handleConnectKick,
    handleConnectYoutube,
    handleTikTokConnect,
    areAlertsEnabled,
    setAreAlertsEnabled,
    setTheme,
    replyingTo,
    setReplyingTo,
    sendMessage,
    getActivityStyle,
    getActivityIcon,
    chatEndRef,
    activityEndRef,
    renderMessageText,
    handleReply,
    isManagerExpanded,
    setIsManagerExpanded
}) => {
    const openPopout = (path, name) => {
        const width = 400;
        const height = 600;
        const left = (window.screen.width - width) / 2;
        const top = (window.screen.height - height) / 2;
        window.open(path, name, `width=${width},height=${height},left=${left},top=${top}`);
    };

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
                    <div className="p-4 border-b border-border bg-tertiary flex items-center justify-between">
                        <div className="flex items-center">
                            <MessageSquare className="w-5 h-5 mr-2 text-main" />
                            <h2 className="font-bold text-lg text-main">Unified Chat</h2>
                        </div>
                        <div className="flex items-center space-x-1">
                            <button
                                className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-accent transition-colors"
                                title="Chat Settings (Customize)"
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => openPopout('/chat?popout=true', 'ChatPopout')}
                                className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-accent transition-colors"
                                title="Popout Chat"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
                        </div>
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
                        <div className="flex items-center space-x-1">
                            <button
                                className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-accent transition-colors"
                                title="Activity Settings (Customize)"
                            >
                                <Settings2 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => openPopout('/activity?popout=true', 'ActivityPopout')}
                                className="p-2 rounded-full hover:bg-white/10 text-muted hover:text-accent transition-colors"
                                title="Popout Activity Feed"
                            >
                                <ExternalLink className="w-4 h-4" />
                            </button>
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
        </div>
    );
};

export default DashboardLayout;
