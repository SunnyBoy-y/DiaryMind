import React, { useState, useEffect } from 'react';
import { History, CalendarClock } from 'lucide-react';

const EchoesOfTime = () => {
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEchoes = async () => {
      try {
        const response = await fetch('/api/rag/echoes');
        if (response.ok) {
          const data = await response.json();
          // Assuming data is an array of strings or objects { date, content }
          // If the API isn't ready, we'll use fallback data to demonstrate UI
          setMemories(Array.isArray(data) ? data : []); 
        } else {
          // Silent fail or minimal error for widget
          console.warn("Failed to fetch echoes");
        }
      } catch (err) {
        console.error("Error fetching echoes:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchEchoes();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center p-4 border-2 border-gray-300 border-dashed rounded bg-yellow-50/50">
        <span className="font-serif italic text-gray-500">正在唤醒往日记忆...</span>
      </div>
    );
  }

  if (memories.length === 0) {
    return (
      <div className="bg-[#fdfbf7] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg relative overflow-hidden group transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <h3 className="font-handwriting font-bold text-black text-xl mb-2 flex items-center gap-2 border-b-2 border-black/10 pb-2">
          <CalendarClock size={20} />
          那年今日
        </h3>
        <p className="font-handwriting text-gray-500 italic">
          暂无往日的回响...
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#fff9e6] border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg relative overflow-hidden h-full flex flex-col transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="absolute top-0 right-0 p-2 opacity-5 pointer-events-none">
        <History size={64} color="black" />
      </div>
      
      <h3 className="font-handwriting font-bold text-black text-xl mb-3 flex items-center gap-2 border-b-2 border-black/10 pb-2">
        <CalendarClock size={20} />
        往日回响
      </h3>

      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar-sepia space-y-4">
        {memories.map((memory, index) => (
          <div key={index} className="relative pl-4 border-l-2 border-[#ff9b9b]">
            <div className="absolute -left-[5px] top-2 w-2 h-2 rounded-full bg-[#ff9b9b] border border-black"></div>
            <div className="text-xs font-handwriting font-bold text-gray-500 mb-1">
              {memory.date || '未知日期'}
            </div>
            <p className="font-handwriting text-black text-sm leading-relaxed">
              {memory.content || memory.text || memory}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EchoesOfTime;
