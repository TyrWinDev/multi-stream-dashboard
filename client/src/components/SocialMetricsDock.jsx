import React, { useEffect, useState } from 'react';
import { TrendingUp, Users, Heart } from 'lucide-react';

// Mock metrics data - in a real app this could be fetched from an API or socket
const mockMetrics = [
    { platform: 'twitch', type: 'viewers', value: 1234 },
    { platform: 'kick', type: 'followers', value: 567 },
    { platform: 'youtube', type: 'subscribers', value: 890 },
    { platform: 'tiktok', type: 'likes', value: 3456 },
];

const SocialMetricsDock = () => {
    const [metrics, setMetrics] = useState(mockMetrics);

    // Example: simulate live updates every 5 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setMetrics((prev) =>
                prev.map((m) => ({ ...m, value: m.value + Math.floor(Math.random() * 10) }))
            );
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="absolute bottom-4 right-4 bg-[#111] border border-gray-700 rounded-lg shadow-lg p-4 flex space-x-4 items-center">
            {metrics.map((m, idx) => (
                <div key={idx} className="flex items-center space-x-1 text-gray-300">
                    <TrendingUp className="w-4 h-4 text-accent" />
                    <span className="capitalize">{m.platform}</span> {m.type}: {m.value}
                </div>
            ))}
        </div>
    );
};

export default SocialMetricsDock;
