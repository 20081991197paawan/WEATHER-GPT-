import React from 'react';
import { Clock, TrendingUp, CloudRain } from 'lucide-react';
import { HourlyForecastItem } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface SmartTimelineProps {
  hourly: HourlyForecastItem[];
}

export const SmartTimeline: React.FC<SmartTimelineProps> = ({ hourly }) => {
  // Pick intervals: e.g. every 2-3 hours for the next 12 hours
  const timelineSteps = hourly.filter((_, idx) => idx % 2 === 0).slice(0, 6);

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950 border border-slate-800/80 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Smart Weather Timeline
            </h3>
            <p className="text-[11px] text-slate-400">
              Anticipated meteorological shift over the next 12 hours
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-400">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Rain threat
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span> Thermal transition
          </span>
        </div>
      </div>

      {/* Timeline Progression Track */}
      <div className="relative">
        {/* Horizontal Connector Line for Desktop */}
        <div className="hidden md:block absolute top-1/2 left-6 right-6 h-0.5 bg-gradient-to-r from-cyan-500/40 via-blue-500/40 to-slate-700 -translate-y-6 z-0" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 relative z-10">
          {timelineSteps.map((step, idx) => {
            const isRainy = step.rainProb >= 50;
            const isHighHeat = step.temp >= 35;

            return (
              <div
                key={step.time}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col items-center text-center ${
                  isRainy
                    ? 'bg-blue-950/40 border-blue-500/40 shadow-lg shadow-blue-500/10'
                    : isHighHeat
                    ? 'bg-amber-950/40 border-amber-500/40'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Time Label */}
                <span className="text-xs font-bold text-slate-300 font-mono mb-2">
                  {step.hourFormatted}
                </span>

                {/* Weather Icon */}
                <div className="w-12 h-12 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center mb-2 shadow-inner">
                  <WeatherIcon
                    category={step.conditionCategory}
                    isDay={step.isDay}
                    size={28}
                    className="w-7 h-7"
                  />
                </div>

                {/* Temperature */}
                <div className="text-base font-extrabold text-white font-display mb-1">
                  {Math.round(step.temp)}°C
                </div>

                {/* Condition text */}
                <div className="text-[11px] font-medium text-slate-300 line-clamp-1 mb-2">
                  {step.condition}
                </div>

                {/* Rain Probability Pill */}
                <div className="mt-auto w-full pt-2 border-t border-slate-800/60 flex items-center justify-center gap-1">
                  <CloudRain className={`w-3 h-3 ${isRainy ? 'text-cyan-400' : 'text-slate-500'}`} />
                  <span className={`text-[11px] font-mono font-semibold ${isRainy ? 'text-cyan-400' : 'text-slate-400'}`}>
                    {step.rainProb}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
