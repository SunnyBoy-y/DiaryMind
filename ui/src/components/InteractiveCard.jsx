import React from 'react';

export default function InteractiveCard({ children, className = '', onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        card bg-white border-2 border-[var(--color-primary)] p-4 
        rounded-xl transition-all duration-200 ease-in-out
        hover:scale-[1.02] hover:border-[3px] hover:border-[var(--color-primary)] hover:shadow-lg
        active:scale-95
        cursor-pointer
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}
