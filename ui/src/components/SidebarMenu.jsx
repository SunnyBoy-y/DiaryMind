import React from 'react';
import { Bomb, Home, Save, FolderOpen, Music, Calendar as CalendarIcon } from 'lucide-react';

export default function SidebarMenu({ isOpen, onBomb, onNavigate }) {
  const menuItems = [
    { icon: <Home size={24} />, label: '主页', action: () => onNavigate('home') },
    { icon: <Music size={24} />, label: '音乐', action: () => onNavigate('music') },
    { icon: <CalendarIcon size={24} />, label: '时光机', action: () => onNavigate('timemachine') },
    { icon: <Save size={24} />, label: '导出', action: () => alert('Exporting...') },
    { icon: <FolderOpen size={24} />, label: '整理', action: () => alert('Organizing...') },
    { icon: <Bomb size={24} />, label: '炸弹', action: onBomb },
  ];

  return (
    <div 
        className={`
            absolute top-16 left-0 w-12 bg-white border-2 border-black z-20
            transition-all duration-300 ease-in-out flex flex-col items-center py-4 gap-6
            shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
        `}
        style={{
            transform: isOpen ? 'scaleY(1)' : 'scaleY(0)',
            opacity: isOpen ? 1 : 0,
            transformOrigin: 'top center'
        }}
    >
        {menuItems.map((item, index) => (
            <button 
                key={index}
                onClick={item.action}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors group relative"
                title={item.label}
            >
                {item.icon}
                {/* Tooltip */}
                <span className="absolute left-full ml-2 bg-black text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 pointer-events-none">
                    {item.label}
                </span>
            </button>
        ))}
    </div>
  );
}
