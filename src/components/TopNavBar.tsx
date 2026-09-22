import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Search,
  Layers,
  Bell,
  Sparkles,
  ChevronDown,
  Navigation,
  Thermometer,
  Volume2,
  VolumeX,
  Compass,
  Zap,
  LogIn,
  LogOut,
  Bookmark,
  Database,
  CheckCircle2,
  User as UserIcon,
  Bike,
} from 'lucide-react';
import { ALL_DEMO_SCENARIOS } from '../data/demoScenarios';
import { useFirebase } from '../context/FirebaseContext';

interface TopNavBarProps {
  onOpenSearch: () => void;
  onOpenLayers: () => void;
  onOpenAlerts: () => void;
  onOpenAi: () => void;
  activeAlertCount?: number;
  selectedScenarioId: string;
  onSelectScenario: (id: string | 'live') => void;
  useFahrenheit: boolean;
  onToggleFahrenheit: () => void;
  isAiOnline?: boolean;
  onOpenTour?: () => void;
  appMode?: 'ngijih' | 'dashboard' | 'omni' | 'commute';
  onToggleAppMode?: () => void;
  onSetAppMode?: (mode: 'ngijih' | 'dashboard' | 'omni' | 'commute') => void;
}

export const TopNavBar: React.FC<TopNavBarProps> = ({
  onOpenSearch,
  onOpenLayers,
  onOpenAlerts,
  onOpenAi,
  activeAlertCount = 0,
  selectedScenarioId,
  onSelectScenario,
  useFahrenheit,
  onToggleFahrenheit,
  isAiOnline = true,
  onOpenTour,
  appMode = 'ngijih',
  onToggleAppMode,
  onSetAppMode,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('28 Aug | 11:52');
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const adminRef = useRef<HTMLDivElement>(null);

  const { currentUser, signIn, signOut, savedLocations } = useFirebase();

  // Live ticking clock formatted as in screenshot "28 Aug | 11:52"
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const day = now.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
      const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      setCurrentTime(`${day} | ${time}`);
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, []);

  // Click outside to close admin menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (adminRef.current && !adminRef.current.contains(e.target as Node)) {
        setIsAdminOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="relative z-30 w-full px-4 sm:px-8 pt-4 pb-2 flex items-center justify-between">
      {/* 1. Left: Brand Logo & Minimalist Title */}
      <div className="flex items-center gap-2.5 select-none">
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white/90">
          <Cloud className="w-5 h-5 text-white fill-white/20" />
        </div>
        <span className="text-base sm:text-lg font-display font-medium tracking-wide text-white/90">
          forecast<span className="text-white/40">.</span> now
        </span>
      </div>

      {/* 2. Center: Floating Frosted Glass Dock */}
      <div className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full backdrop-blur-2xl bg-white/[0.08] border border-white/[0.14] shadow-[0_8px_32px_rgba(0,0,0,0.35)] text-white/80">
        {/* Search button */}
        <button
          onClick={onOpenSearch}
          title="Search Cities (Cmd+K)"
          className="p-2 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer"
        >
          <Search className="w-4 h-4" />
        </button>

        {/* Layers / Radar / Analytics button */}
        <button
          onClick={onOpenLayers}
          title="Weather Analytics & Hourly Details"
          className="p-2 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer"
        >
          <Layers className="w-4 h-4" />
        </button>

        {/* Alerts Bell with red alert dot */}
        <button
          onClick={onOpenAlerts}
          title="Weather Alerts & Warnings"
          className="relative p-2 rounded-full hover:bg-white/15 hover:text-white transition-all cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          {activeAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          )}
          {activeAlertCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500" />
          )}
        </button>

        {/* 4-Way Mode Switcher: Ngijih UI | Commute (Justgo Animation) | Omni AI | Station */}
        <div className="flex items-center gap-1 p-0.5 rounded-full bg-white/5 border border-white/10">
          <button
            onClick={() => onSetAppMode ? onSetAppMode('ngijih') : onToggleAppMode?.()}
            title="Ngijih Illustrated Dashboard UI & UX"
            className={`p-1.5 px-2.5 sm:px-3 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              appMode === 'ngijih'
                ? 'bg-[#f97316] text-white shadow-[0_0_12px_rgba(249,115,22,0.6)]'
                : 'hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span className="font-bold">Ngijih UI</span>
          </button>

          <button
            onClick={() => onSetAppMode ? onSetAppMode('commute') : onToggleAppMode?.()}
            title="Justgo Animated Commute with Weather Personas"
            className={`p-1.5 px-2.5 sm:px-3 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              appMode === 'commute'
                ? 'bg-orange-500 text-white shadow-[0_0_12px_rgba(249,115,22,0.6)]'
                : 'hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            <Bike className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Justgo</span>
          </button>

          <button
            onClick={() => onSetAppMode ? onSetAppMode('omni') : onToggleAppMode?.()}
            title="Gemini Omni Weather Chat & Grounding"
            className={`p-1.5 px-2.5 sm:px-3 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              appMode === 'omni'
                ? 'bg-[#8ab4f8] text-slate-950 shadow-[0_0_12px_rgba(138,180,248,0.6)]'
                : 'hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Omni</span>
          </button>

          <button
            onClick={() => onSetAppMode ? onSetAppMode('dashboard') : onToggleAppMode?.()}
            title="3D Atmospheric Station Dashboard"
            className={`p-1.5 px-2.5 sm:px-3 rounded-full transition-all cursor-pointer flex items-center gap-1 text-xs font-semibold ${
              appMode === 'dashboard'
                ? 'bg-emerald-500 text-slate-950 shadow-[0_0_12px_rgba(16,185,129,0.6)]'
                : 'hover:bg-white/15 text-white/70 hover:text-white'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Station</span>
          </button>
        </div>
      </div>

      {/* 3. Right: Date & Time + Firebase Auth & Station Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Date & Time ticker */}
        <div className="hidden md:block text-xs font-light tracking-wide text-white/80 font-mono">
          {currentTime}
        </div>

        {/* Firebase User Auth Pill / Google Sign In */}
        {!currentUser ? (
          <button
            onClick={() => signIn()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-xs font-medium transition cursor-pointer shadow-sm"
            title="Sign in with Google to sync weather preferences and saved locations"
          >
            <LogIn className="w-3.5 h-3.5 text-cyan-300" />
            <span className="hidden sm:inline">Sign In</span>
          </button>
        ) : null}

        {/* Profile & Station Controls Dropdown */}
        <div className="relative" ref={adminRef}>
          <button
            onClick={() => setIsAdminOpen(!isAdminOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full backdrop-blur-xl bg-white/[0.08] border border-white/[0.14] hover:bg-white/[0.15] transition-all cursor-pointer text-white text-xs sm:text-sm"
          >
            {currentUser?.photoURL ? (
              <img
                src={currentUser.photoURL}
                alt={currentUser.displayName || 'User'}
                className="w-6 h-6 rounded-full object-cover border border-white/30"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                {currentUser ? (currentUser.displayName?.[0] || currentUser.email?.[0] || 'U').toUpperCase() : 'AD'}
              </div>
            )}
            <span className="font-normal text-white/90 max-w-[80px] sm:max-w-[110px] truncate">
              {currentUser ? (currentUser.displayName || currentUser.email?.split('@')[0]) : 'Station'}
            </span>
            <ChevronDown className={`w-3.5 h-3.5 text-white/60 transition-transform ${isAdminOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Station & User Dropdown */}
          {isAdminOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-3xl p-4 backdrop-blur-3xl bg-slate-900/95 border border-white/20 shadow-2xl z-50 text-white text-xs space-y-3 animate-in fade-in zoom-in-95 duration-200">
              {/* User Profile Card if logged in */}
              {currentUser ? (
                <div className="p-3 rounded-2xl bg-white/[0.07] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      {currentUser.photoURL ? (
                        <img
                          src={currentUser.photoURL}
                          alt=""
                          className="w-8 h-8 rounded-full border border-cyan-400/40 shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-cyan-600/40 flex items-center justify-center text-cyan-200 font-bold shrink-0">
                          <UserIcon className="w-4 h-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="font-semibold text-white truncate text-xs">
                          {currentUser.displayName || 'Google User'}
                        </div>
                        <div className="text-[10px] text-white/60 truncate font-mono">
                          {currentUser.email}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut()}
                      title="Sign Out"
                      className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-rose-300 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[10px]">
                    <span className="flex items-center gap-1 text-emerald-400 font-mono">
                      <Database className="w-3 h-3" /> Firestore Synced
                    </span>
                    <span className="text-white/60 font-mono">
                      {savedLocations.length} Saved {savedLocations.length === 1 ? 'City' : 'Cities'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-900/40 to-cyan-900/40 border border-cyan-500/20 text-center space-y-2">
                  <div className="text-white font-medium text-xs">Firebase Cloud Synchronization</div>
                  <div className="text-[10px] text-white/60">
                    Sign in with your Google account to sync favorite weather locations and Gemini chat history across devices.
                  </div>
                  <button
                    onClick={() => {
                      signIn();
                      setIsAdminOpen(false);
                    }}
                    className="w-full py-2 rounded-xl bg-[#8ab4f8] hover:bg-[#a1c4fd] text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign in with Google</span>
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between pb-1 border-b border-white/10">
                <span className="font-bold text-white tracking-wide text-[11px] uppercase">
                  Station & Evaluation
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                  Online
                </span>
              </div>

              {/* Demo Scenarios Section */}
              <div className="space-y-1.5">
                <span className="text-[10px] text-white/50 uppercase tracking-wider font-semibold">
                  Meteorological Scenarios
                </span>

                <button
                  onClick={() => {
                    onSelectScenario('live');
                    setIsAdminOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all ${
                    selectedScenarioId === 'live'
                      ? 'bg-cyan-500/25 border border-cyan-400/40 text-cyan-200'
                      : 'hover:bg-white/10 text-white/80'
                  }`}
                >
                  <span className="font-medium">📍 Live WMO Station (Real-Time)</span>
                  {selectedScenarioId === 'live' && <span className="text-[10px] text-cyan-300 font-mono">Active</span>}
                </button>

                {ALL_DEMO_SCENARIOS.map((sc) => (
                  <button
                    key={sc.id}
                    onClick={() => {
                      onSelectScenario(sc.id);
                      setIsAdminOpen(false);
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between transition-all ${
                      selectedScenarioId === sc.id
                        ? 'bg-cyan-500/25 border border-cyan-400/40 text-cyan-200'
                        : 'hover:bg-white/10 text-white/80'
                    }`}
                  >
                    <div>
                      <div className="font-medium">{sc.badge} {sc.name}</div>
                      <div className="text-[10px] text-white/50">{sc.description}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Unit Toggle & Tour Guide */}
              <div className="pt-2 border-t border-white/10 space-y-2">
                <button
                  onClick={onToggleFahrenheit}
                  className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 text-white flex items-center justify-between font-medium text-xs transition"
                >
                  <span className="flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-cyan-300" />
                    Temperature Unit
                  </span>
                  <span className="px-2 py-0.5 rounded bg-white/20 font-bold">
                    {useFahrenheit ? '°F' : '°C'}
                  </span>
                </button>

                {onOpenTour && (
                  <button
                    onClick={() => {
                      onOpenTour();
                      setIsAdminOpen(false);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600/40 to-blue-600/40 hover:from-cyan-600/60 hover:to-blue-600/60 border border-cyan-400/30 text-cyan-100 flex items-center justify-center gap-1.5 font-medium text-xs transition"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                    <span>2-Minute Hackathon Demo Tour</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
