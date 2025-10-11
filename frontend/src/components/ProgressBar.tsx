import React from 'react';

interface ProgressBarProps {
  value: number;
  className?: string;
}

export function ProgressBar({ value, className = "" }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  
  return (
    <div className={`w-full h-3 rounded-full bg-gray-100/80 overflow-hidden shadow-inner ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600 rounded-full transition-all duration-300 ease-out relative"
        style={{ width: `${clamped}%` }}
      >
        {/* Shine effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-pulse"></div>
        {/* Glow effect */}
        <div className="absolute inset-0 bg-emerald-400/20 rounded-full blur-sm"></div>
      </div>
    </div>
  );
}

