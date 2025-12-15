import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Settings2 } from 'lucide-react';
import ChatInput from './ChatInput';

const ChatDock = ({ messages, authStatus, sendMessage, replyingTo, setReplyingTo, mentions }) => {
    const [searchParams] = useSearchParams();
    const isTransparent = searchParams.get('transparent') === 'true';
    const isPopout = searchParams.get('popout') === 'true';

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
        <div className={`flex flex-col h-full overflow-hidden ${isTransparent ? 'bg-transparent' : 'bg-[#0f0f0f]'}`}>
            {/* Header (Hidden if transparent, or optional) */}
            {!isTransparent && (
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-secondary">
                    <h2 className="font-bold text-main">Stream Chat</h2>
                    <div className="flex items-center space-x-2">
                        <button className="text-muted hover:text-accent transition-colors" title="Dock Settings">
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-800">
                {messages.length === 0 ? (
                    <div className="text-center text-muted mt-10 italic">
                        No messages yet... waiting for chat events.
                    </div>
                ) : (
                    messages.map((msg) => {
                        const messageText = msg.text || '';
                        const isMention = messageText.toLowerCase().includes((authStatus.twitch?.username || '').toLowerCase());

                        // Theme-aware Mention Styling
                        const mentionStyle = isMention
                            ? "bg-accent/10 border-l-4 border-accent pl-3 -ml-3 rounded-r transition-colors duration-300"
                            : "";

                        return (
                            <div key={msg.id} className={`animate-fade-in group ${mentionStyle}`}>
                                <div className="flex items-baseline space-x-2 text-sm text-main">
                                    {/* Platform Badge */}
                                    <span className={`
                                        px-1.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider
                                        ${msg.platform === 'twitch' ? 'bg-purple-900/40 text-purple-400 border border-purple-500/30' :
                                            msg.platform === 'youtube' ? 'bg-red-900/40 text-red-400 border border-red-500/30' :
                                                msg.platform === 'kick' ? 'bg-green-900/40 text-green-400 border border-green-500/30' :
                                                    'bg-pink-900/40 text-pink-400 border border-pink-500/30'}
                                    `}>
                                        {msg.platform}
                                    </span>

                                    {/* Username */}
                                    <span className="font-bold text-white whitespace-nowrap">
                                        {msg.user}
                                    </span>

                                    <span className="text-gray-500 text-xs">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>

                                    {/* Reply Button (Only show if not transparent/OBS) */}
                                    {!isTransparent && ['twitch', 'kick', 'youtube'].includes(msg.platform) && (
                                        <button
                                            onClick={() => setReplyingTo(msg)}
                                            className="opacity-0 group-hover:opacity-100 transition-opacity text-xs text-accent hover:underline ml-2"
                                        >
                                            Reply
                                        </button>
                                    )}
                                </div>

                                {/* Message Content */}
                                <div className={`mt-0.5 leading-relaxed break-words ${isMention ? 'text-accent font-medium' : 'text-gray-300'}`}>
                                    {msg.replyTo && (
                                        <div className="bg-white/5 inline-flex items-center rounded px-1.5 py-0.5 mb-1 mr-1 text-xs text-gray-500">
                                            <span>Replying to {typeof msg.replyTo === 'string' ? msg.replyTo : '@User'}</span>
                                        </div>
                                    )}
                                    {messageText}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={endRef} />
            </div>

            {/* Input Area (Hidden if transparent) */}
            {!isTransparent && (
                <div className="p-4 border-t border-border bg-tertiary">
                    <ChatInput
                        onSend={sendMessage}
                        connectedPlatforms={['twitch', 'kick', 'youtube'].filter((p) => authStatus[p]?.connected)}
                        replyingTo={replyingTo}
                        onCancelReply={() => setReplyingTo(null)}
                    />
                </div>
            )}
        </div>
    );
};

export default ChatDock;
