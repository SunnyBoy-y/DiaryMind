import React, { useEffect, useState } from 'react';
import DiaryExportShare from './DiaryExportShare';
import InteractiveCard from './InteractiveCard';

const API_BASE = import.meta.env.VITE_API_DIARY_BASE || `${import.meta.env.VITE_API_BASE || "/api"}/diary`;

export default function ExportView({ onBack }) {
  const [diaries, setDiaries] = useState([]);
  const [selectedFilename, setSelectedFilename] = useState(null);
  const [selectedDiary, setSelectedDiary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/list`, { credentials: 'include' });
        if (!res.ok) {
          setError('无法获取日记列表，可能未登录');
          setDiaries([]);
          setLoading(false);
          return;
        }
        const files = await res.json();
        setDiaries(files);
        setLoading(false);
      } catch (e) {
        setError('获取日记列表失败');
        setLoading(false);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      if (!selectedFilename) {
        setSelectedDiary(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/content/${encodeURIComponent(selectedFilename)}`, { credentials: 'include' });
        if (!res.ok) {
          setSelectedDiary(null);
          return;
        }
        const data = await res.json();
        setSelectedDiary({
          filename: selectedFilename,
          content: data?.content || '',
          format: data?.format || 'md',
        });
      } catch {
        setSelectedDiary(null);
      }
    };
    loadContent();
  }, [selectedFilename]);

  return (
    <div className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">导出与分享</h1>
        <button
          onClick={onBack}
          className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
        >
          返回
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <InteractiveCard className="!p-4">
          <h2 className="text-xl font-bold mb-3">选择日记</h2>
          {loading ? (
            <div className="text-gray-500">加载中...</div>
          ) : error ? (
            <div className="text-red-600 font-bold">{error}</div>
          ) : diaries.length === 0 ? (
            <div className="text-gray-500">暂无日记</div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {diaries.map((name) => (
                <button
                  key={name}
                  onClick={() => setSelectedFilename(name)}
                  className={`w-full text-left px-3 py-2 border-2 border-black rounded hover:bg-gray-100 transition-colors ${
                    selectedFilename === name ? 'bg-black text-white' : 'bg-white'
                  }`}
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </InteractiveCard>

        <div className="md:col-span-2">
          <DiaryExportShare
            diaries={diaries.map((d) => ({ filename: d }))}
            selectedDiary={selectedDiary}
            onBack={onBack}
          />
        </div>
      </div>
    </div>
  );
}
