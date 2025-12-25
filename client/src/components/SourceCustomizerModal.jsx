import React, { useState } from 'react';
import { X, Copy, Check, Monitor, Layout, Type, Palette, Zap, Settings2 } from 'lucide-react';
import ChatDock from './ChatDock';
import ActivityDock from './ActivityDock';
import AlertOverlay from './AlertOverlay';

// Mock Data for Preview
const MOCK_MESSAGES = [
    { id: 1, platform: 'twitch', user: 'CoolStreamer', text: 'This is what your chat will look like!', color: '#9146FF', timestamp: new Date().toISOString() },
    { id: 2, platform: 'kick', user: 'KickFan123', text: 'Love the new custom styles!', color: '#53fc18', timestamp: new Date().toISOString() },
    { id: 3, platform: 'youtube', user: 'YT_Viewer', text: 'Can you read this size?', color: '#FF0000', timestamp: new Date().toISOString() },
];

const MOCK_ACTIVITIES = [
    { id: 1, type: 'follow', platform: 'twitch', user: 'NewFollower', details: '', timestamp: new Date().toISOString() },
    { id: 2, type: 'sub', platform: 'kick', user: 'SuperSub', details: 'Tier 1', timestamp: new Date().toISOString() },
    { id: 3, type: 'tip', platform: 'streamelements', user: 'BigDonator', details: '$50.00', timestamp: new Date().toISOString() },
];

const FONTS = [
    { id: 'inter', name: 'Modern (Inter)' },
    { id: 'roboto', name: 'Classic (Roboto)' },
    { id: 'mono', name: 'Code (Monospace)' },
    { id: 'pixel', name: 'Retro (Pixel)' },
    { id: 'comic', name: 'Fun (Comic)' },
];

const ANIMATIONS = [
    { id: 'fade', name: 'Fade In' },
    { id: 'slide', name: 'Slide In' },
    { id: 'none', name: 'None' },
];

