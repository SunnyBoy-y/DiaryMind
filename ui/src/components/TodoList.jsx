import React, { useState, useEffect } from 'react';
import { Square, CheckSquare, Play, Pause } from 'lucide-react';
import InteractiveCard from './InteractiveCard';

export default function TodoList({ todos = [], onUpdateTodo }) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const hasActive = todos.some(t => t.active);
    if (!hasActive) return;

    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [todos]);

  const formatDuration = (ms) => {
    const seconds = Math.floor(ms / 1000);
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <InteractiveCard className="flex flex-col h-full relative !p-4 bg-[#fdfbf7]">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {todos.length === 0 && (
            <div className="text-gray-400 text-lg font-handwriting text-center mt-10 italic">
                今天还没有任务哦~
            </div>
        )}
        {todos.map((t) => {
          const currentDuration = t.active ? t.duration + (now - t.startTime) : t.duration;
          
          return (
            <div key={t.id} className={`flex items-start gap-3 group transition-all duration-300 ${t.completed ? 'opacity-50' : ''}`}>
              <div 
                className={`
                    mt-1 w-5 h-5 flex-shrink-0 cursor-pointer transition-all duration-200
                    border-2 flex items-center justify-center
                    ${t.completed ? 'bg-[#a8e6cf] border-[#a8e6cf]' : 'bg-transparent border-[#2d2d2d] hover:border-[#ff9b9b]'}
                `}
                style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTodo && onUpdateTodo(t.id, 'complete');
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onUpdateTodo && onUpdateTodo(t.id, 'pause');
                }}
              >
                {t.completed && <div className="text-white font-bold text-xs transform -rotate-6">✓</div>}
              </div>
              
              <div 
                className="flex-1 flex flex-col gap-1 cursor-pointer select-none"
                onClick={() => onUpdateTodo && onUpdateTodo(t.id, 'toggle-hidden')}
                onDoubleClick={() => onUpdateTodo && onUpdateTodo(t.id, 'activate')}
              >
                <div className="flex justify-between items-start">
                    <span className={`text-xl font-handwriting leading-snug text-break transition-all duration-300 ${t.hidden || t.completed ? 'line-through text-gray-400 decoration-2 decoration-[#ff9b9b]/50' : 'text-[#2d2d2d]'} ${t.active ? 'font-bold text-[#ff9b9b]' : ''}`}>
                        {t.text}
                    </span>
                    {(t.active || t.duration > 0) && (
                        <span className={`text-xs font-mono px-2 py-0.5 rounded ml-2 flex items-center gap-1 shadow-sm transform rotate-2 ${t.active ? 'bg-[#ff9b9b] text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {t.active && <Play size={8} fill="currentColor" />}
                            {!t.active && t.duration > 0 && <Pause size={8} fill="currentColor" />}
                            {formatDuration(currentDuration)}
                        </span>
                    )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <h2 className="text-xl font-bold mt-2 border-t-2 border-[#2d2d2d]/10 pt-2 font-handwriting text-center text-[#2d2d2d]/50">待办</h2>
    </InteractiveCard>
  );
}
