import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  MapPin,
  Navigation,
  X,
  Loader2,
  Compass,
  Star,
  Trash2,
  Cloud,
  LogIn,
  History,
  Clock,
  Sparkles,
  CornerDownLeft,
} from 'lucide-react';
import { LocationData } from '../types';
import { useFirebase } from '../context/FirebaseContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (loc: LocationData) => void;
  onDetectGps: () => void;
  isDetectingGps: boolean;
}

interface AutocompleteItem extends LocationData {
  source: 'recent' | 'popular' | 'remote';
}

const RECENT_SEARCHES_KEY = 'weather_recent_searches_v1';

const POPULAR_CITIES: LocationData[] = [
  { name: 'New York', country: 'United States', latitude: 40.7128, longitude: -74.006 },
  { name: 'Guntur', region: 'Andhra Pradesh', country: 'India', latitude: 16.3067, longitude: 80.4365 },
  { name: 'London', country: 'United Kingdom', latitude: 51.5074, longitude: -0.1278 },
  { name: 'Tokyo', country: 'Japan', latitude: 35.6762, longitude: 139.6503 },
  { name: 'Bengaluru', region: 'Karnataka', country: 'India', latitude: 12.9716, longitude: 77.5946 },
  { name: 'New Delhi', region: 'Delhi', country: 'India', latitude: 28.6139, longitude: 77.209 },
  { name: 'Paris', country: 'France', latitude: 48.8566, longitude: 2.3522 },
];

