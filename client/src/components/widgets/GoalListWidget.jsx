import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

const GoalListWidget = ({ state }) => {
    if (!state || !state.items) return null;

    return (
        <div className="bg-gray-900/90 backdrop-blur-md p-6 rounded-xl border border-gray-700/50 shadow-2xl min-w-[300px]">
            <h2 className="text-2xl font-bold text-white mb-4 border-b border-gray-700 pb-2">{state.title}</h2>
            <div className="space-y-3">
                {state.items.map(item => (
                    <div key={item.id} className={`flex items-start space-x-3 ${item.completed ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                        <div className="mt-1">
                            {item.completed ? <CheckSquare className="text-green-500 w-6 h-6" /> : <Square className="text-gray-400 w-6 h-6" />}
                        </div>
                        <span className={`text-xl font-medium ${item.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalListWidget;
