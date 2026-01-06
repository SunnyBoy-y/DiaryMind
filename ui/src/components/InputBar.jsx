import React, { useState, useRef } from 'react';
import { ArrowUp } from 'lucide-react';

/**
 * InputBar component for user input with support for:
 * - Fullscreen mode trigger (double click)
 * - Suggestions/Autocompletion
 * - Controlled and uncontrolled modes
 * 
 * @param {Object} props
 * @param {Function} props.onFullScreenMode - Callback for double-click fullscreen trigger
 * @param {Function} props.onSendMessage - Callback when message is sent
 * @param {string} props.value - Controlled value
 * @param {Function} props.onChange - Callback when input changes
 * @param {string} props.suggestionSuffix - Ghost text for suggestion
 * @param {Function} props.onAcceptSuggestion - Callback to accept suggestion (Tab/Enter)
 * @param {string} props.placeholder - Input placeholder
 */
export default function InputBar({ 
  onFullScreenMode, 
  onSendMessage, 
  value: controlledValue, 
  onChange, 
  suggestionSuffix, 
  onAcceptSuggestion, 
  placeholder 
}) {
  const [internalValue, setInternalValue] = useState('');
  const inputRef = useRef(null);

  // Determine if component is controlled
  const isControlled = typeof controlledValue === 'string';
  const currentValue = isControlled ? controlledValue : internalValue;

  // Handle message sending
  const handleSend = () => {
    const text = currentValue || '';
    if (text.trim() && onSendMessage) {
      onSendMessage(text);
      if (!isControlled) {
        setInternalValue('');
      }
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      // If there's a suggestion and we're at the end or want to accept it, 
      // specific logic can be added. Here we assume Enter primarily sends 
      // unless overridden by specific suggestion acceptance logic if desired.
      // Current logic: Enter accepts suggestion if present, otherwise sends.
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
        onAcceptSuggestion();
      }
    }
  };

  const handleClick = () => {
    // Always focus input on click
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleDoubleClick = () => {
    onFullScreenMode && onFullScreenMode();
  };

  // Handle input change
  const handleChange = (e) => {
    const nextValue = e.target.value;
    if (isControlled) {
      onChange && onChange(nextValue);
    } else {
      setInternalValue(nextValue);
      onChange && onChange(nextValue);
    }
  };

  // Styles
  const containerClasses = "flex items-center gap-4 w-full mt-4";
  const inputWrapperClasses = "flex-1 transition-all duration-200 scale-100";
  const inputClasses = `
    w-full border-2 border-[#2d2d2d] p-3 h-14 text-xl outline-none bg-white font-handwriting
    focus:border-[#ff9b9b] focus:shadow-[4px_4px_0px_0px_rgba(255,155,155,1)]
    transition-all duration-200
    placeholder-gray-400
  `;
  const suggestionClasses = "absolute top-0 left-0 pointer-events-none z-0";
  const suggestionTextClasses = "p-3 h-14 text-xl text-gray-300 select-none font-handwriting";
  const buttonClasses = `
    border-2 border-[#2d2d2d] w-14 h-14 flex items-center justify-center bg-white 
    hover:bg-[#ff9b9b] hover:text-white hover:border-[#ff9b9b] hover:shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]
    transition-all duration-200
  `;

  return (
    <div className={containerClasses}>
      <div 
        className={inputWrapperClasses}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <div className="relative">
          <input 
            type="text" 
            ref={inputRef}
            value={currentValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            className={inputClasses}
            style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
            placeholder={placeholder || ''}
          />
          
          {/* Suggestion Overlay */}
          {(suggestionSuffix && (currentValue || '').length > 0) && (
            <div className={suggestionClasses}>
              <div className={suggestionTextClasses}>
                {/* Render invisible current value to position suffix correctly */}
                <span className="opacity-0">{currentValue}</span>
                <span className="opacity-70">{suggestionSuffix}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={handleSend}
        className={buttonClasses}
        aria-label="Send message"
        style={{ borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%' }}
      >
        <ArrowUp size={28} strokeWidth={2.5} />
      </button>
    </div>
  );
}
