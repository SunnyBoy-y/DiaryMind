import React, { useState } from 'react';
import InteractiveCard from './InteractiveCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  // Helper to get days in month
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Helper to get first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month, 1).getDay();
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed
  const today = new Date();
  
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  // Adjust firstDay to make Monday start (0=Mon, 6=Sun) if desired, 
  // but standard JS getDay() is 0=Sun. Let's stick to Sun-Sat or Mon-Sun depending on pref.
  // The sketch showed Mon-Fri, so let's do standard Mon-Sun grid.
  // JS getDay(): 0=Sun, 1=Mon... 6=Sat.
  // To make Mon=0, Tue=1... Sun=6: (day + 6) % 7
  const startDayIndex = (firstDay + 6) % 7; 

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  // Generate calendar grid cells
  const renderCalendarDays = () => {
    const cells = [];
    // Empty cells for previous month
    for (let i = 0; i < startDayIndex; i++) {
      cells.push(<div key={`empty-${i}`} className="text-transparent">0</div>);
    }
    // Days of current month
    for (let d = 1; d <= daysInMonth; d++) {
        const isToday = 
            d === today.getDate() && 
            month === today.getMonth() && 
            year === today.getFullYear();
            
      cells.push(
        <div 
            key={d} 
            className={`
                text-center text-lg md:text-xl p-1 font-handwriting
                flex items-center justify-center aspect-square
                ${isToday ? 'bg-[#ff9b9b] text-white shadow-md transform scale-110' : 'hover:bg-[#f0f0f0] cursor-pointer text-[#2d2d2d]'}
            `}
            style={{ borderRadius: isToday ? '30% 70% 70% 30% / 30% 30% 70% 70%' : '50%' }}
        >
          {d}
        </div>
      );
    }
    return cells;
  };

  return (
    <InteractiveCard className="flex flex-col h-full !p-6 bg-[#fdfbf7]">
      <div className="flex items-center justify-between mb-4 font-handwriting">
        <button onClick={prevMonth} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-[#2d2d2d]">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </h2>
        <button onClick={nextMonth} className="p-1 hover:bg-black/5 rounded-full transition-colors">
            <ChevronRight size={24} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2 font-handwriting">
        {weekDays.map(d => (
            <div key={d} className="text-center font-bold text-sm md:text-base text-gray-400">{d}</div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1 flex-1 content-start">
         {renderCalendarDays()}
      </div>
    </InteractiveCard>
  );
}
