import React, { useState, useEffect, useCallback } from 'react';
import { LocationData, NormalizedWeatherData } from './types';
import { AtmosphericLoading } from './components/AtmosphericLoading';
import { SearchModal } from './components/SearchModal';
import { WeatherGptChat } from './components/WeatherGptChat';
import { AlertsModal } from './components/AlertsModal';
import { DetailsDrawer } from './components/DetailsDrawer';
import { HackathonDemoGuide } from './components/HackathonDemoGuide';
import { WeatherDashboard } from './components/WeatherDashboard';
import { generateResilientWeatherFallback } from './utils/weatherFallback';
import { AlertTriangle, RefreshCw, Navigation } from 'lucide-react';

// Clear any legacy Banten cache from previous sessions immediately
try {
  const cached = localStorage.getItem('weather_cached_v1');
  if (cached && cached.toLowerCase().includes('banten')) {
    localStorage.removeItem('weather_cached_v1');
  }
  const lastLoc = localStorage.getItem('weather_last_location');
  if (lastLoc && lastLoc.toLowerCase().includes('banten')) {
    localStorage.removeItem('weather_last_location');
  }
  const gpsLoc = localStorage.getItem('weather_gps_present_location');
  if (gpsLoc && gpsLoc.toLowerCase().includes('banten')) {
    localStorage.removeItem('weather_gps_present_location');
  }
} catch {}

// Baseline fallback location in case GPS permission is denied or unavailable
const DEFAULT_FALLBACK_LOCATION: LocationData = {
  name: 'New Delhi',
  region: 'Delhi',
  country: 'India',
  latitude: 28.6139,
  longitude: 77.2090,
  timezone: 'Asia/Kolkata',
};

// Retrieve previously detected present GPS location if stored (excluding legacy Banten)
const getStoredGpsLocation = (): LocationData | null => {
  try {
    const raw = localStorage.getItem('weather_gps_present_location') || localStorage.getItem('weather_last_location');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.latitude === 'number' && typeof parsed.longitude === 'number') {
        if (!parsed.name?.toLowerCase().includes('banten')) {
          return parsed;
        }
      }
    }
  } catch {}
  return null;
};

