import React from 'react';
import { LayoutGrid } from 'lucide-react';

export default function SidebarButton() {
  return (
    <button className="mb-4 w-12 h-12 flex items-center justify-center border-2 border-black rounded hover:bg-gray-100 transition-colors bg-white" title="点击后可选组件">
      <LayoutGrid size={24} />
    </button>
  );
}
