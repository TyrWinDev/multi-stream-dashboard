import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import emoteMap from '../utils/emoteMap';
import ChatInput from './ChatInput';
import SourceCustomizerModal from './SourceCustomizerModal';
import { Settings2, Copy } from 'lucide-react';

const ChatDock = ({ messages, authStatus, sendMessage, replyingTo, setReplyingTo, mentions, previewConfig }) => {
    const [searchParams] = useSearchParams();
    const [showSettings, setShowSettings] = useState(false);

    // Resolve Configuration (Preview Prop vs URL Params)
    const config = previewConfig || {
        font: searchParams.get('font') || 'inter',
        size: parseInt(searchParams.get('size') || '14'),
        bgColor: searchParams.get('bg_color') || '#000000',
        bgOpacity: parseInt(searchParams.get('bg_opacity') || '50'),
        badges: searchParams.get('badges') !== 'false',
        animation: searchParams.get('animation') || 'fade',
        orientation: searchParams.get('orientation') || 'vertical',
        isTransparent: searchParams.get('transparent') === 'true'
    };

    // Construct background color
    const getBackgroundColor = () => {
        if (config.isTransparent) return 'transparent';
        if (config.bgColor) {
            const hex = config.bgColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${config.bgOpacity / 100})`;
        }
        return 'transparent';
    };

    const isPopout = searchParams.get('popout') === 'true';

    // Font Mapping
    const getFontFamily = (f) => {
        switch (f) {
            case 'roboto': return '"Roboto", sans-serif';
            case 'mono': return 'monospace';
            case 'pixel': return '"Press Start 2P", cursive';
            case 'comic': return '"Comic Sans MS", cursive';
            default: return '"Inter", sans-serif';
        }
    };

    // Emote Parsing
    const parseEmotes = (text, emotes) => {
        if (!emotes || emotes.length === 0) {
            return text;
        }

        let lastIndex = 0;
        const parts = [];

        emotes.sort((a, b) => a.start - b.start).forEach(emote => {
            if (emote.start > lastIndex) {
                parts.push(text.substring(lastIndex, emote.start));
            }
            parts.push(
                <img
                    key={`${emote.id}-${emote.start}`}
                    src={emote.url}
                    alt={emote.name}
                    className="inline-block h-5 w-5 object-contain mx-0.5 align-middle"
                    style={{ verticalAlign: 'middle' }}
                />
            );
            lastIndex = emote.end + 1;
        });

        if (lastIndex < text.length) {
            parts.push(text.substring(lastIndex));
        }

        return <>{parts}</>;
    };

    const styles = {
        fontFamily: getFontFamily(config.font),
        fontSize: `${config.size}px`,
        // Only apply background effectively to root if vertical, 
        // OR if it's transparent (to clear defaults).
        // If horizontal, we want the root 'transparent' so the strip can have the bg.
        backgroundColor: config.orientation === 'vertical' ? getBackgroundColor() : 'transparent',
    };

    // Style for the horizontal strip specifically
    const horizontalStripStyle = config.orientation === 'horizontal' ? {
        backgroundColor: getBackgroundColor(),
        borderRadius: '8px', // Optional: rounded edges for the strip
    } : {};

    // Auto-scroll logic (simplified for dock)
    const endRef = React.useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const copyUrl = () => {
        const url = `${window.location.origin}/chat?transparent=true`;
        navigator.clipboard.writeText(url);
        alert("Copied Browser Source URL to clipboard!");
    };

    return (
        <div
            className={`flex flex-col h-full w-full ${config.orientation === 'horizontal' ? 'justify-end pb-8 pl-8' : ''} ${config.isTransparent ? '' : 'rounded-lg shadow-lg overflow-hidden'}`}
            style={styles}
        >
            {/* Header (Hidden unless popout) */}
            {isPopout && (
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-secondary">
                    <h2 className="font-bold text-main">Stream Chat</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="text-muted hover:text-accent transition-colors"
                            title="Dock Settings"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                        {!isPopout && (
                            <button onClick={copyUrl} className="text-muted hover:text-accent transition-colors" title="Copy OBS Browser Source URL">
                                <Copy className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Chat List */}
            <div
                className={config.orientation === 'horizontal' ? 'w-full h-auto flex items-center overflow-x-auto whitespace-nowrap px-2 py-1.5' : 'flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800'}
                style={horizontalStripStyle}
            >
                {messages.length === 0 ? (
                    <div className="text-center opacity-50 mt-10 italic">
                        No messages yet... waiting for chat events.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const messageText = msg.text || '';
                        const isMention = messageText.toLowerCase().includes((authStatus?.twitch?.username || '').toLowerCase());

                        // Theme-aware Mention Styling
                        const mentionStyle = isMention
                            ? "bg-accent/10 border-l-4 border-accent pl-3 -ml-3 rounded-r transition-colors duration-300"
                            : "";

                        // Animations
                        const animClass = config.animation === 'slide' ? 'animate-slide-in-right' :
                            config.animation === 'none' ? '' : 'animate-fade-in';

                        return (
                            <div key={msg.id} className={`${animClass} group ${mentionStyle} ${config.orientation === 'horizontal' ? 'inline-flex items-center space-x-2 mr-6 bg-black/20 px-3 py-1 rounded-full' : ''}`}>
                                <div className={`flex items-baseline space-x-2 text-main ${config.orientation === 'horizontal' ? 'flex-shrink-0' : ''}`} style={{ fontSize: '0.9em' }}> {/* Scale meta text slightly smaller */}
                                    {/* Platform Badge */}
                                    {config.badges && (
                                        <span className={`
                                            px-1.5 py-0.5 rounded text-[0.7em] uppercase font-bold tracking-wider
                                            ${msg.platform === 'twitch' ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30' :
                                                msg.platform === 'youtube' ? 'bg-red-900/40 text-red-400 border border-red-500/30' :
                                                    msg.platform === 'kick' ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
                                                        'bg-pink-900/40 text-pink-400 border border-pink-500/30'}
                                        `}>
                                            {msg.platform}
                                        </span>
                                    )}

                                    {/* Username */}
                                    <span className="font-bold text-white whitespace-nowrap">
                                        {msg.user}
                                    </span>

                                    {/* Timestamp (Hide in horizontal mode) */}
                                    {config.orientation !== 'horizontal' && (
                                        <span className="opacity-50 text-[0.8em]">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    )}

                                    {/* Reply Button (Only show if not transparent/OBS) */}
                                    {!config.isTransparent && !previewConfig && ['twitch', 'kick', 'youtube'].includes(msg.platform) && (
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-accent hover:underline ml-2"
                                        >
                                            Reply
                                        </button>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`${config.orientation === 'horizontal' ? 'ml-0 text-white truncate max-w-[300px]' : 'mt-0.5 break-words'} leading-relaxed ${isMention ? 'text-accent font-medium' : 'text-gray-300'}`}>
                                    {msg.replyTo && config.orientation !== 'horizontal' && (
                                        <div className="bg-white/5 inline-flex items-center rounded px-1.5 py-0.5 mb-1 mr-1 text-[0.8em] opacity-70">
                                            <span>Replying to {typeof msg.replyTo === 'string' ? msg.replyTo : '@User'}</span>
                                        </div>
                                    )}
                                    {config.orientation === 'horizontal' && <span className="text-gray-500 mr-2">:</span>}
                                    {parseEmotes(messageText, msg.emotes)}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area (Hidden unless popout) */}
            {isPopout && (
                <div className="p-4 border-t border-border bg-tertiary">
                    <ChatInput
                        onSend={sendMessage}
                        connectedPlatforms={['twitch', 'kick', 'youtube'].filter((p) => authStatus[p]?.connected)}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            )}

            {/* Customizer Modal (Only for standalone Dock) */}
            {!previewConfig && (
                <SourceCustomizerModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    type="chat"
                />
            )}
        </div>
    );
};

export default ChatDock;
