import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function SidebarButton() {
  return (
    <button 
        className="mb-4 w-12 h-12 flex items-center justify-center border-2 border-[#2d2d2d] bg-white hover:bg-[#ff9b9b] hover:text-white hover:border-[#ff9b9b] transition-all duration-200 shadow-[2px_2px_0px_0px_rgba(45,45,45,1)]" 
        title="点击后可选组件"
        style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
    >
      <LayoutGrid size={24} />
    </button>
  );
}
