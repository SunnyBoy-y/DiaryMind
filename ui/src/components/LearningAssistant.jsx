import React, { useState } from 'react';
import InteractiveCard from './InteractiveCard';
import { BookOpen, Brain, Calendar, Clock, CheckCircle } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_DIARY_BASE || `${import.meta.env.VITE_API_BASE || "/api"}/diary`;

export default function LearningAssistant({ onApply }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('knowledge'); // knowledge, plan, review
  const [subject, setSubject] = useState('general');
  const [result, setResult] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const subjects = [
    { value: 'general', label: '通用' },
    { value: 'math', label: '数学' },
    { value: 'physics', label: '物理' },
    { value: 'chemistry', label: '化学' },
    { value: 'biology', label: '生物' },
    { value: 'computer', label: '计算机' },
    { value: 'history', label: '历史' },
    { value: 'geography', label: '地理' },
    { value: 'english', label: '英语' },
    { value: 'chinese', label: '语文' }
  ];

  const typeOptions = [
    { value: 'knowledge', label: '知识点整理', icon: <BookOpen size={20} />, description: '将内容整理为结构化知识点' },
    { value: 'plan', label: '学习计划', icon: <Calendar size={20} />, description: '生成详细的学习时间表' },
    { value: 'review', label: '复习提醒', icon: <Clock size={20} />, description: '按照遗忘曲线制定复习计划' }
  ];

  const handleGenerate = async () => {
    if (!content.trim()) {
      alert('请先输入学习内容~');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch(`${API_BASE}/learn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          type: type,
          subject: subject
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResult(data.result);
      } else {
        alert('生成失败，请重试...');
      }
    } catch (error) {
      console.error('Error generating learning content:', error);
      alert('生成出错啦');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <InteractiveCard className="flex flex-col !p-6">
      <div className="flex items-center gap-2 mb-6">
        <Brain size={24} className="text-purple-600" />
        <h2 className="text-2xl font-bold">AI学习助手</h2>
      </div>

      {/* 功能类型选择 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">选择功能</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {typeOptions.map(option => (
            <button
              key={option.value}
              onClick={() => setType(option.value)}
              className={`p-3 border-2 rounded-lg flex flex-col items-center gap-2 transition-all ${type === option.value ? 'border-purple-600 bg-purple-50' : 'border-gray-300 hover:border-purple-400'}`}
            >
              {option.icon}
              <span className="font-bold">{option.label}</span>
              <span className="text-xs text-gray-600 text-center">{option.description}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 学科选择 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">选择学科</h3>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full border-2 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {subjects.map(subj => (
            <option key={subj.value} value={subj.value}>
              {subj.label}
            </option>
          ))}
        </select>
      </div>

      {/* 内容输入 */}
      <div className="mb-4">
        <h3 className="text-lg font-bold mb-2">输入学习内容</h3>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="请输入要处理的学习内容..."
          className="w-full h-40 border-2 border-black rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
        />
      </div>

      {/* 生成按钮 */}
      <button
        onClick={handleGenerate}
        disabled={isGenerating}
        className="px-6 py-2 bg-purple-600 text-white font-bold rounded hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mb-6"
      >
        {isGenerating ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
            生成中...
          </>
        ) : (
          <>
            <Brain size={20} />
            生成
          </>
        )}
      </button>

      {/* 结果展示 */}
      {result && (
        <div className="flex-1 border-2 border-purple-200 rounded-lg p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <CheckCircle size={20} className="text-green-500" />
              生成结果
            </h3>
            <button
              onClick={() => onApply(result)}
              className="px-4 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
            >
              <CheckCircle size={16} />
              应用到日记
            </button>
          </div>
          <div className="prose max-w-none font-handwriting text-lg whitespace-pre-wrap">
            <div dangerouslySetInnerHTML={{ __html: result.replace(/\n/g, '<br>') }} />
          </div>
        </div>
      )}
    </InteractiveCard>
  );
}