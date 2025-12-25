import React, { useEffect, useState, useRef } from 'react';

const SpinWheelWidget = ({ state }) => {
    // This is a complex visual component. Simplified version:
    // We rotate a div based on random deg or determined winner.
    // If state.spinning is true, we spin CSS class? Or Canvas?
    // Let's use CSS rotation for simplicity and performance.

    // NOTE: Real implementation requires syncing "start spin" to a result.
    // Here we just visualize state.

    // If we want it to look good, we need to calculate rotation based on "Winner".
    // Or just spin indefinitely while "spinning" is true.

    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (state?.spinning) {
            // Start spinning fast
            // In a real app we'd need physics or a defined end point.
            // For now, let's just rotate.
        } else if (state?.winner) {
            // Snap to winner? 
            // This logic is tricky without client-side physics or pre-calculated end rotation.
        }
    }, [state?.spinning, state?.winner]);

    if (!state) return null;

    const colors = ['#e11d48', '#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2'];

    return (
        <div className="relative w-96 h-96">
            {/* Pointer */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-4 z-20 w-8 h-12 bg-white clip-arrow shadow-xl"></div>

            {/* Wheel */}
            <div
                className={`w-full h-full rounded-full border-4 border-white shadow-2xl relative overflow-hidden transition-transform duration-[4000ms] cubic-bezier(0.1, 0.7, 0.1, 1)`}
                style={{
                    transform: state.spinning ? `rotate(${rotation + 1440}deg)` : `rotate(${rotation}deg)`
                    // This is a placeholder for actual spin logic which requires more sophisticated state management (start time, seed, etc)
                }}
            >
                {state.segments.map((seg, i) => {
                    const angle = 360 / state.segments.length;
                    return (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-full h-[2px] origin-left bg-transparent"
                            style={{
                                transform: `translateY(-50%) rotate(${i * angle}deg)`,
                            }}
                        >
                            {/* Wedge using Conic Gradient or skewed divs - reusing CSS hack for wedges is hard without SVG. 
                               Let's use a simpler visual for now: a list that highlights? 
                               Or just SVG. SVG is best.
                           */}
                        </div>
                    )
                })}

                {/* SVG Fallback for better visuals */}
                <svg viewBox="0 0 100 100" className={`w-full h-full transform ${state.spinning ? 'animate-spin-fast' : ''}`}>
                    {state.segments.map((seg, i) => {
                        const angle = 360 / state.segments.length;
                        const start = i * angle;
                        const end = (i + 1) * angle;
                        // Generating path for slice
                        // x = r + r*cos(a), y = r + r*sin(a)
                        // Need to convert to radians * (PI/180)
                        // Adjust angle to start from top (-90deg) or just rotate SVG container
                        const startRad = (start - 90) * Math.PI / 180;
                        const endRad = (end - 90) * Math.PI / 180;

                        const x1 = 50 + 50 * Math.cos(startRad);
                        const y1 = 50 + 50 * Math.sin(startRad);
                        const x2 = 50 + 50 * Math.cos(endRad);
                        const y2 = 50 + 50 * Math.sin(endRad);

                        // Large arc flag
                        const largeArc = end - start <= 180 ? 0 : 1;

                        return (
                            <path
                                key={i}
                                d={`M50,50 L${x1},${y1} A50,50 0 ${largeArc},1 ${x2},${y2} z`}
                                fill={seg.color || colors[i % colors.length]}
                                stroke="#fff"
                                strokeWidth="0.5"
                            />
                        );
                    })}
                </svg>

                {/* Labels */}
                {state.segments.map((seg, i) => {
                    const angle = 360 / state.segments.length;
                    // Position text
                    return (
                        <div
                            key={'label-' + i}
                            className="absolute top-1/2 left-1/2 text-white font-bold text-sm"
                            style={{
                                transform: `translate(-50%, -50%) rotate(${i * angle + angle / 2}deg) translate(0px, -60px) rotate(90deg)`
                            }}
                        >
                            <span className="drop-shadow-md">{seg.text}</span>
                        </div>
                    );
                })}
            </div>

            {/* Winner Display */}
            {state.winner && !state.spinning && (
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-black/80 text-white px-6 py-4 rounded-lg text-2xl font-bold animate-bounce text-center z-30 whitespace-nowrap">
                    🎉 {state.winner} 🎉
                </div>
            )}
        </div>
    );
};

export default SpinWheelWidget;
