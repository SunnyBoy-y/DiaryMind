import React from 'react';

const icons = {
  sunny: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <circle cx="12" cy="12" r="5" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
  rainy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242" />
      <path d="M16 14v6M8 14v6M12 16v6" />
    </svg>
  ),
  cloudy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M17.5 19c0-1.7-1.3-3-3-3h-1.1c-.2-2.3-2.1-4-4.4-4-2.5 0-4.5 1.8-4.9 4.2C2.1 16.6 1 18.1 1 20c0 2.2 1.8 4 4 4h12.5c2.5 0 4.5-2 4.5-4.5S20 15 17.5 15" />
    </svg>
  ),
  snowy: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M2 12h20M12 2v20M20 20L4 4m16 0L4 20" />
      <path d="M8 8l8 8M8 16l8-8" opacity="0.5" />
    </svg>
  ),
  unknown: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M9 16c2 1 4 1 6 0" />
    </svg>
  ),
};

export default function WeatherSelector({ selected, onSelect }) {
  const options = [
    { key: 'sunny', label: '晴天' },
    { key: 'rainy', label: '雨天' },
    { key: 'cloudy', label: '多云' },
    { key: 'snowy', label: '雪' },
    { key: 'unknown', label: '不知道' },
  ];

  return (
    <div className="flex gap-4 items-center">
      {options.map(({ key, label }) => (
        <div
          key={key}
          onClick={() => onSelect(key)}
          className={`
            flex flex-col items-center gap-1 cursor-pointer transition-transform hover:scale-110
            ${selected === key ? 'text-black scale-110' : 'text-gray-400'}
          `}
        >
          {icons[key]}
          <span className="text-xs font-handwriting">{label}</span>
        </div>
      ))}
    </div>
  );
}
