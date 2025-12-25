import React from 'react';

const ChatHighlightWidget = ({ state }) => {
    if (!state || !state.message) return null;
    const msg = state.message;

    return (
        <div className="max-w-2xl mx-auto my-4 transition-all duration-500 ease-in-out transform hover:scale-105">
            <div className="relative bg-black/40 backdrop-blur-xl rounded-2xl p-6 border-l-4 border-secondary shadow-lg overflow-hidden">
                {/* Decorative Quote */}
                <div className="absolute -top-4 -left-2 text-8xl text-secondary/20 font-serif">"</div>

                <div className="flex items-start gap-4 relataive z-10 transition-all font-outfit">
                    {/* Avatar */}
                    <div className="flex-shrink-0">
                        {msg.avatar ? (
                            <img src={msg.avatar} alt={msg.user} className="w-16 h-16 rounded-full border-2 border-secondary object-cover" />
                        ) : (
                            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-2xl font-bold text-white uppercase border-2 border-secondary">
                                {msg.user.charAt(0)}
                            </div>
                        )}
                        {/* Platform Badge */}
                        <div className="absolute top-14 left-10 bg-black/80 rounded-full p-1 border border-white/20 shadow-sm">
                            <img src={`/assets/icons/${msg.platform}.svg`} onError={(e) => e.target.style.display = 'none'} className="w-4 h-4" alt={msg.platform} />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-exhibit font-bold text-white text-xl tracking-wide">{msg.user}</span>
                            {/* Badges/Tags could go here */}
                        </div>
                        <p className="text-gray-100 text-2xl font-medium leading-relaxed shadow-sm drop-shadow-md">
                            {msg.text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatHighlightWidget;
