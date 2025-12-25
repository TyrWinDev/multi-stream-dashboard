import React, { useState } from 'react';
import { Plus, Minus, Play, Pause, RotateCcw } from 'lucide-react';

const WidgetDashboard = ({ socket, widgetState }) => {
    // Local state for forms before saving/emitting
    const [, setCounterTitle] = useState('');

    // --- Handlers ---
    const updateCounter = (delta) => {
        if (!socket || !widgetState.counter) return;
        socket.emit('widget-action', {
            type: 'counter-update',
            payload: { count: widgetState.counter.count + delta }
        });
    };

    const toggleTimer = () => {
        if (!socket || !widgetState.timer) return;
        socket.emit('widget-action', {
            type: 'timer-update',
            payload: { isRunning: !widgetState.timer.isRunning }
        });
    };

    const resetTimer = () => {
        if (!socket || !widgetState.timer) return;
        socket.emit('widget-action', {
            type: 'timer-update',
            payload: { isRunning: false, remaining: widgetState.timer.duration }
        });
    };

    const updateProgress = (val) => {
        if (!socket || !widgetState.progress) return;
        socket.emit('widget-action', {
            type: 'progress-update',
            payload: { current: Math.max(0, Math.min(widgetState.progress.max, widgetState.progress.current + val)) }
        });
    };

    const spinWheel = () => {
        if (!socket || !widgetState.wheel || widgetState.wheel.spinning) return;

        socket.emit('widget-action', { type: 'wheel-update', payload: { spinning: true, winner: null } });

        setTimeout(() => {
            const winner = widgetState.wheel.segments[Math.floor(Math.random() * widgetState.wheel.segments.length)];
            socket.emit('widget-action', { type: 'wheel-update', payload: { spinning: false, winner } });
        }, 4000);
    };

    if (!widgetState) return <div className="text-muted p-10 animate-pulse">Loading Widget State...</div>;

    const Card = ({ title, children }) => (
        <div className="bg-tertiary border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-main font-bold text-lg mb-4 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                {title}
            </h3>
            {children}
        </div>
    );

    return (
        <div className="p-6 h-full overflow-y-auto pb-20 bg-primary">
            <h1 className="text-3xl font-black text-main mb-6 drop-shadow-sm border-b border-border pb-4">Widget Control Deck</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* COUNTER */}
                <Card title="Counter">
                    <div className="flex flex-col items-center">
                        <div className="text-6xl font-black text-accent mb-4 drop-shadow">{widgetState.counter.count}</div>
                        <div className="flex gap-4">
                            <button onClick={() => updateCounter(-1)} className="bg-secondary hover:bg-border text-main p-3 rounded-full transition-colors"><Minus /></button>
                            <button onClick={() => updateCounter(1)} className="bg-accent hover:bg-accent-hover text-white p-3 rounded-full transition-colors"><Plus /></button>
                        </div>
                    </div>
                </Card>

                {/* TIMER */}
                <Card title="Timer">
                    <div className="flex flex-col items-center">
                        <div className="text-5xl font-mono font-bold text-main mb-4">
                            {Math.floor(widgetState.timer.remaining / 60)}:{(widgetState.timer.remaining % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={toggleTimer} className={`p-3 rounded-full text-white transition-colors ${widgetState.timer.isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {widgetState.timer.isRunning ? <Pause /> : <Play />}
                            </button>
                            <button onClick={resetTimer} className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                                <RotateCcw />
                            </button>
                        </div>
                        <div className="mt-4 w-full">
                            <label className="text-xs text-muted uppercase font-bold">Set Duration (min)</label>
                            <input
                                type="number"
                                className="w-full mt-1 bg-secondary border border-border text-main p-2 rounded focus:outline-none focus:border-accent"
                                defaultValue={widgetState.timer.duration / 60}
                                onBlur={(e) => {
                                    const mins = parseInt(e.target.value) || 5;
                                    socket.emit('widget-action', { type: 'timer-update', payload: { duration: mins * 60, remaining: mins * 60 } });
                                }}
                            />
                        </div>
                    </div>
                </Card>

                {/* PROGRESS */}
                <Card title="Progress Goal">
                    <div className="mb-2 flex justify-between text-main text-sm">
                        <span>Current: <span className="text-accent font-bold">{widgetState.progress.current}</span></span>
                        <span>Max: {widgetState.progress.max}</span>
                    </div>
                    <div className="w-full h-4 bg-secondary rounded-full overflow-hidden mb-4 border border-border">
                        <div className="h-full bg-accent transition-all duration-500" style={{ width: `${(widgetState.progress.current / widgetState.progress.max) * 100}%` }}></div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => updateProgress(-1)} className="bg-secondary hover:bg-border text-main py-2 px-4 rounded w-full transition-colors font-bold">-1</button>
                        <button onClick={() => updateProgress(1)} className="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded w-full transition-colors font-bold">+1</button>
                        <button onClick={() => updateProgress(5)} className="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded w-full transition-colors font-bold">+5</button>
                    </div>
                </Card>

                {/* WHEEL */}
                <Card title="Spin Wheel">
                    <div className="text-center mb-4 text-main h-[24px]">
                        {widgetState.wheel.spinning ? <span className="text-accent animate-pulse">Spinning...</span> : (widgetState.wheel.winner ? <span>Winner: <span className="font-bold text-accent">{widgetState.wheel.winner}</span></span> : 'Ready to Spin')}
                    </div>
                    <button
                        onClick={spinWheel}
                        disabled={widgetState.wheel.spinning}
                        className={`w-full py-4 rounded-xl font-bold text-xl uppercase transition-all shadow-md ${widgetState.wheel.spinning ? 'bg-secondary text-muted cursor-not-allowed' : 'bg-gradient-to-r from-accent to-purple-600 text-white hover:scale-[1.02]'}`}
                    >
                        SPIN!
                    </button>
                </Card>

                {/* SOCIALS */}
                <Card title="Socials">
                    <div className="space-y-2">
                        {widgetState.social.handles.map((h, i) => (
                            <div key={i} className="flex justify-between items-center bg-secondary p-2 rounded text-main border border-border">
                                <span className="capitalize text-sm font-medium">{h.platform}:</span>
                                <span className="text-muted text-sm">{h.handle}</span>
                            </div>
                        ))}
                        <div className="text-center text-xs text-muted mt-2 italic">(Editing coming in v1.4)</div>
                    </div>
                </Card>

                {/* HIGHLIGHT */}
                <Card title="Chat Highlight">
                    <div className="p-4 bg-secondary rounded border border-border text-center text-muted italic min-h-[100px] flex items-center justify-center">
                        {widgetState.highlight.message
                            ? <div>
                                <div className="text-accent font-bold not-italic mb-1">{widgetState.highlight.message.user}</div>
                                "{widgetState.highlight.message.text}"
                            </div>
                            : "No message highlighted."}
                    </div>
                    <div className="mt-2 text-center text-xs text-muted">
                        (Click the "Star" icon on any chat message)
                    </div>
                </Card>

            </div>

            <div className="mt-12 p-4 bg-secondary/50 rounded-lg border border-border text-center text-muted text-sm">
                <div className="font-bold text-main mb-2">Browser Source URL</div>
                <code className="bg-primary px-2 py-1 rounded border border-border select-all block sm:inline text-accent">http://localhost:3002/widgets/[type]</code>
                <div className="mt-2 text-xs opacity-60">Types: counter, timer, social, progress, goals, wheel, highlight, activity</div>
            </div>
        </div>
    );
};

export default WidgetDashboard;
