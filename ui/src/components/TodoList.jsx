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
    <InteractiveCard className="flex flex-col h-full relative !p-4">
      <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
        {todos.length === 0 && (
            <div className="text-gray-400 text-sm text-center mt-4">暂无待办事项</div>
        )}
        {todos.map((t) => {
          const currentDuration = t.active ? t.duration + (now - t.startTime) : t.duration;
          
          return (
            <div key={t.id} className={`flex items-start gap-2 group ${t.completed ? 'opacity-50' : ''}`}>
              <div 
                className="mt-1 cursor-pointer hover:scale-110 transition-transform"
                onClick={(e) => {
                    e.stopPropagation();
                    onUpdateTodo && onUpdateTodo(t.id, 'complete');
                }}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onUpdateTodo && onUpdateTodo(t.id, 'pause');
                }}
              >
                {t.completed ? <CheckSquare size={20} /> : <Square size={20} className="stroke-2" />}
              </div>
              
              <div 
                className="flex-1 flex flex-col gap-1 cursor-pointer select-none"
                onClick={() => onUpdateTodo && onUpdateTodo(t.id, 'toggle-hidden')}
                onDoubleClick={() => onUpdateTodo && onUpdateTodo(t.id, 'activate')}
              >
                <div className="flex justify-between items-center">
                    <span className={`text-lg leading-none text-break ${t.hidden || t.completed ? 'line-through text-gray-400' : ''} ${t.active ? 'font-bold' : ''}`}>
                        {t.text}
                    </span>
                    {(t.active || t.duration > 0) && (
                        <span className="text-xs font-mono bg-black text-white px-1 rounded flex items-center gap-1">
                            {t.active && <Play size={8} fill="white" />}
                            {!t.active && t.duration > 0 && <Pause size={8} fill="white" />}
                            {formatDuration(currentDuration)}
                        </span>
                    )}
                </div>
                {/* Visual line for hidden state if we want something more than strike-through, 
                    but strike-through is standard for "hidden as line". 
                    User said "隐藏为横线状态", likely means collapsed to a line or just strike-through.
                    If it means collapsed, maybe we hide the text and show a line? 
                    Let's assume strike-through for now as it keeps context.
                */}
              </div>
            </div>
          );
        })}
      </div>
      <h2 className="text-xl font-bold mt-2 border-t border-black pt-2">待办</h2>
    </InteractiveCard>
  );
}
