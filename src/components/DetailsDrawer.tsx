import React from 'react';
import { X, Layers, Activity, CloudRain, ShieldCheck, MapPin } from 'lucide-react';
import { NormalizedWeatherData } from '../types';
import { HourlyForecast } from './HourlyForecast';
import { WeatherIntelligenceCard } from './WeatherIntelligenceCard';
import { Recommendations } from './Recommendations';
import { NearbyAssistance } from './NearbyAssistance';

interface DetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: NormalizedWeatherData;
}

export const DetailsDrawer: React.FC<DetailsDrawerProps> = ({
  isOpen,
  onClose,
  weatherData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl h-[92vh] sm:h-[88vh] rounded-3xl backdrop-blur-3xl bg-stone-950/95 border border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300 text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center text-amber-300">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-display">
                Weather Analytics & Hourly Forecast
              </h3>
              <p className="text-xs text-white/50">
                Detailed 24-hour meteorological parameters for {weatherData.location.name}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 custom-scrollbar">
          {/* 1. 24-Hour Forecast */}
          <HourlyForecast hourly={weatherData.hourly} />

          {/* 2. Weather Intelligence & Comfort Breakdown */}
          <WeatherIntelligenceCard
            intelligence={weatherData.intelligence}
            comfortScore={weatherData.comfortScore}
          />

          {/* 3. Action Guide Recommendations */}
          <Recommendations
            current={weatherData.current}
            hourly={weatherData.hourly}
          />

          {/* 4. Contextual Nearby Assistance */}
          <NearbyAssistance
            places={weatherData.nearbyAssistance}
            currentWeather={weatherData.current}
          />
        </div>
      </div>
    </div>
  );
};
