import React, { useState, useEffect } from 'react';

const CounterWidget = ({ socket, state }) => {
    // Determine if we are in dashboard (control) or standalone (view)
    // For now, we just render the visual part. Controls are separate or integrated?
    // The plan said "Dashboard" has controls, "Standalone" has view.
    // So this component should be the VIEW. The controls will be in the Dashboard.

    // However, for preview purposes in dashboard, maybe we show the same view?

    useEffect(() => {
        if (state?.soundEnabled && state.count !== 0) {
            // Simple beep or load a file. For now, a generated beep is safest without assets.
            // Or use a placeholder URL.
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3'); // Generic Pop sound
            audio.volume = 0.5;
            audio.play().catch(e => console.log('Audio play failed silently', e));
        }
    }, [state?.count, state?.soundEnabled]);

    if (!state) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
            <h2 className={`text-2xl font-bold text-main drop-shadow-md mb-2 ${state.title ? '' : 'hidden'}`}>{state.title}</h2>
            <div className="text-6xl font-black text-accent drop-shadow-lg tracking-wider animate-pulse-slow">
                {state.count}
            </div>
        </div>
    );
};

export default CounterWidget;
