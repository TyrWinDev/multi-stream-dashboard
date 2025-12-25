import React from 'react';

const ProgressBarWidget = ({ state }) => {
    if (!state) return null;

    const percentage = Math.min(100, Math.max(0, (state.current / state.max) * 100));

    return (
        <div className="w-full max-w-lg p-4 bg-tertiary backdrop-blur-md rounded-xl border border-border shadow-2xl">
            <div className="flex justify-between items-end mb-2">
                <span className="text-main font-bold text-xl uppercase tracking-wider">{state.title}</span>
                <span className="text-accent font-bold text-2xl">
                    {state.current} <span className="text-muted text-lg">/ {state.max}</span>
                </span>
            </div>
            <div className="w-full h-8 bg-secondary rounded-full overflow-hidden border border-border relative">
                <div
                    className="h-full bg-gradient-to-r from-accent to-accent-hover transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                >
                    {percentage > 10 && <span className="text-white font-bold text-xs drop-shadow-md">{percentage.toFixed(0)}%</span>}
                </div>
            </div>
        </div>
    );
};

export default ProgressBarWidget;
