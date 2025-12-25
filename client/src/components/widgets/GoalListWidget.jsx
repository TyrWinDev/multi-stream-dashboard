import React from 'react';
import { CheckSquare, Square } from 'lucide-react';

const GoalListWidget = ({ state }) => {
    if (!state || !state.items) return null;

    return (
        <div className="bg-tertiary backdrop-blur-md p-6 rounded-xl border border-border shadow-2xl min-w-[300px]">
            <h2 className="text-2xl font-bold text-main mb-4 border-b border-border pb-2">{state.title}</h2>
            <div className="space-y-3">
                {state.items.map(item => (
                    <div key={item.id} className={`flex items-start space-x-3 ${item.completed ? 'opacity-50' : 'opacity-100'} transition-opacity`}>
                        <div className="mt-1">
                            {item.completed ? <CheckSquare className="text-secondary-text w-6 h-6" /> : <Square className="text-muted w-6 h-6" />}
                        </div>
                        <span className={`text-xl font-medium ${item.completed ? 'text-muted line-through' : 'text-main'}`}>
                            {item.text}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GoalListWidget;
