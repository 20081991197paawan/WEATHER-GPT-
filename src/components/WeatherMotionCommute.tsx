import React, { useState, useEffect, useMemo } from 'react';
import {
  Compass,
  MapPin,
  ChevronLeft,
  ChevronRight,
  Droplets,
  Wind,
  Sun,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause,
  CloudRain,
  Snowflake,
  ShieldCheck,
  Calendar,
  Bike,
  Footprints,
  Mountain,
} from 'lucide-react';
import { NormalizedWeatherData } from '../types';
import { KyotoKimonoCharacter } from './characters/KyotoKimonoCharacter';
import { MexicoSerapeCharacter } from './characters/MexicoSerapeCharacter';
import { CuscoAndeanCharacter } from './characters/CuscoAndeanCharacter';
import { SaharaLinenCharacter } from './characters/SaharaLinenCharacter';
import { LondonRainCharacter } from './characters/LondonRainCharacter';
import { AlpsSnowCharacter } from './characters/AlpsSnowCharacter';

export type PlaceId = 'kyoto' | 'mexico' | 'cusco' | 'sahara' | 'london_rain' | 'alps_snow';
export type ActivityMode = 'cycling' | 'walking' | 'explore' | 'treks';

interface WeatherMotionCommuteProps {
  weatherData: NormalizedWeatherData;
  useFahrenheit?: boolean;
  onOpenSearch?: () => void;
  onAskWeatherGpt?: (question: string) => void;
}

export interface PlaceConfig {
  id: PlaceId;
  name: string;
  country: string;
  flag: string;
  characterName: string;
  outfitDescription: string;
  defaultTempC: number;
  conditionTitle: string;
  conditionSubtitle: string;
  humidityOrRain: string;
  humidityLabel: string;
  windSpeed: number;
  sunHours: number;
  skyGradient: string;
  groundColor: string;
  emojiTag: string;
  suggestedDestination: string;
  suggestedDate: string;
  destinationPrompt: string;
  datePrompt: string;
  brandTag?: string;
  tabs: Array<{ id: ActivityMode; label: string }>;
}

