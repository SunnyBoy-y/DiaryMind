import React, { useState, useEffect } from 'react';
import { Moon, Sun, Palette } from 'lucide-react';

export default function ThemeProvider({ children }) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState('light');

  // 从localStorage加载主题偏好
  useEffect(() => {
    const savedTheme = localStorage.getItem('diaryMind_theme') || 'light';
    const savedDarkMode = localStorage.getItem('diaryMind_darkMode') === 'true';
    
    setSelectedTheme(savedTheme);
    setIsDarkMode(savedDarkMode);
    applyTheme(savedTheme, savedDarkMode);
  }, []);

  // 应用主题
  const applyTheme = (theme, darkMode) => {
    const root = document.documentElement;
    
    if (darkMode) {
      root.classList.add('dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else {
      root.classList.remove('dark');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    }

    // 应用主题颜色
    const themes = {
      light: {
        primary: '#3B82F6',
        secondary: '#EC4899',
        accent: '#F59E0B',
      },
      warm: {
        primary: '#F97316',
        secondary: '#FB923C',
        accent: '#FBBF24',
      },
      cool: {
        primary: '#06B6D4',
        secondary: '#0EA5E9',
        accent: '#06B6D4',
      },
      nature: {
        primary: '#16A34A',
        secondary: '#84CC16',
        accent: '#22C55E',
      },
    };

    const themeColors = themes[theme] || themes.light;
    root.style.setProperty('--color-primary', themeColors.primary);
    root.style.setProperty('--color-secondary', themeColors.secondary);
    root.style.setProperty('--color-accent', themeColors.accent);
  };

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('diaryMind_darkMode', newDarkMode);
    applyTheme(selectedTheme, newDarkMode);
  };

  const handleThemeChange = (theme) => {
    setSelectedTheme(theme);
    localStorage.setItem('diaryMind_theme', theme);
    applyTheme(theme, isDarkMode);
  };

  return (
    <div className={isDarkMode ? 'dark' : 'light'}>
      {children}
      
      {/* 浮动主题切换按钮 */}
      <ThemeToggleButton 
        isDarkMode={isDarkMode}
        selectedTheme={selectedTheme}
        onToggleDark={toggleDarkMode}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}

function ThemeToggleButton({ isDarkMode, selectedTheme, onToggleDark, onThemeChange }) {
  const [showPanel, setShowPanel] = useState(false);

  const themes = [
    { id: 'light', label: '浅色', colors: 'from-blue-300 to-blue-500', icon: '☀️' },
    { id: 'warm', label: '暖色', colors: 'from-orange-300 to-orange-500', icon: '🔥' },
    { id: 'cool', label: '清爽', colors: 'from-cyan-300 to-cyan-500', icon: '❄️' },
    { id: 'nature', label: '自然', colors: 'from-green-300 to-green-500', icon: '🌿' },
  ];

  return (
    <div className="fixed bottom-8 right-8 z-40">
      {/* 主题选择面板 */}
      {showPanel && (
        <div className="absolute bottom-20 right-0 bg-white border-2 border-black rounded-lg p-4 shadow-xl w-64 animate-fadeIn">
          <h3 className="font-bold mb-3 text-lg">🎨 主题选择</h3>
          
          {/* 主题网格 */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            {themes.map(theme => (
              <button
                key={theme.id}
                onClick={() => onThemeChange(theme.id)}
                className={`p-3 border-2 rounded-lg font-bold text-center transition ${
                  selectedTheme === theme.id
                    ? 'border-black bg-yellow-200'
                    : 'border-gray-300 hover:border-black bg-white'
                }`}
              >
                <div className="text-2xl mb-1">{theme.icon}</div>
                <div className="text-xs">{theme.label}</div>
              </button>
            ))}
          </div>

          <hr className="border-gray-300 my-3" />

          {/* 深色模式切换 */}
          <button
            onClick={onToggleDark}
            className={`w-full p-3 border-2 font-bold rounded-lg transition flex items-center justify-between ${
              isDarkMode
                ? 'border-black bg-gray-800 text-white'
                : 'border-gray-300 bg-white hover:border-black'
            }`}
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
              {isDarkMode ? '深色模式' : '浅色模式'}
            </span>
            <span className={isDarkMode ? 'text-green-400' : 'text-gray-500'}>
              {isDarkMode ? '✓' : '○'}
            </span>
          </button>

          {/* 快捷提示 */}
          <div className="mt-3 p-2 bg-blue-50 border-2 border-blue-300 rounded text-xs font-bold text-gray-700">
            💡 主题设置已保存到浏览器本地存储
          </div>
        </div>
      )}

      {/* 浮动按钮 */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="w-14 h-14 bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-black rounded-full shadow-lg hover:shadow-xl hover:scale-110 transition flex items-center justify-center text-2xl"
        title="打开主题选择"
      >
        <Palette size={28} className="text-white" />
      </button>
    </div>
  );
}
