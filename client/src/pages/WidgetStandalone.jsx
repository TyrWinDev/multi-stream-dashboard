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
                return <RecentActivityWidget socket={socket} state={widgetState.recentEvents} />;
            default:
                return <div className="text-red-500 font-bold">Unknown Widget Type: {type}</div>;
        }
    };

    return (
        <div
            className={`w-screen h-screen overflow-hidden flex items-center justify-center p-4`}
            style={{ backgroundColor: bgColor === 'dark' ? '#0f0f0f' : (bgColor || 'transparent') }}
        >
            {renderWidget()}
        </div>
    );
};

export default WidgetStandalone;
