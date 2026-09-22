import React, { useState, useMemo, useEffect } from 'react';
import {
  Search,
  Bell,
  MapPin,
  Calendar,
  Settings,
  BarChart3,
  ChevronDown,
  Wind,
  Sun,
  Droplets,
  Eye,
  EyeOff,
  Gauge,
  Umbrella,
  Cloud,
  CloudRain,
  CloudSun,
  CloudSnow,
  CloudLightning,
  Sparkles,
  Check,
  AlertTriangle,
  LogIn,
  LogOut,
  Bookmark,
  BookmarkCheck,
  User,
  Radio,
  Sliders,
  Flame,
  Navigation,
  Loader2,
} from 'lucide-react';
import { NormalizedWeatherData, LocationData } from '../types';
import { WeatherScene2DBackground } from './WeatherScene2DBackground';
import {
  WeatherDynamicCanvasOverlay,
  WeatherOverlayMode,
  WeatherOverlayIntensity,
} from './WeatherDynamicCanvasOverlay';
import { CustomizableWeatherWidgets } from './CustomizableWeatherWidgets';
import { RegionalWeatherMap } from './RegionalWeatherMap';
import { useFirebase } from '../context/FirebaseContext';

interface WeatherDashboardProps {
  weatherData: NormalizedWeatherData;
  isLoading?: boolean;
  useFahrenheit: boolean;
  onToggleFahrenheit: () => void;
  onOpenSearch: () => void;
  onOpenAlerts: () => void;
  onOpenDetails: () => void;
  onOpenAi: () => void;
  onSelectLocation: (loc: LocationData) => void;
  onDetectGps?: () => void;
  isDetectingGps?: boolean;
  activeAlertCount?: number;
}

