import React, { useState, useEffect } from 'react';
import { Sparkles, Zap } from 'lucide-react';

const InsightCapsule = () => {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsight = async () => {
      try {
        // Simulating an API call or using a real one
        // Replace with actual endpoint: /api/rag/insight
        const response = await fetch('/api/rag/insight');
        if (response.ok) {
          const data = await response.json();
          setInsight(data);
        } else {
            // Fallback for demo if API fails
            setInsight({
                title: "每日洞察",
                content: "保持记录是与自我对话的最佳方式。数据表明，持续记录能提升 40% 的情绪感知力。",
                tag: "Self-Awareness"
            });
        }
      } catch (err) {
        console.error("Failed to fetch insight", err);
        setInsight({
            title: "每日洞察",
            content: "保持记录是与自我对话的最佳方式。数据表明，持续记录能提升 40% 的情绪感知力。",
            tag: "Self-Awareness"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchInsight();
  }, []);

  if (loading) return null;

  return (
    <div className="group relative w-full overflow-hidden rounded-lg border-2 border-black bg-[#a8d8ea] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="relative h-full w-full z-10 flex flex-col justify-between">
        <div>
            <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-black px-3 py-1 text-sm font-bold text-black">
                    <Sparkles size={14} className="text-[#ff9b9b]" />
                    AI 洞察
                </span>
                <span className="text-xs font-bold tracking-wider text-black/70 uppercase font-handwriting">
                    {insight?.tag || 'TREND'}
                </span>
            </div>

            <h3 className="mb-2 text-xl font-bold leading-tight text-black font-handwriting">
                {insight?.title || 'Insight Capsule'}
            </h3>
            
            <p className="text-sm leading-relaxed text-black/80 font-handwriting">
                {insight?.content || insight?.message}
            </p>
        </div>
      </div>
      
      {/* Decorative Background Pattern */}
      <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
        <Zap size={100} color="black" />
      </div>
    </div>
  );
};

export default InsightCapsule;
