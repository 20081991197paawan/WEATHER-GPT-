import React from 'react';
import {
  Sparkles,
  Compass,
  CheckCircle,
  AlertCircle,
  Clock,
  Car,
  Activity,
  Award,
} from 'lucide-react';
import { ComfortScore, WeatherIntelligence } from '../types';

interface WeatherIntelligenceCardProps {
  intelligence: WeatherIntelligence;
  comfortScore: ComfortScore;
}

export const WeatherIntelligenceCard: React.FC<WeatherIntelligenceCardProps> = ({
  intelligence,
  comfortScore,
}) => {
  const getRatingColor = (rating: ComfortScore['rating']) => {
    switch (rating) {
      case 'Exceptional':
        return { text: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-500/40', ring: 'stroke-emerald-400' };
      case 'Good':
        return { text: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/40', ring: 'stroke-amber-400' };
      case 'Moderate':
        return { text: 'text-amber-400', bg: 'bg-amber-950/60 border-amber-500/40', ring: 'stroke-amber-400' };
      case 'Poor':
        return { text: 'text-orange-400', bg: 'bg-orange-950/60 border-orange-500/40', ring: 'stroke-orange-400' };
      default:
        return { text: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-500/40', ring: 'stroke-rose-400' };
    }
  };

  const scoreStyle = getRatingColor(comfortScore.rating);

  // SVG circular gauge math
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (comfortScore.score / 100) * circumference;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Today's Weather Intelligence (AI Summary Card) */}
      <div className="lg:col-span-7 rounded-3xl p-6 bg-gradient-to-br from-stone-900/90 via-stone-900/80 to-stone-950 border border-stone-800/80 shadow-xl backdrop-blur-xl relative overflow-hidden flex flex-col justify-between">
        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div>
          {/* Header */}
          <div className="flex items-center justify-between gap-2 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-orange-950 border border-orange-500/40 text-amber-400 flex items-center justify-center shadow">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-white font-display">
                Today's Weather Intelligence
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-800 text-amber-300 border border-stone-700">
              Gemini 3.8 Flash Synthesis
            </span>
          </div>

          <h4 className="text-sm font-semibold text-amber-300 mb-2 font-display">
            {intelligence.headline}
          </h4>

          <p className="text-xs md:text-sm text-stone-300 leading-relaxed mb-4">
            {intelligence.summary}
          </p>

          {/* Key Takeaways */}
          <div className="space-y-2 mb-4">
            {intelligence.keyTakeaways.map((point, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-stone-300">
                <CheckCircle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                <span>{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Guidance: Best Outdoor Window & Travel Safety */}
        <div className="pt-4 border-t border-stone-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/60 flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">Optimal Outdoor Window</span>
              <span className="font-semibold text-stone-200">{intelligence.bestOutdoorWindow}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-stone-950/60 border border-stone-800/60 flex items-center gap-2.5">
            <Car className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-stone-400 block font-medium">Transit & Commute Guidance</span>
              <span className="text-stone-300 text-[11px] leading-tight line-clamp-2">{intelligence.travelSafetyAdvice}</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Outdoor Comfort Estimate (Weather Score Card) */}
      <div className="lg:col-span-5 rounded-3xl p-6 bg-gradient-to-br from-stone-900/90 via-stone-900/80 to-stone-950 border border-stone-800/80 shadow-xl backdrop-blur-xl flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 text-amber-400 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white font-display">
                  Outdoor Comfort
                </h3>
                <span className="text-[10px] text-stone-400 block">
                  AI Outdoor Comfort Estimate
                </span>
              </div>
            </div>

            <span className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${scoreStyle.bg} ${scoreStyle.text}`}>
              {comfortScore.rating}
            </span>
          </div>

          {/* Gauge + Description */}
          <div className="flex items-center gap-6 my-3">
            {/* Circular Gauge */}
            <div className="relative w-24 h-24 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-stone-800"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`${scoreStyle.ring} transition-all duration-1000 ease-out`}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white font-display">
                  {comfortScore.score}
                </span>
                <span className="text-[10px] text-stone-400 font-mono font-medium">
                  /100
                </span>
              </div>
            </div>

            <div>
              <p className="text-xs text-stone-300 leading-relaxed">
                {comfortScore.description}
              </p>
              <p className="text-[10px] text-stone-400 mt-1 italic">
                Derived algorithmically from thermal index, humidity, wind shear, and UV.
              </p>
            </div>
          </div>

          {/* Factor breakdown chips */}
          <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-2">
            <div className="text-[11px] font-bold text-stone-400 uppercase tracking-wider mb-1">
              Atmospheric Factor Breakdown
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60 flex items-center justify-between">
                <span className="text-stone-400">Thermal:</span>
                <span className={`font-semibold ${comfortScore.factors.temperature.impact === 'negative' ? 'text-rose-400' : comfortScore.factors.temperature.impact === 'neutral' ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {comfortScore.factors.temperature.value}°C
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60 flex items-center justify-between">
                <span className="text-stone-400">Humidity:</span>
                <span className={`font-semibold ${comfortScore.factors.humidity.impact === 'negative' ? 'text-rose-400' : 'text-stone-200'}`}>
                  {comfortScore.factors.humidity.value}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60 flex items-center justify-between">
                <span className="text-stone-400">Rain Threat:</span>
                <span className={`font-semibold ${comfortScore.factors.rain.impact === 'negative' ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {comfortScore.factors.rain.value}%
                </span>
              </div>

              <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60 flex items-center justify-between">
                <span className="text-stone-400">Wind:</span>
                <span className="font-semibold text-stone-200">
                  {comfortScore.factors.wind.value} km/h
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 text-[10px] text-stone-400 text-right">
          Non-official AI estimate for outdoor planning
        </div>
      </div>
    </div>
  );
};
