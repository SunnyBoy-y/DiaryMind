import React, { useEffect, useState } from 'react';

export default function BombOverlay({ isActive, onComplete }) {
  const [stage, setStage] = useState('idle'); // idle, throwing, exploding, cracked
  const [crackPos, setCrackPos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (isActive) {
      setStage('throwing');
      // Random position for crack
      const x = 20 + Math.random() * 60; // 20% to 80% width
      const y = 20 + Math.random() * 60; // 20% to 80% height
      setCrackPos({ x, y });

      // Animation sequence
      setTimeout(() => setStage('exploding'), 1000); // Throw duration
      setTimeout(() => setStage('cracked'), 1500);   // Explosion duration
      setTimeout(() => {
          setStage('idle');
          onComplete();
      }, 6500); // Crack duration (5s) + previous delays
    }
  }, [isActive, onComplete]);

  if (stage === 'idle') return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
      
      {/* Throwing Bomb */}
      {stage === 'throwing' && (
        <div 
            className="absolute w-16 h-16 transition-all duration-[1000ms] ease-in"
            style={{
                left: '50%',
                top: '50%',
                transform: `translate(${crackPos.x * window.innerWidth / 100 - window.innerWidth/2}px, ${crackPos.y * window.innerHeight / 100 - window.innerHeight/2}px) rotate(720deg) scale(0.5)`,
            }}
        >
             <svg viewBox="0 0 24 24" fill="black" className="w-full h-full">
                <circle cx="12" cy="13" r="9" />
                <path d="M12 4V2" stroke="black" strokeWidth="2" />
                <path d="M12 2L14 0" stroke="black" strokeWidth="2" />
             </svg>
        </div>
      )}

      {/* Explosion */}
      {stage === 'exploding' && (
         <div 
            className="absolute"
            style={{ left: `${crackPos.x}%`, top: `${crackPos.y}%`, transform: 'translate(-50%, -50%)' }}
         >
             <div className="w-32 h-32 bg-white rounded-full animate-ping opacity-75"></div>
         </div>
      )}

      {/* Crack */}
      {(stage === 'cracked' || stage === 'exploding') && (
        <div 
            className="absolute"
            style={{ left: `${crackPos.x}%`, top: `${crackPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
             {/* Simple SVG Crack */}
             <svg width="200" height="200" viewBox="0 0 100 100" fill="none" stroke="black" strokeWidth="3">
                <path d="M50 50 L30 30 M50 50 L70 30 M50 50 L30 70 M50 50 L70 70 M50 50 L50 20" />
                <path d="M50 50 L80 50 M50 50 L20 50 M50 50 L50 80" />
             </svg>
        </div>
      )}
    </div>
  );
}
