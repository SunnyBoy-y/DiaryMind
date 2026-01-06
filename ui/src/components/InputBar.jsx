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
    w-full border-2 border-black p-3 h-14 text-xl outline-none bg-transparent
    focus:ring-2 focus:ring-black/50
    transition-all duration-200
  `;
  const suggestionClasses = "absolute top-0 left-0 pointer-events-none z-0";
  const suggestionTextClasses = "p-3 h-14 text-xl text-gray-400 select-none";
  const buttonClasses = "border-2 border-black w-14 h-14 flex items-center justify-center bg-white hover:bg-gray-100 transition-colors";

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
      >
        <ArrowUp size={32} strokeWidth={2} />
      </button>
    </div>
  );
}
