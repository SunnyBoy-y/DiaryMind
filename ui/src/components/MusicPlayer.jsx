import React, { useState, useEffect, useRef } from 'react';
import InteractiveCard from './InteractiveCard';
import InputBar from './InputBar';
import { Play, Pause, SkipBack, SkipForward, ArrowUp, Music as MusicIcon } from 'lucide-react';

export default function MusicPlayer({ 
  playlist = [], 
  currentSong = 'No Song Selected', 
  isPlaying = false, 
  onPlay, 
  onToggle, 
  onNext, 
  onPrev 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [suggestionSuffix, setSuggestionSuffix] = useState('');
  
  // Search State
  const [searchMatches, setSearchMatches] = useState([]);
  const [currentMatchIndex, setCurrentMatchIndex] = useState(-1);
  
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);
  const clickCountRef = useRef(0);
  const clickTimeoutRef = useRef(null);

  // Auto-scroll effect or switch back to display mode
  useEffect(() => {
    if (isEditing) {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setIsEditing(false);
      }, 5000);
    }
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isEditing, inputValue]);

  const handleInputClick = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setInputValue(currentSong || '');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleInputBlur = () => {
      setIsEditing(false);
  };

  const handleKeyDown = (e) => {
      if (e.key === 'Enter') {
          handleInputBlur();
      }
  };

  // Visualization heights
  const [barHeights, setBarHeights] = useState(Array.from({ length: 8 }, () => '20%'));

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setBarHeights(prev => prev.map(() => `${Math.floor(Math.random() * 60) + 20}%`));
      }, 200);
    } else {
      setTimeout(() => {
        setBarHeights(Array.from({ length: 8 }, () => '20%'));
      }, 0);
    }
    return () => { if (timer) clearInterval(timer); };
  }, [isPlaying]);

  const onSearchChange = (val) => {
    setSearchValue(val);
    const query = (val || '').trim().toLowerCase();
    
    if (!query) {
      setSuggestionSuffix('');
      setSearchMatches([]);
      setCurrentMatchIndex(-1);
      return;
    }

    // Fuzzy search (includes)
    const matches = playlist.filter(name => name.toLowerCase().includes(query));
    setSearchMatches(matches);
    setCurrentMatchIndex(-1); // Reset index on new input

    // Suffix logic for prefix matches only (visual aid)
    const prefixMatch = matches.find(name => name.toLowerCase().startsWith(query));
    setSuggestionSuffix(prefixMatch ? prefixMatch.slice(query.length) : '');
  };

  const handleTab = () => {
    if (searchMatches.length === 0) return;
    
    const nextIndex = (currentMatchIndex + 1) % searchMatches.length;
    setCurrentMatchIndex(nextIndex);
    setSearchValue(searchMatches[nextIndex]);
    setSuggestionSuffix(''); // Clear suffix
  };

  const handleSearchSend = (text) => {
    const query = (text || '').trim().toLowerCase();
    if (!query) return;
    
    // Try to find exact match or use the selected match
    let match = playlist.find(name => name.toLowerCase() === query);
    if (!match && searchMatches.length > 0) {
        // If we have matches, play the first one or current cycled one?
        // Let's play the first one if exact match fails
        match = searchMatches[0];
    }
    
    if (match) {
      onPlay && onPlay(match);
      setSearchValue('');
      setSearchMatches([]);
    }
  };

  const handleCardClick = () => {
    clickCountRef.current += 1;
    
    if (clickTimeoutRef.current) {
        clearTimeout(clickTimeoutRef.current);
    }

    if (clickCountRef.current === 2) { // Double click
        setShowPlaylist(true);
        clickCountRef.current = 0;
    } else {
        clickTimeoutRef.current = setTimeout(() => {
            clickCountRef.current = 0;
        }, 300); // Reduced timeout for better response
    }
  };

  return (
    <div className="flex flex-col h-full w-full">
        <div className="flex-1 flex items-center justify-center p-6 relative">
            <InteractiveCard 
                className="w-full max-w-md aspect-square flex flex-col items-center justify-between !p-8 bg-white relative transition-all duration-300 select-none"
                onClick={handleCardClick}
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
                                <div className="text-center text-gray-500 mt-4">暂无音乐</div>
                            ) : (
                                playlist.map((song, idx) => (
                                    <div 
                                        key={idx}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onPlay && onPlay(song);
                                        }}
                                        className={`
                                            p-3 border-2 border-black rounded cursor-pointer hover:bg-gray-100 transition-colors flex items-center gap-3
                                            ${currentSong === song ? 'bg-black text-white hover:bg-black/90' : 'bg-white'}
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
                             {barHeights.map((h, i) => (
                                 <div 
                                    key={i} 
                                    className={`w-2 bg-black rounded-full transition-all duration-300 ease-in-out ${isPlaying ? 'animate-pulse' : ''}`}
                                    style={{ 
                                        height: h,
                                        animationDelay: `${i * 0.1}s`
                                    }}
                                 ></div>
                             ))}
                        </div>

                        {/* Controls */}
                        <div className="flex items-center gap-8 mb-8" onClick={(e) => e.stopPropagation()}>
                            <button 
                                className="hover:scale-110 transition-transform"
                                onClick={onPrev}
                            >
                                <SkipBack size={32} fill="black" />
                            </button>
                            <button 
                                onClick={onToggle}
                                className="w-16 h-16 border-2 border-black rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                            >
                                {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" ml={4} />}
                            </button>
                            <button 
                                className="hover:scale-110 transition-transform"
                                onClick={onNext}
                            >
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
                                        正在播放: {currentSong} &nbsp;&nbsp;&nbsp;&nbsp; 正在播放: {currentSong}
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </InteractiveCard>
        </div>
        
        {/* Input Bar at Bottom */}
        <InputBar 
          value={searchValue}
          onChange={onSearchChange}
          suggestionSuffix={suggestionSuffix}
          onAcceptSuggestion={handleTab}
          onSendMessage={handleSearchSend}
          placeholder="搜索歌曲，按 Tab 切换匹配项"
        />
    </div>
  );
}
