import React, { useState, useEffect } from 'react';
import InteractiveCard from './InteractiveCard';
import { Calendar, Clock, BookOpen, Search, Filter, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_DIARY_BASE || `${import.meta.env.VITE_API_BASE || "/api"}/diary`;

export default function TimeMachine() {
  const [timelineData, setTimelineData] = useState([]);
  const [stats, setStats] = useState({
    total_diaries: 0,
    recent_diaries: 0,
    average_length: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    format: 'all',
    dateRange: 'all'
  });
  const [expandedItems, setExpandedItems] = useState(new Set());

  // 获取时光机数据
  const fetchTimeMachineData = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE}/time-machine`);
      if (response.ok) {
        const data = await response.json();
        setTimelineData(data.timeline);
        setStats(data.stats);
      } else {
        console.error('Failed to fetch time machine data');
      }
    } catch (error) {
      console.error('Error fetching time machine data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    fetchTimeMachineData();
  }, []);

  // 切换展开/折叠状态
  const toggleExpand = (filename) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(filename)) {
      newExpanded.delete(filename);
    } else {
      newExpanded.add(filename);
    }
    setExpandedItems(newExpanded);
  };

  // 过滤日记数据
  const filteredDiaries = timelineData.filter(diary => {
    // 搜索过滤
    const matchesSearch = diary.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         diary.preview.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 格式过滤
    const matchesFormat = filterOptions.format === 'all' || diary.format === filterOptions.format;
    
    // 日期范围过滤
    const now = new Date();
    const diaryDate = new Date(diary.date);
    let matchesDateRange = true;
    
    if (filterOptions.dateRange === 'week') {
      const oneWeekAgo = new Date(now.setDate(now.getDate() - 7));
      matchesDateRange = diaryDate >= oneWeekAgo;
    } else if (filterOptions.dateRange === 'month') {
      const oneMonthAgo = new Date(now.setMonth(now.getMonth() - 1));
      matchesDateRange = diaryDate >= oneMonthAgo;
    } else if (filterOptions.dateRange === 'year') {
      const oneYearAgo = new Date(now.setFullYear(now.getFullYear() - 1));
      matchesDateRange = diaryDate >= oneYearAgo;
    }
    
    return matchesSearch && matchesFormat && matchesDateRange;
  });

  // 格式化日期
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 标题和统计信息 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-4xl font-bold font-handwriting">日记时光机</h1>
        
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full md:w-auto">
          <InteractiveCard className="!p-4 !bg-blue-50">
            <div className="flex items-center gap-2">
              <BookOpen size={24} className="text-blue-600" />
              <div>
                <div className="text-sm text-gray-600">总日记数</div>
                <div className="text-2xl font-bold">{stats.total_diaries}</div>
              </div>
            </div>
          </InteractiveCard>
          
          <InteractiveCard className="!p-4 !bg-green-50">
            <div className="flex items-center gap-2">
              <Calendar size={24} className="text-green-600" />
              <div>
                <div className="text-sm text-gray-600">最近7天</div>
                <div className="text-2xl font-bold">{stats.recent_diaries}</div>
              </div>
            </div>
          </InteractiveCard>
          
          <InteractiveCard className="!p-4 !bg-yellow-50">
            <div className="flex items-center gap-2">
              <Clock size={24} className="text-yellow-600" />
              <div>
                <div className="text-sm text-gray-600">平均字数</div>
                <div className="text-2xl font-bold">{stats.average_length}</div>
              </div>
            </div>
          </InteractiveCard>
        </div>
      </div>

      {/* 搜索和过滤 */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="搜索日记标题或内容..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border-2 border-black rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        
        <div className="flex gap-2">
          <select
            value={filterOptions.format}
            onChange={(e) => setFilterOptions(prev => ({ ...prev, format: e.target.value }))}
            className="border-2 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有格式</option>
            <option value="md">Markdown</option>
            <option value="docx">DOCX</option>
            <option value="txt">TXT</option>
          </select>
          
          <select
            value={filterOptions.dateRange}
            onChange={(e) => setFilterOptions(prev => ({ ...prev, dateRange: e.target.value }))}
            className="border-2 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">所有时间</option>
            <option value="week">最近一周</option>
            <option value="month">最近一月</option>
            <option value="year">最近一年</option>
          </select>
        </div>
      </div>

      {/* 时间线内容 */}
      <InteractiveCard className="flex flex-col !p-6 h-full">
        <div className="flex items-center gap-2 mb-6">
          <Filter size={24} className="text-gray-600" />
          <h2 className="text-2xl font-bold">日记时间线</h2>
          <span className="ml-2 text-sm text-gray-500">共 {filteredDiaries.length} 篇日记</span>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p>加载中...</p>
            </div>
          ) : filteredDiaries.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BookOpen size={48} className="mx-auto mb-4 opacity-50" />
              <p>暂无日记记录</p>
              <p className="text-sm">开始写第一篇日记吧！</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDiaries.map((diary) => (
                <div key={diary.filename} className="relative border-l-4 border-gray-300 pl-6 pb-6">
                  {/* 时间点 */}
                  <div className="absolute -left-[11px] top-0 w-5 h-5 bg-blue-500 rounded-full border-2 border-white"></div>
                  
                  {/* 日期标签 */}
                  <div className="text-sm text-gray-500 mb-2">
                    {diary.date || formatDate(diary.last_modified)}
                  </div>
                  
                  {/* 标题和基本信息 */}
                  <div 
                    className="cursor-pointer flex items-center justify-between group"
                    onClick={() => toggleExpand(diary.filename)}
                  >
                    <div className="flex-1">
                      <h3 className="text-xl font-bold font-handwriting group-hover:text-blue-600 transition-colors">
                        {diary.title}
                      </h3>
                      <div className="text-sm text-gray-600 mt-1">
                        <span className="mr-3">{diary.word_count} 字</span>
                        <span className="mr-3">{diary.format.toUpperCase()}</span>
                        <span>{formatDate(diary.last_modified)}</span>
                      </div>
                    </div>
                    
                    {/* 展开/折叠按钮 */}
                    {expandedItems.has(diary.filename) ? (
                      <ChevronUp size={20} className="ml-2 text-gray-400" />
                    ) : (
                      <ChevronDown size={20} className="ml-2 text-gray-400" />
                    )}
                  </div>
                  
                  {/* 预览内容 */}
                  {expandedItems.has(diary.filename) && (
                    <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                      <p className="font-handwriting text-gray-700 whitespace-pre-wrap">
                        {diary.preview}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </InteractiveCard>
    </div>
  );
}