export default function App() {
  const initialStoredLoc = getStoredGpsLocation();
  const [location, setLocation] = useState<LocationData>(initialStoredLoc || DEFAULT_FALLBACK_LOCATION);
  const [weatherData, setWeatherData] = useState<NormalizedWeatherData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDetectingGps, setIsDetectingGps] = useState<boolean>(!initialStoredLoc);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('live');
  const [useFahrenheit, setUseFahrenheit] = useState<boolean>(false);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);
  const [isOfflineFallback, setIsOfflineFallback] = useState<boolean>(false);
  const [gpsNotification, setGpsNotification] = useState<string | null>(null);

  // Modals & Drawers State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isAiOpen, setIsAiOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState<boolean>(false);
  const [isDemoGuideOpen, setIsDemoGuideOpen] = useState<boolean>(false);

  // Fetch weather data from server API with automatic retry and local caching
  const fetchWeather = useCallback(async (loc: LocationData, scenarioId: string = 'live') => {
    setIsLoading(true);
    setFetchErrorMessage(null);

    let url = `/api/weather?latitude=${loc.latitude}&longitude=${loc.longitude}&name=${encodeURIComponent(
      loc.name
    )}&country=${encodeURIComponent(loc.country)}`;

    if (loc.region) {
      url += `&region=${encodeURIComponent(loc.region)}`;
    }

    if (scenarioId !== 'live') {
      url += `&scenario=${encodeURIComponent(scenarioId)}`;
    }

    let success = false;
    let attempts = 0;
    const maxAttempts = 2;

    while (attempts < maxAttempts && !success) {
      try {
        attempts++;
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (!res.ok) {
          throw new Error(`Weather fetch status: ${res.status}`);
        }

        const data: NormalizedWeatherData = await res.json();
        setWeatherData(data);
        setIsOfflineFallback(false);
        setFetchErrorMessage(null);
        success = true;

        // Persist to local storage cache for instant offline recovery
        try {
          localStorage.setItem('weather_cached_v1', JSON.stringify({
            data,
            location: loc,
            timestamp: Date.now(),
          }));
        } catch {}
      } catch (err: any) {
        console.warn(`Weather fetch attempt ${attempts} encountered issue:`, err?.message || err);
        if (attempts < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    }

    if (!success) {
      console.warn('Network meteorology unreachable; activating resilient offline telemetry recovery.');
      let recovered = false;

      // 1. Check local storage cache
      try {
        const cachedRaw = localStorage.getItem('weather_cached_v1');
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (parsed?.data) {
            setWeatherData(parsed.data);
            setIsOfflineFallback(true);
            setFetchErrorMessage('Live connection temporarily unavailable. Showing cached atmospheric telemetry.');
            recovered = true;
          }
        }
      } catch {}

      // 2. Generate resilient fallback if no cache available
      if (!recovered) {
        const fallback = generateResilientWeatherFallback(
          loc.latitude,
          loc.longitude,
          loc.name,
          loc.region || '',
          loc.country
        );
        setWeatherData(fallback);
        setIsOfflineFallback(true);
        setFetchErrorMessage('Live connection interrupted. Showing resilient offline forecast model.');
      }
    }

    setIsLoading(false);
  }, []);

  // Geolocation detection handler with option to force update
  const handleDetectGps = useCallback((silentBackground: boolean = false) => {
    if (!navigator.geolocation) {
      console.warn('Geolocation not supported by this browser.');
      if (!silentBackground) {
        setGpsNotification('Geolocation is not supported by your browser.');
        setTimeout(() => setGpsNotification(null), 4000);
      }
      return;
    }

    if (!silentBackground) {
      setIsDetectingGps(true);
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`/api/geocode?lat=${latitude}&lon=${longitude}`);
          let name = 'Current Location';
          let region = '';
          let country = 'Present Location';

          if (res.ok) {
            const geoInfo = await res.json();
            if (geoInfo?.results?.[0]) {
              name = geoInfo.results[0].name || name;
              region = geoInfo.results[0].region || '';
              country = geoInfo.results[0].country || country;
            }
          }

          const detectedLoc: LocationData = {
            name,
            region,
            country,
            latitude,
            longitude,
          };

          try {
            localStorage.setItem('weather_gps_present_location', JSON.stringify(detectedLoc));
            localStorage.setItem('weather_last_location', JSON.stringify(detectedLoc));
          } catch {}

          setLocation(detectedLoc);
          setSelectedScenarioId('live');
          fetchWeather(detectedLoc, 'live');
          setGpsNotification(`Present GPS Location: ${name}${region ? `, ${region}` : ''}`);
          setTimeout(() => setGpsNotification(null), 4000);
        } catch (e) {
          const fallbackLoc: LocationData = {
            name: 'GPS Coordinates',
            country: 'Present Location',
            latitude,
            longitude,
          };
          try {
            localStorage.setItem('weather_gps_present_location', JSON.stringify(fallbackLoc));
            localStorage.setItem('weather_last_location', JSON.stringify(fallbackLoc));
          } catch {}
          setLocation(fallbackLoc);
          setSelectedScenarioId('live');
          fetchWeather(fallbackLoc, 'live');
        } finally {
          setIsDetectingGps(false);
        }
      },
      (err) => {
        console.warn('GPS detection denied or failed:', err);
        setIsDetectingGps(false);
        if (!silentBackground) {
          setGpsNotification('GPS permission was not granted. Tap the GPS icon anytime to detect your present location.');
          setTimeout(() => setGpsNotification(null), 5000);
        }
        // If we don't have weather data yet, load fallback
        setLocation((prev) => {
          if (!weatherData) {
            fetchWeather(prev, 'live');
          }
          return prev;
        });
      },
      { timeout: 9000, enableHighAccuracy: true, maximumAge: 60000 }
    );
  }, [fetchWeather, weatherData]);

  // Initial fetch on load: Detect GPS present location automatically
  useEffect(() => {
    const saved = getStoredGpsLocation();
    if (saved) {
      // Instant render with verified cached GPS, then re-verify in background
      fetchWeather(saved, 'live');
      handleDetectGps(true);
    } else {
      // First time launch: actively prompt and resolve present GPS location
      handleDetectGps(false);
    }
  }, []);

  // Handler to select location from search or quick pills
  const handleSelectLocation = (newLoc: LocationData) => {
    setLocation(newLoc);
    setSelectedScenarioId('live');
    try {
      localStorage.setItem('weather_last_location', JSON.stringify(newLoc));
    } catch {}
    fetchWeather(newLoc, 'live');
  };

  // Handler for demo scenario switching
  const handleSelectScenario = (scenarioId: string) => {
    setSelectedScenarioId(scenarioId);
    fetchWeather(location, scenarioId);
  };

  const activeAlerts = weatherData?.alerts || [];
  const criticalAlerts = activeAlerts.filter((a) => a.severity === 'danger' || a.severity === 'warning');

  return (
    <>
      {/* Offline/Fallback status toast banner */}
      {fetchErrorMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 text-amber-200 border border-amber-500/30 backdrop-blur-xl shadow-2xl flex items-center gap-3 text-xs sm:text-sm animate-fade-in max-w-lg w-[92%] sm:w-auto">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="flex-1 font-medium">{fetchErrorMessage}</span>
          <button
            onClick={() => fetchWeather(location, selectedScenarioId)}
            className="px-2.5 py-1 rounded-xl bg-amber-400 text-stone-950 font-bold hover:bg-amber-300 cursor-pointer text-xs transition flex items-center gap-1.5 shrink-0"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
          <button
            onClick={() => setFetchErrorMessage(null)}
            className="text-stone-400 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* GPS Status Toast */}
      {gpsNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-stone-900/95 text-emerald-200 border border-emerald-500/40 backdrop-blur-xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm animate-fade-in max-w-lg w-[92%] sm:w-auto">
          <Navigation className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="flex-1 font-medium text-emerald-100">{gpsNotification}</span>
          <button
            onClick={() => setGpsNotification(null)}
            className="text-stone-400 hover:text-white p-1 text-xs shrink-0 cursor-pointer"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Loading State Animation */}
      {isLoading && !weatherData && (
        <AtmosphericLoading
          locationName={location.name}
          isDetectingGps={isDetectingGps}
          statusMessage={isDetectingGps ? 'Locating Present GPS Coordinates...' : undefined}
        />
      )}

      {/* 1b. Emergency Recovery State if both loading failed and weatherData is absent */}
      {!isLoading && !weatherData && (
        <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-6 text-stone-200 text-center">
          <div className="max-w-md p-8 rounded-3xl bg-stone-900/90 border border-stone-800 shadow-2xl flex flex-col items-center backdrop-blur-md">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <AlertTriangle className="w-7 h-7 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-white">Weather Telemetry Offline</h2>
            <p className="text-sm text-stone-400 mb-6">
              Unable to connect to live meteorological satellite stations. You can retry the live connection or load our high-resolution offline atmospheric model.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => fetchWeather(location, 'live')}
                className="px-5 py-2.5 rounded-xl bg-amber-400 text-stone-950 font-bold text-sm hover:bg-amber-300 cursor-pointer transition active:scale-95 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Connection
              </button>
              <button
                onClick={() => {
                  const fallback = generateResilientWeatherFallback(
                    location.latitude,
                    location.longitude,
                    location.name,
                    location.region,
                    location.country
                  );
                  setWeatherData(fallback);
                }}
                className="px-5 py-2.5 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700 font-semibold text-sm cursor-pointer transition active:scale-95"
              >
                Load Offline Model
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Unified Weather Dashboard UI */}
      {weatherData && (
        <WeatherDashboard
          weatherData={weatherData}
          isLoading={isLoading}
          useFahrenheit={useFahrenheit}
          onToggleFahrenheit={() => setUseFahrenheit(!useFahrenheit)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAlerts={() => setIsAlertsOpen(true)}
          onOpenDetails={() => setIsDetailsOpen(true)}
          onOpenAi={() => setIsAiOpen(true)}
          onSelectLocation={handleSelectLocation}
          onDetectGps={() => handleDetectGps(false)}
          isDetectingGps={isDetectingGps}
          activeAlertCount={criticalAlerts.length}
        />
      )}

      {/* 3. Interactive Modals & Drawers */}
      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectLocation={handleSelectLocation}
        onDetectGps={handleDetectGps}
        isDetectingGps={isDetectingGps}
      />

      {/* WeatherGPT Bottom-Center AI Glass Command Bar */}
      {weatherData && (
        <WeatherGptChat
          weatherData={weatherData}
          isOpen={isAiOpen}
          onToggleOpen={(open) => setIsAiOpen(open)}
          onClose={() => setIsAiOpen(false)}
        />
      )}

      {/* Alerts Modal */}
      {weatherData && (
        <AlertsModal
          isOpen={isAlertsOpen}
          onClose={() => setIsAlertsOpen(false)}
          alerts={weatherData.alerts}
          locationName={weatherData.location.name}
        />
      )}

      {/* Details & Hourly Forecast Drawer */}
      {weatherData && (
        <DetailsDrawer
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          weatherData={weatherData}
        />
      )}

      {/* Demo Guide Walkthrough Modal */}
      <HackathonDemoGuide
        isOpen={isDemoGuideOpen}
        onClose={() => setIsDemoGuideOpen(false)}
        onSelectScenario={handleSelectScenario}
        onAskQuestion={() => setIsAiOpen(true)}
        onToggleTheme={() => {}}
      />
    </>
  );
}
