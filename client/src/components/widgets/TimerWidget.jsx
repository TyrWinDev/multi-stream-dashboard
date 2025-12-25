import React, { useState, useEffect } from 'react';

const TimerWidget = ({ socket, state }) => {
    // Local state for smooth counting if needed, but for now rely on server or simple hydration
    // For a timer, we might want to run the countdown locally and sync often.

    const [displayTime, setDisplayTime] = useState(state?.remaining || 0);

    useEffect(() => {
        setDisplayTime(state?.remaining || 0);
    }, [state?.remaining]);

    useEffect(() => {
        let interval;
        if (state?.isRunning && displayTime > 0) {
            interval = setInterval(() => {
                setDisplayTime(prev => Math.max(0, prev - 1));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state?.isRunning]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!state) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
            <h2 className="text-2xl font-bold text-white drop-shadow-md mb-2">{state.title}</h2>
            <div className={`text-6xl font-mono font-black drop-shadow-lg ${state.isRunning ? 'text-green-400' : 'text-red-400'}`}>
                {formatTime(displayTime)}
            </div>
        </div>
    );
};

export default TimerWidget;
