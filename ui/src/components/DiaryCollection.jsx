import React, { useState, useEffect } from 'react';
import InteractiveCard from './InteractiveCard';
import InputBar from './InputBar';
import { ChevronUp, ChevronDown, Save, FileText } from 'lucide-react';

const API_BASE = "http://localhost:8082/api/diary";

export default function DiaryCollection({ onBack, onCreateNew }) {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [currentFilename, setCurrentFilename] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
      fetchList();
  }, []);

  const fetchList = () => {
      fetch(`${API_BASE}/list`)
        .then(res => res.json())
        .then(data => setItems(data))
        .catch(err => console.error("Failed to fetch diaries", err));
  };

  const handleSelect = (filename) => {
      setLoading(true);
      fetch(`${API_BASE}/content/${filename}`)
        .then(res => res.json())
        .then(data => {
            setContent(data.content);
            setCurrentFilename(filename);
            setLoading(false);
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
  };

  const handleCreateNew = () => {
      setContent("");
      setCurrentFilename("");
  };

  const handleSave = () => {
      const filename = currentFilename || `diary_${new Date().toISOString().slice(0,10)}_${new Date().getTime()}.md`;
      
      // Determine format from filename or default to md
      let format = 'md';
      if (filename.toLowerCase().endsWith('.docx')) format = 'docx';
      
      fetch(`${API_BASE}/save`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
              filename: filename,
              content: content,
              format: format
          })
      })
      .then(res => res.json())
      .then(data => {
          alert('Saved successfully!');
          setCurrentFilename(data.filename);
          fetchList();
      })
      .catch(err => {
          console.error(err);
          alert('Failed to save');
      });
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold">日记集</h1>
            <div className="flex gap-2">
                <button 
                    onClick={handleCreateNew}
                    className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
                >
                    新建
                </button>
                <button 
                    onClick={handleSave}
                    className="px-4 py-2 border-2 border-black bg-black text-white hover:bg-gray-800 font-bold flex items-center gap-2"
                >
                    <Save size={20} /> 保存
                </button>
            </div>
        </div>

        {/* Thumbnails Row */}
        <div className="flex gap-4 overflow-x-auto pb-2 min-h-[160px]">
            {items.length === 0 && (
                 <div className="flex items-center justify-center w-full text-gray-500">
                     暂无日记
                 </div>
            )}
            {items.map((item, idx) => (
                <div 
                    key={idx} 
                    onClick={() => handleSelect(item)}
                    className={`
                        w-24 h-32 md:w-32 md:h-40 border-2 border-black shrink-0 hover:scale-105 transition-transform cursor-pointer flex flex-col items-center justify-center p-2 gap-2
                        ${currentFilename === item ? 'bg-gray-200' : 'bg-white'}
                    `}
                >
                    <FileText size={32} />
                    <span className="text-xs text-center break-all overflow-hidden line-clamp-3">{item}</span>
                </div>
            ))}
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex gap-4 min-h-0">
            {/* Text Area */}
            <div className="flex-1 border-2 border-black bg-white p-6 relative overflow-hidden flex flex-col">
                <input 
                    type="text" 
                    value={currentFilename} 
                    onChange={(e) => setCurrentFilename(e.target.value)}
                    placeholder="文件名 (例如: my_diary.md)"
                    className="w-full border-b-2 border-gray-200 mb-4 pb-2 text-xl font-bold outline-none"
                />
                {loading ? (
                    <div className="flex-1 flex items-center justify-center">Loading...</div>
                ) : (
                    <textarea 
                        className="flex-1 w-full h-full resize-none outline-none text-xl leading-loose font-handwriting"
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        placeholder="在这里写下你的日记..."
                    />
                )}
            </div>
            
            {/* Custom Scrollbar Pill (Visual only for now, could be hooked up) */}
            <div className="w-12 border-2 border-black bg-white rounded-full flex flex-col items-center justify-between py-2">
                <button className="hover:bg-gray-100 rounded p-1">
                    <ChevronUp />
                </button>
                <div className="flex-1 w-full flex justify-center">
                    <div className="w-1.5 h-1/3 bg-black rounded-full mt-2"></div>
                </div>
                <button className="hover:bg-gray-100 rounded p-1">
                    <ChevronDown />
                </button>
            </div>
        </div>

        {/* Bottom Input Bar */}
        <InputBar />
    </div>
  );
}
