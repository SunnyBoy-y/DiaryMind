import React, { useEffect, useState } from 'react';
import InteractiveCard from './InteractiveCard';

export default function Clock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const secondRatio = time.getSeconds() / 60;
  const minuteRatio = (secondRatio + time.getMinutes()) / 60;
  const hourRatio = (minuteRatio + time.getHours()) / 12;

  // Generate numbers 1-12 positioned around the circle
  const numbers = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <InteractiveCard className="flex flex-col items-center h-full relative !p-4">
        <h2 className="text-xl font-bold mb-4">时钟</h2>
      <div className="relative w-32 h-32 border-2 border-black rounded-full flex items-center justify-center">
        
        {/* Numbers */}
        {numbers.map((num) => {
          const angle = (num * 30 - 90) * (Math.PI / 180);
          const radius = 55; // Slightly inside the 64px radius (w-32 = 128px diam)
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <div
              key={num}
              className="absolute text-xs font-bold"
              style={{
                transform: `translate(${x}px, ${y}px)`,
              }}
            >
              {num}
            </div>
          );
        })}

        {/* Hour Hand */}
        <div
          className="absolute w-1 h-8 bg-black origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${hourRatio * 360}deg)` }}
        />
        {/* Minute Hand */}
        <div
          className="absolute w-0.5 h-12 bg-black origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${minuteRatio * 360}deg)` }}
        />
        {/* Second Hand */}
        <div
          className="absolute w-0.5 h-14 bg-red-500 origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${secondRatio * 360}deg)` }}
        />
        {/* Center Dot */}
        <div className="absolute w-2 h-2 bg-black rounded-full z-20" />
      </div>
    </InteractiveCard>
  );
}
