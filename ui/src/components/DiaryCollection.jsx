import React, { useState, useEffect, useRef } from 'react';
import InteractiveCard from './InteractiveCard';
import InputBar from './InputBar';
import { ChevronUp, ChevronDown, Save, FileText, Edit, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_BASE = "http://localhost:8082/api/diary";

export default function DiaryCollection({ onBack, onCreateNew }) {
  const [items, setItems] = useState([]);
  const [content, setContent] = useState("");
  const [currentFilename, setCurrentFilename] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const contentRef = useRef(null);
  const [scrollRatio, setScrollRatio] = useState(0);

  useEffect(() => {
      fetchList();
  }, []);
  
  // Tab Navigation for Headers
  useEffect(() => {
      const handleKeyDown = (e) => {
          if (e.key === 'Tab' && !isEditing && contentRef.current) {
              e.preventDefault();
              const headers = Array.from(contentRef.current.querySelectorAll('h1, h2, h3, h4, h5, h6'));
              if (headers.length === 0) return;
              
              const currentScroll = contentRef.current.scrollTop;
              // Find first header significantly below current scroll
              let nextHeader = headers.find(h => h.offsetTop > currentScroll + 50);
              
              if (!nextHeader) {
                  // Cycle to top
                  nextHeader = headers[0];
              }
              
              if (nextHeader) {
                  nextHeader.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }
          }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, content]);

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
            setIsEditing(false); // Default to view mode
        })
        .catch(err => {
            console.error(err);
            setLoading(false);
        });
  };

  const handleCreateNew = () => {
      setContent("");
      setCurrentFilename("");
      setIsEditing(true);
  };

  const handleSave = () => {
      const filename = currentFilename || `diary_${new Date().toISOString().slice(0,10)}_${new Date().getTime()}.md`;
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
          setIsEditing(false);
      })
      .catch(err => {
          console.error(err);
          alert('Failed to save');
      });
  };

  // Scrollbar Logic
  const handleScroll = () => {
      if (contentRef.current) {
          const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
          if (scrollHeight <= clientHeight) {
              setScrollRatio(0);
          } else {
              setScrollRatio(scrollTop / (scrollHeight - clientHeight));
          }
      }
  };

  const scrollBy = (amount) => {
      if (contentRef.current) {
          contentRef.current.scrollBy({ top: amount, behavior: 'smooth' });
      }
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
            <h1 className="text-4xl font-bold">日记集</h1>
            <div className="flex gap-2">
                <button 
                    onClick={() => setIsEditing(!isEditing)}
                    className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold flex items-center gap-2"
                >
                    {isEditing ? <Eye size={20} /> : <Edit size={20} />}
                    {isEditing ? '预览' : '编辑'}
                </button>
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
            {/* Text Area / Markdown View */}
            <div className="flex-1 border-2 border-black bg-white p-6 relative flex flex-col">
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
                    <div 
                        className="flex-1 w-full h-full relative overflow-hidden"
                    >
                        {isEditing ? (
                            <textarea 
                                className="w-full h-full resize-none outline-none text-xl leading-loose font-handwriting overflow-y-auto no-scrollbar"
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="在这里写下你的日记..."
                                ref={contentRef}
                                onScroll={handleScroll}
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            />
                        ) : (
                            <div 
                                className="w-full h-full text-xl leading-loose font-handwriting overflow-y-auto no-scrollbar prose prose-lg max-w-none"
                                ref={contentRef}
                                onScroll={handleScroll}
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                onDoubleClick={() => setIsEditing(true)}
                            >
                                <ReactMarkdown>{content}</ReactMarkdown>
                            </div>
                        )}
                        <style>{`
                            .no-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                    </div>
                )}
            </div>
            
            {/* Custom Scrollbar Pill */}
            <div className="w-12 border-2 border-black bg-white rounded-full flex flex-col items-center justify-between py-2">
                <button 
                    className="hover:bg-gray-100 rounded p-1"
                    onClick={() => scrollBy(-100)}
                >
                    <ChevronUp />
                </button>
                <div className="flex-1 w-full flex justify-center relative bg-gray-100 rounded-full mx-auto w-1.5 my-2">
                    {/* Track */}
                    <div 
                        className="absolute w-3 h-8 bg-black rounded-full left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                        style={{ 
                            top: `${scrollRatio * 100}%`,
                            transform: `translate(-50%, -${scrollRatio * 100}%)`
                        }}
                        // Dragging logic could be added here, but arrows + scroll are "usable"
                    ></div>
                </div>
                <button 
                    className="hover:bg-gray-100 rounded p-1"
                    onClick={() => scrollBy(100)}
                >
                    <ChevronDown />
                </button>
            </div>
        </div>

        {/* Bottom Input Bar */}
        <InputBar />
    </div>
  );
}
