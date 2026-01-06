import React, { useState, useEffect, useMemo } from 'react';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Clock, CalendarDays, Activity } from 'lucide-react';

export default function DiaryAnalytics({ diaries, onBack }) {
  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year', 'all'
  const [selectedMood, setSelectedMood] = useState(null);

  // 从文件名提取日期
  const extractDateFromFilename = (filename) => {
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    return dateMatch ? new Date(dateMatch[1]) : null;
  };

  // 过滤指定时间范围内的日记
  const filteredDiaries = useMemo(() => {
    const now = new Date();
    let startDate = new Date();

    switch (timeRange) {
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate = new Date('2000-01-01');
    }

    return diaries.filter(diary => {
      const diaryDate = extractDateFromFilename(diary.filename);
      return diaryDate && diaryDate >= startDate;
    });
  }, [diaries, timeRange]);

  // 统计数据
  const stats = useMemo(() => {
    const totalDiaries = filteredDiaries.length;
    const totalWords = filteredDiaries.reduce((sum) => sum + 150, 0); // 估算平均150字/篇
    
    // 每天写作频率
    const writingDays = new Set();
    filteredDiaries.forEach(diary => {
      const dateMatch = diary.filename.match(/(\d{4}-\d{2}-\d{2})/);
      if (dateMatch) writingDays.add(dateMatch[1]);
    });

    // 心情分布
    const moodDistribution = {};
    const moods = ['开心', '平静', '伤心', '生气', '疲惫', '兴奋'];
    moods.forEach(mood => {
      moodDistribution[mood] = filteredDiaries.filter(d => d.filename.includes(`[${mood}]`)).length;
    });

    // 天气分布
    const weatherDistribution = {};
    const weathers = ['晴天', '多云', '雨天', '雪天', '风天'];
    weathers.forEach(weather => {
      weatherDistribution[weather] = filteredDiaries.filter(d => d.filename.includes(`[${weather}]`)).length;
    });

    // 热门词汇（从文件名中提取标签）
    const wordFreq = {};
    filteredDiaries.forEach(diary => {
      const tagMatches = diary.filename.match(/#(\w+)/g);
      if (tagMatches) {
        tagMatches.forEach(tag => {
          const word = tag.slice(1);
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        });
      }
    });

    const topWords = Object.entries(wordFreq)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    return {
      totalDiaries,
      totalWords,
      writingDays: writingDays.size,
      moodDistribution,
      weatherDistribution,
      topWords,
      avgWordsPerDay: writingDays.size > 0 ? Math.round(totalWords / writingDays.size) : 0,
    };
  }, [filteredDiaries]);

  // 获取最常见的心情
  const topMoods = Object.entries(stats.moodDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 获取最常见的天气
  const topWeathers = Object.entries(stats.weatherDistribution)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  // 绘制简单柱状图
  const SimpleBarChart = ({ data, label }) => {
    const maxValue = Math.max(...Object.values(data), 1);
    return (
      <div className="space-y-2">
        {Object.entries(data)
          .filter(([, value]) => value > 0)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([key, value]) => (
            <div key={key} className="flex items-center gap-2">
              <div className="w-16 text-sm font-bold">{key}</div>
              <div className="flex-1 bg-gray-200 h-6 rounded overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                  style={{ width: `${(value / maxValue) * 100}%` }}
                />
              </div>
              <div className="w-8 text-right font-bold">{value}</div>
            </div>
          ))}
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">📊 日记分析</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
          >
            返回
          </button>
        )}
      </div>

      {/* 时间范围选择 */}
      <div className="flex gap-2 flex-wrap">
        {['week', 'month', 'year', 'all'].map(range => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 border-2 font-bold rounded transition ${
              timeRange === range
                ? 'border-black bg-yellow-200'
                : 'border-gray-300 bg-white hover:border-black'
            }`}
          >
            {range === 'week' && '近7天'}
            {range === 'month' && '近30天'}
            {range === 'year' && '近1年'}
            {range === 'all' && '全部时间'}
          </button>
        ))}
      </div>

      {/* 关键统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="border-2 border-black bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 size={20} />
            <span className="text-sm font-bold text-gray-600">总日记数</span>
          </div>
          <div className="text-3xl font-bold text-blue-600">{stats.totalDiaries}</div>
        </div>

        <div className="border-2 border-black bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <CalendarDays size={20} />
            <span className="text-sm font-bold text-gray-600">写作天数</span>
          </div>
          <div className="text-3xl font-bold text-green-600">{stats.writingDays}</div>
        </div>

        <div className="border-2 border-black bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp size={20} />
            <span className="text-sm font-bold text-gray-600">日均字数</span>
          </div>
          <div className="text-3xl font-bold text-purple-600">{stats.avgWordsPerDay}</div>
        </div>

        <div className="border-2 border-black bg-pink-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={20} />
            <span className="text-sm font-bold text-gray-600">总字数</span>
          </div>
          <div className="text-3xl font-bold text-pink-600">{stats.totalWords}</div>
        </div>
      </div>

      {/* 分析内容区域 */}
      <div className="flex-1 overflow-y-auto space-y-6">
        {/* 心情分布 */}
        <div className="border-2 border-black bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">😊</span> 心情分布
          </h2>
          <SimpleBarChart data={stats.moodDistribution} />
          {topMoods.length > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
              <p className="font-bold text-sm">
                💡 你最常见的心情：<span className="text-lg">{topMoods[0][0]}</span>
                {topMoods[0][1]} 次
              </p>
            </div>
          )}
        </div>

        {/* 天气分布 */}
        <div className="border-2 border-black bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">☀️</span> 天气分布
          </h2>
          <SimpleBarChart data={stats.weatherDistribution} />
          {topWeathers.length > 0 && (
            <div className="mt-4 p-3 bg-blue-50 border-2 border-blue-200 rounded-lg">
              <p className="font-bold text-sm">
                🌤️ 最常见的天气：<span className="text-lg">{topWeathers[0][0]}</span>
                {topWeathers[0][1]} 次
              </p>
            </div>
          )}
        </div>

        {/* 热门标签/词汇云 */}
        <div className="border-2 border-black bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <span className="text-2xl">🏷️</span> 热门标签
          </h2>
          {stats.topWords.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {stats.topWords.map(([word, freq], idx) => {
                const sizes = ['text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];
                const colors = [
                  'bg-red-100 text-red-700 border-red-300',
                  'bg-orange-100 text-orange-700 border-orange-300',
                  'bg-yellow-100 text-yellow-700 border-yellow-300',
                  'bg-green-100 text-green-700 border-green-300',
                  'bg-blue-100 text-blue-700 border-blue-300',
                ];
                return (
                  <div
                    key={word}
                    className={`px-4 py-2 border-2 rounded-full font-bold ${sizes[Math.min(idx, 4)]} ${
                      colors[idx % colors.length]
                    }`}
                  >
                    #{word} ({freq})
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-600">还没有标签数据</p>
          )}
        </div>

        {/* 写作趋势提示 */}
        <div className="border-2 border-black bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">✨ 写作观察</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold">📈</span>
              <span>
                在过去的 <strong>{timeRange === 'week' ? '7天' : timeRange === 'month' ? '30天' : timeRange === 'year' ? '1年' : '全部时间'}</strong>，你一共写了 <strong>{stats.totalDiaries}</strong> 篇日记
              </span>
            </li>
            {stats.writingDays > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold">📅</span>
                <span>
                  平均每 <strong>{Math.round(stats.writingDays / stats.totalDiaries * 10) / 10}</strong> 篇日记记录一次生活
                </span>
              </li>
            )}
            {topMoods.length > 0 && (
              <li className="flex items-start gap-2">
                <span className="font-bold">😊</span>
                <span>
                  你的情绪以 <strong>{topMoods[0][0]}</strong> 为主，这反映了你当前的心态状态
                </span>
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
