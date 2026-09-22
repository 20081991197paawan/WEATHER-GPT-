import React from 'react';
import {
  Umbrella,
  Sun,
  Droplets,
  Shirt,
  Car,
  Bike,
  Sparkles,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CurrentWeather, HourlyForecastItem } from '../types';

interface RecommendationsProps {
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
}

export const Recommendations: React.FC<RecommendationsProps> = ({ current, hourly }) => {
  const next6Hours = hourly.slice(0, 6);
  const maxRain = Math.max(current.rainProb, ...next6Hours.map((h) => h.rainProb));
  const maxTemp = Math.max(current.temp, ...next6Hours.map((h) => h.temp));
  const minTemp = Math.min(current.temp, ...next6Hours.map((h) => h.temp));
  const maxUv = Math.max(current.uvIndex, ...next6Hours.map((h) => h.uvIndex));
  const maxWind = Math.max(current.windSpeed, ...next6Hours.map((h) => h.windSpeed));

  // Dynamic contextual recommendations strictly based on actual weather data
  const recs = [
    {
      id: 'umbrella',
      icon: Umbrella,
      title: maxRain >= 60 ? 'Carry Sturdy Umbrella' : maxRain >= 30 ? 'Pack Compact Umbrella' : 'No Umbrella Needed',
      badge: maxRain >= 60 ? 'Essential' : maxRain >= 30 ? 'Standby' : 'Clear',
      badgeColor: maxRain >= 60 ? 'bg-orange-950 text-amber-300 border-orange-500/40' : maxRain >= 30 ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-stone-800 text-stone-400 border-stone-700',
      description: maxRain >= 60
        ? `Precipitation threat peaks at ${maxRain}%. Water-resistant rain gear is strongly advised.`
        : maxRain >= 30
        ? `Moderate shower probability (${maxRain}%). A compact umbrella in your bag prevents surprises.`
        : `Only ${maxRain}% rain probability throughout the next 6 hours. Travel without rain gear.`,
    },
    {
      id: 'sunscreen',
      icon: Sun,
      title: maxUv >= 8 ? 'Very High UV: SPF 50+ Required' : maxUv >= 6 ? 'High UV: SPF 30+ Advised' : maxUv >= 3 ? 'Moderate UV: Sunscreen Recommended' : 'Low UV: Minimal Sun Protection',
      badge: maxUv >= 6 ? 'Action' : 'Normal',
      badgeColor: maxUv >= 6 ? 'bg-orange-950 text-orange-300 border-orange-500/40' : 'bg-stone-800 text-stone-400 border-stone-700',
      description: maxUv >= 6
        ? `Peak UV index hits ${maxUv}. Wear UV-protective sunglasses and reapply sunscreen every 2 hours.`
        : `UV level is around ${maxUv}. Natural sun exposure is generally safe for short durations.`,
    },
    {
      id: 'hydration',
      icon: Droplets,
      title: maxTemp >= 35 ? 'Intense Hydration: Drink 3+ Liters' : maxTemp >= 28 ? 'Stay Well Hydrated' : 'Normal Hydration Routine',
      badge: maxTemp >= 35 ? 'Critical' : 'Routine',
      badgeColor: maxTemp >= 35 ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-stone-800 text-stone-400 border-stone-700',
      description: maxTemp >= 35
        ? `Thermal index reaches ${Math.round(current.feelsLike)}°C. Carry electrolytes and avoid heat exhaustion.`
        : `Ambient thermal comfort is moderate. Maintain standard fluid intake throughout the day.`,
    },
    {
      id: 'apparel',
      icon: Shirt,
      title: minTemp < 16 ? 'Wear Light Jacket or Layer' : maxTemp > 32 ? 'Lightweight Breathable Fabrics' : 'Standard Casual Attire',
      badge: 'Attire',
      badgeColor: 'bg-stone-800 text-stone-300 border-stone-700',
      description: minTemp < 16
        ? `Cooler temperatures dipping to ${minTemp}°C during evening hours. A light jacket is recommended.`
        : maxTemp > 32
        ? `High ambient warmth. Wear loose cottons or moisture-wicking materials to stay cool.`
        : `Comfortable thermal band between ${minTemp}°C and ${maxTemp}°C suitable for standard clothing.`,
    },
    {
      id: 'transit',
      icon: Car,
      title: maxRain >= 60 || maxWind >= 40 ? 'Allow Extra Commute Buffer' : 'Clear Roadway Flow Expected',
      badge: maxRain >= 60 ? 'Delay Risk' : 'Optimal',
      badgeColor: maxRain >= 60 ? 'bg-amber-950 text-amber-300 border-amber-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
      description: maxRain >= 60
        ? `Wet road surfaces and possible waterlogging may slow traffic. Plan 15–20 min extra transit time.`
        : `Dry road conditions with good visibility (${current.visibility} km) support smooth transit.`,
    },
    {
      id: 'outdoor',
      icon: Bike,
      title: maxRain > 50 || maxTemp > 38 ? 'Indoor Exercise Preferred' : 'Optimal Window for Outdoor Sports',
      badge: maxRain > 50 || maxTemp > 38 ? 'Caution' : 'Favorable',
      badgeColor: maxRain > 50 || maxTemp > 38 ? 'bg-rose-950 text-rose-300 border-rose-500/40' : 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
      description: maxRain > 50
        ? 'Rainfall interrupts open ground sports. Consider gym or covered sports arenas today.'
        : maxTemp > 38
        ? 'High thermal stress during afternoon. Schedule running or cricket before 8 AM or after 6 PM.'
        : 'Pleasant atmospheric parameters. Great conditions for outdoor cycling, cricket, and jogging.',
    },
  ];

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800/80 shadow-xl backdrop-blur-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display">
              What should I do?
            </h3>
            <p className="text-[11px] text-stone-400">
              AI-generated contextual action guide strictly grounded in forecast conditions
            </p>
          </div>
        </div>

        <span className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-stone-800 text-amber-300 border border-stone-700">
          Personalized Actions
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recs.map((rec) => {
          const Icon = rec.icon;
          return (
            <div
              key={rec.id}
              className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 hover:border-orange-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-9 h-9 rounded-xl bg-stone-800/80 border border-stone-700/60 text-amber-400 flex items-center justify-center shadow-inner">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${rec.badgeColor}`}>
                    {rec.badge}
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-100 mb-1 font-display">
                  {rec.title}
                </h4>

                <p className="text-xs text-stone-400 leading-relaxed">
                  {rec.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
