import React, { useState } from 'react';
import { Send } from 'lucide-react';

const ChatInput = ({ onSend }) => {
    const [text, setText] = useState('');
    const [platform, setPlatform] = useState('all'); // all, twitch, kick

    const handleSend = (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        onSend(platform, text);
        setText('');
    };

    return (
        <form onSubmit={handleSend} className="p-3 bg-[#1a1a1a] border-t border-gray-800 flex flex-col gap-2">
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
                {/* Kick sending is experimental/in-progress */}
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
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={`Send to ${platform}...`}
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
    );
};

export default ChatInput;
