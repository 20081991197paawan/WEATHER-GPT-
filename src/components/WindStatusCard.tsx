import React from 'react';
import { Wind } from 'lucide-react';

interface WindStatusCardProps {
  windSpeed: number; // in km/h
  windGusts?: number;
  windDirection?: number;
  hourlyWind?: number[];
}

export const WindStatusCard: React.FC<WindStatusCardProps> = ({
  windSpeed = 7.9,
  windGusts,
  windDirection,
  hourlyWind,
}) => {
  const displaySpeed = (windSpeed || 7.9).toFixed(2);

  // Equalizer bar heights (frequency spectrum look from screenshot)
  const barPattern = [
    3, 5, 4, 8, 12, 10, 16, 22, 18, 26, 30, 24, 18, 22, 28, 20, 15, 18, 12, 8, 5, 4, 3
  ];

  return (
    <div className="w-full max-w-sm rounded-3xl p-5 backdrop-blur-2xl bg-white/[0.07] border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.35)] text-white transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18]">
      {/* Top Header Row */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-white/80">
          <Wind className="w-4 h-4 text-slate-300" />
          <span className="text-sm font-normal tracking-wide text-white/90">Wind status</span>
        </div>
        <div className="text-right">
          <span className="text-base sm:text-lg font-bold tracking-tight text-white">
            {displaySpeed}
          </span>
          <span className="text-xs text-white/70 font-normal ml-1">km/h</span>
        </div>
      </div>

      {/* Smooth Continuous Spline Wave Chart */}
      <div className="relative w-full h-16 sm:h-20 mb-3 overflow-hidden">
        <svg
          viewBox="0 0 300 70"
          className="w-full h-full overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="windWaveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.25)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.0)" />
            </linearGradient>
            <linearGradient id="windStrokeGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.6)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.95)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.7)" />
            </linearGradient>
          </defs>

          {/* Fill under wave */}
          <path
            d="M 0 45 C 30 45, 50 38, 80 40 C 110 42, 130 18, 160 20 C 190 22, 210 52, 240 46 C 270 40, 285 45, 300 42 L 300 70 L 0 70 Z"
            fill="url(#windWaveGrad)"
          />

          {/* Stroke wave line */}
          <path
            d="M 0 45 C 30 45, 50 38, 80 40 C 110 42, 130 18, 160 20 C 190 22, 210 52, 240 46 C 270 40, 285 45, 300 42"
            fill="none"
            stroke="url(#windStrokeGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {/* Rhythmic Frequency / Equalizer Bars */}
      <div className="flex items-end justify-between gap-[3px] sm:gap-1 h-8 pt-1 px-1">
        {barPattern.map((height, i) => {
          const isPeak = height > 20;
          return (
            <div
              key={i}
              className="flex-1 flex flex-col items-center justify-end"
            >
              <div
                style={{ height: `${height}px` }}
                className={`w-full max-w-[4px] rounded-full transition-all duration-500 ${
                  isPeak
                    ? 'bg-white/90 shadow-[0_0_8px_rgba(255,255,255,0.8)]'
                    : 'bg-white/35'
                }`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
