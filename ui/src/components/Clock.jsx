import React, { useEffect, useState } from 'react';
import InteractiveCard from './InteractiveCard';

export default function Clock({ simple = false, scale = 1 }) {
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

  const ClockFace = (
      <div 
        className={`relative w-32 h-32 border-2 border-[#2d2d2d] rounded-full flex items-center justify-center bg-white ${!simple ? 'shadow-[2px_2px_0px_0px_rgba(45,45,45,0.5)]' : 'shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]'}`}
        style={{ 
            borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%', // Imperfect circle
            transform: `scale(${scale})`,
            transformOrigin: 'center'
        }}
      >
        
        {/* Numbers */}
        {numbers.map((num) => {
          const angle = (num * 30 - 90) * (Math.PI / 180);
          const radius = 52; 
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          return (
            <div
              key={num}
              className="absolute text-sm font-bold font-handwriting text-[#2d2d2d]"
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
          className="absolute w-1.5 h-8 bg-[#2d2d2d] origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${hourRatio * 360}deg)`, borderRadius: '5px' }}
        />
        {/* Minute Hand */}
        <div
          className="absolute w-1 h-11 bg-[#2d2d2d] origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${minuteRatio * 360}deg)`, borderRadius: '5px' }}
        />
        {/* Second Hand */}
        <div
          className="absolute w-0.5 h-12 bg-[#ff9b9b] origin-bottom bottom-1/2 rounded-full z-10"
          style={{ transform: `rotate(${secondRatio * 360}deg)` }}
        />
        {/* Center Dot */}
        <div className="absolute w-3 h-3 bg-[#2d2d2d] rounded-full z-20 border-2 border-white" />
      </div>
  );

  if (simple) {
      return (
          <div className="flex items-center justify-center" style={{ width: `${8 * 4 * scale}px`, height: `${8 * 4 * scale}px` }}>
              {ClockFace}
          </div>
      );
  }

  return (
    <InteractiveCard className="flex flex-col items-center h-full relative !p-4 bg-[#fdfbf7]">
        <h2 className="text-xl font-bold mb-4 font-handwriting">时钟</h2>
        {ClockFace}
    </InteractiveCard>
  );
}
