import React from 'react';
import { Github, Settings, Bug, Coffee } from 'lucide-react';

const StatusBar = ({ onOpenSettings, onOpenDebug }) => {
    return (
        <div className="h-12 bg-[#0a0a0a] border-t border-gray-800 flex items-center justify-between px-6 text-sm select-none">
            {/* Left: Copyright & Links */}
            <div className="flex items-center space-x-4 text-gray-500">
                <span>© 2025 MultiStream Dashboard by TyrDev</span>
                <a
                    href="https://github.com/TyrWinDev/multi-stream-dashboard/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-white transition-colors"
                >
                    <Github className="w-4 h-4 mr-1.5" />
                    GitHub
                </a>
                <a
                    href="https://ko-fi.com/tyrwinter"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center hover:text-[#FF5E5B] transition-colors"
                >
                    <Coffee className="w-4 h-4 mr-1.5" />
                    Donate
                </a>
            </div>

            {/* Right: Global Controls */}
            <div className="flex items-center space-x-3">
                <button
                    onClick={onOpenDebug}
                    className="flex items-center px-3 py-1.5 rounded bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-green-400 transition-all font-medium"
                    title="Simulation & Debug"
                >
                    <Bug className="w-4 h-4 mr-2" />
                    Simulation
                </button>
                <div className="w-px h-4 bg-gray-800 mx-1"></div>
                <button
                    onClick={onOpenSettings}
                    className="flex items-center px-3 py-1.5 rounded bg-gray-900 border border-gray-800 hover:bg-gray-800 text-gray-300 hover:text-white transition-all font-medium"
                >
                    <Settings className="w-4 h-4 mr-2" />
                    Connections
                </button>
            </div>
        </div>
    );
};

export default StatusBar;
