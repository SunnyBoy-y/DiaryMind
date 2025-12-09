import React from 'react';
import { Square } from 'lucide-react';
import InteractiveCard from './InteractiveCard';

export default function TodoList() {
  const todos = [1, 2, 3];

  return (
    <InteractiveCard className="flex flex-col h-full relative !p-4">
      <div className="flex-1 space-y-3">
        {todos.map((t) => (
          <div key={t} className="flex items-start gap-2">
            <Square size={20} className="stroke-2" />
            <div className="flex-1 flex flex-col gap-1 mt-1">
                <div className="h-1 w-full bg-black rounded-full"></div>
                <div className="h-1 w-3/4 bg-black rounded-full"></div>
            </div>
          </div>
        ))}
      </div>
      <h2 className="text-xl font-bold mt-2">待办</h2>
    </InteractiveCard>
  );
}