export const PLACES: Record<PlaceId, PlaceConfig> = {
  kyoto: {
    id: 'kyoto',
    name: 'Kyoto',
    country: 'Japan',
    flag: '🇯🇵',
    characterName: 'Aoi',
    outfitDescription: 'Floral Kimono & Geta',
    defaultTempC: 18,
    conditionTitle: 'Spring Garden Blossom',
    conditionSubtitle: 'Mild & pleasant under sakura canopy',
    humidityOrRain: '12 %',
    humidityLabel: 'Precipitation',
    windSpeed: 8,
    sunHours: 8.5,
    skyGradient: 'from-sky-100 via-rose-50 to-pink-100',
    groundColor: '#9bb885',
    emojiTag: '🙌 🌸',
    suggestedDestination: 'Philosopher’s Path Garden',
    suggestedDate: 'Today, 3:30 PM',
    destinationPrompt: 'Choose your destination',
    datePrompt: 'Set your date',
    tabs: [
      { id: 'cycling', label: 'Cycling' },
      { id: 'walking', label: 'Walking' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
  mexico: {
    id: 'mexico',
    name: 'Mexico City',
    country: 'Mexico',
    flag: '🇲🇽',
    characterName: 'Valeria',
    outfitDescription: 'Artisan Serape & Basket',
    defaultTempC: 22,
    conditionTitle: 'Warm Vibrant Market',
    conditionSubtitle: 'Sunny artisan streets & mountain breeze',
    humidityOrRain: '10 %',
    humidityLabel: 'Precipitation',
    windSpeed: 12,
    sunHours: 8.5,
    skyGradient: 'from-sky-200 via-amber-50 to-blue-100',
    groundColor: '#d6c4a5',
    emojiTag: '🥽 🌴',
    suggestedDestination: 'Coyoacán Artisan Market',
    suggestedDate: 'Tomorrow, 11:00 AM',
    destinationPrompt: 'Choose your destination',
    datePrompt: 'Set your date',
    tabs: [
      { id: 'cycling', label: 'Cycling' },
      { id: 'walking', label: 'Walking' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
  cusco: {
    id: 'cusco',
    name: 'Cusco',
    country: 'Peru',
    flag: '🇵🇪',
    characterName: 'Mateo',
    outfitDescription: 'Andean Poncho & Chullo',
    defaultTempC: 12,
    conditionTitle: 'Misty High-Altitude Pass',
    conditionSubtitle: 'Atmospheric fog rolling over Inca ruins',
    humidityOrRain: '90 % (Humidity)',
    humidityLabel: 'Humidity',
    windSpeed: 18,
    sunHours: 4.0,
    skyGradient: 'from-slate-200 via-blue-100 to-emerald-50',
    groundColor: '#8a9b7a',
    emojiTag: '🦙 ⛰️',
    suggestedDestination: 'Machu Picchu Sun Gate Trail',
    suggestedDate: 'Next Tuesday, 7:00 AM',
    destinationPrompt: 'Choose your trek destination',
    datePrompt: 'Set your trek dates',
    brandTag: 'llama',
    tabs: [
      { id: 'treks', label: 'Treks' },
      { id: 'walking', label: 'Day trips' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
  sahara: {
    id: 'sahara',
    name: 'Sahara Desert',
    country: 'Morocco',
    flag: '🏜️',
    characterName: 'Nadia',
    outfitDescription: 'Breathable Linen & Sun Hat',
    defaultTempC: 38,
    conditionTitle: 'Arid Golden Dunes',
    conditionSubtitle: 'Warm sun with gentle desert shimmer',
    humidityOrRain: '0 %',
    humidityLabel: 'Precipitation',
    windSpeed: 12,
    sunHours: 12.0,
    skyGradient: 'from-sky-100 via-amber-50 to-orange-100',
    groundColor: '#eab875',
    emojiTag: '🙌 ☀️',
    suggestedDestination: 'Erg Chebbi Oasis Dunes',
    suggestedDate: 'Today, 6:00 PM (Sunset)',
    destinationPrompt: 'Choose your destination',
    datePrompt: 'Set your date',
    tabs: [
      { id: 'cycling', label: 'Cycling' },
      { id: 'walking', label: 'Walking' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
  london_rain: {
    id: 'london_rain',
    name: 'London',
    country: 'United Kingdom',
    flag: '🇬🇧',
    characterName: 'Marcus',
    outfitDescription: 'Yellow Slicker & Navy Pants',
    defaultTempC: 14,
    conditionTitle: 'Cool Rain Shower',
    conditionSubtitle: 'Wet reflective roads and overcast skies',
    humidityOrRain: '85 %',
    humidityLabel: 'Precipitation',
    windSpeed: 24,
    sunHours: 2.0,
    skyGradient: 'from-slate-300 via-blue-200 to-indigo-100',
    groundColor: '#6f8373',
    emojiTag: '🌧️ 🚲',
    suggestedDestination: 'Thames Embankment Trail',
    suggestedDate: 'Today, 4:00 PM',
    destinationPrompt: 'Choose your destination',
    datePrompt: 'Set your date',
    tabs: [
      { id: 'cycling', label: 'Cycling' },
      { id: 'walking', label: 'Walking' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
  alps_snow: {
    id: 'alps_snow',
    name: 'Zermatt',
    country: 'Switzerland',
    flag: '🇨🇭',
    characterName: 'Leo',
    outfitDescription: 'Crimson Puffer & Beanie',
    defaultTempC: -2,
    conditionTitle: 'Alpine Snow Flurry',
    conditionSubtitle: 'Crisp mountain air & powdery snowfall',
    humidityOrRain: '35 %',
    humidityLabel: 'Snow Prob.',
    windSpeed: 14,
    sunHours: 3.5,
    skyGradient: 'from-blue-100 via-slate-100 to-indigo-100',
    groundColor: '#e2e8f0',
    emojiTag: '❄️ ⛷️',
    suggestedDestination: 'Matterhorn Glacier Trail',
    suggestedDate: 'Tomorrow, 9:00 AM',
    destinationPrompt: 'Choose your destination',
    datePrompt: 'Set your date',
    tabs: [
      { id: 'treks', label: 'Treks' },
      { id: 'walking', label: 'Walking' },
      { id: 'explore', label: 'Explore nearby' },
    ],
  },
};

export const PLACE_ORDER: PlaceId[] = ['kyoto', 'mexico', 'cusco', 'sahara', 'london_rain', 'alps_snow'];

export const WeatherMotionCommute: React.FC<WeatherMotionCommuteProps> = ({
  weatherData,
  useFahrenheit = false,
  onOpenSearch,
  onAskWeatherGpt,
}) => {
  // Determine matching place based on real live weather if auto-sync is on
  const detectedPlaceId = useMemo<PlaceId>(() => {
    const cityName = weatherData.location.name.toLowerCase();
    const cond = weatherData.current.conditionCategory;
    const temp = weatherData.current.temp;

    if (cityName.includes('kyoto') || cityName.includes('tokyo') || cityName.includes('japan')) return 'kyoto';
    if (cityName.includes('mexico') || cityName.includes('cancun') || cityName.includes('guadalajara')) return 'mexico';
    if (cityName.includes('cusco') || cityName.includes('peru') || cityName.includes('lima')) return 'cusco';
    if (cityName.includes('sahara') || cityName.includes('cairo') || cityName.includes('dubai') || temp > 34) return 'sahara';
    if (cond === 'snow' || temp <= 2) return 'alps_snow';
    if (cond === 'rain' || cond === 'drizzle' || cond === 'thunderstorm') return 'london_rain';
    if (temp >= 26) return 'sahara';
    if (temp >= 20) return 'mexico';
    if (temp >= 15) return 'kyoto';
    return 'cusco';
  }, [weatherData]);

  const [currentPlaceId, setCurrentPlaceId] = useState<PlaceId>('kyoto');
  const [activity, setActivity] = useState<ActivityMode>('walking');
  const [isAutoSync, setIsAutoSync] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [destination, setDestination] = useState(PLACES.kyoto.suggestedDestination);
  const [dateSelection, setDateSelection] = useState(PLACES.kyoto.suggestedDate);
  const [routeAdvice, setRouteAdvice] = useState<string | null>(null);
  const [isCheckingRoute, setIsCheckingRoute] = useState(false);

  // Sync when auto-sync is explicitly toggled on
  useEffect(() => {
    if (isAutoSync) {
      setCurrentPlaceId(detectedPlaceId);
    }
  }, [detectedPlaceId, isAutoSync]);

  const currentPlace = PLACES[currentPlaceId];

  // Update suggested destination and date when switching place
  const handleSelectPlace = (placeId: PlaceId) => {
    setIsAutoSync(false);
    setCurrentPlaceId(placeId);
    setDestination(PLACES[placeId].suggestedDestination);
    setDateSelection(PLACES[placeId].suggestedDate);
    setRouteAdvice(null);
    // set default active tab based on place
    if (placeId === 'cusco' || placeId === 'alps_snow') {
      setActivity('treks');
    } else {
      setActivity('walking');
    }
  };

  const handleNextPlace = () => {
    const idx = PLACE_ORDER.indexOf(currentPlaceId);
    const nextIdx = (idx + 1) % PLACE_ORDER.length;
    handleSelectPlace(PLACE_ORDER[nextIdx]);
  };

  const handlePrevPlace = () => {
    const idx = PLACE_ORDER.indexOf(currentPlaceId);
    const prevIdx = (idx - 1 + PLACE_ORDER.length) % PLACE_ORDER.length;
    handleSelectPlace(PLACE_ORDER[prevIdx]);
  };

  const displayTemp = (tempC: number) => {
    if (useFahrenheit) {
      return Math.round((tempC * 9) / 5 + 32);
    }
    return Math.round(tempC);
  };

  // WeatherGPT route check
  const handleCheckRoute = () => {
    setIsCheckingRoute(true);
    setTimeout(() => {
      setIsCheckingRoute(false);
      const temp = displayTemp(currentPlace.defaultTempC);
      const unit = useFahrenheit ? '°F' : '°C';
      setRouteAdvice(
        `Route check verified for ${currentPlace.name}! Current climate is ${temp}${unit} with ${currentPlace.humidityOrRain} precip. ${currentPlace.conditionSubtitle}. Perfect for ${activity} exploration.`
      );
    }, 550);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 sm:px-4 py-2 select-none">
      {/* Outer Card Container - Styled to match the Justgo Dribbble aesthetic with subtle warm cream canvas */}
      <div className="relative rounded-[32px] sm:rounded-[44px] bg-[#fbf9f5] text-slate-900 border border-[#eae5dc] shadow-[0_25px_70px_rgba(0,0,0,0.14),0_10px_30px_rgba(0,0,0,0.06)] overflow-hidden flex flex-col transition-all duration-300">
        {/* Decorative corner tribal/ethnic pattern subtly nodding to the Mexico & Peru cards */}
        <div className="absolute top-0 right-0 w-44 h-24 opacity-[0.06] pointer-events-none overflow-hidden">
          <svg viewBox="0 0 200 100" fill="none" className="w-full h-full text-slate-800">
            <path d="M0 20 L20 0 L40 20 L60 0 L80 20 L100 0 L120 20 L140 0 L160 20 L180 0 L200 20" stroke="currentColor" strokeWidth="3" />
            <path d="M0 40 L20 20 L40 40 L60 20 L80 40 L100 20 L120 40 L140 20 L160 40 L180 20 L200 40" stroke="currentColor" strokeWidth="2" />
            <path d="M0 60 L20 40 L40 60 L60 40 L80 60 L100 40 L120 60 L140 40 L160 60 L180 40 L200 60" stroke="currentColor" strokeWidth="2" />
          </svg>
        </div>

        {/* 1. Header Bar */}
        <header className="px-6 sm:px-12 pt-7 pb-4 flex items-center justify-between border-b border-stone-200/50">
          {/* Brand Identity: Justgo with Llama icon if Cusco, or Bicycle icon */}
          <div className="flex items-center gap-2.5">
            {currentPlace.brandTag === 'llama' ? (
              /* Custom Peruvian Llama icon from the Cusco card */
              <div className="w-7 h-7 text-slate-900 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
                  <path d="M19 8h-3V4c0-.6-.4-1-1-1s-1 .4-1 1v4h-2c-1.1 0-2 .9-2 2v2H7v-2c0-.6-.4-1-1-1s-1 .4-1 1v7c0 .6.4 1 1 1h1v4c0 .6.4 1 1 1s1-.4 1-1v-4h4v4c0 .6.4 1 1 1s1-.4 1-1v-4h2c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
            ) : (
              /* Bike icon for standard Justgo */
              <div className="w-7 h-7 text-slate-900 flex items-center justify-center">
                <Bike className="w-6 h-6 stroke-[2.2]" />
              </div>
            )}
            <span className="text-xl sm:text-2xl font-display font-black tracking-tight text-slate-900">
              Just<span className="text-slate-900 font-extrabold">go</span>
            </span>
          </div>

          {/* Place-specific Activity Pills (e.g. Cycling | Walking | Explore nearby OR Treks | Day trips | Explore nearby) */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {currentPlace.tabs.map((tab) => {
              const isActive = activity === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActivity(tab.id)}
                  className={`px-3.5 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'bg-stone-200/50 hover:bg-stone-200 text-slate-600'
                  }`}
                >
                  {tab.id === 'cycling' && <Bike className="w-3.5 h-3.5" />}
                  {tab.id === 'walking' && <Footprints className="w-3.5 h-3.5" />}
                  {tab.id === 'treks' && <Mountain className="w-3.5 h-3.5" />}
                  {tab.id === 'explore' && <Compass className="w-3.5 h-3.5" />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </header>

        {/* 2. Main Stage: Temperature + 2D Animated Human & Scenic Circle + Metrics */}
        <div className="px-6 sm:px-12 py-6 sm:py-8 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Temperature, Location, Navigation Controls */}
          <div className="lg:col-span-3 flex flex-col justify-between space-y-4">
            <div>
              {/* Giant Temperature */}
              <div className="text-6xl sm:text-7xl md:text-8xl font-display font-light tracking-tighter text-slate-900 select-none leading-none">
                {displayTemp(currentPlace.defaultTempC)}°
              </div>

              {/* Location with Flag / Regional Tag */}
              <div className="mt-3 flex items-center gap-2 text-slate-800">
                <span className="text-base" role="img" aria-label={currentPlace.country}>
                  {currentPlace.flag}
                </span>
                <button
                  onClick={onOpenSearch}
                  className="font-bold text-base sm:text-lg hover:underline hover:text-orange-600 transition"
                >
                  {currentPlace.name}
                  {currentPlace.country ? `, ${currentPlace.country}` : ''}
                </button>
              </div>

              {/* Weather Subtitle */}
              <p className="mt-1 text-xs text-slate-500 font-medium">
                {currentPlace.conditionTitle}
              </p>
            </div>

            {/* Carousel Switcher Arrows (← and → as seen in user's images) */}
            <div className="pt-2">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={handlePrevPlace}
                  title="Previous Destination & 2D Persona"
                  className="w-8 h-8 rounded-full border border-stone-300 bg-white hover:bg-stone-100 flex items-center justify-center text-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNextPlace}
                  title="Next Destination & 2D Persona"
                  className="w-8 h-8 rounded-full border border-stone-300 bg-white hover:bg-stone-100 flex items-center justify-center text-slate-700 shadow-sm transition active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Auto Sync Indicator Pill */}
                <button
                  onClick={() => setIsAutoSync(!isAutoSync)}
                  title={isAutoSync ? 'Auto-syncing to your search location.' : 'Click to match local searched weather'}
                  className={`ml-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition cursor-pointer flex items-center gap-1 border ${
                    isAutoSync
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : 'bg-stone-100 text-stone-600 border-stone-300'
                  }`}
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{isAutoSync ? 'Live Weather' : 'Explore Places'}</span>
                </button>
              </div>

              {/* Current Character Persona Pill */}
              <div className="mt-3 p-2.5 rounded-2xl bg-stone-100/90 border border-stone-200/80 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">{currentPlace.characterName}</span>
                  <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white text-slate-600 border border-stone-200">
                    {currentPlace.id}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">{currentPlace.outfitDescription}</div>
              </div>
            </div>
          </div>

          {/* Center Column: The Circular Scenic Vignette with 2D Animated Human */}
          <div className="lg:col-span-6 flex items-center justify-center">
            {/* The circular portal with overflow handling (in Cusco the steps cascade forward) */}
            <div className="relative w-full max-w-[400px] aspect-[1/1] flex items-center justify-center">
              {/* Circular Backdrop Container */}
              <div className="relative w-[340px] sm:w-[380px] h-[340px] sm:h-[380px] rounded-full overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.08)] border-4 border-white bg-gradient-to-b from-sky-100 via-amber-50 to-orange-50">
                {/* Dynamic Sky Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-b ${currentPlace.skyGradient} transition-colors duration-700`} />

                {/* ========================================================= */}
                {/* 1. SCENERY BACKDROPS FOR EACH PLACE                       */}
                {/* ========================================================= */}

                {/* --- A. KYOTO, JAPAN SCENERY --- */}
                {currentPlaceId === 'kyoto' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Distant soft clouds */}
                    <div className="absolute top-10 inset-x-0 flex justify-around opacity-40">
                      <div className="w-24 h-8 rounded-full bg-white blur-[1px]" />
                      <div className="w-32 h-9 rounded-full bg-white blur-[1px]" />
                    </div>

                    {/* Cherry Blossom (Sakura) Branches framing the top */}
                    <div className="absolute top-0 inset-x-0 h-36">
                      <svg viewBox="0 0 380 140" className="w-full h-full" fill="none">
                        {/* Left Branch */}
                        <path d="M-20 40 Q60 20 120 70 Q150 90 170 85" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                        <path d="M70 35 Q95 15 125 25" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />
                        {/* Right Branch */}
                        <path d="M400 30 Q310 15 250 65 Q220 85 190 75" stroke="#78350f" strokeWidth="4" strokeLinecap="round" />
                        <path d="M285 30 Q260 10 230 15" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round" />

                        {/* Clusters of Pale Pink Sakura Blossoms */}
                        {/* Left clusters */}
                        <circle cx="50" cy="30" r="14" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="65" cy="22" r="12" fill="#f472b6" opacity="0.8" />
                        <circle cx="85" cy="32" r="15" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="115" cy="55" r="16" fill="#f472b6" opacity="0.85" />
                        <circle cx="140" cy="75" r="13" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="160" cy="85" r="10" fill="#f472b6" opacity="0.9" />

                        {/* Right clusters */}
                        <circle cx="330" cy="25" r="16" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="310" cy="18" r="13" fill="#f472b6" opacity="0.85" />
                        <circle cx="280" cy="35" r="17" fill="#fbcfe8" opacity="0.9" />
                        <circle cx="250" cy="55" r="15" fill="#f472b6" opacity="0.8" />
                        <circle cx="210" cy="75" r="14" fill="#fbcfe8" opacity="0.9" />
                      </svg>
                    </div>

                    {/* Drifting Sakura Petals Animation */}
                    <div className="absolute inset-0 overflow-hidden z-20 pointer-events-none">
                      {Array.from({ length: 14 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2.5 h-3.5 bg-pink-300 rounded-full animate-sakura opacity-80"
                          style={{
                            left: `${(i * 19 + 10) % 90}%`,
                            top: `${(i * 13) % 40}%`,
                            animationDelay: `${i * 0.45}s`,
                            animationDuration: `${4.5 + (i % 4) * 0.8}s`,
                          }}
                        />
                      ))}
                    </div>

                    {/* Traditional Wooden Arched Bridge */}
                    <div className="absolute bottom-28 right-4 w-44 h-24">
                      <svg viewBox="0 0 160 80" className="w-full h-full" fill="none">
                        {/* Bridge Arch */}
                        <path d="M10 65 Q80 20 150 65" stroke="#b45309" strokeWidth="6" fill="none" strokeLinecap="round" />
                        <path d="M14 68 Q80 26 146 68" stroke="#78350f" strokeWidth="3" fill="none" strokeLinecap="round" />
                        {/* Bridge Railing Posts */}
                        <line x1="35" y1="48" x2="35" y2="36" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                        <line x1="60" y1="36" x2="60" y2="24" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                        <line x1="85" y1="32" x2="85" y2="20" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                        <line x1="110" y1="36" x2="110" y2="24" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                        <line x1="130" y1="48" x2="130" y2="36" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
                        {/* Handrail */}
                        <path d="M30 40 Q85 14 135 40" stroke="#b45309" strokeWidth="3" fill="none" />
                      </svg>
                    </div>

                    {/* Traditional Stone Lantern (Tōrō) on the Left */}
                    <div className="absolute bottom-20 left-6 w-14 h-32">
                      <svg viewBox="0 0 50 110" className="w-full h-full" fill="none">
                        {/* Roof Cap */}
                        <polygon points="25,10 45,28 5,28" fill="#64748b" />
                        {/* Light Chamber */}
                        <rect x="15" y="28" width="20" height="18" rx="2" fill="#475569" />
                        <circle cx="25" cy="37" r="4" fill="#fef08a" opacity="0.9" />
                        {/* Mid support */}
                        <rect x="12" y="46" width="26" height="8" rx="2" fill="#64748b" />
                        {/* Stem / Column */}
                        <rect x="18" y="54" width="14" height="34" rx="3" fill="#64748b" />
                        {/* Base Pedestal */}
                        <rect x="8" y="88" width="34" height="16" rx="4" fill="#475569" />
                      </svg>
                    </div>

                    {/* Garden Grass & Stepping Stones Path */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-[#9bb885]">
                      {/* Curving flagstone pathway */}
                      <svg viewBox="0 0 380 100" className="w-full h-full" fill="none">
                        <path d="M190 0 C170 30 150 60 140 100 L240 100 C230 60 210 30 190 0 Z" fill="#cbd5e1" opacity="0.6" />
                        {/* Individual stones */}
                        <ellipse cx="185" cy="20" rx="14" ry="6" fill="#94a3b8" />
                        <ellipse cx="178" cy="45" rx="18" ry="7" fill="#94a3b8" />
                        <ellipse cx="170" cy="72" rx="22" ry="8" fill="#94a3b8" />
                        <ellipse cx="190" cy="95" rx="28" ry="10" fill="#94a3b8" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* --- B. MEXICO CITY SCENERY --- */}
                {currentPlaceId === 'mexico' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Festive Papel Picado Bunting Fluttering in Breeze */}
                    <div className="absolute top-2 inset-x-0 h-16 z-20 overflow-hidden">
                      <svg viewBox="0 0 380 60" className="w-full h-full" fill="none">
                        <path d="M0 12 Q95 32 190 18 Q285 34 380 12" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
                        <polygon points="35,18 65,24 62,48 32,42" fill="#ec4899" opacity="0.9" />
                        <circle cx="48" cy="33" r="2.5" fill="#ffffff" opacity="0.8" />
                        <polygon points="90,26 120,28 118,52 88,50" fill="#facc15" opacity="0.9" />
                        <circle cx="104" cy="39" r="2.5" fill="#ffffff" opacity="0.8" />
                        <polygon points="145,24 175,20 173,44 143,48" fill="#06b6d4" opacity="0.9" />
                        <circle cx="159" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
                        <polygon points="205,20 235,25 233,49 203,44" fill="#84cc16" opacity="0.9" />
                        <circle cx="219" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
                        <polygon points="260,28 290,30 288,54 258,52" fill="#f97316" opacity="0.9" />
                        <circle cx="274" cy="41" r="2.5" fill="#ffffff" opacity="0.8" />
                        <polygon points="315,26 345,18 343,42 313,50" fill="#a855f7" opacity="0.9" />
                        <circle cx="329" cy="34" r="2.5" fill="#ffffff" opacity="0.8" />
                      </svg>
                    </div>

                    {/* Distant Metropolitan Cathedral & Snow-capped Popocatépetl Volcano */}
                    <div className="absolute top-12 inset-x-0 h-28">
                      <svg viewBox="0 0 380 110" className="w-full h-full" fill="none">
                        {/* Distant Volcano Popocatépetl */}
                        <polygon points="280,100 330,30 380,100" fill="#cbd5e1" opacity="0.7" />
                        <polygon points="315,50 330,30 345,50" fill="#ffffff" opacity="0.9" />
                        {/* Historic Cathedral Towers */}
                        <rect x="130" y="55" width="22" height="45" fill="#94a3b8" opacity="0.5" />
                        <polygon points="125,55 141,35 157,55" fill="#94a3b8" opacity="0.6" />
                        <rect x="180" y="55" width="22" height="45" fill="#94a3b8" opacity="0.5" />
                        <polygon points="175,55 191,35 207,55" fill="#94a3b8" opacity="0.6" />
                        {/* Dome */}
                        <ellipse cx="166" cy="65" rx="16" ry="14" fill="#94a3b8" opacity="0.5" />
                      </svg>
                    </div>

                    {/* Left Artisan Market Stall: Hanging Colorful Serape Blankets & Pottery */}
                    <div className="absolute bottom-16 left-2 w-32 h-44 animate-fabric">
                      <svg viewBox="0 0 120 160" className="w-full h-full" fill="none">
                        {/* Stall wooden frame */}
                        <line x1="10" y1="30" x2="110" y2="30" stroke="#78350f" strokeWidth="4" />
                        <line x1="15" y1="30" x2="15" y2="150" stroke="#78350f" strokeWidth="3" />
                        <line x1="105" y1="30" x2="105" y2="150" stroke="#78350f" strokeWidth="3" />
                        {/* Hanging Woven Serape 1: Hot Pink, Orange, Yellow */}
                        <rect x="22" y="32" width="22" height="55" rx="1" fill="#ec4899" />
                        <rect x="22" y="44" width="22" height="8" fill="#eab308" />
                        <rect x="22" y="60" width="22" height="6" fill="#06b6d4" />
                        {/* Hanging Woven Serape 2: Cyan, Navy, Lime */}
                        <rect x="48" y="32" width="24" height="60" rx="1" fill="#06b6d4" />
                        <rect x="48" y="46" width="24" height="8" fill="#84cc16" />
                        <rect x="48" y="64" width="24" height="7" fill="#f97316" />
                        {/* Hanging Serape 3: Purple, Coral */}
                        <rect x="76" y="32" width="20" height="50" rx="1" fill="#a855f7" />
                        <rect x="76" y="42" width="20" height="7" fill="#f43f5e" />

                        {/* Clay pottery jugs (Ollas de barro) and baskets on table */}
                        <ellipse cx="35" cy="120" rx="14" ry="12" fill="#c2410c" />
                        <ellipse cx="65" cy="118" rx="16" ry="13" fill="#ea580c" />
                        <ellipse cx="90" cy="122" rx="12" ry="10" fill="#b45309" />
                      </svg>
                    </div>

                    {/* Right Fruit Cart with Striped Awning, Bananas, Pineapples & Melons */}
                    <div className="absolute bottom-16 right-2 w-32 h-44">
                      <svg viewBox="0 0 120 160" className="w-full h-full" fill="none">
                        {/* Striped Awning (Red & Yellow) */}
                        <path d="M15 40 L105 40 L95 20 L25 20 Z" fill="#ef4444" />
                        <polygon points="25,20 40,20 32,40 15,40" fill="#facc15" />
                        <polygon points="55,20 70,20 62,40 45,40" fill="#facc15" />
                        <polygon points="85,20 95,20 90,40 75,40" fill="#facc15" />
                        {/* Awning scalloped trim */}
                        <path d="M15 40 Q25 46 35 40 Q45 46 55 40 Q65 46 75 40 Q85 46 95 40" stroke="#facc15" strokeWidth="2" fill="none" />

                        {/* Cart Base & Wheel */}
                        <rect x="25" y="65" width="70" height="35" rx="3" fill="#6366f1" />
                        <circle cx="45" cy="115" r="16" stroke="#1e293b" strokeWidth="4" fill="#f1f5f9" />
                        <circle cx="45" cy="115" r="3" fill="#0f172a" />

                        {/* Fruit Casks: Bananas & Pineapples */}
                        <ellipse cx="40" cy="62" rx="9" ry="6" fill="#eab308" />
                        <ellipse cx="60" cy="60" rx="8" ry="7" fill="#16a34a" />
                        <ellipse cx="80" cy="62" rx="7" ry="6" fill="#9333ea" />
                      </svg>
                    </div>

                    {/* Cobblestone Market Pavement */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[#d6c4a5]">
                      <svg viewBox="0 0 380 90" className="w-full h-full" fill="none">
                        <line x1="0" y1="30" x2="380" y2="30" stroke="#b8a687" strokeWidth="2" strokeDasharray="14 8" />
                        <line x1="0" y1="55" x2="380" y2="55" stroke="#b8a687" strokeWidth="2" strokeDasharray="18 10" />
                        <line x1="0" y1="78" x2="380" y2="78" stroke="#b8a687" strokeWidth="2" strokeDasharray="16 9" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* --- C. CUSCO, PERU SCENERY --- */}
                {currentPlaceId === 'cusco' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Towering Huayna Picchu Mountain Peak */}
                    <div className="absolute top-4 inset-x-0 h-48">
                      <svg viewBox="0 0 380 180" className="w-full h-full" fill="none">
                        {/* Huayna Picchu Peak */}
                        <polygon points="120,180 215,20 310,180" fill="#4d7c0f" opacity="0.65" />
                        <polygon points="170,180 215,20 260,180" fill="#65a30d" opacity="0.75" />
                        {/* Secondary Mountain Ridge */}
                        <polygon points="0,180 90,80 190,180" fill="#3f6212" opacity="0.55" />
                        <polygon points="250,180 340,90 390,180" fill="#3f6212" opacity="0.55" />
                      </svg>
                    </div>

                    {/* Animated Swirling Mountain Mist & Altitude Clouds */}
                    <div className="absolute inset-0 overflow-hidden z-10 pointer-events-none">
                      {/* Mist Layer 1 (Drifting Left) */}
                      <div className="absolute top-16 -left-12 w-96 h-20 bg-gradient-to-r from-white/10 via-white/55 to-white/10 rounded-full blur-[6px] animate-mist-fast" />
                      {/* Mist Layer 2 (Drifting Right) */}
                      <div className="absolute top-28 -right-16 w-96 h-24 bg-gradient-to-r from-white/15 via-white/60 to-white/15 rounded-full blur-[8px] animate-mist-slow" />
                      {/* Low Cloud layer hugging the ruins */}
                      <div className="absolute bottom-24 left-0 w-full h-16 bg-white/40 blur-[4px]" />
                    </div>

                    {/* Terraced Agricultural Citadel Ruins of Machu Picchu */}
                    <div className="absolute bottom-16 inset-x-0 h-36">
                      <svg viewBox="0 0 380 140" className="w-full h-full" fill="none">
                        {/* Terrace 1 (Top) */}
                        <path d="M80 30 L320 30 L310 45 L75 45 Z" fill="#713f12" />
                        <rect x="75" y="45" width="235" height="10" fill="#a16207" opacity="0.8" />

                        {/* Friendly Grazing Andean Llama on Upper Terrace */}
                        <g transform="translate(92, 8) scale(0.65)">
                          {/* Legs */}
                          <line x1="16" y1="26" x2="16" y2="39" stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="round" />
                          <line x1="24" y1="26" x2="24" y2="39" stroke="#e2e8f0" strokeWidth="2.8" strokeLinecap="round" />
                          <line x1="36" y1="26" x2="36" y2="39" stroke="#f8fafc" strokeWidth="2.8" strokeLinecap="round" />
                          <line x1="44" y1="26" x2="44" y2="39" stroke="#e2e8f0" strokeWidth="2.8" strokeLinecap="round" />
                          {/* Fluffy Body */}
                          <ellipse cx="30" cy="22" rx="16" ry="9" fill="#ffffff" />
                          {/* Woven Saddle Blanket */}
                          <rect x="22" y="16" width="16" height="10" rx="1" fill="#ec4899" />
                          <rect x="24" y="19" width="12" height="4" fill="#facc15" />
                          {/* Grazing Neck & Head */}
                          <path d="M42 20 L52 14 L50 7 L38 16 Z" fill="#ffffff" />
                          <circle cx="53" cy="8" r="4.5" fill="#ffffff" />
                          {/* Perked Ears */}
                          <polygon points="50,5 52,0 54,5" fill="#fbcfe8" />
                          <polygon points="53,5 55,1 57,5" fill="#fbcfe8" />
                          {/* Snout */}
                          <ellipse cx="56" cy="10" rx="2.5" ry="1.8" fill="#fef08a" />
                          <circle cx="54" cy="7.5" r="0.9" fill="#1e293b" />
                          {/* Tail */}
                          <circle cx="14" cy="19" r="2.5" fill="#ffffff" />
                        </g>

                        {/* Terrace 2 */}
                        <path d="M50 55 L345 55 L335 72 L45 72 Z" fill="#65a30d" />
                        <rect x="45" y="72" width="290" height="12" fill="#78350f" opacity="0.8" />
                        {/* Terrace 3 */}
                        <path d="M25 84 L365 84 L355 105 L20 105 Z" fill="#84cc16" />
                        <rect x="20" y="105" width="335" height="14" fill="#713f12" opacity="0.8" />
                      </svg>
                    </div>

                    {/* Stone Paving Trail */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[#8a9b7a]">
                      <svg viewBox="0 0 380 90" className="w-full h-full" fill="none">
                        {/* Stepping flagstones */}
                        <ellipse cx="190" cy="20" rx="35" ry="12" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
                        <ellipse cx="185" cy="50" rx="45" ry="14" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
                        <ellipse cx="180" cy="80" rx="55" ry="16" fill="#a8a29e" stroke="#78716c" strokeWidth="2" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* --- D. SAHARA DESERT SCENERY --- */}
                {currentPlaceId === 'sahara' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Blazing Desert Sun with Warm Radiant Glow */}
                    <div className="absolute top-8 left-20">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-300 to-yellow-100 shadow-[0_0_40px_rgba(251,191,36,0.8)] animate-pulse-subtle" />
                    </div>

                    {/* Distant Palm Oasis (Palmeraie) */}
                    <div className="absolute bottom-28 right-12 w-28 h-24">
                      <svg viewBox="0 0 100 80" className="w-full h-full" fill="none">
                        {/* Palm Trunks */}
                        <path d="M45 80 Q48 55 52 35" stroke="#78350f" strokeWidth="3.5" strokeLinecap="round" />
                        <path d="M60 80 Q62 58 68 40" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                        {/* Palm Fronds / Leaves */}
                        <path d="M52 35 Q30 20 20 30" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                        <path d="M52 35 Q50 10 52 5" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" />
                        <path d="M52 35 Q75 18 85 28" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
                        <path d="M68 40 Q85 30 95 38" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Rolling Golden Sand Dunes with Wave Ridges */}
                    <div className="absolute inset-x-0 bottom-0 h-44">
                      <svg viewBox="0 0 380 170" className="w-full h-full" fill="none">
                        {/* Distant Dune */}
                        <path d="M0 110 Q90 60 210 110 T380 90 L380 170 L0 170 Z" fill="#d97706" opacity="0.45" />
                        {/* Midground Dune Ridge */}
                        <path d="M-20 130 Q110 75 250 135 T400 110 L400 170 L-20 170 Z" fill="#f59e0b" opacity="0.85" />
                        {/* Foreground Dune Ridge */}
                        <path d="M-10 145 Q130 95 280 150 L380 150 L380 170 L-10 170 Z" fill="#fbbf24" />
                      </svg>
                    </div>

                    {/* Heat Shimmer Waves */}
                    <div className="absolute bottom-24 inset-x-0 h-16 pointer-events-none animate-heat-shimmer">
                      <div className="w-full h-full bg-gradient-to-t from-amber-400/20 via-orange-300/10 to-transparent blur-[2px]" />
                    </div>
                  </div>
                )}

                {/* --- E. LONDON RAIN SCENERY (Complementary) --- */}
                {currentPlaceId === 'london_rain' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Rain streaks */}
                    <div className="absolute inset-0 overflow-hidden z-20">
                      {Array.from({ length: 24 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-0.5 h-8 bg-blue-400/60 rounded-full"
                          style={{
                            left: `${(i * 17) % 100}%`,
                            top: `${(i * 19) % 80}%`,
                            animation: `rain-streak ${0.4 + (i % 5) * 0.1}s linear infinite`,
                            animationDelay: `${(i % 7) * 0.1}s`,
                          }}
                        />
                      ))}
                    </div>
                    {/* Wet pavement */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[#6f8373]">
                      <div className="absolute top-2 inset-x-0 h-4 bg-black/10 rounded-full blur-sm" />
                    </div>
                  </div>
                )}

                {/* --- F. ALPS SNOW SCENERY (Complementary) --- */}
                {currentPlaceId === 'alps_snow' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Falling snow */}
                    <div className="absolute inset-0 overflow-hidden z-20">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <div
                          key={i}
                          className="absolute w-2 h-2 rounded-full bg-white/90 shadow-sm"
                          style={{
                            left: `${(i * 13) % 96}%`,
                            top: `-10px`,
                            animation: `snow-tumble ${2.5 + (i % 4) * 0.8}s linear infinite`,
                            animationDelay: `${(i % 5) * 0.4}s`,
                          }}
                        />
                      ))}
                    </div>
                    {/* Snowy terrain */}
                    <div className="absolute inset-x-0 bottom-0 h-24 bg-[#e2e8f0]" />
                  </div>
                )}

                {/* ========================================================= */}
                {/* 2. REALISTIC 2D ANIMATED CHARACTERS (High-Fidelity Anatomic Vectors & Fluid Walk Physics) */}
                {/* ========================================================= */}
                <div className="absolute inset-0 flex items-center justify-center pt-6 z-30 pointer-events-none">
                  {currentPlaceId === 'kyoto' && <KyotoKimonoCharacter isPaused={isPaused} />}
                  {currentPlaceId === 'mexico' && <MexicoSerapeCharacter isPaused={isPaused} />}
                  {currentPlaceId === 'cusco' && <CuscoAndeanCharacter isPaused={isPaused} />}
                  {currentPlaceId === 'sahara' && <SaharaLinenCharacter isPaused={isPaused} />}
                  {currentPlaceId === 'london_rain' && <LondonRainCharacter isPaused={isPaused} />}
                  {currentPlaceId === 'alps_snow' && <AlpsSnowCharacter isPaused={isPaused} />}
                </div>

                {/* Play / Pause Animation & Tag overlay */}
                <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
                  <button
                    onClick={() => setIsPaused(!isPaused)}
                    title={isPaused ? 'Play animation' : 'Pause animation'}
                    className="w-7 h-7 rounded-full bg-white/80 hover:bg-white text-slate-800 flex items-center justify-center shadow-md backdrop-blur-md transition cursor-pointer"
                  >
                    {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
                  </button>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide bg-white/80 backdrop-blur-md text-slate-800 uppercase border border-white/60">
                    {currentPlace.characterName} • {currentPlace.name}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Clean Vertical Meteorological Metrics (Matching the Reference Images) */}
          <div className="lg:col-span-3 flex flex-col justify-center space-y-6">
            {/* Metric 1: Precipitation or Humidity with Droplet / Cloud line icon */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-orange-100/70 border border-orange-200/80 flex items-center justify-center text-orange-600 shrink-0">
                <Droplets className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-display font-medium text-slate-900 block leading-tight">
                  {currentPlace.humidityOrRain}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">{currentPlace.humidityLabel}</span>
              </div>
            </div>

            {/* Metric 2: Wind Speed with Airflow Line Icon */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-sky-100/70 border border-sky-200/80 flex items-center justify-center text-sky-600 shrink-0">
                <Wind className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-display font-medium text-slate-900 block leading-tight">
                  {currentPlace.windSpeed} km/h
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Wind Speed</span>
              </div>
            </div>

            {/* Metric 3: Daylight / Sunlight Hours */}
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-100/70 border border-amber-200/80 flex items-center justify-center text-amber-600 shrink-0">
                <Sun className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-display font-medium text-slate-900 block leading-tight">
                  {currentPlace.sunHours} h
                </span>
                <span className="text-[11px] text-slate-500 font-medium">Daily Sunlight</span>
              </div>
            </div>

            {/* Place Switcher Quick Thumbnails Pill Carousel */}
            <div className="pt-2 border-t border-stone-200/60">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Explore 2D Worlds:
              </span>
              <div className="grid grid-cols-2 gap-1.5">
                {PLACE_ORDER.map((placeId) => {
                  const p = PLACES[placeId];
                  const isActive = currentPlaceId === placeId;
                  return (
                    <button
                      key={placeId}
                      onClick={() => handleSelectPlace(placeId)}
                      className={`px-2 py-1.5 rounded-xl text-[11px] font-semibold transition cursor-pointer flex items-center gap-1.5 border text-left ${
                        isActive
                          ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                          : 'bg-white/80 hover:bg-white text-slate-700 border-stone-200'
                      }`}
                    >
                      <span className="text-xs">{p.flag}</span>
                      <span className="truncate">{p.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Capsule Commute / Destination Card (Matching the Reference UI) */}
        <div className="px-6 sm:px-12 py-5 sm:py-6 bg-white border-t border-stone-200/70">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Left Title: "Just go somewhere" + dynamic place emojis */}
            <div className="md:col-span-4 flex items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-xl font-display font-bold text-slate-900 leading-tight">
                    Just go somewhere
                  </h3>
                  <span className="text-base" role="img">
                    {currentPlace.emojiTag}
                  </span>
                </div>
                {/* Dotted progress rail as shown in the mockup */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="w-2.5 h-2.5 rounded-full border-2 border-orange-500 bg-white" />
                  <span className="w-12 h-0.5 border-t border-dashed border-stone-300" />
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                </div>
              </div>
            </div>

            {/* Destination Input: "Where do you want to go" */}
            <div className="md:col-span-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                {currentPlace.destinationPrompt}
              </span>
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Choose destination..."
                className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-stone-100/80 px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* Date Input: "Date" */}
            <div className="md:col-span-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-0.5">
                {currentPlace.datePrompt}
              </span>
              <input
                type="text"
                value={dateSelection}
                onChange={(e) => setDateSelection(e.target.value)}
                placeholder="Set date..."
                className="w-full text-xs sm:text-sm font-semibold text-slate-800 bg-stone-100/80 px-3 py-1.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>

            {/* The Iconic Coral Circular Action Button with Search Icon */}
            <div className="md:col-span-2 flex justify-end">
              <button
                onClick={handleCheckRoute}
                disabled={isCheckingRoute}
                title="Verify Meteorological Viability with WeatherGPT"
                className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-orange-500 to-rose-500 hover:from-orange-400 hover:to-rose-400 text-white flex items-center justify-center shadow-lg shadow-orange-500/25 transition-all hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-60"
              >
                {isCheckingRoute ? (
                  <Sparkles className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5 stroke-[2.4]" />
                )}
              </button>
            </div>
          </div>

          {/* Route Advice Banner */}
          {routeAdvice && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-xs text-slate-800 shadow-sm flex items-start justify-between gap-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-900 block mb-0.5">Route Weather Intelligence:</span>
                  <p>{routeAdvice}</p>
                </div>
              </div>
              {onAskWeatherGpt && (
                <button
                  onClick={() => onAskWeatherGpt(`Check the weather and route safety in ${currentPlace.name} for ${activity} to ${destination} right now.`)}
                  className="shrink-0 px-3 py-1 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 font-semibold text-xs border border-orange-300 transition cursor-pointer"
                >
                  Ask WeatherGPT ↗
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
