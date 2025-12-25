import React, { useState, useEffect } from 'react';
import { Twitter, Instagram, Youtube, Facebook, Twitch } from 'lucide-react'; // Basic icons

// Map string to icon
const IconMap = {
    twitter: Twitter,
    instagram: Instagram,
    youtube: Youtube,
    facebook: Facebook,
    twitch: Twitch
};

const SocialRotatorWidget = ({ socket, state }) => {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (!state?.handles || state.handles.length === 0) return;

        const interval = setInterval(() => {
            setIndex(prev => (prev + 1) % state.handles.length);
        }, 8000); // Rotate every 8s

        return () => clearInterval(interval);
    }, [state?.handles]);

    if (!state?.handles || state.handles.length === 0) return null;

    const currentItem = state.handles[index];
    const Icon = IconMap[currentItem.platform?.toLowerCase()] || null;

    return (
        <div className="flex items-center space-x-4 bg-tertiary backdrop-blur-md px-6 py-3 rounded-full border border-border shadow-2xl animate-fade-in-up">
            {Icon ? <Icon className="w-6 h-6 text-accent" /> : <span className="font-bold text-xl uppercase tracking-widest text-accent">{currentItem.platform}</span>}
            <div className="h-6 w-px bg-border"></div>
            <span className="font-semibold text-2xl text-main">{currentItem.handle}</span>
        </div>
    );
};

export default SocialRotatorWidget;
