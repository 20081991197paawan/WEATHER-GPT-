import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Search,
  Navigation,
  Sparkles,
  Sun,
  Moon,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { LocationData } from '../types';
import { ALL_DEMO_SCENARIOS } from '../data/demoScenarios';

interface HeaderProps {
  currentLocation: LocationData;
  onSelectLocation: (loc: LocationData) => void;
  onDetectGps: () => void;
  isDetectingGps: boolean;
  isDemoMode: boolean;
  onSelectScenario: (scenarioId: string | 'live') => void;
  selectedScenarioId: string;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenDemoGuide: () => void;
  isAiOnline: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentLocation,
  onSelectLocation,
  onDetectGps,
  isDetectingGps,
  isDemoMode,
  onSelectScenario,
  selectedScenarioId,
  darkMode,
  onToggleDarkMode,
  onOpenDemoGuide,
  isAiOnline,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showScenarioMenu, setShowScenarioMenu] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scenarioMenuRef = useRef<HTMLDivElement>(null);

  // Live time ticker
  const [currentTime, setCurrentTime] = useState<string>('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Debounced geocoding search
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Geocoding search failed:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Click outside to close menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
      if (scenarioMenuRef.current && !scenarioMenuRef.current.contains(e.target as Node)) {
        setShowScenarioMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectCity = (city: any) => {
    onSelectLocation({
      name: city.name,
      region: city.region,
      country: city.country,
      latitude: city.latitude,
      longitude: city.longitude,
      timezone: city.timezone,
      elevation: city.elevation,
    });
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="relative z-30 w-full border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-xl transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & AI Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
              <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight text-white font-display">
                  Weather<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">GPT</span>
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 uppercase tracking-wider">
                  Nexus 2026
                </span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  Gemini 3.8 Flash Agent
                </span>
                <span className="text-slate-600">•</span>
                <span className="font-mono text-slate-400">{currentTime || 'Live'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Global Search & Location Selector */}
        <div className="flex-1 max-w-md min-w-[220px] relative" ref={searchContainerRef}>
          <div className="relative flex items-center">
            <Search className="absolute left-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowDropdown(true)}
              placeholder="Search global city (e.g. Guntur, Bengaluru, Tokyo)..."
              className="w-full pl-9 pr-24 py-2 text-xs sm:text-sm rounded-xl bg-slate-900/80 text-slate-100 placeholder-slate-500 border border-slate-700/60 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all shadow-inner"
            />
            {isSearching && (
              <Loader2 className="absolute right-14 w-4 h-4 text-cyan-400 animate-spin" />
            )}
            <button
              onClick={onDetectGps}
              disabled={isDetectingGps}
              title="Detect Current GPS Location"
              className="absolute right-1.5 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 hover:text-cyan-200 border border-slate-700 transition flex items-center gap-1 disabled:opacity-50"
            >
              <Navigation className={`w-3 h-3 ${isDetectingGps ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">GPS</span>
            </button>
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 py-1.5 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl z-50 max-h-64 overflow-y-auto custom-scrollbar">
              {searchResults.map((city, idx) => (
                <button
                  key={`${city.latitude}-${city.longitude}-${idx}`}
                  onClick={() => handleSelectCity(city)}
                  className="w-full px-3.5 py-2 text-left hover:bg-cyan-950/50 flex items-center justify-between gap-2 border-b border-slate-800/40 last:border-0 transition"
                >
                  <div className="flex items-center gap-2 truncate">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="text-xs font-medium text-slate-200 truncate">{city.name}</span>
                    {city.region && (
                      <span className="text-[11px] text-slate-400 truncate">({city.region})</span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 uppercase bg-slate-800/80 px-1.5 py-0.5 rounded">
                    {city.countryCode || city.country}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Controls: Demo Mode, Tour Guide & Dark/Light */}
        <div className="flex items-center gap-2">
          {/* Demo Mode / Scenario Selector */}
          <div className="relative" ref={scenarioMenuRef}>
            <button
              onClick={() => setShowScenarioMenu(!showScenarioMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition shadow-sm ${
                isDemoMode
                  ? 'bg-amber-950/60 text-amber-300 border-amber-500/40 hover:bg-amber-900/50'
                  : 'bg-slate-900/80 text-emerald-400 border-emerald-500/30 hover:bg-slate-800'
              }`}
            >
              {isDemoMode ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  <span>DEMO DATA</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>LIVE RADAR</span>
                </>
              )}
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </button>

            {showScenarioMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl p-2 z-50">
                <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Hackathon Scenarios
                </div>
                <button
                  onClick={() => {
                    onSelectScenario('live');
                    setShowScenarioMenu(false);
                  }}
                  className={`w-full p-2.5 rounded-xl text-left transition flex items-center justify-between ${
                    !isDemoMode
                      ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                      : 'hover:bg-slate-800/80 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      Real-Time Live Station Data
                    </div>
                    <div className="text-[11px] text-slate-400">Open-Meteo live API connection</div>
                  </div>
                </button>

                <div className="h-px bg-slate-800 my-1.5" />

                {ALL_DEMO_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      onSelectScenario(sc.id);
                      setShowScenarioMenu(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left transition mb-1 last:mb-0 ${
                      isDemoMode && selectedScenarioId === sc.id
                        ? 'bg-amber-950/60 border border-amber-500/30 text-amber-200'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-semibold">
                      <span>{sc.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-950/80 text-amber-300 border border-amber-800/50">
                        {sc.badge}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {sc.description}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 2-Min Hackathon Demo Tour Button */}
          <button
            onClick={onOpenDemoGuide}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/30 transition shadow-sm"
            title="Open Hackathon 2-Minute Demo Flow"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Demo Tour</span>
          </button>

          {/* Dark / Light toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition"
            title={darkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
          </button>
        </div>
      </div>
    </header>
  );
};
