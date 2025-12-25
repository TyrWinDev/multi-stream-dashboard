import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import CounterWidget from '../components/widgets/CounterWidget';
import TimerWidget from '../components/widgets/TimerWidget';
import SocialRotatorWidget from '../components/widgets/SocialRotatorWidget';
import ProgressBarWidget from '../components/widgets/ProgressBarWidget';
import GoalListWidget from '../components/widgets/GoalListWidget';
import SpinWheelWidget from '../components/widgets/SpinWheelWidget';
import ChatHighlightWidget from '../components/widgets/ChatHighlightWidget';
import RecentActivityWidget from '../components/widgets/RecentActivityWidget';

const WidgetStandalone = ({ socket, widgetState }) => {
    const { type } = useParams();

    // URL Params for customization
    const searchParams = new URLSearchParams(window.location.search);
    const bgColor = searchParams.get('bg'); // e.g. 'black', 'dark', 'white'

    // Safety check
    if (!widgetState) return (
        <div className="flex items-center justify-center h-screen w-full bg-gray-900">
            <div className="text-white font-bold text-xl animate-pulse">Loading Widget...</div>
        </div>
    );

    const renderWidget = () => {
        switch (type) {
            case 'counter':
                return <CounterWidget socket={socket} state={widgetState.counter} />;
            case 'timer':
                return <TimerWidget socket={socket} state={widgetState.timer} />;
            case 'social':
                return <SocialRotatorWidget socket={socket} state={widgetState.social} />;
            case 'progress':
                return <ProgressBarWidget socket={socket} state={widgetState.progress} />;
            case 'goals':
                return <GoalListWidget socket={socket} state={widgetState.goals} />;
            case 'wheel':
                return <SpinWheelWidget socket={socket} state={widgetState.wheel} />;
            case 'highlight':
                return <ChatHighlightWidget socket={socket} state={widgetState.highlight} />;
            case 'activity':
                return <RecentActivityWidget socket={socket} state={widgetState} />;
            default:
                return <div className="text-red-500 font-bold">Unknown Widget Type: {type}</div>;
        }
    };

    // Derived Styles
    const globalState = widgetState.global || {};
    const fontClass = globalState.font === 'serif' ? 'font-serif' : globalState.font === 'mono' ? 'font-mono' : 'font-sans';

    // Theme Injection (Basic)
    // For 'neon', we might add a class.

    // Animation
    const animMap = {
        'fade-in': 'animate-fade-in',
        'slide-in': 'animate-slide-in',
        'slide-up': 'animate-slide-up',
        'bounce-in': 'animate-bounce-in',
        'none': ''
    };
    const animClass = animMap[globalState.animation] || '';

    // Transparency: If global transparent is TRUE, overrides 'bg' unless 'bg' is explicit? 
    // Usually OBS adds it as a layer, so 'transparent' means no background color on the container.
    // If 'transparent mode' is ON, we force transparency.
    // However, the `bg` param is for testing usually.
    // Let's say: bgColor from URL > Global Transparent > Default Transparent

    const finalBg = bgColor === 'dark' ? '#0f0f0f' : (globalState.transparent ? 'transparent' : (bgColor || 'transparent'));

    return (
        <div
            className={`w-screen h-screen overflow-hidden flex items-center justify-center p-4 ${fontClass} ${globalState.theme === 'neon' ? 'theme-cyberpunk' : ''}`}
            style={{ backgroundColor: finalBg }}
        >
            <div className={`w-full flex justify-center ${animClass} duration-500`}>
                {renderWidget()}
            </div>
        </div>
    );
};

export default WidgetStandalone;