// Helper component to highlight matching search characters
const HighlightMatch: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  if (!query || !query.trim()) return <span>{text}</span>;
  const trimmed = query.trim();
  const escaped = trimmed.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = text.split(regex);

  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span
            key={i}
            className="text-orange-400 font-semibold underline decoration-orange-400/50 underline-offset-2"
          >
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  onDetectGps,
  isDetectingGps,
}) => {
  const [query, setQuery] = useState('');
  const [remoteResults, setRemoteResults] = useState<LocationData[]>([]);
  const [recentSearches, setRecentSearches] = useState<LocationData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const activeItemRef = useRef<HTMLButtonElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const { currentUser, savedLocations, deleteLocation, signIn } = useFirebase();

  // Load recent searches from localStorage
  const loadRecentSearches = (): LocationData[] => {
    try {
      const data = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (item) => item && item.name && typeof item.latitude === 'number' && typeof item.longitude === 'number'
          );
        }
      }
    } catch (err) {
      console.warn('Failed loading recent searches:', err);
    }
    return [];
  };

  const persistRecentSearches = (items: LocationData[]) => {
    try {
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed saving recent searches:', err);
    }
  };

  // Sync recent searches when modal opens
  useEffect(() => {
    if (isOpen) {
      setRecentSearches(loadRecentSearches());
      setSelectedIndex(-1);
      setTimeout(() => inputRef.current?.focus(), 80);
    } else {
      setQuery('');
      setRemoteResults([]);
      setSelectedIndex(-1);
    }
  }, [isOpen]);

  // Save selected location to recent searches
  const handleSelect = (loc: LocationData) => {
    const current = loadRecentSearches();
    const filtered = current.filter(
      (item) =>
        !(
          (Math.abs(item.latitude - loc.latitude) < 0.05 && Math.abs(item.longitude - loc.longitude) < 0.05) ||
          (item.name.toLowerCase() === loc.name.toLowerCase() &&
            item.country?.toLowerCase() === loc.country?.toLowerCase())
        )
    );
    const updated = [loc, ...filtered].slice(0, 8);
    setRecentSearches(updated);
    persistRecentSearches(updated);

    onSelectLocation(loc);
    onClose();
  };

  const handleRemoveRecent = (e: React.MouseEvent, index: number) => {
    e.stopPropagation();
    const updated = recentSearches.filter((_, i) => i !== index);
    setRecentSearches(updated);
    persistRecentSearches(updated);
  };

  const handleClearAllRecent = (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  // Auto-complete suggestion debounced fetch from /api/geocode
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setRemoteResults([]);
      setIsLoading(false);
      setSelectedIndex(-1);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/geocode?query=${encodeURIComponent(query.trim())}`, {
          signal: controller.signal,
        });
        if (res.ok) {
          const data = await res.json();
          setRemoteResults(data.results || []);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Auto-complete geocoding error:', err);
        }
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  // Combined autocomplete suggestions: Local instant matches + Remote geocoding results
  const suggestions: AutocompleteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];

    const map = new Map<string, AutocompleteItem>();

    // 1. Instant local matches from recent searches
    for (const recent of recentSearches) {
      if (
        recent.name.toLowerCase().includes(q) ||
        (recent.region && recent.region.toLowerCase().includes(q)) ||
        (recent.country && recent.country.toLowerCase().includes(q))
      ) {
        const key = `${recent.name.toLowerCase()}_${recent.country?.toLowerCase() || ''}`;
        map.set(key, { ...recent, source: 'recent' });
      }
    }

    // 2. Remote geocoding results
    for (const remote of remoteResults) {
      const key = `${remote.name.toLowerCase()}_${remote.country?.toLowerCase() || ''}`;
      if (!map.has(key)) {
        map.set(key, { ...remote, source: 'remote' });
      }
    }

    // 3. Popular cities matching query (if not already included)
    for (const pop of POPULAR_CITIES) {
      if (
        pop.name.toLowerCase().includes(q) ||
        (pop.region && pop.region.toLowerCase().includes(q)) ||
        (pop.country && pop.country.toLowerCase().includes(q))
      ) {
        const key = `${pop.name.toLowerCase()}_${pop.country?.toLowerCase() || ''}`;
        if (!map.has(key)) {
          map.set(key, { ...pop, source: 'popular' });
        }
      }
    }

    return Array.from(map.values()).slice(0, 10);
  }, [query, recentSearches, remoteResults]);

  // Reset selectedIndex when suggestions change
  useEffect(() => {
    if (suggestions.length > 0 && selectedIndex >= suggestions.length) {
      setSelectedIndex(0);
    }
  }, [suggestions.length, selectedIndex]);

  // Scroll active item into view
  useEffect(() => {
    if (selectedIndex >= 0 && activeItemRef.current) {
      activeItemRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedIndex]);

  // Keyboard navigation for auto-complete suggestions
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelect(suggestions[selectedIndex]);
      } else if (suggestions.length > 0) {
        handleSelect(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      if (query) {
        setQuery('');
      } else {
        onClose();
      }
    }
  };

  if (!isOpen) return null;

  const isQuerying = query.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/65 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl p-5 sm:p-6 backdrop-blur-3xl bg-stone-900/95 border border-white/20 shadow-2xl text-white space-y-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header & Close Button */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-white/90 font-display font-medium text-base">
            <Compass className="w-5 h-5 text-orange-400" />
            <span>Search Global Locations</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition cursor-pointer"
            aria-label="Close search"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar with Auto-complete */}
        <div className="relative shrink-0">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(-1);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a city name (e.g. London, New York, Guntur)..."
            className="w-full pl-11 pr-24 py-3 rounded-2xl bg-white/[0.08] border border-white/15 focus:border-orange-400 focus:outline-none text-white placeholder-white/40 text-sm transition"
          />
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-xs text-white/40">
            {isLoading && (
              <Loader2 className="w-4 h-4 text-orange-400 animate-spin" />
            )}
            {query && !isLoading && (
              <button
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(-1);
                  inputRef.current?.focus();
                }}
                className="p-0.5 rounded-full hover:bg-white/10 text-white/40 hover:text-white transition cursor-pointer"
                title="Clear input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {isQuerying && suggestions.length > 0 && (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white/10 border border-white/10 text-[10px] text-white/60 font-mono">
                <CornerDownLeft className="w-2.5 h-2.5" />
              </kbd>
            )}
          </div>
        </div>

        {/* Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-1">
          {/* A. When user is typing: AUTO-COMPLETE SUGGESTIONS */}
          {isQuerying ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-orange-400/90 font-semibold px-1">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                  Auto-complete Suggestions ({suggestions.length})
                </span>
                <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                  ↑ ↓ to navigate • ↵ to select
                </span>
              </div>

              {suggestions.length > 0 ? (
                <div className="space-y-1">
                  {suggestions.map((item, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={`${item.name}-${item.latitude}-${item.longitude}-${idx}`}
                        ref={isSelected ? activeItemRef : null}
                        onClick={() => handleSelect(item)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full text-left p-3 rounded-2xl transition flex items-center justify-between gap-3 group cursor-pointer border ${
                          isSelected
                            ? 'bg-orange-500/20 border-orange-400/50 shadow-md ring-1 ring-orange-400/30'
                            : 'bg-white/[0.04] hover:bg-white/[0.09] border-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition ${
                              isSelected
                                ? 'bg-orange-500 text-stone-950 font-bold'
                                : 'bg-white/10 text-orange-400'
                            }`}
                          >
                            {item.source === 'recent' ? (
                              <History className="w-4 h-4" />
                            ) : (
                              <MapPin className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-white truncate flex items-center gap-2">
                              <span>
                                <HighlightMatch text={item.name} query={query} />
                              </span>
                              {item.source === 'recent' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium shrink-0">
                                  Recent
                                </span>
                              )}
                              {item.source === 'popular' && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-sky-500/20 text-sky-300 font-medium shrink-0">
                                  Popular
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-white/50 truncate">
                              <HighlightMatch
                                text={[item.region, item.country].filter(Boolean).join(', ')}
                                query={query}
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-white/40 font-mono hidden sm:inline">
                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                          </span>
                          <CornerDownLeft
                            className={`w-3.5 h-3.5 transition ${
                              isSelected ? 'text-orange-400 opacity-100' : 'opacity-0 text-white/30'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : !isLoading ? (
                <div className="py-8 text-center space-y-2 rounded-2xl bg-white/[0.02] border border-white/5">
                  <Compass className="w-8 h-8 mx-auto text-white/20 stroke-1" />
                  <p className="text-sm text-white/70">
                    No matching cities found for{' '}
                    <span className="font-semibold text-orange-300">“{query}”</span>
                  </p>
                  <p className="text-xs text-white/40">
                    Try checking spelling or search by country / state name.
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center space-y-2">
                  <Loader2 className="w-6 h-6 mx-auto text-orange-400 animate-spin" />
                  <p className="text-xs text-white/50">Searching meteorological stations worldwide...</p>
                </div>
              )}
            </div>
          ) : (
            /* B. When query is empty: GPS + RECENT SEARCHES + CLOUD FAVORITES + SUGGESTED */
            <div className="space-y-4">
              {/* GPS Live Geolocation Button */}
              <button
                onClick={() => {
                  onDetectGps();
                  onClose();
                }}
                disabled={isDetectingGps}
                className="w-full py-2.5 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 flex items-center justify-center gap-2 text-xs font-medium text-amber-300 transition cursor-pointer"
              >
                {isDetectingGps ? (
                  <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                ) : (
                  <Navigation className="w-4 h-4 text-orange-400" />
                )}
                <span>Detect My Real GPS Coordinates</span>
              </button>

              {/* 1. Recent Searches List (from localStorage) */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-amber-300 font-semibold px-1">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      Recent Searches ({recentSearches.length})
                    </span>
                    <button
                      onClick={handleClearAllRecent}
                      className="text-[10px] text-white/40 hover:text-rose-400 transition cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear All</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {recentSearches.map((item, idx) => (
                      <div
                        key={`recent-${item.name}-${item.latitude}-${idx}`}
                        className="w-full flex items-center justify-between p-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/5 transition group cursor-pointer"
                        onClick={() => handleSelect(item)}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <History className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <div className="min-w-0 flex-1">
                            <span className="text-xs text-white font-medium truncate block">
                              {item.name}
                            </span>
                            <span className="text-[10px] text-white/50 truncate block">
                              {[item.region, item.country].filter(Boolean).join(', ')}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[10px] text-white/30 font-mono hidden sm:inline">
                            {item.latitude.toFixed(2)}°, {item.longitude.toFixed(2)}°
                          </span>
                          <button
                            onClick={(e) => handleRemoveRecent(e, idx)}
                            title="Remove from recent searches"
                            className="p-1 rounded-full text-white/30 hover:text-rose-300 hover:bg-white/10 transition cursor-pointer"
                            aria-label={`Remove ${item.name} from recent searches`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Firebase Cloud Saved Favorites */}
              {currentUser && savedLocations.length > 0 && (
                <div className="pt-2 border-t border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-amber-300 font-semibold px-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      Cloud Saved Favorites ({savedLocations.length})
                    </span>
                    <span className="text-[10px] text-white/40 font-mono">Firestore</span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    {savedLocations.map((loc) => (
                      <div
                        key={loc.id}
                        className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] transition group"
                      >
                        <button
                          onClick={() => {
                            handleSelect({
                              name: loc.name,
                              region: loc.region,
                              country: loc.country || '',
                              latitude: loc.lat,
                              longitude: loc.lon,
                            });
                          }}
                          className="flex items-center gap-2 flex-1 text-left min-w-0 cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="text-xs text-white font-medium truncate">{loc.name}</span>
                          {loc.region && (
                            <span className="text-[10px] text-white/50 truncate">({loc.region})</span>
                          )}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteLocation(loc.id);
                          }}
                          title="Remove from saved favorites"
                          className="p-1 rounded text-white/30 hover:text-rose-300 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Not Signed In Banner */}
              {!currentUser && (
                <div className="p-2.5 rounded-2xl bg-orange-950/30 border border-orange-500/20 flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 text-white/80 text-[11px]">
                    <Cloud className="w-3.5 h-3.5 text-amber-300 shrink-0" />
                    <span>Sign in to sync your favorite cities to Firebase Cloud</span>
                  </div>
                  <button
                    onClick={() => signIn()}
                    className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 text-stone-950 font-bold text-[10px] shrink-0 flex items-center gap-1 transition cursor-pointer"
                  >
                    <LogIn className="w-3 h-3" />
                    <span>Sign In</span>
                  </button>
                </div>
              )}

              {/* 4. Popular Cities Chips */}
              <div className="pt-2 border-t border-white/10">
                <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mb-2 px-1">
                  Suggested Cities
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_CITIES.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleSelect(city)}
                      className="px-3 py-1 rounded-full text-xs bg-white/[0.06] hover:bg-orange-500/20 hover:border-orange-400/40 border border-white/10 text-white/80 hover:text-white transition cursor-pointer"
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
