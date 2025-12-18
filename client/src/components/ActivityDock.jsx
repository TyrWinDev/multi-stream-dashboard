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
        fadeOut: parseInt(searchParams.get('fade_out') || '0'),
        position: searchParams.get('position') || 'bottom_left',
        reverse: searchParams.get('reverse') === 'true',
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
        // Background moved to inner container
        backgroundColor: 'transparent',
    };

    const boxStyles = {
        // Only apply background checks if vertical usually, but relying on transparent logic
        // For activity dock, we usually have transparent background for list items?
        // User might set a custom background color for the whole dock.
        // So we apply it here.
        backgroundColor: config.isTransparent ? 'transparent' : (config.bgColor ? `rgba(${parseInt(config.bgColor.slice(1, 3), 16)}, ${parseInt(config.bgColor.slice(3, 5), 16)}, ${parseInt(config.bgColor.slice(5, 7), 16)}, ${config.bgOpacity / 100})` : 'transparent'),
        borderRadius: config.isTransparent ? '0px' : '8px',
        border: config.isTransparent ? 'none' : '1px solid rgba(255,255,255,0.1)'
    };

    // Layout Logic (Shared with ChatDock logic)
    const getPositionClasses = () => {
        if (config.orientation === 'horizontal') {
            const align = config.position === 'top' ? 'items-start' : 'items-end'; // top/bottom of screen
            return `flex-col ${align} justify-center`; // justify-center ensures it fills or centers if needed, but we want it sticky.
            // Actually, if we use flex-col on wrapper:
            // items-start = Top. items-end = Bottom.
            // create a flex column, full height.
        } else {
            // Vertical
            let justify = 'justify-end'; // Default bottom
            let align = 'items-start';   // Default left

            if (config.position.includes('top')) justify = 'justify-start';
            if (config.position.includes('right')) align = 'items-end';
            if (config.position.includes('center')) align = 'items-center';

            return `flex-col ${justify} ${align}`;
        }
    };

    const getListClasses = () => {
        if (config.orientation === 'horizontal') {
            const dir = config.reverse ? 'flex-row-reverse space-x-reverse' : 'flex-row';
            return `${dir} items-center space-x-4 animate-scroll-left whitespace-nowrap`;
        } else {
            const dir = config.reverse ? 'flex-col-reverse space-y-reverse' : 'flex-col';
            return `${dir} space-y-3 w-full scrollbar-thin scrollbar-thumb-gray-800`;
        }
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
            className={`flex h-full w-full overflow-hidden ${config.orientation === 'vertical' ? 'p-4' : ''} ${getPositionClasses()}`}
            style={containerStyles}
        >
            {/* Inner Container */}
            <div
                className={`flex flex-col w-full ${config.orientation === 'vertical' ? 'max-h-full shadow-lg overflow-hidden' : 'h-full'}`}
                style={config.orientation === 'vertical' ? boxStyles : {}}
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
                    className={`flex w-full overflow-hidden ${config.orientation === 'vertical' ? 'flex-1 p-2' : ''}`}
                // Using style for horizontal ticker background if needed (not usually for activity dock transparent)
                >
                    <div className={`flex ${getListClasses()}`}>
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

                                const fadeStyle = config.fadeOut > 0 ? {
                                    animation: `${config.animation !== 'none' ? 'fadeIn 0.3s ease-out, ' : ''}fadeOut 1s ease-in forwards`,
                                    animationDelay: `0s, ${config.fadeOut}s`
                                } : undefined;

                                return (
                                    <div
                                        key={act.id}
                                        className={`${config.animation !== 'none' && !config.fadeOut ? animClass : ''} relative flex items-center rounded-lg p-2 shrink-0 border border-white/5 shadow-sm transition-all hover:scale-[1.02]`}
                                        style={{ ...getEventStyle(act.type), ...fadeStyle }}
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

                </div>
            </div> {/* End Inner */}

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
