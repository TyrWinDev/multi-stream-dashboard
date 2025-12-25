import React, { useEffect, useState } from 'react';
import { Heart, Star, DollarSign, Gift, UserPlus } from 'lucide-react';

const RecentActivityWidget = ({ socket, state }) => {
    // state prop can be complex here depending on how it's passed.
    // In WidgetStandalone, it passes `widgetState`, which contains `{ recentEvents: [], activity: {} }` (after our updates).
    // In App.jsx, it passes `widgetState` directly? No, it might pass specific slice.
    // Actually, WidgetStandalone passes `socket={socket} state={widgetState}`. 
    // So `state` IS `widgetState`.

    // If we are in legacy mode or during transition, handle both.
    const recentEvents = state?.recentEvents || (Array.isArray(state) ? state : []);
    const activityConfig = state?.activity || {};

    const [events, setEvents] = useState(recentEvents);

    useEffect(() => {
        if (state?.recentEvents) {
            setEvents(state.recentEvents);
        } else if (Array.isArray(state)) {
            setEvents(state);
        }
    }, [state]);

    useEffect(() => {
        if (!socket) return;

        const handleActivity = (act) => {
            setEvents(prev => {
                if (prev.find(e => e.id === act.id)) return prev;
                return [act, ...prev].slice(0, 50);
            });
        };

        socket.on('activity-event', handleActivity);

        return () => {
            socket.off('activity-event', handleActivity);
        };
    }, [socket]);

    const getIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-6 h-6 text-blue-400" />;
            case 'sub': return <Heart className="w-6 h-6 text-red-500" />;
            case 'tip': return <DollarSign className="w-6 h-6 text-green-400" />;
            case 'gift': return <Gift className="w-6 h-6 text-pink-400" />;
            default: return <Star className="w-6 h-6 text-yellow-400" />;
        }
    };

    const limit = activityConfig.limit || 5;
    const filter = activityConfig.filter || ['follow', 'sub', 'cheer', 'raid', 'donation'];
    const layout = activityConfig.layout || 'list';

    const displayedEvents = events
        .filter(e => filter.includes(e.type))
        .slice(0, limit);

    return (
        <div className={`w-full ${layout === 'ticker' ? 'overflow-hidden whitespace-nowrap' : 'flex flex-col space-y-2 w-80 p-2'}`}>
            {layout === 'ticker' ? (
                <div className="flex gap-8 animate-ticker">
                    {displayedEvents.map(event => (
                        <div key={event.id || Math.random()} className="flex items-center gap-2 bg-black/60 backdrop-blur-md rounded-full px-4 py-1 border border-cyan-500/50">
                            {getIcon(event.type)}
                            <span className="font-bold text-white">{event.user}</span>
                            <span className="text-cyan-400 text-xs uppercase">{event.type}</span>
                        </div>
                    ))}
                </div>
            ) : (
                displayedEvents.map(event => (
                    <div key={event.id || Math.random()} className="animate-slide-in-right bg-gray-900/80 backdrop-blur-md rounded-lg p-3 border-l-4 border-cyan-500 shadow-lg flex items-center space-x-3">
                        <div className="flex-shrink-0 bg-gray-800 p-2 rounded-full">
                            {getIcon(event.type)}
                        </div>
                        <div className="flex-1 min-w-0 overflow-hidden">
                            <div className="text-white font-bold truncate">{event.user}</div>
                            <div className="text-gray-400 text-sm truncate uppercase tracking-widest">{event.type}</div>
                            {event.details && <div className="text-cyan-300 text-xs truncate">{event.details}</div>}
                        </div>
                    </div>
                ))
            )}

            {displayedEvents.length === 0 && (
                <div className="text-center text-gray-500 italic p-4 bg-black/20 rounded">
                    Waiting for events...
                </div>
            )}
        </div>
    );
};

export default RecentActivityWidget;
