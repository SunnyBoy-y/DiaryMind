import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, Repeat, Shuffle, Plus, Trash2, Music as MusicIcon, MoreVertical } from 'lucide-react';

export default function AdvancedMusicPlayer({ 
  playlist = [], 
  currentSong = null,
  currentIndex = 0,
  isPlaying = false, 
  onPlay, 
  onToggle, 
  onNext, 
  onPrev,
  onRemove,
  onVolumeChange
}) {
  // 播放控制状态
  const [volume, setVolume] = useState(100);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loopMode, setLoopMode] = useState('off'); // 'off', 'all', 'one'
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  const [showVolumeControl, setShowVolumeControl] = useState(false);
  const [playlistSearch, setPlaylistSearch] = useState('');

  const audioRef = useRef(new Audio());
  const progressIntervalRef = useRef(null);

  // 处理音量变化
  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume / 100;
    }
    if (onVolumeChange) {
      onVolumeChange(newVolume);
    }
  };

  // 处理循环模式
  const handleLoopModeChange = () => {
    const modes = ['off', 'all', 'one'];
    const currentIdx = modes.indexOf(loopMode);
    setLoopMode(modes[(currentIdx + 1) % modes.length]);
  };

  // 处理随机播放
  const handleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  // 处理随机下一首
  const handleShuffleNext = () => {
    if (playlist.length === 0) return;
    const randomIndex = Math.floor(Math.random() * playlist.length);
    onPlay && onPlay(playlist[randomIndex], randomIndex);
  };

  // 格式化时间
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // 搜索播放列表
  const filteredPlaylist = playlistSearch
    ? playlist.filter(song => song.toLowerCase().includes(playlistSearch.toLowerCase()))
    : playlist;

  // 获取循环模式图标
  const getLoopIcon = () => {
    if (loopMode === 'off') return '↻';
    if (loopMode === 'all') return '🔁';
    return '🔂'; // one
  };

  // 获取循环模式文本
  const getLoopText = () => {
    if (loopMode === 'off') return '不循环';
    if (loopMode === 'all') return '循环全部';
    return '单曲循环';
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-blue-50 to-purple-50 rounded-xl">
      {/* 主播放器卡片 */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 gap-6">
        {/* 专辑封面区域 */}
        <div className="relative">
          <div className="w-48 h-48 border-4 border-black rounded-lg bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center shadow-xl hover:shadow-2xl transition overflow-hidden group">
            {currentSong ? (
              <>
                <MusicIcon size={80} className="text-white opacity-40" />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition flex items-center justify-center">
                  <button
                    onClick={() => onToggle && onToggle()}
                    className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition"
                  >
                    {isPlaying ? <Pause size={32} /> : <Play size={32} />}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center">
                <MusicIcon size={80} className="text-white opacity-50 mx-auto mb-2" />
                <p className="text-white font-bold">选择音乐</p>
              </div>
            )}
          </div>

          {/* 播放状态指示器 */}
          {isPlaying && (
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-2 border-black rounded-full animate-pulse" />
          )}
        </div>

        {/* 歌曲信息 */}
        <div className="text-center max-w-xs">
          <h2 className="text-2xl font-bold text-gray-800 truncate">
            {currentSong || '未选择'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {currentIndex + 1} / {playlist.length}
          </p>
        </div>

        {/* 进度条 */}
        <div className="w-full max-w-xs space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={progress}
            onChange={(e) => setProgress(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-black"
          />
          <div className="flex justify-between text-xs font-bold text-gray-600">
            <span>{formatTime(progress)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* 主控制按钮 */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => onPrev && onPrev()}
            className="p-3 border-2 border-black bg-white hover:bg-gray-100 rounded-full transition"
            title="上一首"
          >
            <SkipBack size={24} />
          </button>

          <button
            onClick={() => onToggle && onToggle()}
            className="p-4 bg-black text-white hover:bg-gray-800 rounded-full transition shadow-lg hover:shadow-xl scale-125"
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? <Pause size={32} /> : <Play size={32} fill="white" />}
          </button>

          <button
            onClick={() => onNext && onNext()}
            className="p-3 border-2 border-black bg-white hover:bg-gray-100 rounded-full transition"
            title="下一首"
          >
            <SkipForward size={24} />
          </button>
        </div>

        {/* 副控制按钮 */}
        <div className="flex gap-2 flex-wrap justify-center">
          {/* 循环模式 */}
          <button
            onClick={handleLoopModeChange}
            className={`px-3 py-1 border-2 font-bold text-sm rounded transition ${
              loopMode !== 'off'
                ? 'border-black bg-yellow-200'
                : 'border-gray-300 bg-white hover:border-black'
            }`}
            title={getLoopText()}
          >
            {getLoopIcon()} {getLoopText()}
          </button>

          {/* 随机播放 */}
          <button
            onClick={handleShuffle}
            className={`px-3 py-1 border-2 font-bold text-sm rounded transition flex items-center gap-1 ${
              isShuffle
                ? 'border-black bg-blue-200'
                : 'border-gray-300 bg-white hover:border-black'
            }`}
            title={isShuffle ? '关闭随机播放' : '启用随机播放'}
          >
            <Shuffle size={16} /> 随机
          </button>

          {/* 音量控制 */}
          <div className="relative">
            <button
              onClick={() => setShowVolumeControl(!showVolumeControl)}
              className="px-3 py-1 border-2 border-gray-300 bg-white hover:border-black font-bold text-sm rounded transition flex items-center gap-1"
            >
              <Volume2 size={16} /> {volume}%
            </button>

            {showVolumeControl && (
              <div className="absolute top-full right-0 mt-2 bg-white border-2 border-black rounded-lg p-3 shadow-xl z-10 w-40">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="text-center text-xs font-bold mt-2">{volume}%</div>
              </div>
            )}
          </div>

          {/* 播放列表按钮 */}
          <button
            onClick={() => setShowPlaylist(!showPlaylist)}
            className="px-3 py-1 border-2 border-black bg-white hover:bg-gray-100 font-bold text-sm rounded transition"
          >
            列表 ({playlist.length})
          </button>
        </div>
      </div>

      {/* 播放列表抽屉 */}
      {showPlaylist && (
        <div className="bg-white border-t-4 border-black max-h-64 flex flex-col">
          {/* 搜索栏 */}
          <div className="p-4 border-b-2 border-gray-300">
            <input
              type="text"
              placeholder="搜索歌曲..."
              value={playlistSearch}
              onChange={(e) => setPlaylistSearch(e.target.value)}
              className="w-full px-3 py-2 border-2 border-black rounded-lg font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 歌曲列表 */}
          <div className="flex-1 overflow-y-auto space-y-1 p-2">
            {filteredPlaylist.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="font-bold">没有找到歌曲</p>
              </div>
            ) : (
              filteredPlaylist.map((song, idx) => {
                const actualIndex = playlist.indexOf(song);
                const isCurrentSong = currentSong === song;
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded border-2 font-bold cursor-pointer transition flex items-center justify-between group ${
                      isCurrentSong
                        ? 'border-black bg-yellow-100'
                        : 'border-gray-300 bg-gray-50 hover:border-black'
                    }`}
                  >
                    <button
                      onClick={() => onPlay && onPlay(song, actualIndex)}
                      className="flex-1 text-left truncate"
                    >
                      <span className="text-xs text-gray-500">{actualIndex + 1}. </span>
                      {song}
                    </button>
                    {isCurrentSong && isPlaying && (
                      <span className="text-lg animate-pulse">🎵</span>
                    )}
                    {onRemove && (
                      <button
                        onClick={() => onRemove(actualIndex)}
                        className="p-1 opacity-0 group-hover:opacity-100 transition hover:bg-red-200 rounded"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
