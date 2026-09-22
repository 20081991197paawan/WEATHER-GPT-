import React, { useState } from 'react';
import { motion } from 'motion/react';
import { DailyForecastItem } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface WeeklyForecastTrackProps {
  daily: DailyForecastItem[];
  onSelectDay?: (day: DailyForecastItem) => void;
  selectedDayIndex?: number;
}

export const WeeklyForecastTrack: React.FC<WeeklyForecastTrackProps> = ({
  daily,
  onSelectDay,
  selectedDayIndex: externalSelectedIndex,
}) => {
  const [internalSelectedIndex, setInternalSelectedIndex] = useState<number>(3); // Default to Thursday/index 3 like screenshot
  const selectedIndex = externalSelectedIndex !== undefined ? externalSelectedIndex : internalSelectedIndex;

  // Fallback 7 days if less than 7 items provided
  const days = daily && daily.length >= 7 ? daily.slice(0, 7) : daily;

  // Calculate y-offsets for smooth curve based on max temperatures
  const maxTemps = days.map((d) => Math.round(d.tempMax));
  const minTemp = Math.min(...maxTemps);
  const maxTemp = Math.max(...maxTemps);
  const tempSpan = Math.max(1, maxTemp - minTemp);

  // SVG coordinate parameters
  const svgWidth = 1000;
  const svgHeight = 120;
  const stepX = svgWidth / (days.length); // ~142.8px per slot
  const startX = stepX / 2; // center of each day slot

  // Map temperatures to y coordinates (warmer = higher = lower y value)
  // Range from y=25 to y=85
  const points = days.map((day, idx) => {
    const norm = (Math.round(day.tempMax) - minTemp) / tempSpan;
    const y = 80 - norm * 45; // 35px to 80px range
    const x = startX + idx * stepX;
    return { x, y, day, idx };
  });

  // Construct smooth cubic bezier SVG path across points
  const generateSplinePath = () => {
    if (points.length < 2) return '';
    let d = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const curr = points[i];
      const next = points[i + 1];
      const cp1x = curr.x + (next.x - curr.x) / 2;
      const cp1y = curr.y;
      const cp2x = curr.x + (next.x - curr.x) / 2;
      const cp2y = next.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
    }
    return d;
  };

  const splinePath = generateSplinePath();

  const handleDayClick = (idx: number) => {
    setInternalSelectedIndex(idx);
    if (onSelectDay && days[idx]) {
      onSelectDay(days[idx]);
    }
  };

  return (
    <div className="relative w-full select-none pt-4 pb-2">
      {/* 7 Days Grid Header (Day Name + Temperature) */}
      <div className="grid grid-cols-7 text-center mb-3">
        {days.map((day, idx) => {
          const isSelected = idx === selectedIndex;
          const dayName = new Date(day.date).toLocaleDateString('en-US', { weekday: 'long' });

          return (
            <button
              key={day.date}
              onClick={() => handleDayClick(idx)}
              className={`flex flex-col items-center justify-center p-1 sm:p-2 rounded-2xl transition-all duration-300 group cursor-pointer ${
                isSelected
                  ? 'text-white'
                  : 'text-white/70 hover:text-white'
              }`}
            >
              <span className="text-xs sm:text-sm font-normal tracking-wide text-white/80 group-hover:text-white">
                {dayName}
              </span>
              <span className="text-lg sm:text-2xl font-bold tracking-tight text-white mt-0.5">
                {Math.round(day.tempMax)}°
              </span>
            </button>
          );
        })}
      </div>

      {/* Continuous Spline Wave Track with Circular Frosted Badges */}
      <div className="relative w-full h-24 sm:h-28 overflow-visible">
        {/* Continuous SVG Spline Line */}
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="trackGrad" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.45)" />
              <stop offset="50%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0.5)" />
            </linearGradient>

            <filter id="splineGlow" x="-10%" y="-10%" width="120%" height="120%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Glowing Continuous Spline Stroke */}
          <path
            d={splinePath}
            fill="none"
            stroke="url(#trackGrad)"
            strokeWidth="2.2"
            strokeLinecap="round"
            filter="url(#splineGlow)"
          />

          {/* Selected Day Vertical Dotted Stalk and Glowing Aura */}
          {points[selectedIndex] && (
            <g>
              {/* Vertical dotted stalk rising up to node */}
              <line
                x1={points[selectedIndex].x}
                y1={points[selectedIndex].y + 16}
                x2={points[selectedIndex].x}
                y2={svgHeight}
                stroke="rgba(255, 255, 255, 0.6)"
                strokeWidth="1.8"
                strokeDasharray="3 3"
              />

              {/* Glowing illumination bulb at node */}
              <circle
                cx={points[selectedIndex].x}
                cy={points[selectedIndex].y}
                r="22"
                fill="rgba(255, 255, 255, 0.2)"
                filter="url(#splineGlow)"
              />
              <circle
                cx={points[selectedIndex].x}
                cy={points[selectedIndex].y}
                r="7"
                fill="#ffffff"
                className="shadow-[0_0_12px_#ffffff]"
              />
            </g>
          )}
        </svg>

        {/* 7 Circular Frosted Badges along the timeline */}
        <div className="absolute inset-0 grid grid-cols-7 items-center justify-items-center pointer-events-none">
          {days.map((day, idx) => {
            const isSelected = idx === selectedIndex;
            return (
              <motion.button
                key={day.date}
                onClick={() => handleDayClick(idx)}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.95 }}
                className={`relative w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300 pointer-events-auto cursor-pointer ${
                  isSelected
                    ? 'backdrop-blur-xl bg-white/30 border-2 border-white text-white shadow-[0_0_20px_rgba(255,255,255,0.7)]'
                    : 'backdrop-blur-md bg-white/10 border border-white/20 text-white/80 hover:bg-white/20 hover:text-white'
                }`}
              >
                <WeatherIcon
                  category={day.conditionCategory}
                  isDay={true}
                  className="w-5 h-5 sm:w-6 sm:h-6"
                />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
