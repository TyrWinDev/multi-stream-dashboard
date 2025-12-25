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
        if (state?.isRunning) {
            interval = setInterval(() => {
                if (state.mode === 'countup') {
                    setDisplayTime(prev => prev + 1);
                } else {
                    setDisplayTime(prev => Math.max(0, prev - 1));
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [state?.isRunning, state?.mode]);

    // Alarm Logic
    useEffect(() => {
        if (state?.mode === 'countdown' && state?.alarmEnabled && state?.remaining === 0 && !state?.isRunning && displayTime === 0) {
            // Play Alarm
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3'); // Bell Alarm
            audio.volume = 0.6;
            audio.play().catch(e => console.log('Alarm play failed', e));
        }
    }, [state?.remaining, state?.isRunning, state?.mode, state?.alarmEnabled, displayTime]);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    if (!state) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
            <h2 className="text-2xl font-bold text-main drop-shadow-md mb-2">{state.title}</h2>
            <div className={`text-6xl font-black drop-shadow-lg ${state.isRunning ? 'text-accent' : 'text-accent-hover opacity-80'}`}>
                {formatTime(displayTime)}
            </div>
        </div>
    );
};

export default TimerWidget;
