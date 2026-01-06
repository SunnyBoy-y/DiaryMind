import React, { useState, useEffect } from 'react';
import InteractiveCard from './InteractiveCard';

export default function DiaryList() {
  const [diaryItems, setDiaryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/diary/time-machine', { credentials: 'include' });
        if (!res.ok) {
          console.error("Failed to fetch diary list", res.status, res.statusText);
          setDiaryItems([]);
          setLoading(false);
          return;
        }
        const data = await res.json();
        const timeline = Array.isArray(data?.timeline) ? data.timeline : [];
        const items = timeline.slice(0, 5).map((item, index) => ({
          id: index,
          title: item?.title || item?.filename || '未命名',
          date: item?.date || '未知日期',
          mood: item?.mood || null,
          tags: item?.tags || []
        }));
        setDiaryItems(items);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch diary list", err);
        setDiaryItems([]);
        setLoading(false);
      }
    };
    load();
  }, []);

  // 点击处理程序
  const handleDiaryClick = (diaryId) => {
    console.log('点击了日记:', diaryId);
    // 这里可以添加导航或其他逻辑
  };

  return (
    <InteractiveCard className="flex flex-col h-full !p-4 bg-[#fdfbf7]">
      <h2 className="text-xl font-bold mb-4 text-center font-handwriting">日记集</h2>
      <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-2">
        {loading ? (
            <div className="text-center text-gray-500 font-handwriting mt-10">加载中...</div>
        ) : diaryItems.length === 0 ? (
            <div className="text-center text-gray-400 font-handwriting mt-10 italic">
                还没有日记哦<br/>
                <span className="text-sm">快去写一篇吧~</span>
            </div>
        ) : (
            diaryItems.map((diary) => (
            <div 
                key={diary.id} 
                className="flex flex-col gap-1 cursor-pointer group transition-all duration-200"
                onClick={(e) => {
                    e.stopPropagation(); // Prevent parent click if needed
                    handleDiaryClick(diary.id);
                }}
            >
                <div className="flex justify-between items-center font-handwriting px-1 py-1 rounded hover:bg-black/5 transition-colors">
                    <div className="flex items-center gap-2 overflow-hidden">
                        <span className="truncate text-lg group-hover:text-[#ff9b9b] transition-colors">{diary.title}</span>
                        {diary.mood && (
                            <span className="text-xs bg-[#fff5d7] text-[#8b7355] px-2 py-0.5 rounded-full border border-[#8b7355]/30 whitespace-nowrap transform -rotate-2">
                                {diary.mood}
                            </span>
                        )}
                    </div>
                    <span className="text-sm text-gray-400 whitespace-nowrap flex-shrink-0 group-hover:text-gray-600">{diary.date}</span>
                </div>
                {/* Ruled Line */}
                <div className="h-px w-full bg-[#a8d8ea] opacity-50 group-hover:opacity-100 transition-opacity"></div>
            </div>
            ))
        )}
      </div>
    </InteractiveCard>
  );
}
