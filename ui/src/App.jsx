import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Clock from './components/Clock';
import DiaryList from './components/DiaryList';
import TodoList from './components/TodoList';
import Calendar from './components/Calendar';
import InputBar from './components/InputBar';
import SidebarButton from './components/SidebarButton';
import DiaryCollection from './components/DiaryCollection';
import FullScreenDiary from './components/FullScreenDiary';
import InteractiveCard from './components/InteractiveCard';
import SidebarMenu from './components/SidebarMenu';
import BombOverlay from './components/BombOverlay';
import MusicPlayer from './components/MusicPlayer';
import FlowMode from './components/FlowMode';
import TimeMachine from './components/TimeMachine';
import ExportView from './components/ExportView';
import InsightCapsule from './components/InsightCapsule';
import EchoesOfTime from './components/EchoesOfTime';
import DocumentUploader from './components/DocumentUploader';
import { Music as MusicIcon, X, Play, Pause, Calendar as CalendarIcon, LogOut, Settings, LogIn } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || "/api";
const MUSIC_API_BASE = `${API_BASE}/music`;
const AUTH_API_BASE = `${API_BASE}/auth`;

function App() {
  const navigate = useNavigate();
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'collection' | 'fullscreen' | 'music' | 'timemachine' | 'export'
  const [isSimpleMode, setIsSimpleMode] = useState(true);
  const [isGuest, setIsGuest] = useState(() => {
    try { return localStorage.getItem('isGuest') === 'true'; } catch { return false; }
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBombActive, setIsBombActive] = useState(false);
  const [isFlowMode, setIsFlowMode] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const idleTimerRef = useRef(null);
  // 用户状态
  const [user, setUser] = useState(null);

  // Input Control State
  const [inputValue, setInputValue] = useState('');
  const [suggestionSuffix, setSuggestionSuffix] = useState('');

  // Task Planning State
  const [taskProposal, setTaskProposal] = useState(null); // { suggestion: string, schedule: [{ time: string, task: string }] }
  const [moodResult, setMoodResult] = useState(null); // { mood_color, mood_keyword, soul_insight }
  const [todos, setTodos] = useState([]); // [{ id, text, completed, active, startTime, duration }]

  // Music State
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(new Audio());
  const [musicIconPos, setMusicIconPos] = useState({ x: 24, y: 24 });
  const draggingMusicRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });

  // 获取当前用户信息
  useEffect(() => {
    const fetchCurrentUser = async () => {
      if (isGuest) {
        setUser(null);
        return;
      }
      try {
        const response = await fetch(`${AUTH_API_BASE}/me`);

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Token无效，跳转登录
          navigate('/login');
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        navigate('/login');
      }
    };

    fetchCurrentUser();
  }, [navigate, isGuest]);

  // 登出函数
  const handleLogout = async () => {
    try {
      await fetch(`${AUTH_API_BASE}/logout`, {
        method: 'POST'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setUser(null);
      try { localStorage.removeItem('isGuest'); } catch {}
      navigate('/login');
    }
  };

  // Fetch playlist on mount
  useEffect(() => {
    fetch(`${MUSIC_API_BASE}/list`)
      .then(res => res.json())
      .then(data => setPlaylist(data))
      .catch(err => console.error("Failed to fetch playlist", err));
    
    // Cleanup audio on unmount
    const audio = audioRef.current;
    return () => {
        audio.pause();
    };
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('musicIconPos');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') {
          setMusicIconPos(parsed);
        }
      }
    } catch {}
  }, []);

  const clamp = (val, min, max) => Math.max(min, Math.min(max, val));
  const startDragMusicIcon = (e) => {
    e.preventDefault();
    e.stopPropagation();
    draggingMusicRef.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    window.addEventListener('mousemove', onDragMusicIcon);
    window.addEventListener('mouseup', endDragMusicIcon);
  };
  const onDragMusicIcon = (e) => {
    if (!draggingMusicRef.current) return;
    const container = document.querySelector('.relative.w-full.max-w-5xl.z-10');
    const bounds = container ? container.getBoundingClientRect() : document.body.getBoundingClientRect();
    const x = clamp(e.clientX - bounds.left - dragOffsetRef.current.x, 0, bounds.width - 48);
    const y = clamp(e.clientY - bounds.top - dragOffsetRef.current.y, 0, bounds.height - 48);
    setMusicIconPos({ x, y });
  };
  const endDragMusicIcon = () => {
    draggingMusicRef.current = false;
    window.removeEventListener('mousemove', onDragMusicIcon);
    window.removeEventListener('mouseup', endDragMusicIcon);
    try { localStorage.setItem('musicIconPos', JSON.stringify(musicIconPos)); } catch {}
  };

  // Handle song ending (Auto play next)
  useEffect(() => {
      const audio = audioRef.current;
      const handleEnded = () => {
          handleNextSong();
      };
      const handleError = (e) => {
          console.warn("Audio error", e);
          setIsPlaying(false);
      };
      audio.addEventListener('ended', handleEnded);
      audio.addEventListener('error', handleError);
      return () => {
        audio.removeEventListener('ended', handleEnded);
        audio.removeEventListener('error', handleError);
      };
  }); // Re-bind if handleNextSong changes, or use ref for handler

  const playSong = (song) => {
    if (!playlist || playlist.length === 0) {
      console.warn("No playlist available");
      return;
    }
    if (!playlist.includes(song)) {
      console.warn("Song not found in playlist:", song);
      return;
    }
    const audio = audioRef.current;
    try {
      audio.pause();
      setIsPlaying(false);
      if (currentSong !== song) {
        setCurrentSong(song);
      }
      audio.src = `${MUSIC_API_BASE}/stream/${encodeURIComponent(song)}`;
      audio.load();
      const onCanPlay = () => {
        audio.play().then(() => setIsPlaying(true)).catch(err => {
          console.error("Play error", err);
          setIsPlaying(false);
        });
        audio.removeEventListener('canplay', onCanPlay);
      };
      audio.addEventListener('canplay', onCanPlay);
    } catch (e) {
      console.error("Play error", e);
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
    } else {
        if (audioRef.current.src) {
            audioRef.current.play().catch(e => console.error("Play error", e));
            setIsPlaying(true);
        } else if (playlist.length > 0) {
            playSong(playlist[0]);
        }
    }
  };

  const handleNextSong = () => {
    if (playlist.length === 0) return;
    const idx = currentSong ? playlist.indexOf(currentSong) : -1;
    const nextIdx = (idx + 1) % playlist.length;
    playSong(playlist[nextIdx]);
  };

  const handlePrevSong = () => {
    if (playlist.length === 0) return;
    const idx = currentSong ? playlist.indexOf(currentSong) : -1;
    const prevIdx = (idx - 1 + playlist.length) % playlist.length;
    playSong(playlist[prevIdx]);
  };

  const stopMusic = (e) => {
      e.stopPropagation();
      audioRef.current.pause();
      audioRef.current.currentTime = 0; // Optional: reset to start
      setIsPlaying(false);
      // Optional: clear current song if we want to completely stop
      // setCurrentSong(null);
  };

  

  // Idle Timer Logic
  useEffect(() => {
    const resetIdleTimer = () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        
        const hasActiveTask = todos.some(t => t.active);
        if (hasActiveTask && !isFlowMode) {
            idleTimerRef.current = setTimeout(() => {
                setIsFlowMode(true);
            }, 30000); // 30 seconds
        }
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    const handleActivity = () => resetIdleTimer();

    events.forEach(event => window.addEventListener(event, handleActivity));
    
    // Initial start if condition met
    resetIdleTimer();

    return () => {
        if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
        events.forEach(event => window.removeEventListener(event, handleActivity));
    };
  }, [todos, isFlowMode]); // Re-run when todos state changes (active status) or flow mode changes


  const handleInputChange = (value) => {
    setInputValue(value);
    if (value === '# ') {
      setSuggestionSuffix('任务');
    } else {
      setSuggestionSuffix('');
    }
  };

  const handleAcceptSuggestion = () => {
    if (suggestionSuffix) {
      setInputValue(inputValue + suggestionSuffix);
      setSuggestionSuffix('');
    }
  };

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;

    if (message.startsWith('# 心情')) {
       const moodText = message.replace('# 心情', '').trim();
       if (!moodText) return;
       
       setIsChatting(true);
       setChatResponse('正在为您炼制情绪...');
       
       try {
           const response = await fetch('/api/llm/mood-alchemy', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ message: moodText })
           });
           const data = await response.json();
           setMoodResult(data);
           setChatResponse('');
           setIsChatting(false);
       } catch (e) {
           setChatResponse('情绪炼制失败: ' + e.message);
       }
       return;
    }

    if (message.startsWith('# 任务')) {
       // Task Planning Mode
       const taskRequest = message.replace('# 任务', '').trim();
       if (!taskRequest) return;

       setIsChatting(true);
       setChatResponse('正在为您规划任务...');
       
       try {
         const response = await fetch('/api/llm/plan-tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: taskRequest
            })
         });
         const data = await response.json();
         if (data.error) {
            setChatResponse('规划任务失败: ' + data.error);
         } else {
            setTaskProposal(data);
            setChatResponse(''); // Clear chat response to show proposal UI instead, or keep it?
            // Let's keep chat response empty and show proposal UI.
            setIsChatting(false); // We'll show a different UI for proposal
         }
       } catch (e) {
         setChatResponse('规划任务出错: ' + e.message);
       }
       return;
    }

    if (message.startsWith('# 问日记')) {
        const query = message.replace('# 问日记', '').trim();
        if (!query) return;

        setIsChatting(true);
        setChatResponse('正在翻阅日记...');
        
        try {
            const response = await fetch('/api/diary/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const data = await response.json();
            setChatResponse(data.reply || '未找到相关内容');
        } catch (e) {
            setChatResponse('记忆检索失败: ' + e.message);
        }
        return;
    }
    
    setIsChatting(true);
    setChatResponse(''); // Clear previous
    
    try {
      const response = await fetch('/api/llm/stream-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: "你是助手",
          message: message + " (请精简回答)",
          stream: true
        })
      });

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: doneReading } = await reader.read();
        done = doneReading;
        const chunkValue = decoder.decode(value, { stream: true });
        // The stream format depends on the backend. 
        // Assuming it sends raw text chunks or JSON lines.
        // Let's assume raw text for now based on typical stream implementations, 
        // but looking at `stream_chat` implementation in backend would be safer.
        // Wait, the backend `stream-chat` returns `StreamingResponse`. 
        // If it uses `qwen.stream_chat`, it might yield strings.
        setChatResponse(prev => prev + chunkValue);
      }
    } catch (error) {
      console.error("Chat error:", error);
      setChatResponse("Error: " + error.message);
    }
  };
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'm') {
        e.preventDefault();
        setCurrentView(prev => {
            if (prev === 'home') return 'collection';
            if (prev === 'collection') return 'home';
            return 'home'; // Exit fullscreen with shortcut too? Or maybe separate logic. Let's keep it simple.
        });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBomb = () => {
      // Sidebar persistence: don't close menu automatically
      // setIsMenuOpen(false); 
      setIsBombActive(true);
  };

  const handleAcceptPlan = () => {
    if (!taskProposal) return;
    const newTodos = taskProposal.schedule.map((item, index) => ({
      id: Date.now() + index,
      text: `${item.time} ${item.task}`,
      completed: false,
      active: false,
      hidden: false,
      startTime: null,
      duration: 0
    }));
    setTodos(prev => [...prev, ...newTodos]);
    setTaskProposal(null);
    setInputValue(''); // Clear input after acceptance
  };

  const handleUpdateTodo = (id, action) => {
    // Reset idle timer on user interaction with todos
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    
    setTodos(prev => prev.map(todo => {
      if (todo.id !== id) {
          // If we activate one, deactivate others?
          // Requirement: "active and start timer... double click checkbox pause timer"
          // If we start one, maybe pause others? Or allow multiple? Usually one at a time.
          // Let's assume single active task for simplicity, or just independent.
          // "正在进行任务" implies focus. Let's stick to independent for now unless specified.
          return todo;
      }

      if (action === 'toggle-hidden') {
          // Single click: Hide/Strike-through
          // "待办可以单击隐藏为横线状态"
          // If it's already hidden, maybe unhide? Or is it a one-way street?
          // Let's toggle.
          return { ...todo, hidden: !todo.hidden };
      }
      if (action === 'activate') {
          // Double click: Expand/Active and start timer
          if (todo.active) return todo; // Already active
          return { ...todo, active: true, startTime: Date.now(), hidden: false };
      }
      if (action === 'pause') {
          // Double click checkbox (or box?): Pause timer
          if (!todo.active) return todo;
          const elapsed = Date.now() - todo.startTime;
          return { ...todo, active: false, duration: todo.duration + elapsed, startTime: null };
      }
      if (action === 'complete') {
          // Click checkbox: Mark as complete, stop timer
          if (todo.completed) return { ...todo, completed: false }; // Toggle back?
          
          let newDuration = todo.duration;
          if (todo.active) {
              newDuration += Date.now() - todo.startTime;
          }
          return { ...todo, completed: true, active: false, duration: newDuration, startTime: null };
      }
      return todo;
    }));
  };

  const handleNavigate = (view) => {
      const restrictedForGuest = new Set(['fullscreen', 'collection', 'export']);
      if (isGuest && restrictedForGuest.has(view)) return;
      setCurrentView(view);
      // Sidebar persistence: don't close menu automatically
      // setIsMenuOpen(false);
  };

  const renderContent = () => {
      if (currentView === 'fullscreen') {
          if (isGuest) {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="p-8 border-2 border-[#2d2d2d] rounded-xl text-center card">
                  <div className="text-2xl font-handwriting mb-2">访客模式</div>
                  <div className="text-gray-500 font-handwriting">当前为访客模式，暂不可写日记</div>
                </div>
              </div>
            );
          }
          return <FullScreenDiary />;
      }
      if (currentView === 'collection') {
          if (isGuest) {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="p-8 border-2 border-[#2d2d2d] rounded-xl text-center card">
                  <div className="text-2xl font-handwriting mb-2">访客模式</div>
                  <div className="text-gray-500 font-handwriting">访客无法查看日记集</div>
                </div>
              </div>
            );
          }
          return <DiaryCollection 
            onBack={() => setCurrentView('home')} 
            onCreateNew={() => setCurrentView('fullscreen')}
          />;
      }
      if (currentView === 'music') {
          return <MusicPlayer 
            playlist={playlist}
            currentSong={currentSong}
            isPlaying={isPlaying}
            onPlay={playSong}
            onToggle={togglePlay}
            onNext={handleNextSong}
            onPrev={handlePrevSong}
          />;
      }
      if (currentView === 'timemachine') {
          return <TimeMachine />;
      }
      if (currentView === 'export') {
          if (isGuest) {
            return (
              <div className="flex items-center justify-center h-full">
                <div className="p-8 border-2 border-[#2d2d2d] rounded-xl text-center card">
                  <div className="text-2xl font-handwriting mb-2">访客模式</div>
                  <div className="text-gray-500 font-handwriting">访客不可使用导出功能</div>
                </div>
              </div>
            );
          }
          return <ExportView onBack={() => setCurrentView('home')} />;
      }
      
      // Home View (Focus/Simple Mode)
      if (isSimpleMode) {
        return (
            <div className="flex flex-col h-full relative animate-fade-in">
                {/* Header Area */}
                <div className="flex justify-between items-center p-8">
                    <div className="flex gap-4">
                         {/* Optional: Add Date or Welcome Text here */}
                         <div className="text-2xl font-handwriting font-bold text-gray-400">
                            {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'long' })}
                         </div>
                    </div>
                    {/* Right side controls (User, Settings) are absolute positioned in parent, but we can add more here if needed */}
                </div>

                {/* Main Content Area - Centered */}
                <div className="flex-1 flex flex-col items-center justify-center w-full max-w-6xl mx-auto gap-10 px-4">
                    
                    {/* Hero Section: Greeting */}
                    <div className="flex flex-col items-center gap-6 py-10">
                        <h1 className="text-7xl font-handwriting font-bold text-[#2d2d2d] animate-fade-in-up">
                            {(() => {
                                const hour = new Date().getHours();
                                if (hour < 5) return '夜深了';
                                if (hour < 11) return '早上好';
                                if (hour < 13) return '中午好';
                                if (hour < 18) return '下午好';
                                return '晚上好';
                            })()}，
                            <span className="text-[#ff9b9b]">{user ? user.username : '朋友'}</span>
                        </h1>
                        <div className="text-2xl font-handwriting text-gray-400 animate-fade-in-up delay-100">
                            准备好开始新的记录了吗？
                        </div>
                    </div>

                    {/* Input Section */}
                    <div className="w-full max-w-3xl z-20">
                        <InputBar 
                          onFullScreenMode={isGuest ? undefined : () => setCurrentView('fullscreen')} 
                          onSendMessage={handleSendMessage}
                          value={inputValue}
                          onChange={handleInputChange}
                          suggestionSuffix={suggestionSuffix}
                          onAcceptSuggestion={handleAcceptSuggestion}
                          placeholder="输入 '# 任务' 规划，'# 心情' 分析，'# 问日记' 回忆..."
                        />
                    </div>

                    {/* Adaptive Widget Grid */}
                    <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        
                        {/* Widget 1: Focus Task */}
                        <div 
                            className="bg-white/80 backdrop-blur-sm border-2 border-[#2d2d2d] p-6 flex flex-col gap-2 hover:shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] transition-all cursor-pointer group h-40"
                            style={{ borderRadius: '20px 15px 25px 15px' }}
                            onClick={() => {
                                // If clicked, maybe expand or go to full list? 
                                // For now, just a visual indicator
                            }}
                        >
                            <div className="flex items-center gap-2 text-gray-500 font-bold font-handwriting">
                                <div className="w-3 h-3 rounded-full bg-[#ff9b9b]"></div>
                                <span>当前专注</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                {activeTask ? (
                                    <div className="text-2xl font-bold font-handwriting text-center text-[#2d2d2d] group-hover:scale-105 transition-transform">
                                        {activeTask.text}
                                    </div>
                                ) : (
                                    <div className="text-lg text-gray-400 font-handwriting italic">
                                        暂无进行中的任务
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Widget 2: Recent Memory (Diary) */}
                        {!isGuest && (
                          <div 
                              className="bg-white/80 backdrop-blur-sm border-2 border-[#2d2d2d] p-6 flex flex-col gap-2 hover:shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] transition-all cursor-pointer group h-40"
                              style={{ borderRadius: '15px 25px 15px 20px' }}
                              onClick={() => setCurrentView('collection')}
                          >
                              <div className="flex items-center gap-2 text-gray-500 font-bold font-handwriting">
                                  <div className="w-3 h-3 rounded-full bg-[#a8d8ea]"></div>
                                  <span>最近回忆</span>
                              </div>
                              <div className="flex-1 flex items-center justify-center">
                                  <div className="text-lg text-gray-600 font-handwriting text-center group-hover:text-black transition-colors line-clamp-2">
                                      点击查看日记本
                                  </div>
                              </div>
                          </div>
                        )}

                        {/* Widget 3: Quick Stats / Music */}
                        <div 
                            className="bg-white/80 backdrop-blur-sm border-2 border-[#2d2d2d] p-6 flex flex-col gap-2 hover:shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] transition-all cursor-pointer group h-40"
                            style={{ borderRadius: '25px 15px 20px 15px' }}
                            onClick={() => setCurrentView('music')}
                        >
                            <div className="flex items-center gap-2 text-gray-500 font-bold font-handwriting">
                                <div className="w-3 h-3 rounded-full bg-[#aa96da]"></div>
                                <span>氛围</span>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                {isPlaying && currentSong ? (
                                    <div className="flex flex-col items-center gap-1">
                                         <div className="animate-pulse text-[#2d2d2d] font-bold font-handwriting">{currentSong}</div>
                                         <div className="text-xs text-gray-400">正在播放</div>
                                    </div>
                                ) : (
                                    <div className="text-lg text-gray-400 font-handwriting italic group-hover:text-black">
                                        播放点音乐?
                                    </div>
                                )}
                            </div>
                        </div>

                    </div>

                    {/* Footer Quick Links */}
                    <div className="flex gap-12 mt-8 opacity-60 hover:opacity-100 transition-opacity">
                        {!isGuest && (
                          <button onClick={() => setCurrentView('collection')} className="flex flex-col items-center gap-2 group">
                               <div className="p-3 border-2 border-transparent group-hover:border-[#2d2d2d] rounded-full transition-all">
                                  <CalendarIcon size={24} />
                               </div>
                               <span className="font-handwriting text-sm">日记本</span>
                          </button>
                        )}
                        <button onClick={() => setCurrentView('timemachine')} className="flex flex-col items-center gap-2 group">
                             <div className="p-3 border-2 border-transparent group-hover:border-[#2d2d2d] rounded-full transition-all">
                                <Play size={24} className="transform rotate-90" />
                             </div>
                             <span className="font-handwriting text-sm">时光机</span>
                        </button>
                        {!isGuest && (
                          <button onClick={() => setCurrentView('export')} className="flex flex-col items-center gap-2 group">
                               <div className="p-3 border-2 border-transparent group-hover:border-[#2d2d2d] rounded-full transition-all">
                                  <LogOut size={24} className="transform rotate-180" /> 
                               </div>
                               <span className="font-handwriting text-sm">导出</span>
                          </button>
                        )}
                    </div>
                </div>
            </div>
        );
      }

      return (
        <div className="flex flex-col gap-6 h-full flex-1">
          {/* Main Grid Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
            
            {/* Left Section */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Top Row: Clock and Diary (visitor hidden) */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div className="h-full">
                  <Clock />
                </div>
                <div className="h-full">
                  {isGuest ? (
                    <div className="card h-full flex items-center justify-center">
                      <div className="text-gray-500 font-handwriting">访客模式：暂不提供日记列表</div>
                    </div>
                  ) : (
                    <div onClick={() => setCurrentView('collection')}>
                      <DiaryList />
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Row: Todo */}
              <div className="flex-1">
                <TodoList todos={todos} onUpdateTodo={handleUpdateTodo} />
              </div>
            </div>

            {/* Right Section: Calendar and Smart Widgets */}
            <div className="md:col-span-5 h-full flex flex-col gap-4 overflow-y-auto custom-scrollbar pr-2">
              <InsightCapsule />
              
              <div className="flex-shrink-0">
                 <Calendar />
              </div>

              <div className="flex-1 min-h-[200px]">
                 <EchoesOfTime />
              </div>

              <DocumentUploader />
            </div>

          </div>

          {/* Task Proposal Display */}
          {taskProposal && (
            <div className="w-full bg-white border-2 border-[#2d2d2d] p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] z-20"
                 style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
               <div className="flex flex-col gap-2">
                  <div className="font-handwriting text-lg font-bold">任务规划建议</div>
                  <div className="text-gray-600 italic font-handwriting">{taskProposal.suggestion}</div>
                  <div className="border-t border-[#2d2d2d]/20 my-2 pt-2">
                     {taskProposal.schedule.map((item, i) => (
                        <div key={i} className="flex justify-between text-sm font-handwriting">
                           <span className="font-bold">{item.time}</span>
                           <span>{item.task}</span>
                        </div>
                     ))}
                  </div>
                  <div className="flex justify-end gap-2 mt-2 font-handwriting">
                     <button 
                        onClick={() => setTaskProposal(null)}
                        className="px-4 py-1 border-2 border-[#2d2d2d] hover:bg-gray-100 rounded-lg transition-all"
                     >
                        取消
                     </button>
                     <button 
                        onClick={handleAcceptPlan}
                        className="px-4 py-1 bg-[#2d2d2d] text-white border-2 border-[#2d2d2d] hover:bg-[#4a4a4a] rounded-lg transition-all"
                     >
                        接受
                     </button>
                  </div>
               </div>
            </div>
          )}

          {/* Mood Alchemy Display */}
          {moodResult && (
            <div className="w-full mb-4 z-20 relative animate-fade-in">
               <div 
                 className="p-6 border-2 border-[#2d2d2d] shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] text-white relative overflow-hidden"
                 style={{ 
                    backgroundColor: moodResult.mood_color,
                    borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px'
                 }}
               >
                  <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                          <h3 className="text-2xl font-bold font-handwriting">{moodResult.mood_keyword}</h3>
                          <button 
                             onClick={() => setMoodResult(null)}
                             className="text-white/80 hover:text-white"
                          >
                             <X size={20} />
                          </button>
                      </div>
                      <p className="text-xl font-handwriting italic text-center my-4">
                          "{moodResult.soul_insight}"
                      </p>
                      <div className="text-right text-xs opacity-70 mt-4 font-handwriting">
                          今日情绪胶囊
                      </div>
                  </div>
                  {/* Decorative circles */}
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/20 rounded-full blur-xl"></div>
                  <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-black/10 rounded-full blur-xl"></div>
               </div>
            </div>
          )}

          {/* Chat Response Display */}
          {(isChatting && chatResponse) && (
             <div className="w-full bg-white border-2 border-[#2d2d2d] p-4 mb-4 shadow-[4px_4px_0px_0px_rgba(45,45,45,1)] max-h-40 overflow-y-auto z-20"
                  style={{ borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px' }}>
               <div className="flex justify-between items-start">
                  <div className="font-handwriting text-lg whitespace-pre-wrap text-break">{chatResponse}</div>
                  <button onClick={() => setIsChatting(false)} className="text-gray-500 hover:text-black ml-4">x</button>
               </div>
             </div>
          )}

          {/* Bottom Input Area */}
          <InputBar 
            onFullScreenMode={() => setCurrentView('fullscreen')} 
            onSendMessage={handleSendMessage}
            value={inputValue}
            onChange={handleInputChange}
            suggestionSuffix={suggestionSuffix}
            onAcceptSuggestion={handleAcceptSuggestion}
            placeholder="输入 '# 任务' 规划，'# 心情' 分析，'# 问日记' 回忆..."
          />
          
        </div>
      );
  };

  const activeTask = todos.find(t => t.active);
  const activeTaskIndex = todos.findIndex(t => t.active);
  const nextTask = activeTaskIndex !== -1 && activeTaskIndex < todos.length - 1 ? todos[activeTaskIndex + 1] : null;

  return (
    <div className={`min-h-screen bg-gray-50 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center relative overflow-hidden transition-all duration-500 ${isSimpleMode ? 'p-0' : 'p-4'}`}>
      
      {isFlowMode && (
          <FlowMode 
            activeTask={activeTask}
            nextTask={nextTask}
            onExit={() => setIsFlowMode(false)}
          />
      )}

      <BombOverlay isActive={isBombActive} onComplete={() => setIsBombActive(false)} />

      <div className={`relative w-full z-10 transition-all duration-500 ${isSimpleMode ? 'h-screen' : 'max-w-5xl'}`}>
        {/* User Info and Logout - Positioned at top right */}
        <div className={`absolute z-30 flex items-center gap-4 transition-all duration-500 ${isSimpleMode ? 'top-6 right-6' : '-top-12 right-0'}`}>
          {user && (
            <div className="bg-white border-2 border-[#2d2d2d] px-3 py-1 rounded-full text-sm font-bold font-handwriting shadow-[3px_3px_0px_0px_rgba(45,45,45,1)]">
              {user.username}
            </div>
          )}
          
          <button 
            onClick={() => setIsSimpleMode(!isSimpleMode)}
            className="bg-white border-2 border-[#2d2d2d] p-2 rounded-full hover:bg-gray-100 transition-all shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] hover:shadow-[1px_1px_0px_0px_rgba(45,45,45,1)] transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            title={isSimpleMode ? "切换到仪表盘模式" : "切换到专注模式"}
          >
            <Settings size={20} />
          </button>

          <button 
            onClick={handleLogout}
            className="bg-white border-2 border-[#2d2d2d] p-2 rounded-full hover:bg-gray-100 transition-all shadow-[3px_3px_0px_0px_rgba(45,45,45,1)] hover:shadow-[1px_1px_0px_0px_rgba(45,45,45,1)] transform hover:-translate-x-0.5 hover:-translate-y-0.5"
            title="退出登录"
          >
            <LogOut size={20} />
          </button>
        </div>

        {/* Sidebar Button - Positioned outside */}
        <div className={`absolute z-30 transition-all duration-500 ${isSimpleMode ? 'top-6 left-6' : '-top-12 left-0 md:-left-20 md:top-0'}`} onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <SidebarButton />
        </div>

        {/* Music Playing Icon - draggable and non-blocking */}
        {isPlaying && currentView !== 'music' && (
            <div
                className="absolute z-30 w-12 h-12 bg-white border-2 border-[#2d2d2d] flex items-center justify-center rounded-full cursor-move hover:bg-[#ff9b9b] hover:text-white hover:border-[#ff9b9b] transition-all shadow-[4px_4px_0px_0px_rgba(45,45,45,1)]"
                style={{ left: musicIconPos.x, top: musicIconPos.y, borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
                onMouseDown={startDragMusicIcon}
                onDoubleClick={stopMusic}
                title="拖动或双击停止播放"
            >
                <div className="animate-spin [animation-duration:3s] pointer-events-none">
                   <MusicIcon size={20} />
                </div>
            </div>
        )}

        {/* Sidebar Menu - Only in non-simple mode or when requested? Actually let's keep it but maybe different trigger */}
        {/* If simple mode, maybe we don't need sidebar button at all if we have bottom links? */}
        {/* But user might want bomb or other features. Let's keep it but hide it if simple mode prefers minimalism. */}
        {/* User said "click settings to switch back", implying they might not need sidebar in focus mode. */}
        {/* But let's keep it accessible via the button we already positioned. */}
        
        <div className={`absolute z-20 transition-all duration-500 ${isSimpleMode ? 'top-6 left-6' : '-top-12 left-0 md:-left-20 md:top-0'}`}>
             <SidebarMenu 
                isOpen={isMenuOpen} 
                onBomb={handleBomb}
                onNavigate={handleNavigate}
            />
        </div>


        <div 
            className={`w-full bg-white flex flex-col z-10 relative card transition-all duration-500 ${
                isSimpleMode 
                ? 'h-full rounded-none shadow-none p-0' 
                : 'h-[700px] p-6'
            }`}
            style={isSimpleMode ? { background: 'transparent' } : { 
                borderRadius: '255px 15px 225px 15px / 15px 225px 15px 255px',
                boxShadow: '8px 8px 0px 0px rgba(45,45,45,1)'
            }}
        >
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
