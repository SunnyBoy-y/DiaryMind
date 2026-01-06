import React, { useState, useEffect, useCallback } from 'react';
import { Search, X, Filter, Calendar, Hash, Cloud, Heart, ChevronDown } from 'lucide-react';

export default function DiarySearch({ diaries, onSearch, onBack }) {
  // 搜索和过滤状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedMood, setSelectedMood] = useState(null);
  const [selectedWeather, setSelectedWeather] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [expandFilters, setExpandFilters] = useState(false);
  const [searchResults, setSearchResults] = useState(diaries);

  // 心情选项
  const moodOptions = [
    { label: '开心', color: '#FFD700', emoji: '😊' },
    { label: '平静', color: '#87CEEB', emoji: '😐' },
    { label: '伤心', color: '#87CEEB', emoji: '😢' },
    { label: '生气', color: '#FF6B6B', emoji: '😠' },
    { label: '疲惫', color: '#9370DB', emoji: '😴' },
    { label: '兴奋', color: '#FF69B4', emoji: '🤩' },
  ];

  // 天气选项
  const weatherOptions = [
    { label: '晴天', emoji: '☀️' },
    { label: '多云', emoji: '☁️' },
    { label: '雨天', emoji: '🌧️' },
    { label: '雪天', emoji: '❄️' },
    { label: '风天', emoji: '💨' },
  ];

  // 提取所有标签（从日记中解析）
  const extractTags = useCallback(() => {
    const tagsSet = new Set();
    diaries.forEach(diary => {
      const tagMatches = diary.filename.match(/#(\w+)/g);
      if (tagMatches) {
        tagMatches.forEach(tag => tagsSet.add(tag.slice(1)));
      }
    });
    return Array.from(tagsSet);
  }, [diaries]);

  const availableTags = extractTags();

  // 执行搜索和过滤
  useEffect(() => {
    let results = diaries.filter(diary => {
      // 关键词搜索
      if (searchKeyword && !diary.filename.toLowerCase().includes(searchKeyword.toLowerCase())) {
        return false;
      }

      // 心情过滤
      if (selectedMood) {
        const moodRegex = new RegExp(`\\[${selectedMood}\\]`, 'i');
        if (!moodRegex.test(diary.filename)) return false;
      }

      // 天气过滤
      if (selectedWeather) {
        const weatherRegex = new RegExp(`\\[${selectedWeather}\\]`, 'i');
        if (!weatherRegex.test(diary.filename)) return false;
      }

      // 标签过滤
      if (selectedTags.length > 0) {
        const hasTags = selectedTags.some(tag => diary.filename.includes(`#${tag}`));
        if (!hasTags) return false;
      }

      // 日期范围过滤
      if (dateRange.start || dateRange.end) {
        const diaryDate = extractDateFromFilename(diary.filename);
        if (dateRange.start && diaryDate < dateRange.start) return false;
        if (dateRange.end && diaryDate > dateRange.end) return false;
      }

      return true;
    });

    setSearchResults(results);
    if (onSearch) {
      onSearch(results);
    }
  }, [searchKeyword, selectedMood, selectedWeather, selectedTags, dateRange, diaries, onSearch]);

  // 从文件名提取日期
  const extractDateFromFilename = (filename) => {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? dateMatch[1] : '9999-12-31';
  };

  // 清除所有过滤
  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedMood(null);
    setSelectedWeather(null);
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
  };

  // 切换标签选择
  const toggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const activeFiltersCount = [
    searchKeyword ? 1 : 0,
    selectedMood ? 1 : 0,
    selectedWeather ? 1 : 0,
    selectedTags.length,
    (dateRange.start || dateRange.end) ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">🔍 日记搜索</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
          >
            返回
          </button>
        )}
      </div>

      {/* 搜索框 */}
      <div className="relative">
        <div className="flex gap-2 items-center border-2 border-black bg-white px-4 py-3 rounded-lg shadow-md hover:shadow-lg transition">
          <Search size={24} className="text-gray-600" />
          <input
            type="text"
            placeholder="输入关键词搜索日记..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="flex-1 outline-none text-lg"
          />
          {searchKeyword && (
            <button
              onClick={() => setSearchKeyword('')}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X size={20} />
            </button>
          )}
        </div>
      </div>

      {/* 高级过滤按钮 */}
      <div className="flex gap-2">
        <button
          onClick={() => setExpandFilters(!expandFilters)}
          className="flex items-center gap-2 px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold transition"
        >
          <Filter size={20} />
          高级过滤 {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          <ChevronDown size={18} style={{ transform: expandFilters ? 'rotate(180deg)' : '' }} className="transition" />
        </button>

        {activeFiltersCount > 0 && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 border-2 border-red-500 bg-white text-red-500 hover:bg-red-50 font-bold transition"
          >
            清除过滤
          </button>
        )}
      </div>

      {/* 展开的过滤器 */}
      {expandFilters && (
        <div className="border-2 border-black bg-white p-6 rounded-lg space-y-6 shadow-md">
          {/* 心情过滤 */}
          <div>
            <label className="block text-lg font-bold mb-3 flex items-center gap-2">
              <Heart size={20} /> 心情筛选
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {moodOptions.map(mood => (
                <button
                  key={mood.label}
                  onClick={() => setSelectedMood(selectedMood === mood.label ? null : mood.label)}
                  className={`p-3 border-2 rounded-lg font-bold transition ${
                    selectedMood === mood.label
                      ? 'border-black bg-yellow-100 scale-110'
                      : 'border-gray-300 hover:border-black'
                  }`}
                  title={mood.label}
                >
                  <div className="text-2xl mb-1">{mood.emoji}</div>
                  <div className="text-xs">{mood.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 天气过滤 */}
          <div>
            <label className="block text-lg font-bold mb-3 flex items-center gap-2">
              <Cloud size={20} /> 天气筛选
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {weatherOptions.map(weather => (
                <button
                  key={weather.label}
                  onClick={() => setSelectedWeather(selectedWeather === weather.label ? null : weather.label)}
                  className={`p-3 border-2 rounded-lg font-bold transition ${
                    selectedWeather === weather.label
                      ? 'border-black bg-blue-100 scale-110'
                      : 'border-gray-300 hover:border-black'
                  }`}
                  title={weather.label}
                >
                  <div className="text-2xl mb-1">{weather.emoji}</div>
                  <div className="text-xs">{weather.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* 标签过滤 */}
          {availableTags.length > 0 && (
            <div>
              <label className="block text-lg font-bold mb-3 flex items-center gap-2">
                <Hash size={20} /> 标签筛选
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-1 border-2 rounded-full font-bold transition ${
                      selectedTags.includes(tag)
                        ? 'border-black bg-purple-100'
                        : 'border-gray-300 hover:border-black bg-white'
                    }`}
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 日期范围过滤 */}
          <div>
            <label className="block text-lg font-bold mb-3 flex items-center gap-2">
              <Calendar size={20} /> 日期范围
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-bold text-gray-600">开始日期</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="w-full border-2 border-black p-2 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="text-sm font-bold text-gray-600">结束日期</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="w-full border-2 border-black p-2 rounded-lg font-bold"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 搜索结果 */}
      <div className="flex-1 overflow-y-auto border-2 border-black rounded-lg bg-white p-4">
        <div className="mb-4">
          <h2 className="text-2xl font-bold">
            搜索结果 <span className="text-gray-600">({searchResults.length})</span>
          </h2>
        </div>

        {searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <div className="text-6xl mb-4">🔍</div>
            <p className="text-xl font-bold text-gray-600">未找到匹配的日记</p>
            <p className="text-sm text-gray-500 mt-2">试试调整搜索条件或过滤器</p>
          </div>
        ) : (
          <div className="space-y-3">
            {searchResults.map((diary, idx) => (
              <div
                key={idx}
                className="p-4 border-2 border-gray-300 hover:border-black rounded-lg bg-gray-50 hover:bg-yellow-50 transition cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="font-bold text-lg group-hover:text-blue-600 transition">
                      {diary.filename}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      创建时间：{extractDateFromFilename(diary.filename)}
                    </p>
                  </div>
                  <button className="px-3 py-1 border-2 border-black bg-white hover:bg-gray-100 font-bold rounded transition text-sm">
                    查看
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-blue-50 border-2 border-black p-4 rounded-lg">
        <div className="text-center">
          <div className="text-3xl font-bold text-blue-600">{diaries.length}</div>
          <div className="text-sm font-bold text-gray-600">总日记数</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-green-600">{searchResults.length}</div>
          <div className="text-sm font-bold text-gray-600">搜索结果</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-purple-600">{availableTags.length}</div>
          <div className="text-sm font-bold text-gray-600">标签总数</div>
        </div>
        <div className="text-center">
          <div className="text-3xl font-bold text-pink-600">{activeFiltersCount}</div>
          <div className="text-sm font-bold text-gray-600">活跃过滤</div>
        </div>
      </div>
    </div>
  );
}
