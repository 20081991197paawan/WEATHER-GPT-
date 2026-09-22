import React, { useState, useEffect, useId } from 'react';
import {
  Sun,
  Droplets,
  Wind,
  Compass,
  Sliders,
  Check,
  RotateCcw,
  Sparkles,
  Info,
  ChevronDown,
  Gauge,
  Eye,
  Layers,
} from 'lucide-react';
import { CurrentWeather, DailyForecastItem } from '../types';

export type WidgetId = 'uv' | 'humidity' | 'wind' | 'pressure' | 'visibility';

export interface CustomizableWeatherWidgetsProps {
  current: CurrentWeather;
  todayForecast?: DailyForecastItem;
  useFahrenheit: boolean;
  className?: string;
}

interface WidgetDefinition {
  id: WidgetId;
  label: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const ALL_WIDGETS: WidgetDefinition[] = [
  {
    id: 'uv',
    label: 'UV Index',
    category: 'Solar Radiation',
    icon: Sun,
    description: 'Ultraviolet strength, risk category & skin protection advice',
  },
  {
    id: 'humidity',
    label: 'Humidity',
    category: 'Moisture',
    icon: Droplets,
    description: 'Relative atmospheric moisture & calculated dew point',
  },
  {
    id: 'wind',
    label: 'Wind Direction',
    category: 'Airflow & Speed',
    icon: Compass,
    description: 'Live compass vector, directional bearing & Beaufort scale',
  },
  {
    id: 'pressure',
    label: 'Pressure',
    category: 'Barometric',
    icon: Gauge,
    description: 'Atmospheric pressure tendencies and barometric altitude',
  },
  {
    id: 'visibility',
    label: 'Visibility',
    category: 'Atmosphere',
    icon: Eye,
    description: 'Horizontal distance clarity and optical conditions',
  },
];

const DEFAULT_WIDGET_IDS: WidgetId[] = ['uv', 'humidity', 'wind'];
const STORAGE_KEY = 'weather_dashboard_enabled_widgets_v2';

// Helper: Convert degrees to 16-point cardinal direction
function getCardinalDirection(degrees: number): { short: string; long: string } {
  const normalized = ((degrees % 360) + 360) % 360;
  const directions = [
    { short: 'N', long: 'North' },
    { short: 'NNE', long: 'North-Northeast' },
    { short: 'NE', long: 'Northeast' },
    { short: 'ENE', long: 'East-Northeast' },
    { short: 'E', long: 'East' },
    { short: 'ESE', long: 'East-Southeast' },
    { short: 'SE', long: 'Southeast' },
    { short: 'SSE', long: 'South-Southeast' },
    { short: 'S', long: 'South' },
    { short: 'SSW', long: 'South-Southwest' },
    { short: 'SW', long: 'Southwest' },
    { short: 'WSW', long: 'West-Southwest' },
    { short: 'W', long: 'West' },
    { short: 'WNW', long: 'West-Northwest' },
    { short: 'NW', long: 'Northwest' },
    { short: 'NNW', long: 'North-Northwest' },
  ];
  const index = Math.round(normalized / 22.5) % 16;
  return directions[index];
}

// Helper: Beaufort wind speed category
function getBeaufortScale(speedKmh: number): { level: number; name: string; desc: string } {
  if (speedKmh < 2) return { level: 0, name: 'Calm', desc: 'Smoke rises vertically' };
  if (speedKmh <= 5) return { level: 1, name: 'Light Air', desc: 'Direction shown by smoke drift' };
  if (speedKmh <= 11) return { level: 2, name: 'Light Breeze', desc: 'Wind felt on face; leaves rustle' };
  if (speedKmh <= 19) return { level: 3, name: 'Gentle Breeze', desc: 'Leaves in motion; light flags extend' };
  if (speedKmh <= 28) return { level: 4, name: 'Moderate Breeze', desc: 'Raises dust and small branches move' };
  if (speedKmh <= 38) return { level: 5, name: 'Fresh Breeze', desc: 'Small trees in leaf begin to sway' };
  if (speedKmh <= 49) return { level: 6, name: 'Strong Breeze', desc: 'Large branches in motion; whistling' };
  return { level: 7, name: 'High Wind', desc: 'Whole trees in motion; resistance walking' };
}

// Helper: UV Index evaluation
function getUvInfo(uv: number): { label: string; color: string; badgeBg: string; advice: string } {
  if (uv < 3) {
    return {
      label: 'Low',
      color: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      advice: 'Minimal sun hazard. No protection needed under normal exposure.',
    };
  }
  if (uv < 6) {
    return {
      label: 'Moderate',
      color: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
      advice: 'Wear sunglasses, a sun hat, and apply SPF 30+ during peak hours.',
    };
  }
  if (uv < 8) {
    return {
      label: 'High',
      color: 'text-orange-700',
      badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
      advice: 'Protection required. Seek shade during midday; reapply sunscreen.',
    };
  }
  if (uv < 11) {
    return {
      label: 'Very High',
      color: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-800 border-rose-200',
      advice: 'Extra protection essential. Avoid midday direct sun exposure.',
    };
  }
  return {
    label: 'Extreme',
    color: 'text-purple-700',
    badgeBg: 'bg-purple-50 text-purple-800 border-purple-200',
    advice: 'Take full precautions. Unprotected skin can burn within minutes.',
  };
}

// Helper: Humidity comfort scale
function getHumidityComfort(humidity: number): { status: string; note: string; color: string; bg: string } {
  if (humidity < 30) {
    return {
      status: 'Dry',
      note: 'Low moisture. Hydration and moisturizing advised.',
      color: 'text-amber-800',
      bg: 'bg-amber-50 border-amber-200',
    };
  }
  if (humidity <= 60) {
    return {
      status: 'Optimal Comfort',
      note: 'Ideal atmospheric moisture for skin & breathing.',
      color: 'text-emerald-800',
      bg: 'bg-emerald-50 border-emerald-200',
    };
  }
  if (humidity <= 75) {
    return {
      status: 'Moderately Humid',
      note: 'Noticeable moisture; feels slightly warm in sunlight.',
      color: 'text-cyan-800',
      bg: 'bg-cyan-50 border-cyan-200',
    };
  }
  return {
    status: 'High Moisture / Muggy',
    note: 'Thick humid air; perspiration evaporates slower.',
    color: 'text-blue-800',
    bg: 'bg-blue-50 border-blue-200',
  };
}

export const CustomizableWeatherWidgets: React.FC<CustomizableWeatherWidgetsProps> = ({
  current,
  todayForecast,
  useFahrenheit,
  className = '',
}) => {
  const [enabledWidgets, setEnabledWidgets] = useState<WidgetId[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as WidgetId[];
        }
      }
    } catch {
      // Fallback
    }
    return DEFAULT_WIDGET_IDS;
  });

  const [isCustomizeOpen, setIsCustomizeOpen] = useState(false);
  const dropdownId = useId();

  // Save to localStorage on changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(enabledWidgets));
    } catch {
      // Ignore storage errors
    }
  }, [enabledWidgets]);

  const toggleWidget = (id: WidgetId) => {
    setEnabledWidgets((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const resetToDefault = () => {
    setEnabledWidgets(DEFAULT_WIDGET_IDS);
  };

  const selectAll = () => {
    setEnabledWidgets(ALL_WIDGETS.map((w) => w.id));
  };

  // Convert km/h to mph if useFahrenheit
  const displaySpeed = (kmh: number) => {
    if (useFahrenheit) {
      return `${Math.round(kmh * 0.621371)} mph`;
    }
    return `${Math.round(kmh)} km/h`;
  };

  // Cardinal direction and Beaufort for wind
  const windDirDeg = current.windDirection || 0;
  const cardinal = getCardinalDirection(windDirDeg);
  const beaufort = getBeaufortScale(current.windSpeed || 0);

  // UV evaluation
  const uvVal = current.uvIndex !== undefined ? current.uvIndex : 3.5;
  const uvInfo = getUvInfo(uvVal);
  const maxUvToday = todayForecast?.uvIndexMax ?? Math.max(uvVal, 6);

  // Humidity & Dew Point calculation
  const humidityVal = current.humidity !== undefined ? current.humidity : 65;
  const humidityInfo = getHumidityComfort(humidityVal);
  const dewPoint = current.dewPoint ?? Math.round(current.temp - (100 - humidityVal) / 5);

  return (
    <section className={`w-full mt-5 ${className}`}>
      {/* ------------------------------------------------------------- */}
      {/* SECTION HEADER & CUSTOMIZATION TOGGLES */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 px-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-2xs">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-base text-stone-900 tracking-tight">
                Atmospheric Widgets
              </h3>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 border border-stone-200">
                {enabledWidgets.length} active
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Interactive telemetry cards tailored for UV, moisture, and airflow dynamics
            </p>
          </div>
        </div>

        {/* Quick Toggles & Customize Button */}
        <div className="relative flex items-center gap-1.5 flex-wrap">
          {/* Quick toggle chips for primary 3 widgets */}
          {ALL_WIDGETS.slice(0, 3).map((w) => {
            const isEnabled = enabledWidgets.includes(w.id);
            const Icon = w.icon;
            return (
              <button
                key={w.id}
                onClick={() => toggleWidget(w.id)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition cursor-pointer border ${
                  isEnabled
                    ? 'bg-stone-900 text-white border-stone-900 shadow-2xs'
                    : 'bg-white text-stone-500 hover:text-stone-800 border-stone-200 hover:bg-stone-50'
                }`}
                title={`Toggle ${w.label} card`}
              >
                <Icon className={`w-3.5 h-3.5 ${isEnabled ? 'text-amber-400' : 'text-stone-400'}`} />
                <span>{w.label}</span>
                {isEnabled && <Check className="w-3 h-3 text-emerald-400 ml-0.5" />}
              </button>
            );
          })}

          {/* Customize Dropdown Menu */}
          <div className="relative">
            <button
              onClick={() => setIsCustomizeOpen(!isCustomizeOpen)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-white hover:bg-stone-50 text-stone-700 border border-stone-200 transition shadow-2xs cursor-pointer"
              title="Customize widget layout"
            >
              <Sliders className="w-3 h-3 text-stone-500" />
              <span>Customize</span>
              <ChevronDown className="w-3 h-3 text-stone-400" />
            </button>

            {isCustomizeOpen && (
              <div
                id={dropdownId}
                className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-xl border border-stone-200 p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-stone-800"
              >
                <div className="flex items-center justify-between pb-2 mb-2.5 border-b border-stone-100">
                  <div className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-orange-500" />
                    <span className="font-bold text-xs text-stone-900">Manage Grid Widgets</span>
                  </div>
                  <button
                    onClick={resetToDefault}
                    className="text-[10px] text-stone-400 hover:text-orange-600 font-semibold flex items-center gap-1 cursor-pointer"
                    title="Reset to default 3 widgets"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset</span>
                  </button>
                </div>

                <p className="text-[11px] text-stone-500 mb-3">
                  Toggle which telemetry cards are visible in your dashboard grid.
                </p>

                <div className="space-y-1.5 mb-3">
                  {ALL_WIDGETS.map((item) => {
                    const isChecked = enabledWidgets.includes(item.id);
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleWidget(item.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer border ${
                          isChecked
                            ? 'bg-orange-50/70 border-orange-200 text-stone-900'
                            : 'bg-stone-50/60 hover:bg-stone-100 border-transparent text-stone-600'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                              isChecked ? 'bg-orange-500 text-white' : 'bg-stone-200 text-stone-600'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-stone-800 leading-tight">
                              {item.label}
                            </div>
                            <div className="text-[10px] text-stone-400">{item.category}</div>
                          </div>
                        </div>

                        {/* Switch Pill */}
                        <div
                          className={`w-9 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out ${
                            isChecked ? 'bg-orange-500' : 'bg-stone-300'
                          }`}
                        >
                          <div
                            className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform duration-200 ease-in-out ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px]">
                  <button
                    onClick={selectAll}
                    className="text-stone-500 hover:text-stone-800 font-semibold cursor-pointer"
                  >
                    Select All ({ALL_WIDGETS.length})
                  </button>
                  <button
                    onClick={() => setIsCustomizeOpen(false)}
                    className="text-orange-600 font-bold hover:text-orange-700 cursor-pointer"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* EMPTY STATE IF ALL WIDGETS TOGGLED OFF */}
      {/* ------------------------------------------------------------- */}
      {enabledWidgets.length === 0 && (
        <div className="bg-white rounded-[24px] p-6 text-center border border-dashed border-stone-200 my-2">
          <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 mx-auto flex items-center justify-center mb-2">
            <Sliders className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-bold text-stone-800">All environmental widgets are hidden</h4>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Customize your layout or toggle UV Index, humidity, and wind direction back on to view live telemetry.
          </p>
          <button
            onClick={resetToDefault}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-stone-900 text-white text-xs font-semibold hover:bg-stone-800 transition cursor-pointer shadow-xs"
          >
            <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
            <span>Restore UV, Humidity & Wind Widgets</span>
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* WIDGETS RESPONSIVE GRID */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* ========================================================= */}
        {/* CARD 1: UV INDEX */}
        {/* ========================================================= */}
        {enabledWidgets.includes('uv') && (
          <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
            {/* Header: Title + Category pill */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100 group-hover:scale-105 transition-transform">
                    <Sun className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">UV Index</span>
                    <span className="text-[10px] text-stone-400">Solar Intensity</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${uvInfo.badgeBg}`}>
                  {uvInfo.label}
                </span>
              </div>

              {/* Big Value & Peak Max */}
              <div className="flex items-baseline justify-between mt-1 mb-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                    {Math.round(uvVal * 10) / 10}
                  </span>
                  <span className="text-xs font-bold text-stone-400">UVI</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">Peak Today</span>
                  <span className="text-xs font-bold text-stone-700">{Math.round(maxUvToday)} UVI</span>
                </div>
              </div>

              {/* Visual Multi-Segment Spectrum Bar */}
              <div className="relative mb-3">
                <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden flex">
                  {/* Segmented Gradient */}
                  <div
                    className="h-full w-full rounded-full"
                    style={{
                      background: 'linear-gradient(to right, #22c55e 0%, #eab308 25%, #f97316 55%, #ef4444 80%, #a855f7 100%)',
                    }}
                  />
                </div>
                {/* Pointer marker */}
                <div
                  className="absolute -top-1 w-4 h-4 rounded-full bg-white border-2 border-stone-800 shadow-md transform -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${Math.min(96, Math.max(4, (uvVal / 11) * 100))}%` }}
                />
              </div>

              {/* Spectrum Range Labels */}
              <div className="flex justify-between text-[9px] font-semibold text-stone-400 px-0.5 mb-3">
                <span>0 Low</span>
                <span>3 Mod</span>
                <span>6 High</span>
                <span>8 Very High</span>
                <span>11+ Ext</span>
              </div>
            </div>

            {/* Health/Protection Note Footer */}
            <div className="pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{uvInfo.advice}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 2: HUMIDITY & DEW POINT */}
        {/* ========================================================= */}
        {enabledWidgets.includes('humidity') && (
          <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
            {/* Header: Title + Comfort pill */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center border border-cyan-100 group-hover:scale-105 transition-transform">
                    <Droplets className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">Humidity</span>
                    <span className="text-[10px] text-stone-400">Atmospheric Moisture</span>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${humidityInfo.bg} ${humidityInfo.color}`}>
                  {humidityInfo.status}
                </span>
              </div>

              {/* Big Value & Dew Point */}
              <div className="flex items-baseline justify-between mt-1 mb-3">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                    {Math.round(humidityVal)}%
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block">Dew Point</span>
                  <span className="text-xs font-bold text-stone-700">
                    {useFahrenheit ? `${Math.round((dewPoint * 9) / 5 + 32)}°F` : `${dewPoint}°C`}
                  </span>
                </div>
              </div>

              {/* Visual Moisture Level Progress Track */}
              <div className="relative mb-3">
                <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.min(100, Math.max(5, humidityVal))}%`,
                      background: 'linear-gradient(to right, #06b6d4 0%, #3b82f6 50%, #2563eb 100%)',
                    }}
                  />
                </div>
              </div>

              {/* 3 Status Bands Indicators */}
              <div className="grid grid-cols-3 gap-1.5 text-center mb-3">
                <div
                  className={`py-1 rounded-lg text-[9px] font-bold border ${
                    humidityVal < 30
                      ? 'bg-amber-100 text-amber-900 border-amber-300'
                      : 'bg-stone-50 text-stone-400 border-stone-100'
                  }`}
                >
                  Dry (&lt;30%)
                </div>
                <div
                  className={`py-1 rounded-lg text-[9px] font-bold border ${
                    humidityVal >= 30 && humidityVal <= 65
                      ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                      : 'bg-stone-50 text-stone-400 border-stone-100'
                  }`}
                >
                  Optimal (30-65%)
                </div>
                <div
                  className={`py-1 rounded-lg text-[9px] font-bold border ${
                    humidityVal > 65
                      ? 'bg-blue-100 text-blue-900 border-blue-300'
                      : 'bg-stone-50 text-stone-400 border-stone-100'
                  }`}
                >
                  High (&gt;65%)
                </div>
              </div>
            </div>

            {/* Note Footer */}
            <div className="pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
              <Info className="w-3.5 h-3.5 text-cyan-600 shrink-0 mt-0.5" />
              <span>{humidityInfo.note}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* CARD 3: WIND DIRECTION & DYNAMIC COMPASS */}
        {/* ========================================================= */}
        {enabledWidgets.includes('wind') && (
          <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
            {/* Header: Title + Beaufort pill */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 group-hover:scale-105 transition-transform">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">Wind Direction</span>
                    <span className="text-[10px] text-stone-400">Flow Vector & Speed</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {beaufort.name}
                </span>
              </div>

              {/* Main Vector Section: Speed & Cardinal on left, Dynamic Rotating Compass on right */}
              <div className="flex items-center justify-between gap-3 my-1">
                <div>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                      {displaySpeed(current.windSpeed || 0)}
                    </span>
                  </div>
                  <div className="text-xs font-semibold text-stone-700 mt-0.5">
                    Blowing from <strong className="text-orange-600 font-bold">{cardinal.short}</strong> ({windDirDeg}°)
                  </div>
                  <div className="text-[10px] text-stone-400 mt-0.5">
                    {cardinal.long}
                  </div>
                </div>

                {/* Animated Rotating Compass Dial with Vector Needle */}
                <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                  {/* Outer Dial Circle with N/E/S/W markings */}
                  <svg viewBox="0 0 100 100" className="w-full h-full select-none">
                    {/* Dial Ring */}
                    <circle cx="50" cy="50" r="44" fill="#fafaf9" stroke="#e7e5e4" strokeWidth="2" />
                    
                    {/* Degree Tick marks */}
                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
                      const rad = (angle * Math.PI) / 180;
                      const x1 = 50 + Math.sin(rad) * 40;
                      const y1 = 50 - Math.cos(rad) * 40;
                      const x2 = 50 + Math.sin(rad) * 44;
                      const y2 = 50 - Math.cos(rad) * 44;
                      return (
                        <line
                          key={angle}
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#a8a29e"
                          strokeWidth={angle % 90 === 0 ? '2' : '1'}
                        />
                      );
                    })}

                    {/* Cardinal Labels */}
                    <text x="50" y="16" textAnchor="middle" fontSize="9" fontWeight="bold" fill="#ef4444">N</text>
                    <text x="88" y="53" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78716c">E</text>
                    <text x="50" y="90" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78716c">S</text>
                    <text x="12" y="53" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#78716c">W</text>

                    {/* Rotating Compass Needle */}
                    <g
                      className="transition-transform duration-700 ease-out"
                      style={{
                        transformOrigin: '50px 50px',
                        transform: `rotate(${windDirDeg}deg)`,
                      }}
                    >
                      {/* North Arrow Tip (Vibrant Orange / Red) */}
                      <polygon points="50,18 45,50 55,50" fill="#f97316" />
                      {/* South Arrow Base (Dark Stone) */}
                      <polygon points="50,82 45,50 55,50" fill="#292524" />
                      {/* Center Hub */}
                      <circle cx="50" cy="50" r="5" fill="#ffffff" stroke="#292524" strokeWidth="2" />
                      <circle cx="50" cy="50" r="2" fill="#f97316" />
                    </g>
                  </svg>
                </div>
              </div>

              {/* Gusts or secondary telemetry */}
              <div className="flex items-center justify-between text-[11px] text-stone-500 py-1.5 px-2 bg-stone-50 rounded-xl my-2 border border-stone-100">
                <span className="text-[10px] text-stone-400">Peak Gusts</span>
                <span className="font-bold text-stone-700">
                  {current.windGusts ? displaySpeed(current.windGusts) : displaySpeed((current.windSpeed || 10) * 1.3)}
                </span>
              </div>
            </div>

            {/* Note Footer */}
            <div className="pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
              <Wind className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>{beaufort.desc}</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTIONAL EXTRA CARD: BAROMETRIC PRESSURE */}
        {/* ========================================================= */}
        {enabledWidgets.includes('pressure') && (
          <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center border border-violet-100">
                    <Gauge className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">Pressure</span>
                    <span className="text-[10px] text-stone-400">Barometric Sea Level</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-800 border border-violet-200">
                  {current.pressure && current.pressure > 1013 ? 'High Pressure' : 'Normal / Low'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1 mb-3">
                <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                  {current.pressure ? Math.round(current.pressure) : 1013}
                </span>
                <span className="text-xs font-bold text-stone-400">hPa / mb</span>
              </div>

              <div className="relative mb-3">
                <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-violet-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, (((current.pressure || 1013) - 980) / 60) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
              <Info className="w-3.5 h-3.5 text-violet-500 shrink-0 mt-0.5" />
              <span>Standard atmospheric baseline is 1013.25 hPa. Stable conditions prevail.</span>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* OPTIONAL EXTRA CARD: VISIBILITY */}
        {/* ========================================================= */}
        {enabledWidgets.includes('visibility') && (
          <div className="bg-white rounded-[24px] p-5 border border-stone-100 shadow-2xs hover:shadow-sm transition-all duration-200 flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-lime-50 text-lime-700 flex items-center justify-center border border-lime-100">
                    <Eye className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block leading-tight">Visibility</span>
                    <span className="text-[10px] text-stone-400">Optical Distance</span>
                  </div>
                </div>

                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-lime-50 text-lime-800 border border-lime-200">
                  {current.visibility && current.visibility >= 10 ? 'Clear Horizon' : 'Moderate'}
                </span>
              </div>

              <div className="flex items-baseline gap-1.5 mt-1 mb-3">
                <span className="text-3xl sm:text-4xl font-black text-stone-900 tracking-tight">
                  {current.visibility ? current.visibility : 10}
                </span>
                <span className="text-xs font-bold text-stone-400">km</span>
              </div>

              <div className="relative mb-3">
                <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-lime-500"
                    style={{
                      width: `${Math.min(100, Math.max(10, ((current.visibility || 10) / 16) * 100))}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="pt-2.5 border-t border-stone-100 flex items-start gap-1.5 text-[11px] text-stone-500 leading-snug">
              <Info className="w-3.5 h-3.5 text-lime-700 shrink-0 mt-0.5" />
              <span>Optimal line-of-sight clarity with minimal particulate haze.</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
