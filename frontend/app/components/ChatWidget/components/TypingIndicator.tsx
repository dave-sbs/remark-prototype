import React from 'react';

export const TypingIndicator: React.FC = () => {
    return (
        <div className="flex items-center space-x-1 bg-gray-200 rounded-2xl w-fit">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-600/80 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-2 h-2 bg-gray-600/80 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-2 h-2 bg-gray-600/80 rounded-full animate-bounce" />
            </div>
        </div>
    );
};

export default TypingIndicator;
