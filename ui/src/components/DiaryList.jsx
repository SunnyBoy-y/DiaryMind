import React from 'react';
import InteractiveCard from './InteractiveCard';

export default function DiaryList() {
  const items = [1, 2, 3, 4]; 
  return (
    <InteractiveCard className="flex flex-col h-full !p-4">
      <h2 className="text-xl font-bold mb-4 text-center">日记集</h2>
      <div className="space-y-3 flex-1">
        {items.map((_, i) => (
          <div key={i} className="flex flex-col gap-1">
             <div className="h-1 w-full bg-black rounded-full"></div>
             <div className="h-1 w-2/3 bg-black rounded-full"></div>
          </div>
        ))}
      </div>
    </InteractiveCard>
  );
}
