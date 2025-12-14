import React from 'react';
import { Lock } from 'lucide-react';

const LoginModal = ({ onConnectTwitch, onConnectKick, onConnectYoutube, onConnectTikTok }) => {
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[60] backdrop-blur-sm animate-fade-in">
            <div className="bg-[#1a1a1a] border border-gray-700 p-8 rounded-xl shadow-2xl max-w-md w-full text-center">
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to Stream Hub! 🚀</h2>
                <p className="text-gray-400 mb-8">
                    To get started, please connect at least one streaming platform.
                </p>

                <div className="space-y-4">
                    {/* Kick */}
                    <button
                        onClick={onConnectKick}
                        className="w-full flex items-center justify-center p-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                        <Lock className="w-5 h-5 mr-3" />
                        Connect with Kick
                    </button>

                    {/* Twitch */}
                    <button
                        onClick={onConnectTwitch}
                        className="w-full flex items-center justify-center p-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                        <Lock className="w-5 h-5 mr-3" />
                        Connect with Twitch
                    </button>

                    {/* YouTube */}
                    <button
                        onClick={onConnectYoutube}
                        className="w-full flex items-center justify-center p-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition-all transform hover:scale-105"
                    >
                        <Lock className="w-5 h-5 mr-3" />
                        Connect with YouTube
                    </button>

                    {/* TikTok */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="TikTok @username"
                            id="tiktok-login-input"
                            className="flex-1 bg-black/30 border border-pink-900/50 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-pink-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') onConnectTikTok(e.target.value);
                            }}
                        />
                        <button
                            onClick={() => onConnectTikTok(document.getElementById('tiktok-login-input').value)}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-6 rounded-lg transition-all transform hover:scale-105"
                        >
                            Connect
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-xs text-gray-500">
                    Order: Kick, Twitch, YouTube, TikTok
                </p>
            </div>
        </div>
    );
};

export default LoginModal;
