import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Heart, UserPlus, Gift, Zap, Star, Settings2 } from 'lucide-react';

const ActivityDock = ({ activities, getActivityStyle }) => {
    const [searchParams] = useSearchParams();
    const isTransparent = searchParams.get('transparent') === 'true';
    const isPopout = searchParams.get('popout') === 'true';

    // Auto-scroll logic
    const endRef = React.useRef(null);
    useEffect(() => {
        endRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [activities]);

    const copyUrl = () => {
        const url = `${window.location.origin}/activity?transparent=true`;
        navigator.clipboard.writeText(url);
        alert("Copied Browser Source URL to clipboard!");
    };

    return (
        <div className={`flex flex-col h-full overflow-hidden ${isTransparent ? 'bg-transparent' : 'bg-[#0f0f0f]'}`}>
            {!isTransparent && (
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-secondary">
                    <h2 className="font-bold text-main">Activity Feed</h2>
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

            <div className={`flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800 ${isTransparent ? 'scrollbar-none' : ''}`}>
                {activities.length === 0 ? (
                    <div className="text-center text-muted mt-10 italic">
                        No recent activity...
                    </div>
                ) : (
                    activities.map((act) => (
                        <div
                            key={act.id}
                            className={`
                                relative overflow-hidden rounded-lg p-3 border border-white/5 transition-all duration-300 hover:bg-white/5
                                ${getActivityStyle ? getActivityStyle(act.type) : 'bg-tertiary'}
                            `}
                        >
                            {/* Platform Stripe */}
                            <div className={`absolute top-0 left-0 w-1 h-full 
                                ${act.platform === 'twitch' ? 'bg-[#9146FF]' :
                                    act.platform === 'youtube' ? 'bg-[#FF0000]' :
                                        act.platform === 'kick' ? 'bg-[#53FC18]' : 'bg-[#ff0050]'
                                }
                            `}></div>

                            <div className="flex items-center pl-3">
                                <div className="p-2 rounded-full bg-black/30 mr-3">
                                    {act.type === 'follow' && <UserPlus className="w-5 h-5 text-blue-400" />}
                                    {act.type === 'sub' && <Heart className="w-5 h-5 text-purple-400" />}
                                    {act.type === 'tip' && <Zap className="w-5 h-5 text-yellow-400" />}
                                    {act.type === 'gift' && <Gift className="w-5 h-5 text-pink-400" />}
                                    {!['follow', 'sub', 'tip', 'gift'].includes(act.type) && <Star className="w-5 h-5 text-white" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-baseline justify-between">
                                        <span className="font-bold text-white truncate text-sm">{act.user}</span>
                                        <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 ml-2">
                                            {act.type}
                                        </span>
                                    </div>
                                    {act.details && (
                                        <div className="text-xs text-gray-400 mt-0.5 truncate">
                                            {act.details}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                <div ref={endRef} />
            </div>
        </div>
    );
};

export default ActivityDock;
