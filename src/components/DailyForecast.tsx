import React, { useState } from 'react';
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Droplets,
  Sunrise,
  Sunset,
  Sun,
  Wind,
} from 'lucide-react';
import { DailyForecastItem } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface DailyForecastProps {
  daily: DailyForecastItem[];
}

export const DailyForecast: React.FC<DailyForecastProps> = ({ daily }) => {
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // Overall min/max for scale bar
  const overallMin = Math.min(...daily.map((d) => d.tempMin));
  const overallMax = Math.max(...daily.map((d) => d.tempMax));
  const tempRange = Math.max(1, overallMax - overallMin);

  const toggleExpand = (date: string) => {
    setExpandedDate(expandedDate === date ? null : date);
  };

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800/80 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-blue-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              7-Day Extended Forecast
            </h3>
            <p className="text-[11px] text-slate-400">
              Interactive meteorological projections
            </p>
          </div>
        </div>

        <span className="text-xs text-slate-400 hidden sm:inline">
          Click row to expand details
        </span>
      </div>

      <div className="space-y-2">
        {daily.map((day, idx) => {
          const isToday = idx === 0;
          const isExpanded = expandedDate === day.date;

          // Bar positioning math
          const leftPercent = ((day.tempMin - overallMin) / tempRange) * 100;
          const widthPercent = Math.max(12, ((day.tempMax - day.tempMin) / tempRange) * 100);

          return (
            <div
              key={day.date}
              className="rounded-2xl border border-slate-800/60 bg-slate-900/50 hover:bg-slate-800/50 transition overflow-hidden"
            >
              {/* Main Row */}
              <button
                onClick={() => toggleExpand(day.date)}
                className="w-full px-4 py-3.5 flex items-center justify-between gap-3 text-left focus:outline-none"
              >
                {/* Day name */}
                <div className="w-24 shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-100 flex items-center gap-1.5 font-display">
                    <span>{isToday ? 'Today' : day.dayShort}</span>
                    {isToday && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">
                    {day.dayFormatted.split(',')[1] || ''}
                  </div>
                </div>

                {/* Condition + Icon */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <WeatherIcon
                    category={day.conditionCategory}
                    isDay={true}
                    size={22}
                    className="w-5 h-5 shrink-0"
                  />
                  <span className="text-xs text-slate-300 font-medium truncate hidden sm:inline">
                    {day.condition}
                  </span>
                </div>

                {/* Rain probability */}
                <div className="w-14 shrink-0 flex items-center justify-center gap-1 text-xs">
                  <Droplets className="w-3 h-3 text-cyan-400" />
                  <span className={`font-mono font-semibold ${day.rainProb > 40 ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {day.rainProb}%
                  </span>
                </div>

                {/* Temperature Bar */}
                <div className="flex items-center gap-2 w-36 sm:w-48 shrink-0">
                  <span className="text-xs font-bold text-slate-400 w-6 text-right font-mono">
                    {day.tempMin}°
                  </span>
                  <div className="flex-1 h-2 bg-slate-800 rounded-full relative overflow-hidden">
                    <div
                      className="absolute top-0 bottom-0 rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-amber-400"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-bold text-slate-100 w-6 font-mono">
                    {day.tempMax}°
                  </span>
                </div>

                {/* Chevron */}
                <div className="shrink-0 text-slate-400">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {/* Expandable Drawer */}
              {isExpanded && (
                <div className="px-4 py-3 bg-slate-950/70 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunrise className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sunrise</span>
                      <span className="font-mono">{day.sunrise}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Sunset className="w-4 h-4 text-orange-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Sunset</span>
                      <span className="font-mono">{day.sunset}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Sun className="w-4 h-4 text-yellow-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Peak UV Index</span>
                      <span className="font-mono font-semibold text-amber-300">{day.uvIndexMax}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-slate-300">
                    <Wind className="w-4 h-4 text-teal-400 shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block">Max Wind</span>
                      <span className="font-mono">{day.windSpeedMax} km/h</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
