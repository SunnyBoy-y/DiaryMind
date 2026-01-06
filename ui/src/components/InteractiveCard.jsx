import React from 'react';

export default function InteractiveCard({ children, className = '', onClick }) {
  return (
    <div 
      onClick={onClick}
      className={`
        card
        p-4 
        cursor-pointer
        overflow-hidden
        ${className}
      `}
    >
      {children}
    </div>
  );
}
