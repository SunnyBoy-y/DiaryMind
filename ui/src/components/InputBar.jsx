import React, { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export default function InputBar({ onFullScreenMode, onSendMessage, value: controlledValue, onChange, suggestionSuffix, onAcceptSuggestion, placeholder }) {
  const [value, setValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const lastClickTime = useRef(0);

  const currentValue = typeof controlledValue === 'string' ? controlledValue : value;

  const handleSend = () => {
    const text = currentValue || '';
    if (text.trim() && onSendMessage) {
      onSendMessage(text);
      if (typeof controlledValue !== 'string') {
        setValue('');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      if (suggestionSuffix && onAcceptSuggestion) {
        e.preventDefault();
        onAcceptSuggestion();
        return;
      }
      handleSend();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      if (onAcceptSuggestion) {
        onAcceptSuggestion(); // Reuse this prop for generic Tab handler
      }
    }
  };

  const handleClick = () => {
    if ((currentValue || '').trim() !== '') return;

    const now = Date.now();
    if (now - lastClickTime.current < 500) {
      if (onFullScreenMode) {
        onFullScreenMode();
      }
    } else {
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
    }
    lastClickTime.current = now;
  };

  const handleChange = (e) => {
    const next = e.target.value;
    if (typeof controlledValue === 'string') {
      onChange && onChange(next);
    } else {
      setValue(next);
      onChange && onChange(next);
    }
  };

  return (
    <div className="flex items-center gap-4 w-full mt-4">
      <div 
        className={`flex-1 transition-all duration-200 ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
        onClick={handleClick}
      >
        <div className="relative">
          <input 
            type="text" 
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={`
              w-full border-2 border-black p-3 h-14 text-xl outline-none bg-transparent
              focus:ring-2 focus:ring-black/50
              transition-all duration-200
              ${isAnimating ? 'border-[4px]' : ''}
            `}
            placeholder={placeholder || ''}
          />
          {(suggestionSuffix && (currentValue || '').length > 0) && (
            <div className="absolute inset-0 pointer-events-none z-10">
              <div className="p-3 h-14 text-xl text-gray-400 select-none">
                {(currentValue || '')}
                <span 
                  className="text-gray-400 pointer-events-auto cursor-pointer"
                  style={{ opacity: 0.8 }}
                  onMouseDown={(e) => { e.preventDefault(); onAcceptSuggestion && onAcceptSuggestion(); }}
                  title="点击采纳补全"
                >{suggestionSuffix}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <button 
        onClick={handleSend}
        className="border-2 border-black w-14 h-14 flex items-center justify-center bg-white hover:bg-gray-100 transition-colors"
      >
        <ArrowUp size={32} strokeWidth={2} />
      </button>
    </div>
  );
}
