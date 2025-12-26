import React, { useState } from 'react';
import { Plus, Minus, Play, Pause, RotateCcw, Square, CheckSquare, Settings2 } from 'lucide-react';

const WidgetDashboard = ({ socket, widgetState }) => {
    // Local state for forms before saving/emitting
    const [, setCounterTitle] = useState('');
    const [newSocialPlatform, setNewSocialPlatform] = useState('twitter');
    const [newSocialHandle, setNewSocialHandle] = useState('');
    const [newGoalText, setNewGoalText] = useState('');
    const [newSegmentText, setNewSegmentText] = useState('');
    const [newSegmentColor, setNewSegmentColor] = useState('#ef4444');

    // Modal State
    const [showCustomizer, setShowCustomizer] = useState(false);
    const [customizerType, setCustomizerType] = useState('chat'); // 'chat' | 'activity' | 'counter' | 'alerts'

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

            {/* Global Settings Panel */}
            <div className="mb-8 p-4 bg-tertiary/50 rounded-xl border border-border">
                <h3 className="text-main font-bold mb-3 uppercase text-sm tracking-wider flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent"></span> Global Settings
                </h3>
                <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-muted text-sm">Font:</label>
                        <select
                            className="bg-secondary border border-border text-main rounded p-1 text-sm focus:outline-none focus:border-accent"
                            value={widgetState.global?.font || 'sans'}
                            onChange={(e) => socket.emit('widget-action', { type: 'global-update', payload: { font: e.target.value } })}
                        >
                            <option value="sans">Sans-Serif (Default)</option>
                            <option value="serif">Serif (Elegant)</option>
                            <option value="mono">Monospace (Code)</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-muted text-sm">Theme Override:</label>
                        <select
                            className="bg-secondary border border-border text-main rounded p-1 text-sm focus:outline-none focus:border-accent"
                            value={widgetState.global?.theme || 'default'}
                            onChange={(e) => socket.emit('widget-action', { type: 'global-update', payload: { theme: e.target.value } })}
                        >
                            <option value="default">Default</option>
                            <option value="neon">Neon</option>
                            <option value="minimal">Minimal</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-muted text-sm cursor-pointer select-none">
                            <input
                                type="checkbox"
                                className="mr-2"
                                checked={widgetState.global?.transparent || false}
                                onChange={(e) => socket.emit('widget-action', { type: 'global-update', payload: { transparent: e.target.checked } })}
                            />
                            Transparent Mode (OBS)
                        </label>
                    </div>
                    <div className="flex items-center gap-2">
                        <label className="text-muted text-sm">Animation:</label>
                        <select
                            className="bg-secondary border border-border text-main rounded p-1 text-sm focus:outline-none focus:border-accent"
                            value={widgetState.global?.animation || 'none'}
                            onChange={(e) => socket.emit('widget-action', { type: 'global-update', payload: { animation: e.target.value } })}
                        >
                            <option value="none">None</option>
                            <option value="fade-in">Fade In</option>
                            <option value="slide-in">Slide In (Left)</option>
                            <option value="slide-up">Slide Up</option>
                            <option value="bounce-in">Bounce In</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                {/* ALERTS OVERLAY */}
                <Card title="Alerts Overlay">
                    <div className="space-y-4">
                        <div className="p-4 bg-secondary rounded-lg border border-border">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-main font-bold">Latest Alert</span>
                                <span className="text-xs text-muted">Auto-Dismiss</span>
                            </div>
                            <div className="text-center py-4">
                                {widgetState.latestActivity ? (
                                    <div className="animate-fade-in">
                                        <div className="text-accent font-black uppercase text-xl">{widgetState.latestActivity.type}</div>
                                        <div className="text-main">{widgetState.latestActivity.user}</div>
                                    </div>
                                ) : (
                                    <div className="text-muted italic text-sm">Waiting for events...</div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => {
                                    setCustomizerType('alerts');
                                    setShowCustomizer(true);
                                }}
                                className="flex-1 bg-accent hover:bg-accent-hover text-white py-2 rounded font-bold transition flex items-center justify-center gap-2"
                            >
                                <Settings2 className="w-4 h-4" /> Get URL
                            </button>
                            <button
                                onClick={() => socket.emit('widget-action', { type: 'test-alert' })}
                                className="flex-1 bg-secondary hover:bg-tertiary text-main border border-border py-2 rounded font-bold transition flex items-center justify-center gap-2"
                            >
                                <Play className="w-4 h-4" /> Test
                            </button>
                        </div>
                        <p className="text-xs text-muted text-center pt-2">
                            Global alerts that appear on top of your stream.
                        </p>
                    </div>
                </Card>

                {/* COUNTER */}
                <Card title="Counter">
                    <div className="flex flex-col items-center">
                        {/* Title Input */}
                        <input
                            type="text"
                            placeholder="Counter Title"
                            className="bg-secondary border border-border text-main rounded text-center mb-4 w-2/3 p-1 focus:outline-none focus:border-accent font-bold"
                            defaultValue={widgetState.counter.title}
                            onBlur={(e) => socket.emit('widget-action', { type: 'counter-update', payload: { title: e.target.value } })}
                        />

                        <div className="text-6xl font-black text-accent mb-4 drop-shadow">{widgetState.counter.count}</div>

                        <div className="flex gap-4 mb-4">
                            <button onClick={() => updateCounter(-1 * (widgetState.counter.step || 1))} className="bg-secondary hover:bg-border text-main p-3 rounded-full transition-colors"><Minus /></button>
                            <button onClick={() => updateCounter(1 * (widgetState.counter.step || 1))} className="bg-accent hover:bg-accent-hover text-white p-3 rounded-full transition-colors"><Plus /></button>
                        </div>

                        {/* Settings Row */}
                        <div className="flex gap-2 items-center text-xs text-muted w-full px-4 justify-between">
                            <div className="flex items-center gap-1">
                                <span>Step:</span>
                                <input
                                    type="number"
                                    className="bg-secondary border border-border rounded w-12 text-center text-main"
                                    min="1"
                                    defaultValue={widgetState.counter.step || 1}
                                    onBlur={(e) => socket.emit('widget-action', { type: 'counter-update', payload: { step: parseInt(e.target.value) || 1 } })}
                                />
                            </div>
                            <div className="flex items-center gap-1">
                                <label className="cursor-pointer select-none flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={widgetState.counter.soundEnabled || false}
                                        onChange={(e) => socket.emit('widget-action', { type: 'counter-update', payload: { soundEnabled: e.target.checked } })}
                                    />
                                    Sound
                                </label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* TIMER */}
                <Card title="Timer">
                    <div className="flex flex-col items-center">
                        <input
                            type="text"
                            placeholder="Timer Title"
                            className="bg-secondary border border-border text-main rounded text-center mb-4 w-2/3 p-1 focus:outline-none focus:border-accent font-bold"
                            defaultValue={widgetState.timer.title}
                            onBlur={(e) => socket.emit('widget-action', { type: 'timer-update', payload: { title: e.target.value } })}
                        />

                        <div className="text-5xl font-mono font-bold text-main mb-4">
                            {Math.floor(widgetState.timer.remaining / 60)}:{(widgetState.timer.remaining % 60).toString().padStart(2, '0')}
                        </div>
                        <div className="flex gap-3 mb-4">
                            <button onClick={toggleTimer} className={`p-3 rounded-full text-white transition-colors ${widgetState.timer.isRunning ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}>
                                {widgetState.timer.isRunning ? <Pause /> : <Play />}
                            </button>
                            <button onClick={resetTimer} className="p-3 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors">
                                <RotateCcw />
                            </button>
                        </div>

                        <div className="w-full space-y-3 px-2">
                            <div className="flex justify-between items-center text-xs text-muted">
                                <span>Mode:</span>
                                <select
                                    className="bg-secondary border border-border rounded p-1 text-main"
                                    value={widgetState.timer.mode || 'countdown'}
                                    onChange={(e) => {
                                        socket.emit('widget-action', { type: 'timer-update', payload: { mode: e.target.value, isRunning: false } });
                                    }}
                                >
                                    <option value="countdown">Countdown</option>
                                    <option value="countup">Count Up</option>
                                </select>
                            </div>

                            {widgetState.timer.mode === 'countdown' && (
                                <div className="text-xs text-muted">
                                    <label className="uppercase font-bold block mb-1">Set Duration (min)</label>
                                    <input
                                        type="number"
                                        className="w-full bg-secondary border border-border text-main p-2 rounded focus:outline-none focus:border-accent"
                                        defaultValue={widgetState.timer.duration / 60}
                                        onBlur={(e) => {
                                            const mins = parseInt(e.target.value) || 5;
                                            socket.emit('widget-action', { type: 'timer-update', payload: { duration: mins * 60, remaining: mins * 60 } });
                                        }}
                                    />
                                </div>
                            )}

                            <div className="flex justify-between items-center text-xs text-muted">
                                <label className="cursor-pointer select-none flex items-center gap-1">
                                    <input
                                        type="checkbox"
                                        checked={widgetState.timer.alarmEnabled || false}
                                        onChange={(e) => socket.emit('widget-action', { type: 'timer-update', payload: { alarmEnabled: e.target.checked } })}
                                    />
                                    Play Alarm on Zero
                                </label>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* GOALS */}
                <Card title="Goal List">
                    <input
                        type="text"
                        placeholder="Goals Title"
                        className="bg-secondary border border-border text-main rounded text-center mb-4 w-full p-1 focus:outline-none focus:border-accent font-bold"
                        defaultValue={widgetState.goals.title}
                        onBlur={(e) => socket.emit('widget-action', { type: 'goals-update', payload: { title: e.target.value } })}
                    />

                    <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto pr-1">
                        {widgetState.goals.items.length === 0 && <div className="text-center text-xs text-muted italic">No goals set.</div>}
                        {widgetState.goals.items.map(item => (
                            <div key={item.id} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm text-main border border-border">
                                <button
                                    onClick={() => {
                                        const newItems = widgetState.goals.items.map(i => i.id === item.id ? { ...i, completed: !i.completed } : i);
                                        socket.emit('widget-action', { type: 'goals-update', payload: { items: newItems } });
                                    }}
                                    className={`p-1 rounded hover:bg-tertiary transition-colors ${item.completed ? 'text-accent' : 'text-muted'}`}
                                >
                                    {item.completed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                                </button>
                                <span className={`flex-1 truncate ${item.completed ? 'text-muted line-through' : ''}`}>{item.text}</span>
                                <button
                                    onClick={() => {
                                        const newItems = widgetState.goals.items.filter(i => i.id !== item.id);
                                        socket.emit('widget-action', { type: 'goals-update', payload: { items: newItems } });
                                    }}
                                    className="text-red-500 hover:text-red-400 p-1"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            className="bg-secondary border border-border text-main rounded text-xs p-2 flex-1 outline-none focus:border-accent"
                            placeholder="New Goal..."
                            value={newGoalText}
                            onChange={(e) => setNewGoalText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newGoalText.trim()) {
                                    const newItem = { id: Date.now(), text: newGoalText, completed: false };
                                    socket.emit('widget-action', { type: 'goals-update', payload: { items: [...widgetState.goals.items, newItem] } });
                                    setNewGoalText('');
                                }
                            }}
                        />
                        <button
                            className="bg-accent hover:bg-accent-hover text-white rounded p-2"
                            onClick={() => {
                                if (newGoalText.trim()) {
                                    const newItem = { id: Date.now(), text: newGoalText, completed: false };
                                    socket.emit('widget-action', { type: 'goals-update', payload: { items: [...widgetState.goals.items, newItem] } });
                                    setNewGoalText('');
                                }
                            }}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="mt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-muted justify-center">
                            <input
                                type="checkbox"
                                checked={widgetState.goals.showCompleted !== false}
                                onChange={(e) => socket.emit('widget-action', { type: 'goals-update', payload: { showCompleted: e.target.checked } })}
                            />
                            Show Completed Items
                        </label>
                    </div>
                </Card>

                {/* PROGRESS */}
                <Card title="Progress Goal">
                    <input
                        type="text"
                        placeholder="Goal Title"
                        className="bg-secondary border border-border text-main rounded text-center mb-4 w-full p-1 focus:outline-none focus:border-accent font-bold"
                        defaultValue={widgetState.progress.title}
                        onBlur={(e) => socket.emit('widget-action', { type: 'progress-update', payload: { title: e.target.value } })}
                    />

                    <div className="mb-2 flex justify-between text-main text-sm px-1">
                        <span>Current: <span className="text-accent font-bold">{widgetState.progress.current}</span></span>
                        <span>Max: {widgetState.progress.max}</span>
                    </div>

                    <div className="w-full h-4 bg-secondary rounded-full overflow-hidden mb-4 border border-border">
                        <div
                            className="h-full transition-all duration-500"
                            style={{
                                width: `${(widgetState.progress.current / widgetState.progress.max) * 100}%`,
                                background: `linear-gradient(to right, ${widgetState.progress.gradientStart || '#06b6d4'}, ${widgetState.progress.gradientEnd || '#3b82f6'})`
                            }}
                        ></div>
                    </div>

                    <div className="flex gap-2 mb-4">
                        <button onClick={() => updateProgress(-1)} className="bg-secondary hover:bg-border text-main py-2 px-4 rounded w-full transition-colors font-bold">-1</button>
                        <button onClick={() => updateProgress(1)} className="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded w-full transition-colors font-bold">+1</button>
                        <button onClick={() => updateProgress(5)} className="bg-accent hover:bg-accent-hover text-white py-2 px-4 rounded w-full transition-colors font-bold">+5</button>
                    </div>

                    {/* Customization Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted">
                        <div className="flex flex-col gap-1">
                            <label>Start Color</label>
                            <input type="color" className="w-full h-6 rounded cursor-pointer"
                                value={widgetState.progress.gradientStart || '#06b6d4'}
                                onChange={(e) => socket.emit('widget-action', { type: 'progress-update', payload: { gradientStart: e.target.value } })}
                            />
                        </div>
                        <div className="flex flex-col gap-1">
                            <label>End Color</label>
                            <input type="color" className="w-full h-6 rounded cursor-pointer"
                                value={widgetState.progress.gradientEnd || '#3b82f6'}
                                onChange={(e) => socket.emit('widget-action', { type: 'progress-update', payload: { gradientEnd: e.target.value } })}
                            />
                        </div>
                        <label className="flex items-center gap-2 cursor-pointer mt-2 col-span-2">
                            <input
                                type="checkbox"
                                checked={widgetState.progress.showPercentage !== false}
                                onChange={(e) => socket.emit('widget-action', { type: 'progress-update', payload: { showPercentage: e.target.checked } })}
                            />
                            Show Percentage
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer col-span-2">
                            <input
                                type="checkbox"
                                checked={widgetState.progress.showFraction !== false}
                                onChange={(e) => socket.emit('widget-action', { type: 'progress-update', payload: { showFraction: e.target.checked } })}
                            />
                            Show Fraction (Current/Max)
                        </label>
                    </div>
                </Card>

                {/* WHEEL */}
                <Card title="Spin Wheel">
                    <input
                        type="text"
                        placeholder="Wheel Title"
                        className="bg-secondary border border-border text-main rounded text-center mb-4 w-full p-1 focus:outline-none focus:border-accent font-bold"
                        defaultValue={widgetState.wheel.title}
                        onBlur={(e) => socket.emit('widget-action', { type: 'wheel-update', payload: { title: e.target.value } })}
                    />

                    <div className="space-y-2 mb-4 max-h-[150px] overflow-y-auto pr-1">
                        {widgetState.wheel.segments.map((seg, i) => (
                            <div key={seg.id || i} className="flex items-center gap-2 bg-secondary p-2 rounded text-sm text-main border border-border">
                                <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: seg.color }}></div>
                                <span className="flex-1 truncate">{seg.text}</span>
                                <button
                                    onClick={() => {
                                        const newSegments = widgetState.wheel.segments.filter((_, idx) => idx !== i);
                                        socket.emit('widget-action', { type: 'wheel-update', payload: { segments: newSegments } });
                                    }}
                                    className="text-red-500 hover:text-red-400 p-1"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="flex gap-2 mb-4">
                        <input type="color" className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent" value={newSegmentColor} onChange={(e) => setNewSegmentColor(e.target.value)} />
                        <input
                            type="text"
                            className="bg-secondary border border-border text-main rounded text-xs p-2 flex-1 outline-none focus:border-accent min-w-0"
                            placeholder="New Option..."
                            value={newSegmentText}
                            onChange={(e) => setNewSegmentText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && newSegmentText.trim()) {
                                    const newSeg = { id: Date.now(), text: newSegmentText, color: newSegmentColor };
                                    socket.emit('widget-action', { type: 'wheel-update', payload: { segments: [...widgetState.wheel.segments, newSeg] } });
                                    setNewSegmentText('');
                                }
                            }}
                        />
                        <button
                            className="bg-accent hover:bg-accent-hover text-white rounded p-2"
                            onClick={() => {
                                if (newSegmentText.trim()) {
                                    const newSeg = { id: Date.now(), text: newSegmentText, color: newSegmentColor };
                                    socket.emit('widget-action', { type: 'wheel-update', payload: { segments: [...widgetState.wheel.segments, newSeg] } });
                                    setNewSegmentText('');
                                }
                            }}
                        >
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="text-center mb-2 text-main h-[20px] text-xs">
                        {widgetState.wheel.spinning ? <span className="text-accent animate-pulse font-bold">SPINNING...</span> : (widgetState.wheel.winner ? <span>Winner: <span className="font-bold text-accent">{widgetState.wheel.winner}</span></span> : 'Ready')}
                    </div>
                    <button
                        onClick={spinWheel}
                        disabled={widgetState.wheel.spinning || widgetState.wheel.segments.length < 2}
                        className={`w-full py-3 rounded-xl font-bold text-lg uppercase transition-all shadow-md ${widgetState.wheel.spinning || widgetState.wheel.segments.length < 2 ? 'bg-secondary text-muted cursor-not-allowed' : 'bg-gradient-to-r from-accent to-purple-600 text-white hover:scale-[1.02]'}`}
                    >
                        SPIN!
                    </button>
                </Card>

                {/* SOCIALS */}
                <Card title="Socials">
                    <div className="space-y-2">
                        {widgetState.social.handles.map((h, i) => (
                            <div key={i} className="flex justify-between items-center bg-secondary p-2 rounded text-main border border-border">
                                <span className="capitalize text-sm font-medium flex items-center gap-2">
                                    <span className="opacity-50 text-xs">#{i + 1}</span>
                                    {h.platform}:
                                </span>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted text-sm">{h.handle}</span>
                                    <button
                                        className="text-red-500 hover:text-red-400 p-1"
                                        onClick={() => {
                                            const newHandles = widgetState.social.handles.filter((_, idx) => idx !== i);
                                            socket.emit('widget-action', { type: 'social-update', payload: { handles: newHandles } });
                                        }}
                                    >
                                        <Minus className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                            <select
                                className="bg-secondary border border-border text-main rounded text-xs p-2 w-[110px]"
                                value={newSocialPlatform}
                                onChange={(e) => setNewSocialPlatform(e.target.value)}
                            >
                                <option value="twitter">Twitter</option>
                                <option value="instagram">Instagram</option>
                                <option value="youtube">YouTube</option>
                                <option value="facebook">Facebook</option>
                                <option value="twitch">Twitch</option>
                                <option value="tiktok">TikTok</option>
                            </select>
                            <input
                                type="text"
                                placeholder="@handle"
                                className="bg-secondary border border-border text-main rounded text-xs p-2 flex-1 min-w-0"
                                value={newSocialHandle}
                                onChange={(e) => setNewSocialHandle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        if (!newSocialHandle) return;
                                        const newHandles = [...widgetState.social.handles, { platform: newSocialPlatform, handle: newSocialHandle }];
                                        socket.emit('widget-action', { type: 'social-update', payload: { handles: newHandles } });
                                        setNewSocialHandle('');
                                    }
                                }}
                            />
                            <button
                                className="bg-accent hover:bg-accent-hover text-white rounded p-2"
                                onClick={() => {
                                    if (!newSocialHandle) return;
                                    const newHandles = [...widgetState.social.handles, { platform: newSocialPlatform, handle: newSocialHandle }];
                                    socket.emit('widget-action', { type: 'social-update', payload: { handles: newHandles } });
                                    setNewSocialHandle('');
                                }}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </Card>

                {/* HIGHLIGHT */}
                <Card title="Chat Highlight">
                    <div className="p-4 bg-secondary rounded border border-border text-center text-muted italic min-h-[100px] flex items-center justify-center mb-4 relative overflow-hidden">
                        {widgetState.highlight.message
                            ? <div className="z-10 relative">
                                <div className="text-accent font-bold not-italic mb-1">{widgetState.highlight.message.user}</div>
                                "{widgetState.highlight.message.text}"
                            </div>
                            : "No message highlighted."}
                        {widgetState.highlight.message && <button onClick={() => socket.emit('widget-action', { type: 'highlight-update', payload: { message: null } })} className="absolute top-2 right-2 text-red-500 hover:text-red-400"><Minus className="w-4 h-4" /></button>}
                    </div>

                    <div className="flex flex-col gap-2 text-xs text-muted mb-2">
                        <div className="flex justify-between items-center">
                            <label>Style:</label>
                            <select
                                className="bg-secondary border border-border rounded p-1 text-main w-32"
                                value={widgetState.highlight.style || 'modern'}
                                onChange={(e) => socket.emit('widget-action', { type: 'highlight-update', payload: { style: e.target.value } })}
                            >
                                <option value="modern">Modern (Default)</option>
                                <option value="minimal">Minimal</option>
                                <option value="glass">Glassmorphism</option>
                                <option value="neon">Neon Box</option>
                            </select>
                        </div>
                        <div className="flex justify-between items-center">
                            <label>Auto-Hide (sec):</label>
                            <input
                                type="number"
                                className="bg-secondary border border-border rounded p-1 text-main w-16 text-center"
                                min="0"
                                value={widgetState.highlight.autoHide || 0}
                                onChange={(e) => socket.emit('widget-action', { type: 'highlight-update', payload: { autoHide: parseInt(e.target.value) || 0 } })}
                            />
                        </div>
                        <div className="text-[10px] text-right italic opacity-70">(0 to disable)</div>
                    </div>

                    <div className="mt-2 text-center text-xs text-muted border-t border-border pt-2">
                        (Click the "Star" icon on any chat message)
                    </div>
                </Card>

                {/* RECENT ACTIVITY */}
                <Card title="Recent Activity">
                    <div className="space-y-3 p-2">
                        <div className="flex justify-between items-center text-xs text-muted">
                            <label>Max Items (1-10):</label>
                            <span className="font-bold text-accent">{widgetState.activity?.limit || 5}</span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="10"
                            className="w-full accent-accent bg-secondary rounded-lg h-2 cursor-pointer"
                            value={widgetState.activity?.limit || 5}
                            onChange={(e) => socket.emit('widget-action', { type: 'activity-update', payload: { limit: parseInt(e.target.value) } })}
                        />

                        <div className="flex justify-between items-center text-xs text-muted mt-2">
                            <label>Layout:</label>
                            <select
                                className="bg-secondary border border-border rounded p-1 text-main w-32"
                                value={widgetState.activity?.layout || 'list'}
                                onChange={(e) => socket.emit('widget-action', { type: 'activity-update', payload: { layout: e.target.value } })}
                            >
                                <option value="list">Vertical List</option>
                                <option value="ticker">Horizontal Ticker</option>
                            </select>
                        </div>

                        <div className="text-xs text-muted mt-2">
                            <label className="block mb-1 font-bold">Show Events:</label>
                            <div className="grid grid-cols-2 gap-1">
                                {['follow', 'sub', 'cheer', 'raid', 'donation'].map(type => (
                                    <label key={type} className="flex items-center gap-1 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={widgetState.activity?.filter?.includes(type) !== false}
                                            onChange={(e) => {
                                                const currentFilters = widgetState.activity?.filter || ['follow', 'sub', 'cheer', 'raid', 'donation'];
                                                let newFilters = [];
                                                if (e.target.checked) {
                                                    newFilters = [...currentFilters, type];
                                                } else {
                                                    newFilters = currentFilters.filter(f => f !== type);
                                                }
                                                // Ensure no dups
                                                newFilters = [...new Set(newFilters)];
                                                socket.emit('widget-action', { type: 'activity-update', payload: { filter: newFilters } });
                                            }}
                                        />
                                        <span className="capitalize">{type}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
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
