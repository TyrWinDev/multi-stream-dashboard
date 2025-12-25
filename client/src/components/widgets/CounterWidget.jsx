import React, { useState, useEffect } from 'react';

const CounterWidget = ({ socket, state }) => {
    // Determine if we are in dashboard (control) or standalone (view)
    // For now, we just render the visual part. Controls are separate or integrated?
    // The plan said "Dashboard" has controls, "Standalone" has view.
    // So this component should be the VIEW. The controls will be in the Dashboard.

    // However, for preview purposes in dashboard, maybe we show the same view?

    if (!state) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full w-full bg-transparent">
            <h2 className="text-2xl font-bold text-white drop-shadow-md mb-2">{state.title}</h2>
            <div className="text-6xl font-black text-cyan-400 drop-shadow-lg tracking-wider animate-pulse-slow">
                {state.count}
            </div>
        </div>
    );
};

export default CounterWidget;
