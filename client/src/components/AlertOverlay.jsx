
import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Heart, UserPlus, Gift, Zap, Star } from 'lucide-react';

const AlertOverlay = ({ latestEvent, onComplete }) => {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (latestEvent) {
            setVisible(true);
            playAudio(latestEvent.type);
            fireConfetti(latestEvent.type);

            // Hide after 5 seconds
            const timer = setTimeout(() => {
                setVisible(false);
                setTimeout(onComplete, 500); // Allow fade out
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [latestEvent]);

    const playAudio = (type) => {
        // Placeholder for real audio
        // const audio = new Audio('/sounds/alert.mp3');
        // audio.play().catch(e => console.log("Audio play failed (interaction needed first)"));
    };

    const fireConfetti = (type) => {
        const count = 200;
        const defaults = {
            origin: { y: 0.7 }
        };

        const colors = type === 'sub' ? ['#a855f7', '#ffffff'] : // Purple for Sub
            type === 'tip' ? ['#fbbf24', '#ffffff'] : // Gold for Tip
                type === 'gift' ? ['#ec4899', '#ffffff'] : // Pink for Gift
                    ['#3b82f6', '#ffffff']; // Blue for Follow

        function fire(particleRatio, opts) {
            confetti({
                ...defaults,
                ...opts,
                colors: colors,
                particleCount: Math.floor(count * particleRatio)
            });
        }

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    };

    if (!visible || !latestEvent) return null;

    const getIcon = (type) => {
        switch (type) {
            case 'follow': return <UserPlus className="w-12 h-12 text-blue-400" />;
            case 'sub': return <Heart className="w-12 h-12 text-purple-400" />;
            case 'tip': return <Zap className="w-12 h-12 text-yellow-400" />;
            case 'gift': return <Gift className="w-12 h-12 text-pink-400" />;
            default: return <Star className="w-12 h-12 text-white" />;
        }
    };

    const getTitle = (type) => {
        switch (type) {
            case 'follow': return 'New Follower!';
            case 'sub': return 'New Subscriber!';
            case 'tip': return 'New Tip!';
            case 'gift': return 'Gift Received!';
            default: return 'New Event!';
        }
    };

    const getPlatformColor = (platform) => {
        switch (platform) {
            case 'twitch': return '#9146FF'; // Purple
            case 'kick': return '#53FC18';   // Green
            case 'youtube': return '#FF0000'; // Red
            case 'tiktok': return '#ff0050'; // Pink
            default: return '#ffffff';
        }
    };

    const getPlatformLabel = (platform) => {
        // Simple text label or you could use SVGs if imported
        return platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : '';
    };

    const platformColor = getPlatformColor(latestEvent.platform);

    return (
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-[100]">
            <div
                className={`
                    bg-[#1a1a1a] border-4 rounded-2xl p-8 shadow-2xl
                    transform transition-all duration-500 flex flex-col items-center gap-4 text-center
                    ${visible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-10 opacity-0 scale-95'}
                `}
                style={{ borderColor: platformColor, boxShadow: `0 0 30px ${platformColor}40` }}
            >
                {/* Platform Badge */}
                <div
                    className="absolute -top-4 px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wider text-black shadow-lg"
                    style={{ backgroundColor: platformColor }}
                >
                    {getPlatformLabel(latestEvent.platform)}
                </div>

                <div className="p-4 rounded-full bg-white/5 animate-bounce-slow mt-2">
                    {getIcon(latestEvent.type)}
                </div>

                <div className="space-y-1">
                    <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 uppercase tracking-wider">
                        {getTitle(latestEvent.type)}
                    </h2>
                    <div className="text-xl font-bold text-white">
                        {latestEvent.user}
                    </div>
                    {latestEvent.details && (
                        <div className="text-lg text-indigo-400 font-medium pt-2">
                            {latestEvent.details}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertOverlay;
