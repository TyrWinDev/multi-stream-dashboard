import React from 'react';

const ProgressBarWidget = ({ state }) => {
    if (!state) return null;

    const percentage = Math.min(100, Math.max(0, (state.current / state.max) * 100));

    return (
        <div className="w-full max-w-lg p-4 bg-gray-900/80 backdrop-blur-md rounded-xl border border-gray-700/50 shadow-2xl">
            <div className="flex justify-between items-end mb-2">
                <span className="text-white font-bold text-xl uppercase tracking-wider">{state.title}</span>
                <span className="text-cyan-400 font-bold text-2xl">
                    {state.current} <span className="text-gray-500 text-lg">/ {state.max}</span>
                </span>
            </div>
            <div className="w-full h-8 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative">
                <div
                    className="h-full bg-gradient-to-r from-cyan-600 to-blue-500 transition-all duration-1000 ease-out flex items-center justify-end pr-2"
                    style={{ width: `${percentage}%` }}
                >
                    {percentage > 10 && <span className="text-white font-bold text-xs drop-shadow-md">{percentage.toFixed(0)}%</span>}
                </div>
            </div>
        </div>
    );
};

export default ProgressBarWidget;
