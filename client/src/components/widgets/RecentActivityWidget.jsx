import React, { useEffect, useState } from 'react';
import { Heart, Star, DollarSign, Gift, UserPlus } from 'lucide-react';

const RecentActivityWidget = ({ socket, state }) => {
    // Initialize from server state if available, or empty array
    const [events, setEvents] = useState(state || []);

    // Keep local state in sync if parent state updates (e.g. initial load vs socket update)
    useEffect(() => {
        if (state) {
            setEvents(state);
        }
    }, [state]);

    useEffect(() => {
        if (!socket) return;

        const handleActivity = (act) => {
            setEvents(prev => {
                // Avoid duplicates if state update already handled it
                if (prev.find(e => e.id === act.id)) return prev;
                return [act, ...prev].slice(0, 5); // Keep last 5
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

    return (
        <div className="flex flex-col space-y-2 w-80 p-2">
            {events.map(event => (
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
            ))}
            {events.length === 0 && (
                <div className="text-center text-gray-500 italic p-4 bg-black/20 rounded">
                    Waiting for events...
                </div>
            )}
        </div>
    );
};

export default RecentActivityWidget;
