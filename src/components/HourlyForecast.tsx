import React, { useRef } from 'react';
import { Clock, ChevronLeft, ChevronRight, Droplets, Wind } from 'lucide-react';
import { HourlyForecastItem } from '../types';
import { WeatherIcon } from './WeatherIcon';

interface HourlyForecastProps {
  hourly: HourlyForecastItem[];
}

export const HourlyForecast: React.FC<HourlyForecastProps> = ({ hourly }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -280 : 280;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800/80 shadow-xl backdrop-blur-xl relative">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 text-orange-400 flex items-center justify-center">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              Hourly Forecast
            </h3>
            <p className="text-[11px] text-stone-400">
              Next 24-hour meteorological trajectory
            </p>
          </div>
        </div>

        {/* Scroll Arrows */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => scroll('left')}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
            title="Scroll Left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className="p-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
            title="Scroll Right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Horizontal Cards Scrollable Track */}
      <div
        ref={scrollRef}
        className="flex items-stretch gap-3 overflow-x-auto pb-3 pt-1 custom-scrollbar scroll-smooth"
      >
        {hourly.map((item, idx) => {
          const isNow = idx === 0;

          return (
            <div
              key={item.time}
              className={`flex-shrink-0 w-28 p-3.5 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                isNow
                  ? 'bg-gradient-to-b from-orange-950/80 to-amber-950/60 border-2 border-orange-400/80 shadow-lg shadow-orange-500/15'
                  : 'bg-stone-900/80 border border-stone-800/80 hover:border-stone-700 hover:bg-stone-800/60'
              }`}
            >
              {/* Hour */}
              <div className="mb-2">
                <span className={`text-xs font-bold font-mono ${isNow ? 'text-amber-300' : 'text-stone-300'}`}>
                  {isNow ? 'Now' : item.hourFormatted}
                </span>
              </div>

              {/* Weather Icon */}
              <div className="w-10 h-10 rounded-xl bg-stone-800/60 flex items-center justify-center mb-2 shadow-inner">
                <WeatherIcon
                  category={item.conditionCategory}
                  isDay={item.isDay}
                  size={24}
                  className="w-6 h-6"
                />
              </div>

              {/* Temperature */}
              <div className="text-base font-extrabold text-white font-display mb-2">
                {Math.round(item.temp)}°C
              </div>

              {/* Rain Probability Bar */}
              <div className="w-full mt-auto space-y-2 pt-2 border-t border-stone-800/60">
                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <Droplets className="w-3 h-3 text-amber-400" />
                  <span className="font-mono text-amber-300 font-semibold">{item.rainProb}%</span>
                </div>
                <div className="w-full h-1 bg-stone-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-orange-400 rounded-full"
                    style={{ width: `${item.rainProb}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-stone-400">
                  <Wind className="w-3 h-3 text-orange-400" />
                  <span className="font-mono text-stone-300">{Math.round(item.windSpeed)} km/h</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