const SourceCustomizerModal = ({ isOpen, onClose, type = 'chat', onSimulate }) => {
    if (!isOpen) return null;

    // Configuration state
    const [config, setConfig] = useState({
        font: 'inter',
        size: 14,
        orientation: 'vertical',
        bgType: 'custom', // 'transparent' or 'custom'
        bgColor: '#000000',
        bgOpacity: 50,
        activityColorMode: 'simple', // 'simple', 'colorful', 'custom'
        eventColors: {
            follow: '#e91e63', // pink
            sub: '#9c27b0', // purple
            tip: '#4caf50', // green
            gift: '#2196f3', // blue
        },
        fadeOut: 0,
        position: 'bottom_left',
        reverse: false,
        animation: 'fade', // Fix: Initialize animation to prevent undefined in URL
        badges: true, // Fix: Initialize badges defaults to true
        rounded: true,
    });

    // Preview data state
    const [previewMessages, setPreviewMessages] = useState(MOCK_MESSAGES);
    const [previewActivities, setPreviewActivities] = useState(MOCK_ACTIVITIES);

    // Simulation handlers
    const addTestMessage = () => {
        const newMsg = {
            id: Date.now(),
            platform: 'twitch',
            user: 'TestUser',
            text: 'This is a simulated test message!',
            color: '#9146FF',
            timestamp: new Date().toISOString(),
        };
        setPreviewMessages((prev) => [...prev, newMsg]);
        if (onSimulate) onSimulate('message');
    };
    const addTestActivity = () => {
        const newAct = {
            id: Date.now(),
            type: 'follow',
            platform: 'kick',
            user: 'NewFollower',
            details: '',
            timestamp: new Date().toISOString(),
        };
        setPreviewActivities((prev) => [...prev, newAct]);
        if (onSimulate) onSimulate('activity');
    };

    const [copied, setCopied] = useState(false);
    const generateUrl = () => {
        const baseUrl = `${window.location.origin}/${type}`;
        const params = new URLSearchParams();

        // Alerts allow params now!

        if (config.bgType === 'transparent') {
            params.append('transparent', 'true');
        } else {
            params.append('bg_color', config.bgColor);
            params.append('bg_opacity', config.bgOpacity);
        }
        if (config.font !== 'inter') params.append('font', config.font);
        if (config.size !== 14) params.append('size', config.size);
        if (!config.badges) params.append('badges', 'false');
        if (config.animation !== 'fade') params.append('animation', config.animation);
        if (config.orientation !== 'vertical') params.append('orientation', config.orientation);
        if (config.fadeOut > 0) params.append('fade_out', config.fadeOut);
        if (config.position) params.append('position', config.position);
        if (config.position) params.append('position', config.position);
        if (config.reverse) params.append('reverse', 'true');
        if (!config.rounded) params.append('rounded', 'false');

        if (type === 'activity') {
            if (config.activityColorMode !== 'simple') params.append('color_mode', config.activityColorMode);
            if (config.activityColorMode === 'custom') {
                params.append('col_follow', config.eventColors.follow);
                params.append('col_sub', config.eventColors.sub);
                params.append('col_tip', config.eventColors.tip);
                params.append('col_gift', config.eventColors.gift);
            }
        }

        return `${baseUrl}?${params.toString()}`;
    };
    const handleCopy = () => {
        navigator.clipboard.writeText(generateUrl());
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const [importUrl, setImportUrl] = useState('');
    const handleImport = () => {
        try {
            const urlObj = new URL(importUrl);
            const params = urlObj.searchParams;

            const newConfig = { ...config };

            // Background
            if (params.get('transparent') === 'true') {
                newConfig.bgType = 'transparent';
            } else {
                newConfig.bgType = 'custom';
                const bgCol = params.get('bg_color');
                if (bgCol) newConfig.bgColor = bgCol.startsWith('#') ? bgCol : `#${bgCol}`;
                const bgOp = params.get('bg_opacity');
                if (bgOp) newConfig.bgOpacity = parseInt(bgOp);
            }

            // Typography & Layout
            const font = params.get('font');
            if (font) newConfig.font = font;

            const size = params.get('size');
            if (size) newConfig.size = parseInt(size);

            const badges = params.get('badges');
            if (badges === 'false') newConfig.badges = false;
            else newConfig.badges = true; // Default true

            const anim = params.get('animation');
            if (anim) newConfig.animation = anim;

            const orient = params.get('orientation');
            if (orient) newConfig.orientation = orient;

            const fade = params.get('fade_out');
            if (fade) newConfig.fadeOut = parseInt(fade);

            const pos = params.get('position');
            if (pos) newConfig.position = pos;

            if (params.get('reverse') === 'true') newConfig.reverse = true;
            if (params.get('rounded') === 'false') newConfig.rounded = false;

            // Activity Specific
            if (type === 'activity') {
                const mode = params.get('color_mode');
                if (mode) newConfig.activityColorMode = mode;

                if (mode === 'custom') {
                    const colFollow = params.get('col_follow');
                    const colSub = params.get('col_sub');
                    const colTip = params.get('col_tip');
                    const colGift = params.get('col_gift');

                    if (colFollow) newConfig.eventColors.follow = colFollow.startsWith('#') ? colFollow : `#${colFollow}`;
                    if (colSub) newConfig.eventColors.sub = colSub.startsWith('#') ? colSub : `#${colSub}`;
                    if (colTip) newConfig.eventColors.tip = colTip.startsWith('#') ? colTip : `#${colTip}`;
                    if (colGift) newConfig.eventColors.gift = colGift.startsWith('#') ? colGift : `#${colGift}`;
                }
            }

            setConfig(newConfig);
            setImportUrl(''); // Clear input on success
            alert("Configuration Imported Successfully!");
        } catch (e) {
            console.error(e);
            alert("Invalid URL. Please paste a valid full URL.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] backdrop-blur-sm animate-fade-in p-4">
            <div className="bg-[#1a1a1a] border border-gray-700 rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-[#111]">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-accent/10 rounded-lg"><Monitor className="w-6 h-6 text-accent" /></div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Customize {type === 'chat' ? 'Chat' : type === 'activity' ? 'Activity Feed' : 'Alerts'} Source</h2>
                            <p className="text-xs text-gray-400">Design your overlay and copy the URL for OBS</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"><X className="w-6 h-6" /></button>
                </div>
                {/* Main split view */}
                <div className="flex-1 flex flex-row overflow-hidden">
                    {/* Controls */}
                    <div className="w-80 min-w-[320px] bg-[#151515] border-r border-gray-700 p-6 overflow-y-auto space-y-8 scrollbar-thin scrollbar-thumb-gray-800 shrink-0">
                        {/* Import Settings - MOVED TO TOP */}
                        <div className="pb-6 border-b border-gray-800 space-y-3">
                            <div className="flex items-center text-sm font-bold text-gray-300">
                                <Settings2 className="w-4 h-4 mr-2 text-accent" /> Import Config
                            </div>
                            <div className="space-y-2">
                                <input
                                    type="text"
                                    value={importUrl}
                                    onChange={(e) => setImportUrl(e.target.value)}
                                    placeholder="Paste URL here..."
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white focus:border-accent outline-none font-mono"
                                />
                                <button
                                    onClick={handleImport}
                                    disabled={!importUrl}
                                    className="w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Import Settings
                                </button>
                            </div>
                        </div>

                        {/* Font Settings */}
                        <div className="space-y-3">
                            <div className="flex items-center text-sm font-bold text-gray-300"><Type className="w-4 h-4 mr-2 text-accent" />Typography</div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Font Family</label>
                                <select value={config.font} onChange={(e) => setConfig({ ...config, font: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none">
                                    {FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Font Size ({config.size}px)</label>
                                <input type="range" min="10" max="32" step="1" value={config.size} onChange={(e) => setConfig({ ...config, size: parseInt(e.target.value) })} className="w-full accent-accent h-1 bg-gray-700 rounded-lg appearance-none" />
                            </div>
                        </div>
                        {/* Layout & Style */}
                        <div className="space-y-3">
                            <div className="flex items-center text-sm font-bold text-gray-300"><Layout className="w-4 h-4 mr-2 text-accent" />Layout & Style</div>
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Orientation</label>
                                <div className="flex bg-black/30 rounded-lg p-1 border border-gray-700">
                                    {['vertical', 'horizontal'].map(opt => (
                                        <button key={opt} onClick={() => setConfig({ ...config, orientation: opt })} className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${config.orientation === opt ? 'bg-accent text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}>{opt}</button>
                                    ))}
                                </div>
                            </div>
                            {/* Position & Order */}
                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Position</label>
                                <select
                                    value={config.position}
                                    onChange={(e) => setConfig({ ...config, position: e.target.value })}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none"
                                >
                                    {config.orientation === 'vertical' ? (
                                        <>
                                            <option value="top_left">Top Left</option>
                                            <option value="top_right">Top Right</option>
                                            <option value="bottom_left">Bottom Left</option>
                                            <option value="bottom_right">Bottom Right</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="top">Top</option>
                                            <option value="center">Center</option>
                                            <option value="bottom">Bottom</option>
                                        </>
                                    )}
                                </select>
                            </div>

                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-gray-800">
                                <span className="text-sm text-gray-300">Rounded Corners</span>
                                <input type="checkbox" checked={config.rounded} onChange={(e) => setConfig({ ...config, rounded: e.target.checked })} className="accent-accent w-4 h-4" />
                            </div>

                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-gray-800">
                                <span className="text-sm text-gray-300">Reverse Order</span>
                                <input type="checkbox" checked={config.reverse} onChange={(e) => setConfig({ ...config, reverse: e.target.checked })} className="accent-accent w-4 h-4" />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-gray-500">Fade Out Messages</label>
                                <select
                                    value={config.fadeOut}
                                    onChange={(e) => setConfig({ ...config, fadeOut: parseInt(e.target.value) })}
                                    className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none"
                                >
                                    <option value="0">Never</option>
                                    <option value="15">15 Seconds</option>
                                    <option value="30">30 Seconds</option>
                                    <option value="60">60 Seconds</option>
                                </select>
                            </div>
                            <div className="space-y-3 pt-2 border-t border-gray-800">
                                <div className="flex items-center text-sm font-bold text-gray-300"><Palette className="w-4 h-4 mr-2 text-accent" />Background</div>
                                <div className="flex bg-black/30 rounded-lg p-1 border border-gray-700">
                                    <button onClick={() => setConfig({ ...config, bgType: 'transparent' })} className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${config.bgType === 'transparent' ? 'bg-accent text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}>Transparent</button>
                                    <button onClick={() => setConfig({ ...config, bgType: 'custom' })} className={`flex-1 text-xs py-1.5 rounded-md transition-colors ${config.bgType === 'custom' ? 'bg-accent text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}>Custom</button>
                                </div>
                                {config.bgType === 'custom' && (
                                    <div className="space-y-3 animate-fade-in">
                                        <div className="flex items-center justify-between">
                                            <label className="text-xs text-gray-500">Color</label>
                                            <div className="flex items-center space-x-2">
                                                <input type="color" value={config.bgColor} onChange={(e) => setConfig({ ...config, bgColor: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent border-none" />
                                                <span className="text-xs font-mono text-gray-400">{config.bgColor}</span>
                                            </div>
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs text-gray-500">Opacity ({config.bgOpacity}%)</label>
                                            <input type="range" min="0" max="100" value={config.bgOpacity} onChange={(e) => setConfig({ ...config, bgOpacity: parseInt(e.target.value) })} className="w-full accent-accent h-1 bg-gray-700 rounded-lg appearance-none" />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Activity Specific Colors */
                                type === 'activity' && (
                                    <div className="space-y-3 pt-2 border-t border-gray-800">
                                        <div className="flex items-center text-sm font-bold text-gray-300"><Palette className="w-4 h-4 mr-2 text-accent" />Event Colors</div>
                                        <div className="flex bg-black/30 rounded-lg p-1 border border-gray-700">
                                            {['simple', 'colorful', 'custom'].map(mode => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setConfig({ ...config, activityColorMode: mode })}
                                                    className={`flex-1 text-xs py-1.5 rounded-md capitalize transition-colors ${config.activityColorMode === mode ? 'bg-accent text-white font-bold' : 'text-gray-400 hover:text-gray-200'}`}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>

                                        {config.activityColorMode === 'custom' && (
                                            <div className="space-y-2 animate-fade-in pl-2">
                                                {Object.entries(config.eventColors).map(([evt, color]) => (
                                                    <div key={evt} className="flex items-center justify-between">
                                                        <label className="text-xs text-gray-500 capitalize">{evt}</label>
                                                        <div className="flex items-center space-x-2">
                                                            <input
                                                                type="color"
                                                                value={color}
                                                                onChange={(e) => setConfig({
                                                                    ...config,
                                                                    eventColors: { ...config.eventColors, [evt]: e.target.value }
                                                                })}
                                                                className="w-6 h-6 rounded cursor-pointer bg-transparent border-none"
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            <div className="flex items-center justify-between p-2 bg-black/20 rounded-lg border border-gray-800">
                                <span className="text-sm text-gray-300">Show Badges</span>
                                <input type="checkbox" checked={config.badges} onChange={(e) => setConfig({ ...config, badges: e.target.checked })} className="accent-accent w-4 h-4" />
                            </div>
                        </div>
                        {/* Animation */}
                        <div className="space-y-3">
                            <div className="flex items-center text-sm font-bold text-gray-300"><Zap className="w-4 h-4 mr-2 text-accent" />Animation</div>
                            <select value={config.animation} onChange={(e) => setConfig({ ...config, animation: e.target.value })} className="w-full bg-black/30 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-accent outline-none">
                                {ANIMATIONS.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                    </div>
                    {/* Preview Area */}
                    <div className="flex-1 flex flex-col bg-[#000] relative bg-[url('https://transparenttextures.com/patterns/cubes.png')] min-w-0"><div className="absolute top-4 left-4 z-10 bg-black/80 text-white text-xs px-2 py-1 rounded border border-gray-700">Live Preview</div>
                        <div className="flex-1 overflow-hidden relative p-4" style={{
                            '--dock-font': config.font === 'inter' ? 'Inter, sans-serif' : config.font === 'roboto' ? 'Roboto, sans-serif' : config.font === 'mono' ? 'monospace' : config.font === 'pixel' ? '"Press Start 2P", cursive' : 'sans-serif',
                            '--dock-size': `${config.size}px`,
                        }}>
                            {type === 'chat' ? (
                                <ChatDock messages={previewMessages} authStatus={{ twitch: { username: 'MyStream' } }} previewConfig={config} />
                            ) : type === 'activity' ? (
                                <ActivityDock activities={previewActivities} previewConfig={config} />
                            ) : (
                                <div className="flex-1 relative w-full h-full">
                                    <AlertOverlay
                                        latestEvent={previewActivities.length > 0 ? previewActivities[previewActivities.length - 1] : null}
                                        onComplete={() => { }}
                                        position={config.position}
                                        fixed={false}
                                    />
                                    {previewActivities.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-gray-500 text-sm">Trigger a test activity to see the alert!</div>}
                                </div>
                            )}
                        </div>
                        {/* Bottom bar */}
                        <div className="p-4 bg-[#111] border-t border-gray-700 flex items-center space-x-4">
                            <div className="flex-1 bg-black rounded-lg border border-gray-700 flex items-center px-3 py-2 min-w-0">
                                <span className="text-gray-500 text-sm truncate select-all font-mono">{generateUrl()}</span>
                            </div>
                            <button onClick={handleCopy} className={`flex items-center space-x-2 px-6 py-2.5 rounded-lg font-bold transition-all transform hover:scale-105 active:scale-95 shrink-0 ${copied ? 'bg-green-600 text-white' : 'bg-accent hover:bg-accent-hover text-white'}`}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                <span>{copied ? 'Copied!' : 'Copy URL'}</span>
                            </button>
                            {type === 'chat' && (
                                <button onClick={addTestMessage} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded shrink-0">Test Message</button>
                            )}
                            {type === 'activity' && (
                                <button onClick={addTestActivity} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded shrink-0">Test Activity</button>
                            )}
                            {type === 'alerts' && (
                                <button onClick={addTestActivity} className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded shrink-0">Test Alert</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
};

export default SourceCustomizerModal;
