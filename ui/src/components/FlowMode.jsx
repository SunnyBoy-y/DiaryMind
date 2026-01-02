import React, { useState, useEffect, useRef } from 'react';

export default function FlowMode({ activeTask, nextTask, onExit }) {
  const [now, setNow] = useState(Date.now());
  const [encouragement, setEncouragement] = useState('保持专注，你做得很好！');
  const [clickCount, setClickCount] = useState(0);
  const lastClickTime = useRef(0);
  const containerRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Format active task duration
  const startTime = activeTask ? activeTask.startTime : now;
  const duration = activeTask ? activeTask.duration + (now - startTime) : 0;
  
  const formatDuration = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Triple click handler
  const handleClick = () => {
    const currentTime = Date.now();
    if (currentTime - lastClickTime.current < 500) {
      setClickCount(prev => prev + 1);
    } else {
      setClickCount(1);
    }
    lastClickTime.current = currentTime;
  };

  useEffect(() => {
    if (clickCount >= 3) {
      onExit && onExit();
      setClickCount(0);
    }
  }, [clickCount, onExit]);

  // Fetch encouragement periodically
  useEffect(() => {
    const fetchEncouragement = async () => {
      try {
        const currentHour = new Date().getHours();
        let timeDesc = "白天";
        if (currentHour < 6) timeDesc = "深夜";
        else if (currentHour < 9) timeDesc = "清晨";
        else if (currentHour > 18) timeDesc = "晚上";

        const prompt = `我现在正在专注做任务：${activeTask?.text || '未命名任务'}。
        当前时间是${timeDesc}。
        请给我一句简短的鼓励的话，要在30字以内，不要带引号。
        根据当前时间和任务状态（正在进行中）给出合适的鼓励。`;

        const response = await fetch('/api/llm/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: "你是贴心的专注伴侣",
            message: prompt
          })
        });
        const data = await response.json();
        if (data.response) {
            setEncouragement(data.response);
        }
      } catch (e) {
        console.error("Failed to fetch flow encouragement", e);
      }
    };

    fetchEncouragement();
    const interval = setInterval(fetchEncouragement, 60000 * 5); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [activeTask]);

  return (
    <div 
        ref={containerRef}
        className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center select-none cursor-pointer transition-opacity duration-500 animate-in fade-in"
        onClick={handleClick}
    >
      <div className="absolute top-10 text-gray-400 text-sm">
        三击屏幕退出专注模式
      </div>

      <div className="flex-1 flex flex-col items-center justify-center gap-12 w-full max-w-4xl px-8">
        {/* Timer */}
        <div className="text-[12rem] font-mono leading-none tracking-tighter text-black font-bold">
            {formatDuration(duration)}
        </div>

        {/* Current Task */}
        <div className="text-4xl text-center font-bold max-w-3xl">
            {activeTask ? activeTask.text : '专注当下'}
        </div>

        {/* Encouragement */}
        <div className="text-2xl text-gray-500 italic text-center max-w-2xl animate-pulse duration-[3000ms]">
            {encouragement}
        </div>
      </div>

      {/* Next Task */}
      {nextTask && (
          <div className="absolute bottom-10 flex flex-col items-center gap-2 opacity-50">
            <span className="text-sm uppercase tracking-widest">Next</span>
            <span className="text-xl">{nextTask.text}</span>
          </div>
      )}
    </div>
  );
}
