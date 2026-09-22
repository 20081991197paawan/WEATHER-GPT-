import React from 'react';
import { X, Sparkles, Bot, ShieldCheck } from 'lucide-react';
import { NormalizedWeatherData } from '../types';
import { WeatherGptChat } from './WeatherGptChat';

interface WeatherGptModalProps {
  isOpen: boolean;
  onClose: () => void;
  weatherData: NormalizedWeatherData;
}

export const WeatherGptModal: React.FC<WeatherGptModalProps> = ({
  isOpen,
  onClose,
  weatherData,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end p-2 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl h-[92vh] sm:h-[88vh] rounded-3xl backdrop-blur-3xl bg-stone-950/95 border border-white/20 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right-8 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">WeatherGPT</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 border border-orange-400/30 text-amber-300 font-mono">
                  Gemini 3.8 Flash
                </span>
              </div>
              <p className="text-xs text-white/50">
                Atmospheric reasoning for {weatherData.location.name}
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

        {/* Modal Body: The WeatherGPT Chat & Reasoning Engine */}
        <div className="flex-1 overflow-hidden flex flex-col p-2 sm:p-4">
          <WeatherGptChat weatherData={weatherData} />
        </div>
      </div>
    </div>
  );
};
