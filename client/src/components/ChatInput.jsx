import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend, replyingTo, onCancelReply }) => {
    const [text, setText] = useState('');
    const [platform, setPlatform] = useState('all'); // all, twitch, kick

    React.useEffect(() => {
        if (replyingTo) {
            setText((prev) => {
                const prefix = `@${replyingTo.user} `;
                return prev.startsWith(prefix) ? prev : prefix + prev;
            });
            // Auto focus logic or ref could go here
            document.getElementById('chat-input')?.focus();
        }
    }, [replyingTo]);

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(platform, text);
        setText('');
        if (replyingTo) onCancelReply();
    };

    return (
        <div className="bg-[#1a1a1a] border-t border-gray-800 flex flex-col">
            {replyingTo && (
                <div className="px-3 py-2 bg-gray-800/50 flex items-center justify-between text-xs border-b border-gray-700 animate-fade-in">
                    <span className="text-gray-300">
                        Replying to <span className="font-bold text-blue-400">@{replyingTo.user}</span>
                        <span className="opacity-50 ml-1">({replyingTo.platform})</span>
                    </span>
                    <button
                        onClick={onCancelReply}
                        className="text-gray-500 hover:text-white"
                    >
                        ✕
                    </button>
                </div>
            )}

            <form onSubmit={handleSend} className="p-3 flex flex-col gap-2">
                <div className="flex gap-2 text-xs">
                    <button
                        type="button"
                        onClick={() => setPlatform('all')}
                        className={`px-3 py-1 rounded transition ${platform === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        All
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlatform('twitch')}
                        className={`px-3 py-1 rounded transition ${platform === 'twitch' ? 'bg-purple-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Twitch
                    </button>
                    <button
                        type="button"
                        onClick={() => setPlatform('kick')}
                        className={`px-3 py-1 rounded transition ${platform === 'kick' ? 'bg-green-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                    >
                        Kick
                    </button>
                </div>

                <div className="flex gap-2">
                    <input
                        id="chat-input"
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder={replyingTo ? `Reply to @${replyingTo.user}...` : `Send to ${platform}...`}
                        className="flex-1 bg-[#0f0f0f] text-white border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                    />
                    <button
                        type="submit"
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    >
                        <Send className="w-5 h-5" />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatInput;
