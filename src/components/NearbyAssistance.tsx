import React, { useState } from 'react';
import {
  MapPin,
  Navigation,
  Phone,
  Umbrella,
  Shield,
  Clock,
  Sparkles,
  ExternalLink,
  Store,
} from 'lucide-react';
import { NearbyPlace, CurrentWeather } from '../types';

interface NearbyAssistanceProps {
  places: NearbyPlace[];
  currentWeather: CurrentWeather;
}

export const NearbyAssistance: React.FC<NearbyAssistanceProps> = ({
  places,
  currentWeather,
}) => {
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  const isRainy = currentWeather.rainProb >= 40 || currentWeather.precipitationMm > 0.5;
  const isHot = currentWeather.temp >= 35;

  const getCategoryBadge = (cat: NearbyPlace['category']) => {
    switch (cat) {
      case 'umbrella_shop':
        return { label: 'Rain Gear & Umbrellas', icon: Umbrella, color: 'text-amber-400 bg-amber-950/60 border-amber-500/40' };
      case 'shelter':
        return { label: 'Covered Transit Shelter', icon: Shield, color: 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40' };
      case 'cooling_center':
        return { label: 'Cooling Hub / Hydration', icon: Sparkles, color: 'text-orange-400 bg-orange-950/60 border-orange-500/40' };
      default:
        return { label: 'Medical & Emergency Care', icon: Store, color: 'text-rose-400 bg-rose-950/60 border-rose-500/40' };
    }
  };

  return (
    <div className="rounded-3xl p-6 bg-gradient-to-br from-stone-900/90 via-stone-900/70 to-stone-950 border border-stone-800/80 shadow-xl backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-stone-800 border border-stone-700 text-orange-400 flex items-center justify-center">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white font-display flex items-center gap-2">
              Nearby Assistance
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800">
                {isRainy ? 'Active Rain Shelters & Gear' : isHot ? 'Hydration & Cooling Shelters' : 'Weather Services'}
              </span>
            </h3>
            <p className="text-[11px] text-stone-400">
              Contextual safe points, umbrella outlets, and emergency stations nearby
            </p>
          </div>
        </div>

        <span className="text-xs text-stone-400">
          Radius: ~2.0 km around current coordinates
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {places.map((place) => {
          const cat = getCategoryBadge(place.category);
          const CatIcon = cat.icon;

          return (
            <div
              key={place.id}
              className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/80 hover:border-orange-500/40 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${cat.color}`}>
                    <CatIcon className="w-3 h-3" />
                    {cat.label}
                  </span>
                  <span className="text-xs font-mono text-amber-400 font-bold flex items-center gap-1">
                    <Navigation className="w-3 h-3" />
                    {place.distanceKm} km
                  </span>
                </div>

                <h4 className="text-sm font-bold text-stone-100 mb-1 font-display">
                  {place.name}
                </h4>

                <p className="text-xs text-stone-400 flex items-start gap-1.5 mb-2">
                  <MapPin className="w-3.5 h-3.5 text-stone-500 shrink-0 mt-0.5" />
                  <span>{place.address}</span>
                </p>

                <div className="p-2.5 rounded-xl bg-stone-950/60 border border-stone-800/60 text-xs text-stone-300 mb-3">
                  <strong className="text-amber-300 block text-[10px] uppercase tracking-wider mb-0.5">
                    Weather Utility:
                  </strong>
                  <span>{place.weatherUtility}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-stone-800/60 flex items-center justify-between text-xs">
                <span className="text-[11px] text-emerald-400 font-medium">
                  {place.openStatus.split('•')[0]}
                </span>

                <button
                  onClick={() => {
                    const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${place.name} ${place.address}`
                    )}`;
                    window.open(googleMapsUrl, '_blank', 'noopener,noreferrer');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-orange-300 hover:text-white border border-stone-700 flex items-center gap-1 text-xs transition"
                >
                  <span>Directions</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
