import React from 'react';
import InteractiveCard from './InteractiveCard';

export default function DiaryList() {
  // 模拟日记数据
  const diaryItems = [
    { id: 1, title: '今天的心情', date: '2024-01-15' },
    { id: 2, title: '学习记录', date: '2024-01-14' },
    { id: 3, title: '旅行见闻', date: '2024-01-13' },
    { id: 4, title: '工作计划', date: '2024-01-12' }
  ];

  // 点击处理程序
  const handleDiaryClick = (diaryId) => {
    console.log('点击了日记:', diaryId);
    // 这里可以添加导航或其他逻辑
  };

  return (
    <InteractiveCard className="flex flex-col h-full !p-4">
      <h2 className="text-xl font-bold mb-4 text-center">日记集</h2>
      <div className="space-y-3 flex-1">
        {diaryItems.map((diary) => (
          <div 
            key={diary.id} 
            className="flex flex-col gap-1 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => handleDiaryClick(diary.id)}
          >
             <div className="h-1 w-full bg-black rounded-full"></div>
             <div className="h-1 w-2/3 bg-black rounded-full"></div>
          </div>
        ))}
      </div>
    </InteractiveCard>
  );
}
