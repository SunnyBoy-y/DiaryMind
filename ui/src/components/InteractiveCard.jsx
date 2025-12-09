import React from 'react';

export default function InteractiveCard({ children, className = '', onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        bg-white border-2 border-black p-4 
        transition-all duration-200 ease-in-out
        hover:scale-[1.02] hover:border-[3px] hover:shadow-lg
        active:scale-95
        cursor-pointer
        ${className}
      `}
    >
      {children}
    </div>
  );
}
