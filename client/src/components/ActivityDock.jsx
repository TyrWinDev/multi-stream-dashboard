import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Heart, UserPlus, Gift, Zap, Star, Settings2, DollarSign } from 'lucide-react';
import SourceCustomizerModal from './SourceCustomizerModal';

const ActivityDock = ({ activities, previewConfig }) => {
    const [searchParams] = useSearchParams();
    const [showSettings, setShowSettings] = useState(false);

    // Resolve Config
    const config = previewConfig ? {
        ...previewConfig,
        colorMode: previewConfig.activityColorMode || previewConfig.colorMode || 'simple'
    } : {
        font: searchParams.get('font') || 'inter',
        size: parseInt(searchParams.get('size') || '14'),
        bgColor: searchParams.get('bg_color') || '#000000',
        bgOpacity: parseInt(searchParams.get('bg_opacity') || '50'),
        badges: searchParams.get('badges') !== 'false',
        animation: searchParams.get('animation') || 'fade',
        orientation: searchParams.get('orientation') || 'vertical',
        isTransparent: searchParams.get('transparent') === 'true',
        colorMode: searchParams.get('color_mode') || 'simple',
        eventColors: {
            follow: searchParams.get('col_follow') || '#e91e63',
            sub: searchParams.get('col_sub') || '#9c27b0',
            tip: searchParams.get('col_tip') || '#4caf50',
            gift: searchParams.get('col_gift') || '#2196f3',
        }
    };

    // Helper for base background (used in simple mode)
    const getBaseColor = () => {
        if (config.bgColor) {
            const hex = config.bgColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return `rgba(${r}, ${g}, ${b}, ${config.bgOpacity / 100})`;
        }
        return 'rgba(0,0,0,0.5)';
    };

    // Get color for specific event based on mode
    const getEventStyle = (type) => {
        let bg = getBaseColor();

        if (config.colorMode === 'colorful') {
            // Default "Colorful" Palette with user opacity
            const opacity = config.bgOpacity / 100;
            switch (type) {
                case 'follow': bg = `rgba(233, 30, 99, ${opacity})`; break; // pink
                case 'sub': bg = `rgba(156, 39, 176, ${opacity})`; break; // purple
                case 'tip': bg = `rgba(76, 175, 80, ${opacity})`; break; // green
                case 'gift': bg = `rgba(33, 150, 243, ${opacity})`; break; // blue
                default: break;
            }
        } else if (config.colorMode === 'custom') {
            const hex = config.eventColors[type] || config.bgColor;
            const cleanHex = hex.replace('#', '');
            const r = parseInt(cleanHex.substring(0, 2), 16);
            const g = parseInt(cleanHex.substring(2, 4), 16);
            const b = parseInt(cleanHex.substring(4, 6), 16);
            bg = `rgba(${r}, ${g}, ${b}, ${config.bgOpacity / 100})`;
        }

        return {
            backgroundColor: bg,
            backdropFilter: 'blur(4px)',
        };
    };

    const isPopout = searchParams.get('popout') === 'true';

    // Font Mapping
    const getFontFamily = (f) => {
        switch (f) {
            case 'roboto': return '"Roboto", sans-serif';
            case 'mono': return 'monospace';
            case 'pixel': return '"Press Start 2P", cursive';
            case 'comic': return '"Comic Sans MS", cursive';
            default: return '"Inter", sans-serif';
        }
    };

    const containerStyles = {
        fontFamily: getFontFamily(config.font),
        fontSize: `${config.size}px`,
        // Container is transparent now, individual events carry the bg
        backgroundColor: 'transparent',
    };

    // Auto-scroll (for vertical only)
    const endRef = React.useRef(null);
    useEffect(() => {
        if (config.orientation === 'vertical') {
            endRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [activities, config.orientation]);

    const copyUrl = () => {
        const url = `${window.location.origin}/activity?transparent=true`;
        navigator.clipboard.writeText(url);
        alert("Copied Browser Source URL to clipboard!");
    };

    return (
        <div
            className={`flex ${config.orientation === 'vertical' ? 'flex-col h-full overflow-hidden' : 'flex-row items-end h-full overflow-hidden w-full'}`}
            style={containerStyles}
        >
            {/* Header (Hidden unless popout) */}
            {isPopout && (
                <div className="h-12 border-b border-border flex items-center justify-between px-4 bg-secondary shrink-0 w-full">
                    <h2 className="font-bold text-main">Activity Feed</h2>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => setShowSettings(true)}
                            className="text-muted hover:text-accent transition-colors"
                            title="Dock Settings"
                        >
                            <Settings2 className="w-4 h-4" />
                        </button>
                        {!isPopout && (
                            <button onClick={copyUrl} className="text-muted hover:text-accent transition-colors" title="Copy OBS Browser Source URL">
                                <Copy className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Activity List */}
            <div
                className={`
                    ${config.orientation === 'vertical'
                        ? 'flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-gray-800 w-full flex flex-col items-start'
                        : 'flex items-center space-x-4 px-4 animate-scroll-left whitespace-nowrap'} 
                `}
            >
                {activities.length === 0 ? (
                    <div className="text-center opacity-50 italic w-full">
                        No recent activity...
                    </div>
                ) : (
                    activities.map((act) => {
                        // Icons based on type
                        let Icon = Heart;
                        let colorClass = "text-white"; // default white for colorful bgs

                        // In simple mode, we might want colored icons? 
                        // But for now, let's keep icons white if background is colored, or colored if background is dark?
                        // Let's stick to standard behavior: Icon color matches type usually.
                        // However, if the BACKGROUND is the type color, the icon should probably be white.

                        const isColorful = config.colorMode !== 'simple';

                        if (act.type === 'sub') { Icon = Star; }
                        if (act.type === 'tip') { Icon = DollarSign; }
                        if (act.type === 'gift') { Icon = Gift; }

                        // If simple mode, use colored icons. If colorful/custom, use white icons (assuming bg is colored).
                        if (!isColorful) {
                            if (act.type === 'sub') colorClass = "text-purple-400";
                            else if (act.type === 'tip') colorClass = "text-green-400";
                            else if (act.type === 'gift') colorClass = "text-blue-400";
                            else colorClass = "text-pink-400";
                        }

                        // Animations
                        const animClass = config.animation === 'slide' ? 'animate-slide-in-right' :
                            config.animation === 'none' ? '' : 'animate-fade-in';

                        return (
                            <div
                                key={act.id}
                                className={`${animClass} relative flex items-center rounded-lg p-2 shrink-0 border border-white/5 shadow-sm transition-all hover:scale-[1.02]`}
                                style={getEventStyle(act.type)}
                            >
                                {/* Icon Badge */}
                                {config.badges && (
                                    <div className={`p-1.5 rounded-full bg-black/20 mr-3 ${colorClass}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                )}

                                <div className="leading-tight pr-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="font-bold text-white tracking-wide shadow-black drop-shadow-sm">{act.user}</span>

                                        {config.badges && ( // Platform Icon small
                                            <span className="text-[10px] uppercase text-white/50 bg-black/30 px-1 rounded backdrop-blur-[2px]">
                                                {act.platform.slice(0, 2)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-[0.9em] text-white/80 font-medium">
                                        <span className="capitalize">{act.type}</span>
                                        {act.details && <span className="text-white ml-1 font-bold">{act.details}</span>}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                {config.orientation === 'vertical' && <div ref={endRef} />}
            </div>

            {/* Customizer Modal (Only for standalone Dock) */}
            {!previewConfig && (
                <SourceCustomizerModal
                    isOpen={showSettings}
                    onClose={() => setShowSettings(false)}
                    type="activity"
                />
            )}
        </div>
    );
};

export default ActivityDock;