// Popular quick switch locations (with Banten removed)
const POPULAR_LOCATIONS: LocationData[] = [
  { name: 'New Delhi', region: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.2090, timezone: 'Asia/Kolkata' },
  { name: 'Guntur', region: 'Andhra Pradesh', country: 'India', latitude: 16.3067, longitude: 80.4365, timezone: 'Asia/Kolkata' },
  { name: 'Hyderabad', region: 'Telangana', country: 'India', latitude: 17.3850, longitude: 78.4867, timezone: 'Asia/Kolkata' },
  { name: 'London', region: 'Greater London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278, timezone: 'Europe/London' },
  { name: 'Tokyo', region: 'Kanto', country: 'Japan', latitude: 35.6762, longitude: 139.6503, timezone: 'Asia/Tokyo' },
  { name: 'New York', region: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.0060, timezone: 'America/New_York' },
];

export const WeatherDashboard: React.FC<WeatherDashboardProps> = ({
  weatherData,
  isLoading = false,
  useFahrenheit,
  onToggleFahrenheit,
  onOpenSearch,
  onOpenAlerts,
  onOpenDetails,
  onOpenAi,
  onSelectLocation,
  onDetectGps,
  isDetectingGps = false,
  activeAlertCount = 0,
}) => {
  const { currentUser, isAuthLoading, signIn, signOut, saveLocation, deleteLocation, savedLocations, isLocationSaved } = useFirebase();

  const [chartMetric, setChartMetric] = useState<'temp' | 'rain' | 'wind'>('temp');
  const [isLocationDropdownOpen, setIsLocationDropdownOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userName, setUserName] = useState('Jack Grealish');
  const [isEditingName, setIsEditingName] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<LocationData[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [isSavingCity, setIsSavingCity] = useState(false);

  // Dynamic Weather Canvas Overlay settings
  const [overlayMode, setOverlayMode] = useState<WeatherOverlayMode>('auto');
  const [overlayIntensity, setOverlayIntensity] = useState<WeatherOverlayIntensity>('standard');
  const [isOverlayControlOpen, setIsOverlayControlOpen] = useState(false);
  const [isOverlayEnabled, setIsOverlayEnabled] = useState(true);

  // Dynamic atmospheric overlay label derived from active conditions
  const activeEffectLabel = useMemo(() => {
    const cat = weatherData.current.conditionCategory;
    const temp = weatherData.current.temp;
    if (overlayMode === 'snow' || (overlayMode === 'auto' && cat === 'snow')) return 'Falling Snow';
    if (overlayMode === 'rain' || (overlayMode === 'auto' && (cat === 'rain' || cat === 'drizzle'))) return 'Drifting Rain';
    if (overlayMode === 'thunderstorm' || (overlayMode === 'auto' && cat === 'thunderstorm')) return 'Thunderstorm & Lightning';
    if (overlayMode === 'fog' || (overlayMode === 'auto' && (cat === 'fog' || cat === 'cloudy'))) return 'Drifting Mist';
    if (overlayMode === 'haze' || (overlayMode === 'auto' && temp >= 24)) return 'Solar Heat Haze';
    return 'Daylight Shimmer';
  }, [weatherData, overlayMode]);

  // Temperature display helper
  const displayTemp = (c: number) => {
    if (useFahrenheit) {
      return Math.round((c * 9) / 5 + 32);
    }
    return Math.round(c);
  };

  const current = weatherData.current;
  const location = weatherData.location;

  const isCurrentSaved = isLocationSaved(location.latitude, location.longitude);

  const handleToggleBookmark = async () => {
    try {
      setIsSavingCity(true);
      if (isCurrentSaved) {
        const savedItem = savedLocations.find(
          (s) => Math.abs(s.lat - location.latitude) < 0.05 && Math.abs(s.lon - location.longitude) < 0.05
        );
        if (savedItem) {
          await deleteLocation(savedItem.id);
        }
      } else {
        await saveLocation(location);
      }
    } catch (e) {
      console.error('Error toggling location bookmark:', e);
    } finally {
      setIsSavingCity(false);
    }
  };

  // Search autocomplete handler
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.results && Array.isArray(data.results)) {
            setSearchResults(
              data.results.map((r: any) => ({
                name: r.name,
                region: r.region || '',
                country: r.country || '',
                latitude: r.latitude,
                longitude: r.longitude,
                timezone: r.timezone,
              }))
            );
          }
        }
      } catch (err) {
        console.error('Search autocomplete error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hourly slots for "How's the temperature today?" (Morning ~9am, Afternoon ~2pm, Evening ~6pm, Night ~10pm)
  const timeSlotsData = useMemo(() => {
    const hourly = weatherData.hourly || [];
    const getHourItem = (targetHour: number) => {
      return hourly.find((h) => h.hourNum === targetHour) || hourly[0] || {
        temp: current.temp,
        rainProb: current.rainProb,
        windSpeed: current.windSpeed,
        conditionCategory: current.conditionCategory,
      };
    };

    const morning = getHourItem(9);
    const afternoon = getHourItem(14);
    const evening = getHourItem(18);
    const night = getHourItem(22);

    return [
      { label: 'Morning', time: '09:00', temp: morning.temp, rain: morning.rainProb, wind: morning.windSpeed, icon: 'cloud', isPeak: false },
      { label: 'Afternoon', time: '14:00', temp: afternoon.temp, rain: afternoon.rainProb, wind: afternoon.windSpeed, icon: 'sun', isPeak: true },
      { label: 'Evening', time: '18:00', temp: evening.temp, rain: evening.rainProb, wind: evening.windSpeed, icon: 'cloud-sun', isPeak: false },
      { label: 'Night', time: '22:00', temp: night.temp, rain: night.rainProb, wind: night.windSpeed, icon: 'moon', isPeak: false },
    ];
  }, [weatherData, current]);

  // Tomorrow Forecast data
  const tomorrowData = useMemo(() => {
    if (weatherData.daily && weatherData.daily.length > 1) {
      return weatherData.daily[1];
    }
    return {
      dayFormatted: 'Tomorrow',
      condition: 'Rainy',
      tempMax: 20,
      tempMin: 16,
      rainProb: 80,
    };
  }, [weatherData]);

  // Sun Arc Daylight percentage calculation
  const sunTimes = useMemo(() => {
    const todayDaily = weatherData.daily?.[0];
    const sunriseStr = todayDaily?.sunrise || '06:00 am';
    const sunsetStr = todayDaily?.sunset || '06:45 pm';

    // Approximate daylight fraction
    const now = new Date();
    const currentHour = now.getHours() + now.getMinutes() / 60;
    const startHour = 6.0;
    const endHour = 18.75;
    let fraction = (currentHour - startHour) / (endHour - startHour);
    if (fraction < 0) fraction = 0.05;
    if (fraction > 1) fraction = 0.95;

    return {
      sunrise: sunriseStr,
      sunset: sunsetStr,
      progressFraction: fraction,
    };
  }, [weatherData]);

  // Air Quality Rating
  const aqiValue = useMemo(() => {
    const rawAqi = Math.round(weatherData.current.pressure ? (1013 - weatherData.current.pressure) * 15 + 180 : 390);
    return Math.max(45, Math.min(480, rawAqi || 390));
  }, [weatherData]);

  const aqiStatus = useMemo(() => {
    if (aqiValue <= 50) return { label: 'Good', badge: 'bg-emerald-500' };
    if (aqiValue <= 100) return { label: 'Moderate', badge: 'bg-amber-500' };
    if (aqiValue <= 200) return { label: 'Standard', badge: 'bg-stone-800' };
    if (aqiValue <= 300) return { label: 'Unhealthy', badge: 'bg-orange-500' };
    return { label: 'Hazardous', badge: 'bg-rose-500' };
  }, [aqiValue]);

  // UV Index rating
  const uvRating = useMemo(() => {
    const uv = current.uvIndex || 3.5;
    if (uv <= 2) return { text: 'Low', color: 'bg-emerald-400 text-stone-900', risk: 'Low risk of harm from UV rays' };
    if (uv <= 5) return { text: 'Moderate', color: 'bg-[#d9f99d] text-stone-900', risk: 'Moderate risk of harm from UV rays' };
    if (uv <= 7) return { text: 'High', color: 'bg-amber-400 text-stone-900', risk: 'High risk of harm from unprotected sun' };
    return { text: 'Very High', color: 'bg-rose-500 text-white', risk: 'Very high risk of harm from UV rays' };
  }, [current.uvIndex]);

  // Weather Predictions (Next days)
  const predictionItems = useMemo(() => {
    if (weatherData.daily && weatherData.daily.length >= 3) {
      return weatherData.daily.slice(1, 4).map((d) => ({
        date: d.dayFormatted,
        condition: d.condition,
        category: d.conditionCategory,
        maxTemp: displayTemp(d.tempMax),
        minTemp: displayTemp(d.tempMin),
      }));
    }
    return [
      { date: 'November 10', condition: 'Cloudy', category: 'cloudy', maxTemp: 26, minTemp: 19 },
      { date: 'November 11', condition: 'Bright', category: 'clear', maxTemp: 26, minTemp: 20 },
      { date: 'November 12', condition: 'Showers', category: 'rain', maxTemp: 24, minTemp: 18 },
    ];
  }, [weatherData.daily, useFahrenheit]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-3 sm:p-6 md:p-8 lg:p-10 relative overflow-hidden select-none font-sans"
      style={{
        backgroundColor: '#f8f6f2',
        backgroundImage: `
          radial-gradient(ellipse at 85% 15%, rgba(254, 215, 170, 0.45) 0%, transparent 50%),
          radial-gradient(ellipse at 15% 85%, rgba(253, 186, 116, 0.25) 0%, transparent 45%),
          radial-gradient(ellipse at 50% 50%, rgba(255, 255, 255, 0.6) 0%, transparent 60%)
        `,
      }}
    >
      {/* Dynamic Realistic 2D Animated Character & Atmospheric Weather Background */}
      <WeatherScene2DBackground
        conditionCategory={weatherData.current.conditionCategory}
        isDay={weatherData.current.isDay}
      />

      {/* Dynamic Atmospheric Canvas Overlay: Falling snow, drifting rain, heat haze, solar shimmer */}
      {isOverlayEnabled && (
        <WeatherDynamicCanvasOverlay
          conditionCategory={weatherData.current.conditionCategory}
          temperature={weatherData.current.temp}
          windSpeed={weatherData.current.windSpeed}
          isDay={weatherData.current.isDay}
          forcedOverlay={overlayMode}
          intensity={overlayIntensity}
        />
      )}

      {/* 1. Concentric Contour Line Waves in Backdrop */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-20 transition-opacity duration-1000"
        viewBox="0 0 1440 900"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        <path
          d="M-100 150 C300 80, 500 350, 900 120 C1200 -50, 1400 180, 1600 100"
          stroke="rgba(214, 211, 209, 0.6)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-150 240 C250 170, 480 430, 880 200 C1180 30, 1380 260, 1650 180"
          stroke="rgba(214, 211, 209, 0.5)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-50 400 C400 300, 600 600, 1000 400 C1300 250, 1500 500, 1700 380"
          stroke="rgba(214, 211, 209, 0.4)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M-100 700 C300 650, 650 900, 1100 750 C1350 650, 1550 850, 1700 780"
          stroke="rgba(214, 211, 209, 0.5)"
          strokeWidth="1.5"
          fill="none"
        />
        <path
          d="M100 850 C500 800, 800 980, 1250 880 C1450 800, 1600 950, 1750 900"
          stroke="rgba(214, 211, 209, 0.4)"
          strokeWidth="1.5"
          fill="none"
        />
      </svg>

      {/* 2. Main White Dashboard Card Container */}
      <div className="relative z-10 w-full max-w-[1280px] bg-white rounded-[32px] sm:rounded-[40px] shadow-[0_24px_70px_rgba(28,25,23,0.08)] overflow-hidden flex flex-col lg:flex-row min-h-[760px] border border-stone-200/80">
        {/* Subtle Ambient Top Loading Line with Shimmer */}
        {isLoading && (
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-50 overflow-hidden z-50">
            <div className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 w-1/2 animate-skeleton-shimmer rounded-full" />
          </div>
        )}

        {/* ========================================================================= */}
        {/* A. LEFT SLIM NAVIGATION SIDEBAR */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[76px] shrink-0 border-b lg:border-b-0 lg:border-r border-stone-100 flex lg:flex-col items-center justify-between py-4 lg:py-7 px-4 lg:px-0 bg-white z-20">
          {/* Brand Logo: Warm orange spiral coil */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={() => onDetectGps ? onDetectGps() : onSelectLocation(POPULAR_LOCATIONS[0])}
              className="group flex flex-col items-center cursor-pointer transition transform hover:scale-105"
              title="Present GPS Location / Refresh"
            >
              <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center border border-orange-100 shadow-xs">
                {/* Stylized Spiral Coil Icon in Warm Orange */}
                <svg width="26" height="26" viewBox="0 0 32 32" fill="none">
                  <path
                    d="M16 4C9.37 4 4 9.37 4 16C4 22.63 9.37 28 16 28C22.63 28 28 22.63 28 16"
                    stroke="#f97316"
                    strokeWidth="3.2"
                    strokeLinecap="round"
                  />
                  <path
                    d="M16 8C11.58 8 8 11.58 8 16C8 20.42 11.58 24 16 24C20.42 24 24 20.42 24 16"
                    stroke="#fb923c"
                    strokeWidth="3"
                    strokeLinecap="round"
                  />
                  <circle cx="16" cy="16" r="3.5" fill="#f97316" />
                </svg>
              </div>
            </button>
          </div>

          {/* Navigation Icons Vertical Stack */}
          <nav className="flex lg:flex-col items-center gap-2 sm:gap-4 lg:gap-5 my-auto">
            {/* Active Dashboard Button */}
            <button
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white shadow-[0_8px_18px_rgba(249,115,22,0.4)] transition transform hover:scale-105 active:scale-95 cursor-pointer"
              title="Weather Dashboard"
            >
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-4.5 bg-white rounded-full"></div>
                <div className="w-1.5 h-3.5 bg-white/80 rounded-full"></div>
              </div>
            </button>

            {/* Analytics / Charts Icon */}
            <button
              onClick={onOpenDetails}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title="Weather Analytics & Graphs"
            >
              <BarChart3 className="w-5 h-5" />
            </button>

            {/* Locations Pin Icon */}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title="Explore Places"
            >
              <MapPin className="w-5 h-5" />
            </button>

            {/* Calendar Icon */}
            <button
              onClick={onOpenDetails}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition relative cursor-pointer"
              title="7-Day Calendar Forecast"
            >
              <Calendar className="w-5 h-5" />
              <span className="absolute text-[8px] font-bold text-stone-500 top-3">12</span>
            </button>

            {/* Settings Icon (Toggle Celsius / Fahrenheit) */}
            <button
              onClick={onToggleFahrenheit}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-50 transition cursor-pointer"
              title={`Switch Unit: Current is °${useFahrenheit ? 'F' : 'C'}`}
            >
              <Settings className="w-5 h-5" />
            </button>
          </nav>

          {/* Bottom Layout AI Assistant Trigger */}
          <div className="hidden lg:flex flex-col items-center gap-2">
            <button
              onClick={onOpenAi}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-stone-400 hover:text-orange-500 hover:bg-orange-50 transition cursor-pointer"
              title="Ask WeatherGPT AI"
            >
              <Sparkles className="w-4.5 h-4.5 text-orange-400" />
            </button>
          </div>
        </aside>

        {/* ========================================================================= */}
        {/* B. CENTRAL MAIN CONTENT AREA */}
        {/* ========================================================================= */}
        <main className="flex-1 p-4 sm:p-7 pb-28 sm:pb-32 flex flex-col justify-between overflow-y-auto">
          <div>
            {/* 1. Header Bar: Profile Greeting + Google Sign-In + Search + Notification Bell */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              {/* User Avatar + Greeting / Google Sign-In Status */}
              <div className="flex items-center gap-3 relative">
                <div
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="relative w-12 h-12 rounded-full overflow-hidden bg-amber-100 ring-2 ring-orange-200 flex items-center justify-center shrink-0 transition-transform duration-300 hover:scale-105 cursor-pointer"
                  title={currentUser ? `${currentUser.displayName || currentUser.email} (Click for Account)` : 'Click to Sign in with Google'}
                >
                  {currentUser?.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || 'Google User'}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    /* Warm character avatar */
                    <svg viewBox="0 0 100 100" className="w-full h-full">
                      <circle cx="50" cy="50" r="50" fill="#fed7aa" />
                      <path d="M30 42 C30 22 70 22 70 42 C70 30 35 30 30 42 Z" fill="#451a03" />
                      <circle cx="50" cy="46" r="19" fill="#fde047" />
                      <circle cx="43" cy="45" r="5.5" stroke="#1c1917" strokeWidth="2" fill="white" opacity="0.9" />
                      <circle cx="57" cy="45" r="5.5" stroke="#1c1917" strokeWidth="2" fill="white" opacity="0.9" />
                      <line x1="48.5" y1="45" x2="51.5" y2="45" stroke="#1c1917" strokeWidth="2" />
                      <circle cx="43" cy="45" r="1.5" fill="#1c1917" />
                      <circle cx="57" cy="45" r="1.5" fill="#1c1917" />
                      <path d="M46 54 Q50 58 54 54" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
                      <path d="M30 85 C30 65 70 65 70 85 Z" fill="#ea580c" />
                      <polygon points="50,68 44,78 56,78" fill="#ffffff" />
                    </svg>
                  )}
                  {/* Google Authenticated indicator badge */}
                  {currentUser && (
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full ring-2 ring-white" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-stone-400 font-normal">Hello,</span>
                    {currentUser ? (
                      <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.2 rounded-full border border-emerald-200">
                        Google Verified
                      </span>
                    ) : (
                      <button
                        onClick={() => signIn()}
                        className="text-[10px] font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-2 py-0.5 rounded-full border border-orange-200 transition cursor-pointer flex items-center gap-1"
                      >
                        <LogIn className="w-2.5 h-2.5" />
                        <span>Sign in with Google</span>
                      </button>
                    )}
                  </div>

                  {isEditingName ? (
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      onBlur={() => setIsEditingName(false)}
                      onKeyDown={(e) => e.key === 'Enter' && setIsEditingName(false)}
                      autoFocus
                      className="text-lg font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded outline-none border border-orange-400"
                    />
                  ) : (
                    <h1
                      onClick={() => !currentUser && setIsEditingName(true)}
                      className="text-lg sm:text-xl font-bold text-stone-900 tracking-tight cursor-pointer hover:text-orange-600 transition flex items-center gap-1.5"
                      title={currentUser ? currentUser.displayName || 'Google Account' : 'Click to change name'}
                    >
                      {currentUser ? currentUser.displayName || currentUser.email?.split('@')[0] : userName}
                    </h1>
                  )}
                </div>

                {/* Google User Menu Popover */}
                {isUserMenuOpen && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 p-3 z-50 animate-in fade-in zoom-in-95">
                    {currentUser ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-2.5 pb-2 border-b border-stone-100">
                          {currentUser.photoURL ? (
                            <img
                              src={currentUser.photoURL}
                              alt="Avatar"
                              className="w-9 h-9 rounded-full object-cover ring-1 ring-orange-300"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-sm">
                              {currentUser.displayName?.[0] || 'U'}
                            </div>
                          )}
                          <div className="overflow-hidden">
                            <div className="font-bold text-xs text-stone-900 truncate">
                              {currentUser.displayName || 'User'}
                            </div>
                            <div className="text-[10px] text-stone-400 truncate">
                              {currentUser.email}
                            </div>
                          </div>
                        </div>

                        <div className="text-[11px] text-stone-600 flex items-center justify-between">
                          <span>Saved Cities in Cloud:</span>
                          <span className="font-bold text-orange-600">{savedLocations.length}</span>
                        </div>

                        <button
                          onClick={async () => {
                            await signOut();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-2.5 text-center">
                        <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-600 flex items-center justify-center mx-auto">
                          <User className="w-5 h-5" />
                        </div>
                        <h4 className="font-bold text-xs text-stone-900">Google Authentication</h4>
                        <p className="text-[11px] text-stone-500">
                          Sign in to sync your preferred cities, custom radar telemetry, and AI conversations securely.
                        </p>
                        <button
                          onClick={async () => {
                            await signIn();
                            setIsUserMenuOpen(false);
                          }}
                          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <LogIn className="w-3.5 h-3.5" />
                          <span>Sign in with Google</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Search Bar + AI Ask + Bell Button */}
              <div className="flex items-center gap-3 w-full sm:w-auto relative">
                {/* Pill Search Input */}
                <div className="relative flex-1 sm:w-64 md:w-72">
                  <div className="flex items-center bg-[#f5f4f0] hover:bg-[#edebe6] focus-within:bg-white focus-within:ring-2 focus-within:ring-orange-400/50 rounded-full px-4 py-2 transition border border-transparent">
                    <input
                      type="text"
                      placeholder="Search live station radar ..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowSearchResults(true);
                      }}
                      onFocus={() => setShowSearchResults(true)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && searchResults.length > 0) {
                          onSelectLocation(searchResults[0]);
                          setShowSearchResults(false);
                          setSearchQuery('');
                        }
                      }}
                      className="bg-transparent border-none outline-none text-xs text-stone-700 placeholder-stone-400 w-full"
                    />
                    <button
                      onClick={onOpenSearch}
                      className="text-orange-500 hover:text-orange-600 transition shrink-0 ml-1.5 cursor-pointer"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Autocomplete Dropdown */}
                  {showSearchResults && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-stone-100 py-2 z-50 max-h-60 overflow-y-auto">
                      {searchResults.map((loc, idx) => (
                        <button
                          key={`${loc.name}-${idx}`}
                          onClick={() => {
                            onSelectLocation(loc);
                            setShowSearchResults(false);
                            setSearchQuery('');
                          }}
                          className="w-full px-4 py-2 text-left hover:bg-orange-50 text-xs flex items-center justify-between transition text-stone-700 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="font-semibold">{loc.name}</span>
                            <span className="text-stone-400 text-[11px] truncate max-w-[120px]">
                              {loc.region || loc.country}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* GPS Present Location button */}
                {onDetectGps && (
                  <button
                    onClick={onDetectGps}
                    disabled={isDetectingGps}
                    className={`p-2 rounded-full border transition shrink-0 cursor-pointer flex items-center justify-center ${
                      isDetectingGps
                        ? 'bg-amber-100 border-amber-400 text-amber-600 animate-pulse'
                        : 'border-stone-200 text-stone-600 hover:text-orange-600 hover:bg-orange-50 hover:border-orange-200'
                    }`}
                    title="Detect Present GPS Location"
                    aria-label="Present GPS Location"
                  >
                    {isDetectingGps ? (
                      <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
                    ) : (
                      <Navigation className="w-4 h-4 text-orange-500" />
                    )}
                  </button>
                )}

                {/* Bookmark current city button */}
                <button
                  onClick={handleToggleBookmark}
                  disabled={isSavingCity}
                  className={`p-2 rounded-full border transition shrink-0 cursor-pointer ${
                    isCurrentSaved
                      ? 'bg-amber-50 border-amber-300 text-amber-600'
                      : 'border-stone-200 text-stone-400 hover:text-stone-700 hover:bg-stone-50'
                  }`}
                  title={isCurrentSaved ? 'Saved in Cloud' : 'Save City to Cloud'}
                >
                  {isCurrentSaved ? (
                    <BookmarkCheck className="w-4 h-4 fill-amber-500 text-amber-600" />
                  ) : (
                    <Bookmark className="w-4 h-4" />
                  )}
                </button>

                {/* WeatherGPT AI Quick Button */}
                <button
                  onClick={onOpenAi}
                  className="px-3.5 py-2 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition transform hover:scale-[1.02] cursor-pointer shrink-0"
                  title="Ask WeatherGPT AI"
                >
                  <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                  <span className="hidden md:inline">Ask AI</span>
                </button>

                {/* Bell Icon with Alert Notification Count */}
                <button
                  onClick={onOpenAlerts}
                  className="w-10 h-10 rounded-full border border-stone-200/80 flex items-center justify-center text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition relative shrink-0 shadow-xs cursor-pointer"
                  title="Weather Alerts"
                >
                  <Bell className="w-4 h-4 text-stone-600" />
                  {activeAlertCount > 0 && (
                    <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </button>
              </div>
            </header>

            {/* Realtime Live Data Stream Ribbon & Dynamic Weather Canvas Overlay Control */}
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-500 px-1 relative">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span className="font-semibold text-emerald-700">Realtime Open-Meteo High-Res Feed</span>
                <span className="text-stone-400 hidden sm:inline">• Live atmospheric stream</span>
              </div>

              {/* Dynamic Weather Overlay Status & Control Badge */}
              <div className="relative flex items-center gap-2">
                <button
                  onClick={() => setIsOverlayControlOpen(!isOverlayControlOpen)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition shadow-xs border cursor-pointer ${
                    isOverlayEnabled
                      ? 'bg-amber-50/90 text-amber-900 border-amber-200 hover:bg-amber-100'
                      : 'bg-stone-100 text-stone-500 border-stone-200 hover:bg-stone-200'
                  }`}
                  title="Dynamic Weather Canvas Overlay Settings"
                >
                  <Sparkles className={`w-3 h-3 ${isOverlayEnabled ? 'text-amber-500 animate-pulse' : 'text-stone-400'}`} />
                  <span>
                    Overlay: <strong className="font-semibold text-stone-800">{isOverlayEnabled ? activeEffectLabel : 'Disabled'}</strong>
                  </span>
                  <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 bg-white/80 rounded-md border border-amber-200/60 font-bold text-amber-900">
                    {overlayMode === 'auto' ? 'Auto' : overlayMode}
                  </span>
                  <ChevronDown className="w-3 h-3 text-stone-400" />
                </button>

                <div className="text-[10px] text-stone-400 font-mono hidden md:inline">
                  Lat: {location.latitude.toFixed(2)}°, Lon: {location.longitude.toFixed(2)}°
                </div>

                {/* Popover Menu for Canvas Overlay Controls */}
                {isOverlayControlOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-stone-200 p-4 z-50 text-stone-800 animate-in fade-in zoom-in-95 duration-150">
                    <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-stone-100">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span className="font-bold text-xs text-stone-900">Dynamic Weather Canvas</span>
                      </div>
                      <button
                        onClick={() => setIsOverlayEnabled(!isOverlayEnabled)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full transition cursor-pointer ${
                          isOverlayEnabled ? 'bg-amber-100 text-amber-800' : 'bg-stone-100 text-stone-500'
                        }`}
                      >
                        {isOverlayEnabled ? 'Active' : 'Off'}
                      </button>
                    </div>

                    <div className="text-[11px] text-stone-500 mb-3">
                      Renders subtle physics-based overlays (falling snow, drifting rain, thunderstorm, or solar heat haze) matching current weather telemetry.
                    </div>

                    {/* Effect Modes */}
                    <div className="mb-3">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                        Overlay Preset
                      </label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: 'auto', label: 'Auto (Weather)', icon: Sparkles },
                          { id: 'haze', label: 'Heat Haze / Sun', icon: Sun },
                          { id: 'rain', label: 'Drifting Rain', icon: CloudRain },
                          { id: 'snow', label: 'Falling Snow', icon: CloudSnow },
                          { id: 'thunderstorm', label: 'Thunderstorm', icon: CloudLightning },
                          { id: 'fog', label: 'Drifting Mist', icon: Cloud },
                        ].map((item) => {
                          const Icon = item.icon;
                          const isSelected = overlayMode === item.id;
                          return (
                            <button
                              key={item.id}
                              onClick={() => {
                                setOverlayMode(item.id as WeatherOverlayMode);
                                setIsOverlayEnabled(true);
                              }}
                              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs text-left transition cursor-pointer border ${
                                isSelected
                                  ? 'bg-amber-500 text-white font-semibold border-amber-600 shadow-xs'
                                  : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200/70'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate">{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Intensity options */}
                    <div className="mb-2">
                      <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider block mb-1.5">
                        Particle Intensity
                      </label>
                      <div className="flex items-center gap-1.5">
                        {(['subtle', 'standard', 'vivid'] as WeatherOverlayIntensity[]).map((lvl) => (
                          <button
                            key={lvl}
                            onClick={() => setOverlayIntensity(lvl)}
                            className={`flex-1 py-1 rounded-lg text-[11px] font-medium capitalize text-center transition cursor-pointer border ${
                              overlayIntensity === lvl
                                ? 'bg-stone-900 text-white border-stone-900'
                                : 'bg-stone-50 text-stone-600 hover:bg-stone-100 border-stone-200'
                            }`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 mt-2 border-t border-stone-100 flex items-center justify-between text-[10px] text-stone-400">
                      <span>Live wind: {weatherData.current.windSpeed} km/h</span>
                      <button
                        onClick={() => setIsOverlayControlOpen(false)}
                        className="text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 2. Row 1: Two Large Hero Visual Cards (Weather Card + Air Quality Card) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-7">
              {/* --- HERO CARD 1: WEATHER (Warm Sunset Sky with Pastel Clouds & Floating Sun) --- */}
              <div className="relative rounded-[28px] overflow-hidden p-5 sm:p-6 text-stone-900 flex flex-col justify-between min-h-[260px] shadow-sm border border-orange-100/60 group transition-all duration-300 hover:shadow-md hover:border-orange-200">
                {/* Visual Sunset Sky Gradient & Art Canvas */}
                <div
                  className="absolute inset-0 z-0 transition duration-700"
                  style={{
                    background: 'linear-gradient(145deg, #fed7aa 0%, #fecaca 35%, #fde68a 70%, #ffedd5 100%)',
                  }}
                >
                  {/* Glowing Golden Sun tucked behind clouds with subtle pulse animation */}
                  <div className="absolute top-14 right-16 w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-orange-400 opacity-95 blur-[1px] shadow-[0_0_35px_rgba(251,146,60,0.6)] animate-sun-glow" />

                  {/* Stylized Illustrated Billowing Clouds with subtle drift */}
                  <svg
                    className="absolute inset-0 w-full h-full opacity-85 pointer-events-none animate-cloud-drift"
                    viewBox="0 0 340 240"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M140 110 C150 70 210 70 225 100 C245 95 270 110 270 135 C295 140 310 165 300 195 L340 240 L100 240 Z"
                      fill="#fed7aa"
                      opacity="0.8"
                    />
                    <path
                      d="M170 120 C180 90 230 90 245 115 C265 110 290 125 290 150 C310 160 320 185 305 215 L340 240 L150 240 Z"
                      fill="#fef08a"
                      opacity="0.75"
                    />
                    <path
                      d="M200 135 C215 110 260 110 275 130 C295 130 315 145 315 168 C330 178 340 200 325 230 L340 240 L180 240 Z"
                      fill="#ffffff"
                      opacity="0.95"
                    />
                  </svg>
                </div>

                {/* Dynamic Subtle Weather Canvas Overlay Inside Hero Card */}
                {isOverlayEnabled && (
                  <WeatherDynamicCanvasOverlay
                    conditionCategory={weatherData.current.conditionCategory}
                    temperature={weatherData.current.temp}
                    windSpeed={weatherData.current.windSpeed}
                    isDay={weatherData.current.isDay}
                    forcedOverlay={overlayMode}
                    intensity={overlayIntensity}
                    className="rounded-[28px] opacity-75"
                  />
                )}

                {/* Content Overlay */}
                <div className="relative z-10">
                  {/* Header: Weather pill */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-xs">
                      <CloudSun className="w-4 h-4 text-amber-500 animate-pulse" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800">Weather</div>
                      <div className="text-[10px] text-stone-600">What's the weather.</div>
                    </div>
                  </div>

                  {/* Temperature & Condition */}
                  <div className="mt-5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-5xl sm:text-6xl font-black tracking-tighter text-stone-900 drop-shadow-xs">
                        {displayTemp(current.temp)}°C
                      </span>
                      <span className="text-xs font-semibold px-2 py-0.5 bg-white/70 backdrop-blur-md rounded-full text-stone-700 border border-white/60">
                        {displayTemp(current.tempMinToday)}°C
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-stone-700 mt-1 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 inline-block animate-ping" />
                      <span>{current.condition || 'Partly Cloudy'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom 3 Stat Pills (Pressure, Visibility, Humidity) */}
                <div className="relative z-10 grid grid-cols-3 gap-2 mt-6">
                  {/* Pressure Pill (Dark Stone) */}
                  <div className="bg-[#1c1917] text-white rounded-2xl p-2.5 flex flex-col justify-center shadow-sm transition transform hover:scale-[1.02]">
                    <span className="text-[10px] text-stone-300 font-medium">Pressure</span>
                    <span className="text-xs sm:text-sm font-bold mt-0.5 tracking-tight">
                      {current.pressure ? `${Math.round(current.pressure)}mb` : '1013mb'}
                    </span>
                  </div>

                  {/* Visibility Pill (Pastel Lime Green) */}
                  <div className="bg-[#dcfce7] text-stone-900 rounded-2xl p-2.5 flex flex-col justify-center shadow-sm transition transform hover:scale-[1.02]">
                    <span className="text-[10px] text-emerald-800 font-medium">Visibility</span>
                    <span className="text-xs sm:text-sm font-bold mt-0.5 tracking-tight text-emerald-950">
                      {current.visibility ? `${current.visibility} km` : '10 km'}
                    </span>
                  </div>

                  {/* Humidity Pill (Crisp White) */}
                  <div className="bg-white/95 backdrop-blur-sm text-stone-900 rounded-2xl p-2.5 flex flex-col justify-center shadow-sm transition transform hover:scale-[1.02] border border-orange-50">
                    <span className="text-[10px] text-stone-500 font-medium">Humidity</span>
                    <span className="text-xs sm:text-sm font-bold mt-0.5 tracking-tight text-stone-900">
                      {current.humidity ? `${Math.round(current.humidity)}%` : '65%'}
                    </span>
                  </div>
                </div>
              </div>

              {/* --- HERO CARD 2: AIR QUALITY (Golden Amber Morning Horizon with Floating Diamond Kite) --- */}
              <div className="relative rounded-[28px] overflow-hidden p-5 sm:p-6 text-stone-900 flex flex-col justify-between min-h-[260px] shadow-sm border border-amber-100/60 group transition-all duration-300 hover:shadow-md hover:border-amber-200">
                {/* Visual Sky & Kite Background Canvas - Warm Sand and Dawn Gradient */}
                <div
                  className="absolute inset-0 z-0 transition duration-700"
                  style={{
                    background: 'linear-gradient(155deg, #fed7aa 0%, #fef08a 45%, #fed7aa 80%, #ffedd5 100%)',
                  }}
                >
                  {/* Billowing cumulus white clouds on the right */}
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
                    viewBox="0 0 340 240"
                    fill="none"
                    preserveAspectRatio="none"
                  >
                    <path
                      d="M180 130 C190 90 250 90 270 120 C290 115 320 130 320 160 C335 170 345 200 330 230 L340 240 L160 240 Z"
                      fill="#ffffff"
                      opacity="0.95"
                    />
                    <path
                      d="M220 150 C235 120 280 120 300 145 C320 145 340 160 340 185 L340 240 L200 240 Z"
                      fill="#fef3c7"
                      opacity="0.7"
                    />
                  </svg>

                  {/* Red & Orange Diamond Kite Soaring with Tail & Gentle Float Animation */}
                  <div className="absolute top-10 right-16 sm:right-20 z-10 animate-float-gentle">
                    <svg width="65" height="95" viewBox="0 0 60 90" fill="none">
                      <path d="M26 30 Q10 60 -20 110" stroke="rgba(180,83,9,0.4)" strokeWidth="1" strokeDasharray="3 2" />
                      <polygon points="26,10 40,24 26,42 12,24" fill="#ea580c" />
                      <polygon points="26,10 40,24 26,24" fill="#dc2626" />
                      <polygon points="12,24 26,24 26,42" fill="#f59e0b" />
                      <line x1="26" y1="10" x2="26" y2="42" stroke="#ffffff" strokeWidth="1" opacity="0.85" />
                      <line x1="12" y1="24" x2="40" y2="24" stroke="#ffffff" strokeWidth="1" opacity="0.85" />
                      <g className="animate-kite-ribbon">
                        <path d="M26 42 Q32 55 24 68 Q18 80 26 90" stroke="#ea580c" strokeWidth="1.5" fill="none" />
                        <circle cx="28" cy="52" r="2.5" fill="#f59e0b" />
                        <circle cx="21" cy="65" r="2.5" fill="#dc2626" />
                        <circle cx="24" cy="78" r="2.5" fill="#10b981" />
                      </g>
                    </svg>
                  </div>
                </div>

                {/* Content Overlay */}
                <div className="relative z-10">
                  {/* Header: Air Quality pill */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center shadow-xs">
                      <Wind className="w-4 h-4 text-orange-500 animate-spin-slow" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-stone-800">Air Quality</div>
                      <div className="text-[10px] text-stone-600">Main pollutant : PM 2.5</div>
                    </div>
                  </div>

                  {/* AQI Big Value & Wind */}
                  <div className="mt-5">
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-5xl sm:text-6xl font-black tracking-tighter text-stone-900 drop-shadow-xs">
                        {aqiValue}
                      </span>
                      <span className="text-xs font-bold px-2 py-0.5 bg-[#fef08a] rounded-md text-amber-900 border border-amber-200">
                        AQI
                      </span>
                    </div>
                    <div className="text-sm font-semibold text-stone-700 mt-1">
                      {current.windSpeed ? `West Wind ${Math.round(current.windSpeed)} km/h` : 'West Wind'}
                    </div>
                  </div>
                </div>

                {/* Bottom Air Quality Slider Card */}
                <div className="relative z-10 bg-white/95 backdrop-blur-md rounded-2xl p-3 shadow-sm mt-6 border border-amber-50">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-stone-500 mb-2">
                    <span>Good</span>
                    {/* Active Standard Pill */}
                    <span className="bg-[#1c1917] text-white text-[10px] font-bold px-3 py-1 rounded-full shadow-xs">
                      {aqiStatus.label}
                    </span>
                    <span>Hazardous</span>
                  </div>

                  {/* Spectrum Progress Bar */}
                  <div className="relative h-2 w-full bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="absolute inset-0 rounded-full"
                      style={{
                        background: 'linear-gradient(to right, #22c55e 0%, #eab308 30%, #f97316 65%, #ef4444 100%)',
                      }}
                    />
                    {/* Marker Pin Indicator */}
                    <div
                      className="absolute top-0 bottom-0 w-2.5 bg-white border border-stone-400 rounded-full shadow-md transform -translate-x-1/2 transition-all duration-700"
                      style={{ left: `${Math.min(95, Math.max(8, (aqiValue / 450) * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Row 2: "How's the temperature today?" (Spline Chart) + "Tomorrow" Rain Character Card */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
              {/* --- LEFT SECTION: "How's the temperature today?" Spline Chart (Cols 7) --- */}
              <div className="md:col-span-7 bg-white rounded-[28px] p-5 sm:p-6 border border-stone-100 flex flex-col justify-between">
                {/* Header: Title + Switcher (Thermometer, Umbrella, Wind) */}
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                    How's the temperature today?
                  </h3>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-1.5 bg-stone-50 p-1 rounded-full border border-stone-100">
                    <button
                      onClick={() => setChartMetric('temp')}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        chartMetric === 'temp'
                          ? 'bg-[#f97316] text-white shadow-sm'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                      title="Temperature"
                    >
                      <Sun className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setChartMetric('rain')}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        chartMetric === 'rain'
                          ? 'bg-[#f97316] text-white shadow-sm'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                      title="Rain Probability"
                    >
                      <Umbrella className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setChartMetric('wind')}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        chartMetric === 'wind'
                          ? 'bg-[#f97316] text-white shadow-sm'
                          : 'text-stone-400 hover:text-stone-600'
                      }`}
                      title="Wind Speed"
                    >
                      <Wind className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Spline Chart SVG Stage */}
                <div className="relative h-44 w-full flex flex-col justify-between pt-2">
                  {/* Top Nodes with Weather Icons */}
                  <div className="grid grid-cols-4 w-full text-center z-10">
                    {timeSlotsData.map((slot) => (
                      <div key={slot.label} className="flex flex-col items-center">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition transform hover:scale-110 ${
                            slot.isPeak
                              ? 'bg-[#1c1917] text-amber-400 shadow-md ring-4 ring-amber-100/50'
                              : 'bg-stone-100 text-stone-500 shadow-xs'
                          }`}
                        >
                          {slot.icon === 'cloud' && <Cloud className="w-4 h-4 text-stone-400" />}
                          {slot.icon === 'sun' && <Sun className="w-4.5 h-4.5 text-amber-400 animate-spin-slow" />}
                          {slot.icon === 'cloud-sun' && <CloudSun className="w-4 h-4 text-amber-500" />}
                          {slot.icon === 'moon' && <Cloud className="w-4 h-4 text-stone-500" />}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* SVG Spline Connecting Curve */}
                  <div className="absolute inset-x-0 top-12 bottom-12 pointer-events-none">
                    <svg viewBox="0 0 400 80" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                      <defs>
                        <linearGradient id="splineGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                          <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                        </linearGradient>
                      </defs>

                      <path
                        d="M50 45 C100 45, 120 12, 150 12 C180 12, 210 38, 250 38 C290 38, 320 48, 350 48 L350 80 L50 80 Z"
                        fill="url(#splineGradient)"
                      />

                      <path
                        d="M50 45 C100 45, 120 12, 150 12 C180 12, 210 38, 250 38 C290 38, 320 48, 350 48"
                        stroke="#f97316"
                        strokeWidth="2.5"
                        fill="none"
                        strokeLinecap="round"
                      />

                      <circle cx="50" cy="45" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" />
                      <circle cx="150" cy="12" r="4.5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                      <circle cx="250" cy="38" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" />
                      <circle cx="350" cy="48" r="3.5" fill="#ffffff" stroke="#f97316" strokeWidth="2.5" />
                    </svg>
                  </div>

                  {/* Bottom Labels & Temperatures */}
                  <div className="grid grid-cols-4 w-full text-center z-10 mt-auto">
                    {timeSlotsData.map((slot) => {
                      const displayVal =
                        chartMetric === 'temp'
                          ? `${displayTemp(slot.temp)}°`
                          : chartMetric === 'rain'
                          ? `${Math.round(slot.rain)}%`
                          : `${Math.round(slot.wind)}k`;

                      return (
                        <div key={`val-${slot.label}`} className="flex flex-col items-center">
                          <span className="text-base sm:text-lg font-bold text-stone-800 tracking-tight">
                            {displayVal}
                          </span>
                          <span className="text-[11px] font-medium text-stone-400 mt-0.5">
                            {slot.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* --- RIGHT SECTION: "Tomorrow" Rain Character Card (Cols 5) --- */}
              <div className="md:col-span-5 bg-[#e4f7bf] rounded-[28px] p-5 sm:p-6 border border-lime-200/60 flex flex-col justify-between relative overflow-hidden group">
                {/* Realistic Diagonal Raindrop Texture Lines in Background with dynamic falling animation */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                  <svg className="w-full h-full" viewBox="0 0 200 200">
                    <line x1="20" y1="10" x2="10" y2="40" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0s' }} />
                    <line x1="60" y1="30" x2="50" y2="60" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.35s' }} />
                    <line x1="120" y1="15" x2="110" y2="45" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.7s' }} />
                    <line x1="160" y1="35" x2="150" y2="65" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.2s' }} />
                    <line x1="40" y1="90" x2="30" y2="120" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.5s' }} />
                    <line x1="90" y1="80" x2="80" y2="110" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.9s' }} />
                    <line x1="140" y1="95" x2="130" y2="125" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '0.4s' }} />
                    <line x1="180" y1="85" x2="170" y2="115" stroke="#65a30d" strokeWidth="1.5" strokeLinecap="round" className="animate-realistic-rain" style={{ animationDelay: '1.1s' }} />
                  </svg>
                </div>

                {/* Tomorrow Header & Location */}
                <div className="relative z-10">
                  <span className="text-[11px] font-semibold text-lime-900/70">Tomorrow</span>
                  <h4 className="text-lg font-bold text-stone-900 tracking-tight mt-0.5">
                    {location.name}
                  </h4>
                </div>

                {/* Bottom Row: Big 20°C Rainy text on left + Character with Umbrella on right */}
                <div className="relative z-10 flex items-end justify-between mt-6">
                  {/* Temperature & Condition Text */}
                  <div className="mb-2">
                    <div className="text-4xl sm:text-5xl font-black text-stone-900 tracking-tight">
                      {displayTemp(tomorrowData.tempMax)}°C
                    </div>
                    <div className="text-xs font-semibold text-stone-700 mt-1 flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5 text-lime-800" />
                      <span>{tomorrowData.condition || 'Rainy'}</span>
                    </div>
                  </div>

                  {/* Illustrated Character Walking with Orange Umbrella & Realistic Striding Legs */}
                  <div className="relative w-28 h-36 shrink-0 -mr-2 -mb-2">
                    <svg viewBox="0 0 120 160" className="w-full h-full overflow-visible">
                      <ellipse cx="60" cy="150" rx="26" ry="4" fill="#65a30d" opacity="0.3" />

                      {/* Walking Legs */}
                      <g className="animate-stride-back origin-[52px_110px]">
                        <path d="M52 110 L42 144 L49 146" stroke="#1c1917" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </g>
                      <g className="animate-stride-front origin-[62px_110px]">
                        <path d="M62 110 L74 144 L82 143" stroke="#1c1917" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </g>

                      {/* Dark Coat Body */}
                      <path d="M46 72 C46 68 70 68 70 72 L76 112 L40 112 Z" fill="#1c1917" />
                      <polygon points="58,72 52,82 64,82" fill="#ffffff" />
                      <polygon points="58,82 56,98 58,102 60,98" fill="#f59e0b" />

                      {/* Character Face & Hair */}
                      <circle cx="58" cy="56" r="11" fill="#fed7aa" />
                      <circle cx="62" cy="55" r="1.3" fill="#1c1917" />
                      <path d="M61 60 Q64 63 67 60" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                      <path d="M48 54 C48 42 68 42 70 54 C66 48 52 48 48 54 Z" fill="#451a03" />

                      {/* Right Arm holding Umbrella */}
                      <path d="M65 76 L75 92 L62 96" stroke="#1c1917" strokeWidth="5.5" strokeLinecap="round" fill="none" />
                      <circle cx="62" cy="96" r="3.5" fill="#fed7aa" />

                      {/* Large Curved Warm Orange Umbrella */}
                      <g className="animate-umbrella-bob">
                        <line x1="62" y1="36" x2="62" y2="104" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
                        <path d="M62 104 C62 110 56 110 56 106" stroke="#451a03" strokeWidth="2.2" strokeLinecap="round" fill="none" />

                        <path
                          d="M20 38 C20 -4 104 -4 104 38 C90 35 76 38 62 35 C48 38 34 35 20 38 Z"
                          fill="#f97316"
                        />
                        <path d="M42 37 C42 12 62 8 62 35" stroke="#fb923c" strokeWidth="1" fill="none" />
                        <path d="M82 37 C82 12 62 8 62 35" stroke="#ea580c" strokeWidth="1" fill="none" />
                        <rect x="61" y="-6" width="2" height="6" rx="1" fill="#451a03" />
                      </g>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Customizable Weather Widgets Grid (UV Index, Humidity, Wind Direction) */}
            <CustomizableWeatherWidgets
              current={current}
              todayForecast={weatherData.daily?.[0]}
              useFahrenheit={useFahrenheit}
            />

            {/* 5. Mini Interactive Regional Weather Map (Radar & Cloud Overlays) */}
            <RegionalWeatherMap
              location={location}
              current={current}
              useFahrenheit={useFahrenheit}
              onOpenDetails={onOpenDetails}
              className="mt-5"
            />
          </div>
        </main>

        {/* ========================================================================= */}
        {/* C. RIGHT SIDEBAR PANEL (Sun Arc, UVI Card, Weather Prediction) */}
        {/* ========================================================================= */}
        <aside className="w-full lg:w-[320px] shrink-0 border-t lg:border-t-0 lg:border-l border-stone-100 p-5 sm:p-7 flex flex-col justify-between bg-white z-20">
          <div>
            {/* 1. Header: "Sun" with Location Dropdown + Big Orange Temp */}
            <div className="flex items-start justify-between mb-6">
              <div>
                <span className="text-xs font-semibold text-stone-400">Sun</span>
                {/* Location Dropdown Trigger */}
                <div className="relative mt-0.5">
                  <button
                    onClick={() => setIsLocationDropdownOpen(!isLocationDropdownOpen)}
                    className="flex items-center gap-1.5 text-stone-900 font-bold text-sm sm:text-base hover:text-orange-600 transition cursor-pointer"
                  >
                    <span>{location.name}, {location.country}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
                  </button>

                  {/* Preset Locations Dropdown */}
                  {isLocationDropdownOpen && (
                    <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-stone-100 py-2 z-50 animate-in fade-in zoom-in-95">
                      {onDetectGps && (
                        <div className="px-2 pb-1.5 mb-1 border-b border-stone-100">
                          <button
                            onClick={() => {
                              onDetectGps();
                              setIsLocationDropdownOpen(false);
                            }}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer"
                          >
                            <Navigation className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span>Present GPS Location</span>
                          </button>
                        </div>
                      )}
                      <div className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Featured Cities
                      </div>
                      {POPULAR_LOCATIONS.map((loc) => (
                        <button
                          key={loc.name}
                          onClick={() => {
                            onSelectLocation(loc);
                            setIsLocationDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs font-semibold text-stone-700 hover:bg-orange-50 hover:text-orange-600 flex items-center justify-between transition cursor-pointer"
                        >
                          <span>{loc.name}, {loc.country}</span>
                          {location.name.toLowerCase().includes(loc.name.toLowerCase()) && (
                            <Check className="w-3.5 h-3.5 text-orange-500" />
                          )}
                        </button>
                      ))}
                      <div className="border-t border-stone-100 my-1 pt-1">
                        <button
                          onClick={() => {
                            setIsLocationDropdownOpen(false);
                            onOpenSearch();
                          }}
                          className="w-full px-3 py-1.5 text-left text-xs text-orange-600 font-bold hover:bg-orange-50 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>Search other city...</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Big Vibrant Orange Temperature */}
              <div className="text-3xl sm:text-4xl font-black text-[#f97316] tracking-tight">
                {displayTemp(current.temp)}°C
              </div>
            </div>

            {/* 2. Semicircular Sun Arc Celestial Trajectory with Realistic Sun Ray Spin */}
            <div className="relative w-full h-36 flex flex-col items-center justify-center my-2">
              <svg viewBox="0 0 240 120" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="sunArcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#ffedd5" />
                    <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.4" />
                  </linearGradient>
                </defs>

                <path
                  d="M 30 110 A 90 90 0 0 1 170 35 L 120 110 Z"
                  fill="url(#sunArcGrad)"
                  opacity="0.8"
                />

                <path
                  d="M 30 110 A 90 90 0 0 1 210 110"
                  stroke="#d6d3d1"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  fill="none"
                />

                <line x1="20" y1="110" x2="220" y2="110" stroke="#f5f5f4" strokeWidth="2" />
                <circle cx="120" cy="110" r="3" fill="#f97316" />

                {/* Golden Sun Orb on arc */}
                <g transform="translate(170, 35)">
                  <circle cx="0" cy="0" r="10" fill="#f97316" />
                  <circle cx="0" cy="0" r="14" stroke="#fdba74" strokeWidth="1.5" strokeDasharray="2 2" />
                  <g className="animate-sun-rays">
                    <line x1="0" y1="-13" x2="0" y2="-17" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="-9" x2="12" y2="-12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="13" y1="0" x2="17" y2="0" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="9" y1="9" x2="12" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="0" y1="13" x2="0" y2="17" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-9" y1="9" x2="-12" y2="12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-13" y1="0" x2="-17" y2="0" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                    <line x1="-9" y1="-9" x2="-12" y2="-12" stroke="#f97316" strokeWidth="2" strokeLinecap="round" />
                  </g>
                </g>
              </svg>

              {/* Sunrise & Sunset Timestamps */}
              <div className="w-full flex items-center justify-between text-[11px] font-medium text-stone-500 mt-1">
                <div>
                  <div className="text-stone-400 text-[10px]">Sunrise</div>
                  <div className="font-bold text-stone-700">{sunTimes.sunrise}</div>
                </div>
                <div className="text-right">
                  <div className="text-stone-400 text-[10px]">Sunset</div>
                  <div className="font-bold text-stone-700">{sunTimes.sunset}</div>
                </div>
              </div>
            </div>

            {/* 3. Dark Stone UV Index Card */}
            <div className="bg-[#1c1917] rounded-[22px] p-4 text-white shadow-md my-4 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center">
                    <Sun className="w-5 h-5 text-amber-400" />
                  </div>
                  <span className="text-xl font-bold tracking-tight">
                    {Math.round(current.uvIndex || 3.5)} UVI
                  </span>
                </div>

                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${uvRating.color}`}>
                  {uvRating.text}
                </span>
              </div>
              <p className="text-[11px] text-stone-400 font-normal mt-2">
                {uvRating.risk}
              </p>
            </div>

            {/* 4. "Weather Prediction" Forecast List */}
            <div className="mt-4">
              <h4 className="font-bold text-base text-stone-900 mb-3">Weather Prediction</h4>

              <div className="space-y-2.5">
                {predictionItems.map((item, idx) => (
                  <div
                    key={item.date}
                    onClick={onOpenDetails}
                    className="bg-white hover:bg-stone-50 border border-stone-100 rounded-2xl p-3 flex items-center justify-between shadow-2xs transition cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          idx === 0
                            ? 'bg-orange-50 text-orange-500'
                            : idx === 1
                            ? 'bg-amber-50 text-amber-500'
                            : 'bg-emerald-50 text-emerald-500'
                        }`}
                      >
                        {item.category === 'clear' ? (
                          <Sun className="w-4.5 h-4.5" />
                        ) : item.category === 'rain' ? (
                          <CloudRain className="w-4.5 h-4.5" />
                        ) : (
                          <Cloud className="w-4.5 h-4.5" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-stone-800">{item.date}</div>
                        <div className="text-[11px] text-stone-400">{item.condition}</div>
                      </div>
                    </div>

                    <div className="text-xs font-bold text-stone-700">
                      {item.maxTemp}° / {item.minTemp}°
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 5. Orange "Next 5 Days" Action Button */}
          <div className="mt-5">
            <button
              onClick={onOpenDetails}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(249,115,22,0.35)] transition transform hover:scale-[1.01] active:scale-[0.98] cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>Next 5 Days Analytics</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
