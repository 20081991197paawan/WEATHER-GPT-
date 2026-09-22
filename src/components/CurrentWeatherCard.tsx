import React, { useState } from 'react';
import {
  MapPin,
  Droplets,
  Wind,
  Sun,
  Eye,
  Gauge,
  CloudRain,
  ArrowUpRight,
  RefreshCw,
  Compass,
  Thermometer,
  ShieldCheck,
  Star,
} from 'lucide-react';
import { CurrentWeather, LocationData } from '../types';
import { WeatherIcon } from './WeatherIcon';
import { useFirebase } from '../context/FirebaseContext';

interface CurrentWeatherCardProps {
  weather: CurrentWeather;
  location: LocationData;
  isDemoData: boolean;
  dataSource: string;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const CurrentWeatherCard: React.FC<CurrentWeatherCardProps> = ({
  weather,
  location,
  isDemoData,
  dataSource,
  onRefresh,
  isRefreshing = false,
}) => {
  const [useFahrenheit, setUseFahrenheit] = useState(false);
  const { currentUser, isLocationSaved, saveLocation, deleteLocation, savedLocations, signIn } = useFirebase();

  const isSaved = isLocationSaved(location.latitude, location.longitude);
  const matchedSavedItem = savedLocations.find(
    (loc) => Math.abs(loc.lat - location.latitude) < 0.05 && Math.abs(loc.lon - location.longitude) < 0.05
  );

  const handleToggleSaveLocation = async () => {
    if (!currentUser) {
      await signIn();
      return;
    }
    if (isSaved && matchedSavedItem) {
      await deleteLocation(matchedSavedItem.id);
    } else {
      await saveLocation(location);
    }
  };

  const displayTemp = (c: number) => {
    if (useFahrenheit) {
      return Math.round((c * 9) / 5 + 32);
    }
    return Math.round(c);
  };

  const getUvLevel = (uv: number) => {
    if (uv <= 2) return { text: 'Low', color: 'text-emerald-400', bg: 'bg-emerald-950/60 border-emerald-800/40' };
    if (uv <= 5) return { text: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-950/60 border-yellow-800/40' };
    if (uv <= 7) return { text: 'High', color: 'text-orange-400', bg: 'bg-orange-950/60 border-orange-800/40' };
    if (uv <= 10) return { text: 'Very High', color: 'text-rose-400', bg: 'bg-rose-950/60 border-rose-800/40' };
    return { text: 'Extreme', color: 'text-purple-400', bg: 'bg-purple-950/60 border-purple-800/40' };
  };

  const uvLevel = getUvLevel(weather.uvIndex);

  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="relative rounded-3xl p-6 md:p-8 bg-gradient-to-br from-slate-900/90 via-slate-900/70 to-slate-950/90 border border-slate-800/80 shadow-2xl backdrop-blur-2xl overflow-hidden group">
      {/* Subtle top atmospheric glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      {/* Top Header Row */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-cyan-400 font-medium text-sm mb-1">
            <MapPin className="w-4 h-4 shrink-0" />
            <span className="tracking-wide">
              {location.name}
              {location.region ? `, ${location.region}` : ''} • {location.country}
            </span>
            <button
              onClick={handleToggleSaveLocation}
              title={isSaved ? "Saved to Firebase Cloud" : "Save location to Firebase Cloud"}
              className={`p-1.5 rounded-full transition cursor-pointer flex items-center gap-1 text-xs ${
                isSaved
                  ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 hover:bg-amber-400/30'
                  : 'bg-white/[0.06] text-white/50 border border-white/10 hover:text-amber-300 hover:bg-white/10'
              }`}
            >
              <Star className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
              <span className="text-[10px] hidden sm:inline">
                {isSaved ? 'Saved' : 'Save'}
              </span>
            </button>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-2">
            <span>{currentDateFormatted}</span>
            <span>•</span>
            <span className="font-mono text-slate-400">Lat {location.latitude.toFixed(2)}°, Lon {location.longitude.toFixed(2)}°</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Unit Toggle °C / °F */}
          <div className="flex items-center p-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-slate-400">
            <button
              onClick={() => setUseFahrenheit(false)}
              className={`px-2 py-1 rounded-lg transition ${
                !useFahrenheit ? 'bg-cyan-500 text-slate-950 shadow' : 'hover:text-slate-200'
              }`}
            >
              °C
            </button>
            <button
              onClick={() => setUseFahrenheit(true)}
              className={`px-2 py-1 rounded-lg transition ${
                useFahrenheit ? 'bg-cyan-500 text-slate-950 shadow' : 'hover:text-slate-200'
              }`}
            >
              °F
            </button>
          </div>

          {/* Refresh Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              title="Refresh Meteorological Station Feed"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 text-slate-300 hover:text-white transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Main Temperature & Visuals Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center mb-8 relative z-10">
        {/* Left: Large Temperature + Condition */}
        <div className="md:col-span-7 flex items-center gap-6">
          <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-slate-800/60 border border-slate-700/50 shadow-inner shrink-0">
            <WeatherIcon
              category={weather.conditionCategory}
              isDay={weather.isDay}
              size={56}
              className="w-14 h-14"
            />
          </div>

          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl sm:text-7xl font-extrabold tracking-tight text-white font-display">
                {displayTemp(weather.temp)}
              </span>
              <span className="text-3xl sm:text-4xl font-light text-cyan-400 font-display">
                °{useFahrenheit ? 'F' : 'C'}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-lg font-semibold text-slate-100">
                {weather.condition}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                Feels like {displayTemp(weather.feelsLike)}°{useFahrenheit ? 'F' : 'C'}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-2 text-xs text-slate-400">
              <span>Low: <strong className="text-slate-200">{displayTemp(weather.tempMinToday)}°</strong></span>
              <span>•</span>
              <span>High: <strong className="text-slate-200">{displayTemp(weather.tempMaxToday)}°</strong></span>
            </div>
          </div>
        </div>

        {/* Right: Rain Threat Summary Highlight */}
        <div className="md:col-span-5 p-4 rounded-2xl bg-slate-800/40 border border-slate-700/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 text-cyan-300">
              <CloudRain className="w-4 h-4 text-cyan-400" />
              Precipitation Probability
            </span>
            <span className="font-mono text-cyan-400 font-bold">{weather.rainProb}%</span>
          </div>

          {/* Rain Probability Bar */}
          <div className="w-full h-2.5 rounded-full bg-slate-900 border border-slate-700/80 overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                weather.rainProb > 60
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-500'
                  : weather.rainProb > 25
                  ? 'bg-cyan-500'
                  : 'bg-slate-600'
              }`}
              style={{ width: `${Math.max(4, weather.rainProb)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Current rainfall: <strong className="text-slate-200">{weather.precipitationMm} mm/h</strong></span>
            <span>Cloud cover: <strong className="text-slate-200">{weather.cloudCover}%</strong></span>
          </div>
        </div>
      </div>

      {/* Atmospheric Metric Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 relative z-10">
        {/* Rain Probability */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Droplets className="w-3.5 h-3.5 text-cyan-400" />
            <span>Rain Prob</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display">
            {weather.rainProb}%
          </div>
          <div className="text-[10px] text-slate-400">
            {weather.rainProb >= 60 ? 'Heavy risk' : weather.rainProb >= 25 ? 'Spotty' : 'Minimal'}
          </div>
        </div>

        {/* Humidity */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Thermometer className="w-3.5 h-3.5 text-blue-400" />
            <span>Humidity</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display">
            {weather.humidity}%
          </div>
          <div className="text-[10px] text-slate-400">
            {weather.humidity > 70 ? 'Muggy & humid' : weather.humidity < 35 ? 'Dry air' : 'Comfortable'}
          </div>
        </div>

        {/* Wind Speed & Direction */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Wind className="w-3.5 h-3.5 text-teal-400" />
            <span>Wind Speed</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display flex items-center gap-1">
            <span>{weather.windSpeed}</span>
            <span className="text-xs font-normal text-slate-400">km/h</span>
          </div>
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Compass className="w-3 h-3 text-slate-400" />
            <span>Dir {weather.windDirection}°</span>
          </div>
        </div>

        {/* UV Index */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>UV Index</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display flex items-center gap-1.5">
            <span>{weather.uvIndex}</span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${uvLevel.bg} ${uvLevel.color}`}>
              {uvLevel.text}
            </span>
          </div>
          <div className="text-[10px] text-slate-400">
            {weather.uvIndex >= 6 ? 'SPF 30+ advised' : 'Safe exposure'}
          </div>
        </div>

        {/* Visibility */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Eye className="w-3.5 h-3.5 text-sky-400" />
            <span>Visibility</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display">
            {weather.visibility} <span className="text-xs font-normal text-slate-400">km</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {weather.visibility >= 9 ? 'Optimal clarity' : 'Reduced sight'}
          </div>
        </div>

        {/* Surface Pressure */}
        <div className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/30 transition">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1">
            <Gauge className="w-3.5 h-3.5 text-indigo-400" />
            <span>Pressure</span>
          </div>
          <div className="text-lg font-bold text-slate-100 font-display">
            {weather.pressure} <span className="text-xs font-normal text-slate-400">hPa</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {weather.pressure < 1008 ? 'Low depression' : 'Stable barometric'}
          </div>
        </div>
      </div>

      {/* Verified Ground Truth Badge */}
      <div className="mt-5 pt-3 border-t border-slate-800/60 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>{dataSource}</span>
        </div>
        {isDemoData && (
          <span className="font-bold text-amber-400 uppercase tracking-wide px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800/40">
            DEMO DATA (Simulated Scenario)
          </span>
        )}
      </div>
    </div>
  );
};
