import React, { useState, useEffect, useRef } from 'react';
import WeatherSelector from './WeatherSelector';
import InputBar from './InputBar';
import InteractiveCard from './InteractiveCard';
import LearningAssistant from './LearningAssistant';
import { DiaryCanvas, DraggableCard } from './DiaryCanvas';
import { Save, RefreshCw, Lightbulb, ListTodo, BookOpen, Brain, Grid3X3, LayoutGrid } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const API_BASE = import.meta.env.VITE_API_DIARY_BASE || `${import.meta.env.VITE_API_BASE || "/api"}/diary`;

export default function FullScreenDiary() {
  const [weather, setWeather] = useState('sunny');
  const [content, setContent] = useState('');
  const [plan, setPlan] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [structuredContent, setStructuredContent] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [associations, setAssociations] = useState('');
  const [isGeneratingStructure, setIsGeneratingStructure] = useState(false);
  const [isExtractingKeyPoints, setIsExtractingKeyPoints] = useState(false);
  const [isGeneratingAssociations, setIsGeneratingAssociations] = useState(false);
  const [isGeneratingIntro, setIsGeneratingIntro] = useState(false);
  const [intro, setIntro] = useState('');
  const [useIntro, setUseIntro] = useState(false);
  const [templateType, setTemplateType] = useState('auto');
  const [lastSaveTime, setLastSaveTime] = useState(null);
  const [showLearningAssistant, setShowLearningAssistant] = useState(false);
  const [isCanvasMode, setIsCanvasMode] = useState(true); // 画布模式切换
  const [cards, setCards] = useState([
    { id: 'content', type: 'content', x: 0, y: 0 },
    { id: 'plan', type: 'plan', x: 400, y: 0 },
    { id: 'structure', type: 'structure', x: 0, y: 500 },
    { id: 'associations', type: 'associations', x: 400, y: 500 },
    { id: 'keyPoints', type: 'keyPoints', x: 800, y: 0 }
  ]);
  // 通知状态
  const [notifications, setNotifications] = useState([]);
  const notificationIdRef = useRef(0);
  
  // 显示通知的函数
  const showNotification = (message, type = 'info') => {
    const id = notificationIdRef.current++;
    setNotifications(prev => [...prev, { id, message, type }]);
    
    // 3秒后自动移除通知
    setTimeout(() => {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
    }, 3000);
  };
  const [isOrganizing, setIsOrganizing] = useState(false); // 自动整理状态
  
  // 使用ref存储自动保存计时器
  const autoSaveTimerRef = useRef(null);
  const contentRef = useRef(content);
  const planRef = useRef(plan);

  // 自动保存功能
  useEffect(() => {
    // 更新ref值
    contentRef.current = content;
    planRef.current = plan;
    
    // 清除之前的计时器
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    // 设置新的计时器，5秒后自动保存
    autoSaveTimerRef.current = setTimeout(() => {
      handleAutoSave();
    }, 5000);
    
    return () => {
      // 组件卸载时清除计时器
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [content, plan, intro, useIntro]);

  // 自动保存处理函数
  const handleAutoSave = async () => {
    // 如果内容为空，不自动保存
    if (!content.trim() && !plan.trim()) {
      return;
    }
    
    setIsAutoSaving(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const filename = `Diary_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      // 构建完整内容，包括可能的前言
      let diaryContent = `# ${dateStr} ${timeStr} [${weather}]\n\n`;
      
      // 如果使用前言，添加到内容中
      if (useIntro && intro.trim()) {
        diaryContent += `${intro.trim()}\n\n`;
      }
      
      diaryContent += `## 发生了啥\n${contentRef.current}\n\n## 加点计划\n${planRef.current}`;

      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          content: diaryContent,
          format: 'md'
        })
      });

      if (response.ok) {
        setLastSaveTime(new Date());
      }
    } catch (error) {
      console.error("Auto save failed:", error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // 手动保存功能
  const handleSave = async () => {
    if (!content.trim() && !plan.trim()) {
        showNotification("写点什么再保存吧~", "warning");
        return;
      }

    setIsSaving(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString();
      const timeStr = now.toLocaleTimeString();
      const filename = `Diary_${now.getFullYear()}-${String(now.getMonth()+1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
      
      // 构建完整内容，包括可能的前言
      let diaryContent = `# ${dateStr} ${timeStr} [${weather}]\n\n`;
      
      // 如果使用前言，添加到内容中
      if (useIntro && intro.trim()) {
        diaryContent += `${intro.trim()}\n\n`;
      }
      
      diaryContent += `## 发生了啥\n${content}\n\n## 加点计划\n${plan}`;

      const response = await fetch(`${API_BASE}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          content: diaryContent,
          format: 'md'
        })
      });

      if (response.ok) {
        showNotification("保存成功！", "success");
        setLastSaveTime(new Date());
      } else {
        showNotification("保存失败...", "error");
      }
    } catch (error) {
      console.error("Save failed:", error);
      showNotification("保存出错啦", "error");
    } finally {
      setIsSaving(false);
    }
  };

  // AI结构化处理功能
  const handleGenerateStructure = async () => {
    if (!content.trim()) {
        showNotification("请先输入日记内容再生成结构化建议~", "warning");
        return;
      }

    setIsGeneratingStructure(true);
    try {
      const response = await fetch(`${API_BASE}/structure`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content,
          template_type: templateType
        })
      });

      if (response.ok) {
        const data = await response.json();
        setStructuredContent(data.structured_content);
        showNotification("结构化建议生成成功！", "success");
      } else {
        showNotification("生成结构化建议失败...", "error");
      }
    } catch (error) {
      console.error("Generate structure failed:", error);
      showNotification("生成结构化建议出错啦", "error");
    } finally {
      setIsGeneratingStructure(false);
    }
  };

  // AI要点提取功能
  const handleExtractKeyPoints = async () => {
    if (!content.trim()) {
        showNotification("请先输入日记内容再提取要点~", "warning");
        return;
      }

    setIsExtractingKeyPoints(true);
    try {
      const response = await fetch(`${API_BASE}/extract-key-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content
        })
      });

      if (response.ok) {
        const data = await response.json();
        setKeyPoints(data.key_points);
        showNotification("要点提取成功！", "success");
      } else {
        showNotification("提取要点失败...", "error");
      }
    } catch (error) {
      console.error("Extract key points failed:", error);
      showNotification("提取要点出错啦", "error");
    } finally {
      setIsExtractingKeyPoints(false);
    }
  };

  // 应用结构化建议
  const handleApplyStructure = () => {
    if (structuredContent) {
      setContent(structuredContent);
    }
  };

  // AI智能联想功能
  const handleGenerateAssociations = async () => {
    if (!content.trim()) {
        showNotification("请先输入日记内容再生成联想建议~", "warning");
        return;
      }

    setIsGeneratingAssociations(true);
    try {
      // 这里简化处理，只使用当前内容，不包含历史内容
      // 在实际应用中，可以从历史日记中提取相关内容作为历史上下文
      const response = await fetch(`${API_BASE}/associate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_content: content,
          history_content: ""
        })
      });

      if (response.ok) {
        const data = await response.json();
        setAssociations(data.associations);
        showNotification("联想建议生成成功！", "success");
      } else {
        showNotification("生成联想建议失败...", "error");
      }
    } catch (error) {
      console.error("Generate associations failed:", error);
      showNotification("生成联想建议出错啦", "error");
    } finally {
      setIsGeneratingAssociations(false);
    }
  };

  // 应用联想建议到内容中
  const handleApplyAssociation = (association) => {
    setContent(prevContent => `${prevContent}\n\n${association}`);
  };

  // 应用学习助手结果到日记中
  const handleApplyLearningResult = (result) => {
    setContent(prevContent => `${prevContent}

## AI学习助手生成
${result}`);
    setShowLearningAssistant(false);
  };

  // 生成日记前言
  const handleGenerateIntro = async () => {
    setIsGeneratingIntro(true);
    try {
      const token = localStorage.getItem('token');
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      
      const response = await fetch('/api/auth/diary/generate-intro', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: 1, // 实际应用中应从用户状态获取
          date: dateStr,
          mood: weather, // 可以根据实际情况调整
          tags: ''
        })
      });

      if (response.ok) {
        const data = await response.json();
        setIntro(data.generated_intro);
        setUseIntro(true);
        showNotification("前言生成成功！", "success");
      } else {
        showNotification("生成前言失败...", "error");
      }
    } catch (error) {
      console.error("Generate intro failed:", error);
      showNotification("生成前言出错啦", "error");
    } finally {
      setIsGeneratingIntro(false);
    }
  };

  // 应用前言到日记内容
  const handleApplyIntro = () => {
    if (intro) {
      setContent(prevContent => `${intro}

${prevContent}`);
      setIntro('');
      setUseIntro(false);
    }
  };

  // 自动整理画布功能
  const handleOrganizeCanvas = async () => {
    setIsOrganizing(true);
    try {
      // 简单的网格布局算法
      const columns = 3;
      const cardWidth = 400;
      const cardHeight = 500;
      const gap = 100;
      
      const organizedCards = cards.map((card, index) => {
        const row = Math.floor(index / columns);
        const col = index % columns;
        
        return {
          ...card,
          x: col * (cardWidth + gap),
          y: row * (cardHeight + gap)
        };
      });
      
      // 添加动画效果，逐步更新卡片位置
      for (let i = 0; i < organizedCards.length; i++) {
        setCards(prev => {
          const newCards = [...prev];
          newCards[i] = organizedCards[i];
          return newCards;
        });
        // 等待50ms，创建平滑的动画效果
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    } catch (error) {
      console.error("Organize canvas failed:", error);
    } finally {
      setIsOrganizing(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 h-full relative">
      {/* 通知组件 */}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
        {notifications.map(notification => (
          <div 
            key={notification.id} 
            className={`px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 transition-all duration-300 ease-in-out transform translate-x-0 opacity-100 ${notification.type === 'success' ? 'bg-green-500 text-white' : notification.type === 'error' ? 'bg-red-500 text-white' : notification.type === 'warning' ? 'bg-yellow-500 text-white' : 'bg-blue-500 text-white'}`}
          >
            {notification.type === 'success' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
            {notification.type === 'error' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
            {notification.type === 'warning' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>}
            {notification.type === 'info' && <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>}
            <span>{notification.message}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl sm:text-4xl font-bold font-handwriting text-[var(--color-primary)]">我的这一天</h1>
        <div className="flex flex-wrap items-center gap-2">
            <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 btn btn-primary hover:bg-[var(--color-primary)] transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
                <Save size={18} />
                <span className="font-bold">保存</span>
            </button>
            <button 
                onClick={handleGenerateIntro}
                disabled={isGeneratingIntro}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 btn btn-info hover:bg-[var(--color-info)] transition-colors disabled:opacity-50 text-sm sm:text-base"
            >
                <Lightbulb size={18} />
                {isGeneratingIntro ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span className="font-bold">生成前言中...</span>
                  </>
                ) : (
                  <span className="font-bold">生成前言</span>
                )}
            </button>
            <button 
                onClick={() => setIsCanvasMode(!isCanvasMode)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 btn btn-secondary hover:bg-[var(--color-secondary)] transition-colors text-sm sm:text-base"
            >
                {isCanvasMode ? (
                  <>
                    <LayoutGrid size={18} />
                    <span className="font-bold">网格模式</span>
                  </>
                ) : (
                  <>
                    <Grid3X3 size={18} />
                    <span className="font-bold">画布模式</span>
                  </>
                )}
            </button>
            <button 
                onClick={() => setShowLearningAssistant(!showLearningAssistant)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 btn btn-warning hover:bg-[var(--color-warning)] transition-colors text-sm sm:text-base"
            >
                <Brain size={18} />
                <span className="font-bold">
                    {showLearningAssistant ? '关闭学习助手' : '打开学习助手'}
                </span>
            </button>
            {isAutoSaving && (
              <div className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm animate-pulse">
                <RefreshCw size={16} className="animate-spin" />
                <span>自动保存中...</span>
              </div>
            )}
            {lastSaveTime && !isAutoSaving && (
              <div className="flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                <span>上次保存: {lastSaveTime.toLocaleTimeString()}</span>
              </div>
            )}
            <WeatherSelector selected={weather} onSelect={setWeather} />
        </div>
      </div>

      {showLearningAssistant ? (
        <div className="h-full overflow-y-auto">
          <LearningAssistant onApply={handleApplyLearningResult} />
        </div>
      ) : isCanvasMode ? (
        // 画布模式
        <div className="h-full relative">
          <DiaryCanvas 
            controls={(
              <button 
                onClick={handleOrganizeCanvas}
                disabled={isOrganizing}
                className="px-3 py-1 bg-white border border-pink-500 text-pink-600 rounded shadow hover:bg-pink-50 transition-colors text-sm font-medium"
              >
                {isOrganizing ? '整理中...' : '自动整理'}
              </button>
            )}
          >
            {/* 生成可拖拽的卡片 */}
            {cards.map(card => {
              const cardConfig = {
                content: {
                    title: '发生了啥',
                    component: (
                      <InteractiveCard className="flex flex-col !p-6 w-96">
                        <h2 className="text-2xl font-bold mb-4">发生了啥</h2>
                        
                        {/* 前言显示和控制 */}
                        {intro.trim() && (
                          <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-lg font-bold text-blue-700">AI生成前言</h3>
                              <div className="flex gap-2">
                                <button 
                                  onClick={handleApplyIntro}
                                  className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                                >
                                  应用
                                </button>
                                <button 
                                  onClick={() => setUseIntro(!useIntro)}
                                  className="px-2 py-1 bg-white border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium"
                                >
                                  {useIntro ? '不使用' : '使用'}
                                </button>
                              </div>
                            </div>
                            <p className="text-blue-800 font-handwriting">{intro}</p>
                          </div>
                        )}
                        
                        <div className="flex-1 border-b-2 border-black border-dashed mb-4">
                          <textarea 
                            className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent overflow-y-auto whitespace-pre-wrap word-break-break-word"
                            placeholder="记录下今天的故事..."
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            style={{ maxHeight: '300px' }}
                          />
                        </div>
                        <p className="text-right text-sm text-gray-500 font-handwriting">哎呀，别墨迹啦</p>
                      </InteractiveCard>
                    )
                  },
                plan: {
                  title: '加点计划',
                  component: (
                    <InteractiveCard className="flex flex-col !p-6 w-96">
                      <h2 className="text-2xl font-bold mb-4">加点计划</h2>
                      <div className="flex-1">
                        <textarea 
                          className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent overflow-y-auto whitespace-pre-wrap word-break-break-word"
                          placeholder="明天打算做点啥？"
                          value={plan}
                          onChange={(e) => setPlan(e.target.value)}
                          style={{ maxHeight: '300px' }}
                        />
                      </div>
                    </InteractiveCard>
                  )
                },
                structure: {
                  title: 'AI结构化建议',
                  component: (
                    <InteractiveCard className="flex flex-col !p-6 w-96">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <Lightbulb size={24} className="text-[var(--color-warning)]" />
                          AI结构化建议
                        </h2>
                        <div className="flex items-center gap-2">
                          <select 
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value)}
                            className="border-2 border-[var(--color-border)] rounded px-2 py-1 text-sm bg-white"
                          >
                            <option value="auto">自动</option>
                            <option value="timeline">时间线</option>
                            <option value="problem-solution">问题-解决方案</option>
                            <option value="key-points">要点式</option>
                          </select>
                          <button 
                            onClick={handleGenerateStructure}
                            disabled={isGeneratingStructure}
                            className="flex items-center gap-1 px-3 py-1 border-2 border-[var(--color-info)] text-[var(--color-info)] rounded hover:bg-[var(--color-info)] hover:text-white transition-colors disabled:opacity-50 text-sm"
                          >
                            {isGeneratingStructure ? (
                              <>
                                <RefreshCw size={16} className="animate-spin" />
                                生成中...
                              </>
                            ) : (
                              '生成'
                            )}
                          </button>
                          {structuredContent && (
                            <button 
                              onClick={handleApplyStructure}
                              className="flex items-center gap-1 px-3 py-1 border-2 border-[var(--color-success)] text-[var(--color-success)] rounded hover:bg-[var(--color-success)] hover:text-white transition-colors text-sm"
                            >
                              应用
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                        {structuredContent ? (
                          <div className="prose max-w-none font-handwriting text-lg">
                            <div dangerouslySetInnerHTML={{ __html: structuredContent.replace(/\n/g, '<br>') }} />
                          </div>
                        ) : (
                          <p className="text-gray-400 italic text-center py-8">
                            点击生成按钮，AI将为您的日记内容提供结构化建议
                          </p>
                        )}
                      </div>
                    </InteractiveCard>
                  )
                },
                associations: {
                  title: 'AI智能联想',
                  component: (
                    <InteractiveCard className="flex flex-col !p-6 w-96">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <BookOpen size={24} className="text-green-500" />
                          AI智能联想
                        </h2>
                        <button 
                          onClick={handleGenerateAssociations}
                          disabled={isGeneratingAssociations}
                          className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                        >
                          {isGeneratingAssociations ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              生成中...
                            </>
                          ) : (
                            '生成联想'
                          )}
                        </button>
                      </div>
                      <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                        {associations ? (
                          <div className="prose max-w-none font-handwriting text-lg">
                            <ReactMarkdown className="prose max-w-none">{associations}</ReactMarkdown>
                            <button 
                              onClick={() => handleApplyAssociation(associations)} 
                              className="mt-4 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors text-sm"
                            >
                              应用所有联想
                            </button>
                          </div>
                        ) : (
                          <p className="text-gray-400 italic text-center py-8">
                            点击生成联想按钮，AI将为您提供相关的写作思路建议
                          </p>
                        )}
                      </div>
                    </InteractiveCard>
                  )
                },
                keyPoints: {
                  title: 'AI要点提取',
                  component: (
                    <InteractiveCard className="flex flex-col !p-6 w-96">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-2xl font-bold flex items-center gap-2">
                          <ListTodo size={24} className="text-blue-500" />
                          AI要点提取
                        </h2>
                        <button 
                          onClick={handleExtractKeyPoints}
                          disabled={isExtractingKeyPoints}
                          className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                        >
                          {isExtractingKeyPoints ? (
                            <>
                              <RefreshCw size={16} className="animate-spin" />
                              提取中...
                            </>
                          ) : (
                            '提取要点'
                          )}
                        </button>
                      </div>
                      <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                        {keyPoints ? (
                          <div className="prose max-w-none font-handwriting text-lg">
                            <div dangerouslySetInnerHTML={{ __html: keyPoints.replace(/\n/g, '<br>') }} />
                          </div>
                        ) : (
                          <p className="text-gray-400 italic text-center py-8">
                            点击提取按钮，AI将为您的日记内容提取关键要点
                          </p>
                        )}
                      </div>
                    </InteractiveCard>
                  )
                }
              };
              
              return (
                <DraggableCard 
                  key={card.id} 
                  initialPosition={{ x: card.x, y: card.y }}
                >
                  {cardConfig[card.type].component}
                </DraggableCard>
              );
            })}
          </DiaryCanvas>
        </div>
      ) : (
        // 传统网格模式
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Left Column: What happened */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
          <InteractiveCard className="flex flex-col !p-6 h-full">
              <h2 className="text-2xl font-bold mb-4">发生了啥</h2>
              
              {/* 前言显示和控制 */}
              {intro.trim() && (
                <div className="mb-4 p-3 bg-blue-50 border-2 border-blue-300 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-blue-700">AI生成前言</h3>
                    <div className="flex gap-2">
                      <button 
                        onClick={handleApplyIntro}
                        className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
                      >
                        应用
                      </button>
                      <button 
                        onClick={() => setUseIntro(!useIntro)}
                        className="px-2 py-1 bg-white border-2 border-blue-600 text-blue-600 rounded hover:bg-blue-100 text-sm font-medium"
                      >
                        {useIntro ? '不使用' : '使用'}
                      </button>
                    </div>
                  </div>
                  <p className="text-blue-800 font-handwriting">{intro}</p>
                </div>
              )}
              
              <div className="flex-1 border-b-2 border-black border-dashed mb-4">
                  <textarea 
                      className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent overflow-y-auto whitespace-pre-wrap word-break-break-word max-h-[300px]"
                      placeholder="记录下今天的故事..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      aria-label="记录今天的故事"
                  />
              </div>
              <p className="text-right text-sm text-gray-500 font-handwriting">哎呀，别墨迹啦</p>
          </InteractiveCard>

          {/* Plans */}
          <InteractiveCard className="flex-1 !p-6 flex flex-col">
              <h2 className="text-2xl font-bold mb-4">加点计划</h2>
              <div className="flex-1">
                  <textarea 
                      className="w-full h-full resize-none outline-none font-handwriting text-xl bg-transparent overflow-y-auto whitespace-pre-wrap word-break-break-word max-h-[300px]"
                      placeholder="明天打算做点啥？"
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      aria-label="明天的计划"
                  />
              </div>
          </InteractiveCard>
        </div>

        {/* Middle Column: AI Structure Suggestion and Associations */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">
            {/* AI Structure Suggestion */}
            <InteractiveCard className="flex flex-col !p-6 h-1/2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Lightbulb size={24} className="text-yellow-500" />
                        AI结构化建议
                    </h2>
                    <div className="flex items-center gap-2">
                        <select 
                            value={templateType}
                            onChange={(e) => setTemplateType(e.target.value)}
                            className="border border-black rounded px-2 py-1 text-sm"
                        >
                            <option value="auto">自动</option>
                            <option value="timeline">时间线</option>
                            <option value="problem-solution">问题-解决方案</option>
                            <option value="key-points">要点式</option>
                        </select>
                        <button 
                            onClick={handleGenerateStructure}
                            disabled={isGeneratingStructure}
                            className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                        >
                            {isGeneratingStructure ? (
                                <>
                                    <RefreshCw size={16} className="animate-spin" />
                                    生成中...
                                </>
                            ) : (
                                '生成'
                            )}
                        </button>
                        {structuredContent && (
                            <button 
                                onClick={handleApplyStructure}
                                className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors text-sm"
                            >
                                应用
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                    {structuredContent ? (
                        <div className="prose max-w-none font-handwriting text-lg">
                                    <ReactMarkdown className="prose max-w-none">{structuredContent}</ReactMarkdown>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic text-center py-8">
                            点击生成按钮，AI将为您的日记内容提供结构化建议
                        </p>
                    )}
                </div>
            </InteractiveCard>

            {/* AI Smart Associations */}
            <InteractiveCard className="flex flex-col !p-6 h-1/2">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <BookOpen size={24} className="text-green-500" />
                        AI智能联想
                    </h2>
                    <button 
                        onClick={handleGenerateAssociations}
                        disabled={isGeneratingAssociations}
                        className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                    >
                        {isGeneratingAssociations ? (
                            <>
                                <RefreshCw size={16} className="animate-spin" />
                                生成中...
                            </>
                        ) : (
                            '生成联想'
                        )}
                    </button>
                </div>
                <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                    {associations ? (
                        <div className="prose max-w-none font-handwriting text-lg">
                            <div dangerouslySetInnerHTML={{ __html: associations.replace(/\n/g, '<br>') }} />
                            <button 
                                onClick={() => handleApplyAssociation(associations)} 
                                className="mt-4 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors text-sm"
                            >
                                应用所有联想
                            </button>
                        </div>
                    ) : (
                        <p className="text-gray-400 italic text-center py-8">
                            点击生成联想按钮，AI将为您提供相关的写作思路建议
                        </p>
                    )}
                </div>
            </InteractiveCard>
        </div>

        {/* Right Column: AI Key Points Extraction */}
        <InteractiveCard className="lg:col-span-1 flex flex-col !p-6 h-full">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <ListTodo size={24} className="text-blue-500" />
                    AI要点提取
                </h2>
                <button 
                    onClick={handleExtractKeyPoints}
                    disabled={isExtractingKeyPoints}
                    className="flex items-center gap-1 px-3 py-1 border border-black rounded hover:bg-gray-100 transition-colors disabled:opacity-50 text-sm"
                >
                    {isExtractingKeyPoints ? (
                        <>
                            <RefreshCw size={16} className="animate-spin" />
                            提取中...
                        </>
                    ) : (
                        '提取要点'
                    )}
                </button>
            </div>
            <div className="flex-1 border-b-2 border-black border-dashed mb-4 overflow-y-auto">
                {keyPoints ? (
                    <div className="prose max-w-none font-handwriting text-lg">
                        <ReactMarkdown className="prose max-w-none">{keyPoints}</ReactMarkdown>
                    </div>
                ) : (
                    <p className="text-gray-400 italic text-center py-8">
                        点击提取按钮，AI将为您的日记内容提取关键要点
                    </p>
                )}
            </div>
        </InteractiveCard>
      </div>
      )}

      <InputBar 
        onSendMessage={(message) => {
          // 可以在这里添加与AI助手的交互逻辑
          console.log('Send message:', message);
        }}
      />
    </div>
  );
}
