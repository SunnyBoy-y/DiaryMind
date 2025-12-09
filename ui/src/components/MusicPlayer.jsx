import React, { useState, useEffect, useRef } from 'react';
import InteractiveCard from './InteractiveCard';
import InputBar from './InputBar';
import { Play, Pause, SkipBack, SkipForward, ArrowUp, Music as MusicIcon } from 'lucide-react';

const API_BASE = "http://localhost:8082/api/music";

export default function MusicPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [songName, setSongName] = useState('No Song Selected');
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [playlist, setPlaylist] = useState([]);
  
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const audioRef = useRef(new Audio());

  // Fetch playlist on mount
  useEffect(() => {
    fetch(`${API_BASE}/list`)
        .then(res => res.json())
        .then(data => {
            setPlaylist(data);
            if (data.length > 0) {
                // Optionally auto-select first song
                // setSongName(data[0]);
            }
        })
        .catch(err => console.error("Failed to fetch playlist", err));
        
    return () => {
        audioRef.current.pause();
        audioRef.current.src = "";
    };
  }, []);

  // Handle play/pause state
  useEffect(() => {
      if (isPlaying && audioRef.current.src) {
          audioRef.current.play().catch(e => console.error("Play error", e));
      } else {
          audioRef.current.pause();
      }
  }, [isPlaying]);

  const playSong = (song) => {
      setSongName(song);
      audioRef.current.src = `${API_BASE}/stream/${song}`;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(e => console.error("Play error", e));
      setShowPlaylist(false);
  };

  // Auto-scroll effect or switch back to display mode
  useEffect(() => {
    if (isEditing) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        // If user hasn't typed or interacted for 5 seconds, switch back
        setIsEditing(false);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isEditing, inputValue]);

  const handleInputClick = (e) => {
    e.stopPropagation(); // Prevent double click propagation
    setIsEditing(true);
    setInputValue(songName);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputBlur = () => {
      setIsEditing(false);
      if (inputValue.trim()) {
          // Search functionality could be implemented here
          // For now just set the name
          // setSongName(inputValue);
      }
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          handleInputBlur();
      }
  };

  const togglePlaylist = () => {
      setShowPlaylist(!showPlaylist);
  };

  return (
    <div className="flex flex-col h-full w-full">
        <div className="flex-1 flex items-center justify-center p-6 relative">
            <InteractiveCard 
                className="w-full max-w-md aspect-square flex flex-col items-center justify-between !p-8 bg-white relative transition-all duration-300"
                onDoubleClick={() => setShowPlaylist(true)}
            >
                <h2 className="absolute top-4 left-4 font-handwriting text-2xl">音乐播放器</h2>
                
                {showPlaylist ? (
                    <div className="w-full h-full flex flex-col pt-12 pb-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-black pb-2">
                            <span className="font-bold text-lg">播放列表</span>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowPlaylist(false); }}
                                className="text-sm underline hover:text-gray-600"
                            >
                                收起
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {playlist.length === 0 ? (
                                <div className="text-center text-gray-500 mt-4">暂无音乐 (请在server/music文件夹添加音乐)</div>
                            ) : (
                                playlist.map((song, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            playSong(song);
                                        }}
                                        className={`
                                            p-3 border-2 border-black rounded cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-3
                                            ${songName === song ? 'bg-black text-white hover:bg-black/90' : 'bg-white'}
                                        `}
                                    >
                                        <MusicIcon size={16} />
                                        <span className="font-handwriting text-lg truncate">{song}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Spectrum Visualization */}
                        <div className="flex-1 flex items-center justify-center gap-2 w-full mt-8 mb-4 pointer-events-none">
                             {[...Array(8)].map((_, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-2 bg-black rounded-full transition-all duration-300 ease-in-out ${isPlaying ? 'animate-pulse' : ''}`}
                                    style={{ 
                                        height: isPlaying ? `${Math.random() * 60 + 20}%` : '20%',
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                 ></div>
                             ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-8 mb-8" onClick={(e) => e.stopPropagation()}>
                            <button className="hover:scale-110 transition-transform">
                                <SkipBack size={32} fill="black" />
                            </button>
                            <button 
                                onClick={() => setIsPlaying(!isPlaying)}
                                className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" ml={4} />}
                            </button>
                            <button className="hover:scale-110 transition-transform">
                                <SkipForward size={32} fill="black" />
                            </button>
                        </div>

                        {/* Song Name Display/Input */}
                        <div className="w-full relative h-14" onClick={(e) => e.stopPropagation()}>
                            {isEditing ? (
                                <div className="flex items-center gap-2 w-full h-full border-2 border-black p-2">
                                     <input
                                        ref={inputRef}
                                        type="text"
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onBlur={handleInputBlur}
                                        onKeyDown={handleKeyDown}
                                        className="flex-1 outline-none font-handwriting text-xl bg-transparent"
                                        placeholder="搜索歌曲..."
                                     />
                                     <button onClick={handleInputBlur}>
                                         <ArrowUp size={24} />
                                     </button>
                                </div>
                            ) : (
                                <div 
                                    onClick={handleInputClick}
                                    className="w-full h-full border-2 border-black flex items-center justify-center overflow-hidden cursor-pointer hover:bg-gray-50"
                                >
                                    <div className="whitespace-nowrap animate-marquee px-4 font-handwriting text-xl">
                                        正在播放: {songName} &nbsp;&nbsp;&nbsp;&nbsp; 正在播放: {songName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </InteractiveCard>
        </div>
        
        {/* Input Bar at Bottom */}
        <InputBar />
    </div>
  );
}
