import React, { useState, useEffect, useRef } from 'react';
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
import { Music as MusicIcon, X, Play, Pause } from 'lucide-react';

const MUSIC_API_BASE = "http://localhost:8082/api/music";

function App() {
  const [currentView, setCurrentView] = useState('home'); // 'home' | 'collection' | 'fullscreen' | 'music'
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isBombActive, setIsBombActive] = useState(false);
  const [chatResponse, setChatResponse] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  // Music State
  const [playlist, setPlaylist] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState(null);
  const audioRef = useRef(new Audio());

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

  // Handle song ending (Auto play next)
  useEffect(() => {
      const audio = audioRef.current;
      const handleEnded = () => {
          handleNextSong();
      };
      audio.addEventListener('ended', handleEnded);
      return () => audio.removeEventListener('ended', handleEnded);
  }); // Re-bind if handleNextSong changes, or use ref for handler

  const playSong = (song) => {
    if (currentSong !== song) {
        setCurrentSong(song);
        audioRef.current.src = `${MUSIC_API_BASE}/stream/${song}`;
    }
    audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Play error", e));
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

  useEffect(() => {
    const fetchEncouragement = async () => {
      try {
        let prompt = "请直接给我一句简短的鼓励的话。请保持回答精简。";
        
        // Try to fetch diary content
        try {
           const listRes = await fetch('http://localhost:8082/api/diary/list');
           const files = await listRes.json();
           if (files && files.length > 0) {
             // Sort to get latest (assuming filename contains timestamp)
             files.sort(); 
             const latestFile = files[files.length - 1];
             
             const contentRes = await fetch(`http://localhost:8082/api/diary/content/${latestFile}`);
             const contentData = await contentRes.json();
             if (contentData.content) {
                // Truncate content if too long to avoid token limits?
                const diaryContent = contentData.content.slice(0, 1000); 
                prompt = `这是我最近的日记：\n${diaryContent}\n\n请根据这篇日记的内容，给我一句简短的鼓励的话。请保持回答精简。`;
             }
           }
        } catch (e) {
            console.warn("Failed to fetch diary for context:", e);
        }

        const response = await fetch('http://localhost:8082/api/llm/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            role: "你是我的贴心助手",
            message: prompt,
            stream: false
          })
        });
        const data = await response.json();
        setChatResponse(data.response);
        setIsChatting(true);
      } catch (error) {
        console.error("Failed to fetch encouragement:", error);
      }
    };

    // Initial fetch
    // fetchEncouragement(); 
    
    const interval = setInterval(fetchEncouragement, 3600000); // 1 hour
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    setIsChatting(true);
    setChatResponse(''); // Clear previous
    
    try {
      const response = await fetch('http://localhost:8082/api/llm/stream-chat', {
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

  const handleNavigate = (view) => {
      setCurrentView(view);
      // Sidebar persistence: don't close menu automatically
      // setIsMenuOpen(false);
  };

  const renderContent = () => {
      if (currentView === 'fullscreen') {
          return <FullScreenDiary />;
      }
      if (currentView === 'collection') {
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
      
      // Home View
      return (
        <div className="flex flex-col gap-6 h-full flex-1">
          {/* Main Grid Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
            
            {/* Left Section */}
            <div className="md:col-span-7 flex flex-col gap-6">
              
              {/* Top Row: Clock and Diary */}
              <div className="grid grid-cols-2 gap-6 flex-1">
                <div className="h-full">
                  <Clock />
                </div>
                <div className="h-full" onClick={() => setCurrentView('collection')}>
                  <DiaryList />
                </div>
              </div>

              {/* Bottom Row: Todo */}
              <div className="flex-1">
                <TodoList />
              </div>
            </div>

            {/* Right Section: Calendar */}
            <div className="md:col-span-5 h-full">
              <Calendar />
            </div>

          </div>

          {/* Chat Response Display */}
          {(isChatting && chatResponse) && (
             <div className="w-full bg-white border-2 border-black p-4 mb-4 rounded shadow-lg max-h-40 overflow-y-auto z-20">
               <div className="flex justify-between items-start">
                  <div className="font-handwriting text-lg whitespace-pre-wrap">{chatResponse}</div>
                  <button onClick={() => setIsChatting(false)} className="text-gray-500 hover:text-black ml-4">x</button>
               </div>
             </div>
          )}

          {/* Bottom Input Area */}
          <InputBar 
            onFullScreenMode={() => setCurrentView('fullscreen')} 
            onSendMessage={handleSendMessage}
          />
          
        </div>
      );
  };

  return (
    <div className="min-h-screen bg-gray-50 bg-[radial-gradient(#ccc_1px,transparent_1px)] [background-size:20px_20px] flex items-center justify-center p-4 relative overflow-hidden">
      
      <BombOverlay isActive={isBombActive} onComplete={() => setIsBombActive(false)} />

      <div className="relative w-full max-w-5xl z-10">
        {/* Sidebar Button - Positioned outside */}
        <div className="absolute -top-12 left-0 md:-left-20 md:top-0 z-30" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          <SidebarButton />
        </div>

        {/* Music Playing Icon - Show when playing and not in music view */}
        {isPlaying && currentView !== 'music' && (
            <div 
                className="absolute -top-12 left-14 md:-left-20 md:top-14 z-30 w-12 h-12 bg-white border-2 border-black flex items-center justify-center rounded-full cursor-pointer hover:bg-gray-100 transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                onClick={stopMusic}
                title="点击停止播放"
            >
                <div className="animate-spin [animation-duration:3s]">
                   <MusicIcon size={20} />
                </div>
            </div>
        )}

        {/* Sidebar Menu - Now positioned relative to the button wrapper if we want, or absolute like before */}
        {/* Since SidebarButton is absolute -top-12 left-0, SidebarMenu should be visually below it */}
        {/* The SidebarMenu component itself has 'absolute top-16 left-0' style, which is relative to the container 'relative w-full max-w-5xl z-10' */}
        {/* But wait, the SidebarButton is inside 'absolute -top-12 left-0'. */}
        {/* If we put SidebarMenu inside the same absolute div as SidebarButton, it will move with it. */}
        {/* However, the SidebarMenu component currently expects to be in a relative container. */}
        {/* Let's put SidebarMenu in the same container as SidebarButton to align them easily. */}
        
        <div className="absolute -top-12 left-0 md:-left-20 md:top-0 z-20">
             {/* This container aligns with the button */}
             <SidebarMenu 
                isOpen={isMenuOpen} 
                onBomb={handleBomb}
                onNavigate={handleNavigate}
            />
        </div>


        <div className="w-full border-2 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] h-[700px] flex flex-col z-10 relative">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}

export default App;
