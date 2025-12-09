import React, { useState } from 'react';
import WeatherSelector from './WeatherSelector';
import InputBar from './InputBar';
import InteractiveCard from './InteractiveCard';

export default function FullScreenDiary() {
  const [weather, setWeather] = useState('sunny');

  return (
    <div className="flex flex-col gap-6 h-full relative">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-handwriting">我的这一天</h1>
        <WeatherSelector selected={weather} onSelect={setWeather} />
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        
        {/* Left Column: What happened */}
        <InteractiveCard className="flex flex-col !p-6 h-full">
            <h2 className="text-2xl font-bold mb-4">发生了啥</h2>
            <div className="flex-1 border-b-2 border-black border-dashed mb-4">
                <textarea 
                    className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent"
                    placeholder="记录下今天的故事..."
                />
            </div>
            <p className="text-right text-sm text-gray-500 font-handwriting">哎呀，别墨迹啦</p>
        </InteractiveCard>

        {/* Right Column: AI Summary and Plans */}
        <div className="flex flex-col gap-6 h-full">
            
            {/* AI Summary */}
            <InteractiveCard className="flex-none !p-6 bg-gray-50 flex items-center justify-center text-center">
                 <div>
                     <h3 className="text-xl font-bold mb-2">AI 一句活总结</h3>
                     <p className="text-gray-400 italic">等待生成中...</p>
                 </div>
            </InteractiveCard>

            {/* Plans */}
            <InteractiveCard className="flex-1 !p-6 flex flex-col">
                <h2 className="text-2xl font-bold mb-4">加点计划</h2>
                 <div className="flex-1">
                    <textarea 
                        className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent"
                        placeholder="明天打算做点啥？"
                    />
                 </div>
            </InteractiveCard>

        </div>
      </div>

      <InputBar />
    </div>
  );
}
