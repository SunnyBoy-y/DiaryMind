import React, { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

export default function InputBar({ onFullScreenMode, onSendMessage }) {
  const [value, setValue] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const lastClickTime = useRef(0);

  const handleSend = () => {
    if (value.trim() && onSendMessage) {
      onSendMessage(value);
      setValue('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleClick = () => {
    if (value.trim() !== '') return;

    const now = Date.now();
    if (now - lastClickTime.current < 500) {
      // Double click detected
      if (onFullScreenMode) {
        onFullScreenMode();
      }
    } else {
      // Single click - trigger animation
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 200);
    }
    lastClickTime.current = now;
  };

  return (
    <div className="flex items-center gap-4 w-full mt-4">
      <div 
        className={`flex-1 transition-all duration-200 ${isAnimating ? 'scale-[1.02]' : 'scale-100'}`}
        onClick={handleClick}
      >
        <input 
          type="text" 
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`
            w-full border-2 border-black p-3 h-14 text-xl outline-none 
            focus:ring-2 focus:ring-black/50
            transition-all duration-200
            ${isAnimating ? 'border-[4px]' : ''}
          `}
        />
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
