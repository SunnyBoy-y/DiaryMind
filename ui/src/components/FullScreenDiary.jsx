import React, { useState } from 'react';
import WeatherSelector from './WeatherSelector';
import InputBar from './InputBar';
import InteractiveCard from './InteractiveCard';
import { Save } from 'lucide-react';

const API_BASE = "http://localhost:8082/api/diary";

export default function FullScreenDiary() {
  const [weather, setWeather] = useState('sunny');
  const [content, setContent] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!content.trim() && !plan.trim()) {
      alert("写点什么再保存吧~");
      return;
    }

    setIsSaving(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const filename = `Diary_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      const fullContent = `# ${dateStr} ${timeStr} [${weather}]\n\n## 发生了啥\n${content}\n\n## 加点计划\n${plan}`;

      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          content: fullContent,
          format: 'md'
        })
      });

      if (response.ok) {
        alert("保存成功！");
      } else {
        alert("保存失败...");
      }
    } catch (error) {
      console.error("Save failed:", error);
      alert("保存出错啦");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold font-handwriting">我的这一天</h1>
        <div className="flex items-center gap-4">
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
                <Save size={20} />
                <span className="font-bold">保存</span>
            </button>
            <WeatherSelector selected={weather} onSelect={setWeather} />
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 min-h-0">
        
        {/* Left Column: What happened */}
        <InteractiveCard className="flex flex-col !p-6 h-full">
            <h2 className="text-2xl font-bold mb-4">发生了啥</h2>
            <div className="flex-1 border-b-2 border-black border-dashed mb-4">
                <textarea 
                    className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent"
                    placeholder="记录下今天的故事..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
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
                        value={plan}
                        onChange={(e) => setPlan(e.target.value)}
                    />
                 </div>
            </InteractiveCard>

        </div>
      </div>

      <InputBar />
    </div>
  );
}
