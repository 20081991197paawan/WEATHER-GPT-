import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Globe,
  Disc,
  Compass,
  ShieldCheck,
  Database,
  MapPin,
  ExternalLink,
  Layers,
  ShieldAlert,
  Car,
} from 'lucide-react';
import {
  NormalizedWeatherData,
  TransparentReasoning,
  ChatbotRole,
  GeminiModelTier,
  GroundingWebSource,
  GroundingMapPlace,
} from '../types';
import { GeminiOmniOrb } from './GeminiOmniOrb';
import { HolographicWeatherGlobe } from './HolographicWeatherGlobe';
import { WeatherVideoMode } from './OmniBackgroundVideo';
import { useFirebase } from '../context/FirebaseContext';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  reasoning?: TransparentReasoning;
  timestamp: string;
  modelUsed?: string;
  roleUsed?: ChatbotRole;
  groundingType?: 'search' | 'maps' | 'none';
  groundingSources?: GroundingWebSource[];
  mapsPlaces?: GroundingMapPlace[];
}

interface GeminiOmniWeatherAgentProps {
  weatherData: NormalizedWeatherData;
  onWeatherModeChange?: (mode: WeatherVideoMode) => void;
  currentMode?: WeatherVideoMode;
}

export const GeminiOmniWeatherAgent: React.FC<GeminiOmniWeatherAgentProps> = ({
  weatherData,
  onWeatherModeChange,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: `Hello! I am Gemini Omni Weather. Ask me anything about the atmospheric conditions in ${weatherData.location.name}. Try asking if you need an umbrella, for nearby shelter, latest cyclone news, or an outdoor forecast!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
      roleUsed: 'meteorologist',
      groundingType: 'none',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [visualMode, setVisualMode] = useState<'orb' | 'globe'>('orb');
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('meteorologist');
  const [modelPreference, setModelPreference] = useState<'auto' | GeminiModelTier>('auto');
  const [groundingPreference, setGroundingPreference] = useState<'auto' | 'search' | 'maps'>('auto');

  const chatDisplayRef = useRef<HTMLDivElement>(null);

  const { currentUser, userPreferences, updatePreferences, saveChat } = useFirebase();

  // Sync cloud preferences from Firebase
  useEffect(() => {
    if (userPreferences?.visualMode) {
      setVisualMode(userPreferences.visualMode);
    }
    if (userPreferences?.voiceEnabled !== undefined) {
      setVoiceEnabled(userPreferences.voiceEnabled);
    }
  }, [userPreferences]);

  const toggleVoice = () => {
    const next = !voiceEnabled;
    setVoiceEnabled(next);
    if (!next && window.speechSynthesis) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    updatePreferences({ voiceEnabled: next });
  };

  const toggleVisualMode = () => {
    const nextMode = visualMode === 'orb' ? 'globe' : 'orb';
    setVisualMode(nextMode);
    updatePreferences({ visualMode: nextMode });
  };

  // Quick suggestion chips
  const quickQuestions = [
    'Should I carry an umbrella to college?',
    'Will it rain in the next 3 hours?',
    'Nearest shelter or umbrella shop near me?',
    'Latest storm warnings and weather news?',
  ];

  // Auto-scroll chat display to bottom
  useEffect(() => {
    if (chatDisplayRef.current) {
      chatDisplayRef.current.scrollTop = chatDisplayRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Handle video background updates based on AI response keywords
  const handleAIResponse = (response: string) => {
    const text = response.toLowerCase();
    const videoPlayer = document.getElementById('weather-bg') as HTMLVideoElement | null;

    let targetMode: WeatherVideoMode = 'sunny';
    let targetSrc = 'omni-weather-sunny.mp4';

    if (text.includes('rain') || text.includes('storm') || text.includes('thunder')) {
      targetMode = 'rainy';
      targetSrc = 'omni-weather-rainy.mp4';
    } else if (text.includes('snow') || text.includes('cold') || text.includes('freeze') || text.includes('frost')) {
      targetMode = 'snowy';
      targetSrc = 'omni-weather-snowy.mp4';
    } else if (text.includes('sunny') || text.includes('clear') || text.includes('warm') || text.includes('heat')) {
      targetMode = 'sunny';
      targetSrc = 'omni-weather-sunny.mp4';
    }

    if (onWeatherModeChange) {
      onWeatherModeChange(targetMode);
    }

    if (videoPlayer) {
      videoPlayer.src = targetSrc;
      videoPlayer.play().catch(() => {});
    }
  };

  // Text to speech voice playback
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*_#`]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (queryText?: string) => {
    const userQuery = (queryText || input).trim();
    if (!userQuery || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: userQuery,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    // Persist user message to Firestore if logged in
    saveChat('user', userQuery);

    try {
      // Send conversation history to backend for multi-turn chat continuity
      const historyPayload = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          weatherContext: weatherData,
          chatHistory: historyPayload,
          role: selectedRole,
          modelPreference,
          groundingPreference,
          userCoords: {
            latitude: weatherData.location.latitude,
            longitude: weatherData.location.longitude,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const data = await response.json();
      const aiResponseText = data.answer || data.text || 'I have analyzed the atmospheric telemetry for your location.';

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: aiResponseText,
        reasoning: data.reasoning,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: data.model,
        roleUsed: data.role,
        groundingType: data.groundingType,
        groundingSources: data.groundingSources,
        mapsPlaces: data.mapsPlaces,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Persist assistant message to Firestore if logged in
      saveChat('assistant', aiResponseText);

      // Trigger video mode update
      handleAIResponse(aiResponseText);

      // Play voice if enabled
      speakText(aiResponseText);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = `According to verified meteorological station data in ${weatherData.location.name}: Current temperature is ${Math.round(
        weatherData.current.temp
      )}°C with ${weatherData.current.condition} and ${weatherData.current.rainProb}% rain probability.`;

      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: 'deterministic-fallback',
      };

      setMessages((prev) => [...prev, errorMsg]);
      saveChat('assistant', fallbackText);
      handleAIResponse(fallbackText);
      speakText(fallbackText);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <main className="ai-container">
      {/* Header with status dot and title */}
      <header className="flex items-center justify-between pb-2 border-b border-white/10 select-none">
        <div className="flex items-center gap-2.5">
          <div className="status-dot" />
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white font-display flex items-center gap-2">
            <span>Gemini Omni Weather</span>
            {currentUser && (
              <span className="flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Database className="w-2.5 h-2.5" />
                <span className="hidden sm:inline">Cloud Synced</span>
              </span>
            )}
          </h1>
        </div>

        {/* Visualizer selector & voice toggle */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleVisualMode}
            title={visualMode === 'orb' ? 'Switch to 3D Weather Globe' : 'Switch to Chrome Liquid Orb'}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer text-xs flex items-center gap-1 px-2.5"
          >
            {visualMode === 'orb' ? (
              <>
                <Globe className="w-3.5 h-3.5 text-cyan-300" />
                <span className="hidden sm:inline text-[11px]">Globe</span>
              </>
            ) : (
              <>
                <Disc className="w-3.5 h-3.5 text-slate-200" />
                <span className="hidden sm:inline text-[11px]">Orb</span>
              </>
            )}
          </button>

          <button
            onClick={toggleVoice}
            title={voiceEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/80 transition cursor-pointer"
          >
            {voiceEnabled ? (
              <Volume2 className="w-3.5 h-3.5 text-cyan-300" />
            ) : (
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
            )}
          </button>
        </div>
      </header>

      {/* Role & Model Controls Strip */}
      <div className="py-2 border-b border-white/10 flex flex-wrap items-center justify-between gap-1.5 text-[11px]">
        {/* Role Selector */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
          <span className="text-[10px] text-white/50 font-bold uppercase tracking-wider flex items-center gap-0.5 mr-0.5">
            <Layers className="w-2.5 h-2.5 text-cyan-300" />
            Role:
          </span>
          <button
            onClick={() => setSelectedRole('meteorologist')}
            className={`px-2 py-0.5 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedRole === 'meteorologist'
                ? 'bg-cyan-500/30 text-cyan-200 border border-cyan-400/40'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Compass className="w-2.5 h-2.5" />
            Meteorologist
          </button>
          <button
            onClick={() => setSelectedRole('safety_officer')}
            className={`px-2 py-0.5 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedRole === 'safety_officer'
                ? 'bg-rose-500/30 text-rose-200 border border-rose-400/40'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-2.5 h-2.5" />
            Safety
          </button>
          <button
            onClick={() => setSelectedRole('travel_planner')}
            className={`px-2 py-0.5 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedRole === 'travel_planner'
                ? 'bg-amber-500/30 text-amber-200 border border-amber-400/40'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <Car className="w-2.5 h-2.5" />
            Travel
          </button>
          <button
            onClick={() => setSelectedRole('places_guide')}
            className={`px-2 py-0.5 rounded-md text-[10px] transition cursor-pointer flex items-center gap-1 shrink-0 ${
              selectedRole === 'places_guide'
                ? 'bg-emerald-500/30 text-emerald-200 border border-emerald-400/40'
                : 'bg-white/5 text-white/60 hover:text-white'
            }`}
          >
            <MapPin className="w-2.5 h-2.5" />
            Places
          </button>
        </div>

        {/* Model and Grounding Toggles */}
        <div className="flex items-center gap-1">
          {/* Model selection */}
          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setModelPreference('auto')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer ${
                modelPreference === 'auto' ? 'bg-cyan-500/30 text-cyan-200' : 'text-white/50 hover:text-white'
              }`}
            >
              Auto Model
            </button>
            <button
              onClick={() => setModelPreference('gemini-3.8-flash')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer ${
                modelPreference === 'gemini-3.8-flash' ? 'bg-cyan-500/30 text-cyan-200' : 'text-white/50 hover:text-white'
              }`}
            >
              3.8 Flash
            </button>
            <button
              onClick={() => setModelPreference('gemini-3.1-pro-preview')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer ${
                modelPreference === 'gemini-3.1-pro-preview' ? 'bg-purple-500/30 text-purple-200' : 'text-white/50 hover:text-white'
              }`}
            >
              3.1 Pro
            </button>
            <button
              onClick={() => setModelPreference('gemini-3.1-flash-lite')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer ${
                modelPreference === 'gemini-3.1-flash-lite' ? 'bg-amber-500/30 text-amber-200' : 'text-white/50 hover:text-white'
              }`}
            >
              3.1 Lite
            </button>
          </div>

          {/* Grounding Tool mode */}
          <div className="flex items-center gap-1 bg-black/30 p-0.5 rounded-lg border border-white/10">
            <button
              onClick={() => setGroundingPreference('auto')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer ${
                groundingPreference === 'auto' ? 'bg-cyan-500/30 text-cyan-200' : 'text-white/50 hover:text-white'
              }`}
            >
              Auto Tool
            </button>
            <button
              onClick={() => setGroundingPreference('search')}
              title="Google Search Grounding (gemini-3.8-flash)"
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer flex items-center gap-0.5 ${
                groundingPreference === 'search' ? 'bg-blue-500/30 text-blue-200' : 'text-white/50 hover:text-white'
              }`}
            >
              <Globe className="w-2.5 h-2.5" />
              Search
            </button>
            <button
              onClick={() => setGroundingPreference('maps')}
              title="Google Maps Grounding (gemini-3.8-flash)"
              className={`px-1.5 py-0.5 rounded text-[9px] transition cursor-pointer flex items-center gap-0.5 ${
                groundingPreference === 'maps' ? 'bg-emerald-500/30 text-emerald-200' : 'text-white/50 hover:text-white'
              }`}
            >
              <MapPin className="w-2.5 h-2.5" />
              Maps
            </button>
          </div>
        </div>
      </div>

      {/* Visual Centerpiece (Liquid Chrome Orb or Holographic Globe) */}
      <div className="py-2 flex items-center justify-center shrink-0">
        {visualMode === 'orb' ? (
          <GeminiOmniOrb
            isThinking={isLoading}
            isSpeaking={isSpeaking}
            size={120}
          />
        ) : (
          <HolographicWeatherGlobe
            currentTemp={weatherData.current.temp}
            condition={weatherData.current.condition}
            size={140}
          />
        )}
      </div>

      {/* Chat Display Scrollable Thread */}
      <div id="chat-display" ref={chatDisplayRef} className="chat-display custom-scrollbar flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.map((m) => {
          const isAi = m.sender === 'assistant';
          return (
            <div
              key={m.id}
              className={`flex flex-col ${isAi ? 'items-start' : 'items-end'} space-y-1`}
            >
              <div
                className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed max-w-[90%] ${
                  isAi
                    ? 'bg-white/[0.12] border border-white/15 text-white rounded-tl-sm backdrop-blur-md'
                    : 'bg-[#8ab4f8] text-slate-950 font-medium rounded-tr-sm shadow-md'
                }`}
              >
                {/* Assistant Metadata Badges */}
                {isAi && (
                  <div className="flex items-center flex-wrap gap-1.5 mb-2 pb-1.5 border-b border-white/10 text-[10px]">
                    {m.modelUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                        {m.modelUsed}
                      </span>
                    )}
                    {m.roleUsed && (
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white/80 capitalize">
                        {m.roleUsed.replace('_', ' ')}
                      </span>
                    )}
                    {m.groundingType === 'search' && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1">
                        <Globe className="w-2.5 h-2.5" />
                        Search Grounded
                      </span>
                    )}
                    {m.groundingType === 'maps' && (
                      <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" />
                        Maps Grounded
                      </span>
                    )}
                  </div>
                )}

                <div className="whitespace-pre-line">{m.text}</div>

                {/* Google Search Grounding Sources */}
                {isAi && m.groundingSources && m.groundingSources.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1 text-[10px] text-blue-300 font-semibold mb-1">
                      <Globe className="w-3 h-3" />
                      <span>Web Citations:</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {m.groundingSources.map((source, sIdx) => (
                        <a
                          key={sIdx}
                          href={source.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 hover:bg-blue-500/25 border border-blue-400/30 text-[10px] text-blue-200 hover:text-white transition"
                        >
                          <span className="truncate max-w-[160px]">{source.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Google Maps Grounding Places & Links */}
                {isAi && m.mapsPlaces && m.mapsPlaces.length > 0 && (
                  <div className="mt-2.5 pt-2 border-t border-white/10">
                    <div className="flex items-center gap-1 text-[10px] text-emerald-300 font-semibold mb-1">
                      <MapPin className="w-3 h-3" />
                      <span>Google Maps Locations:</span>
                    </div>
                    <div className="space-y-1">
                      {m.mapsPlaces.map((place, pIdx) => (
                        <a
                          key={pIdx}
                          href={place.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-400/30 text-[10px] text-emerald-200 hover:text-white transition group"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-2.5 h-2.5 text-emerald-400" />
                              {place.title}
                            </span>
                            <span className="text-[9px] text-emerald-300 group-hover:underline flex items-center gap-0.5">
                              Open Maps
                              <ExternalLink className="w-2 h-2" />
                            </span>
                          </div>
                          {place.address && (
                            <div className="text-[9px] text-white/60 mt-0.5">{place.address}</div>
                          )}
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Grounded Reasoning Panel */}
                {isAi && m.reasoning && (
                  <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 text-[11px] text-white/70">
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span className="flex items-center gap-1 text-cyan-300 font-semibold">
                        <ShieldCheck className="w-3 h-3" /> Grounded WMO Metric:
                      </span>
                      <span className="px-1.5 py-0.5 rounded bg-white/10 text-white font-bold">
                        VERDICT: {m.reasoning.verdict}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-white/60 bg-black/20 p-2 rounded-xl">
                      <div>Rain Prob: <span className="text-white font-bold">{m.reasoning.rainProbability}%</span></div>
                      <div>Precip: <span className="text-white font-bold">{m.reasoning.expectedRainfallMm} mm</span></div>
                      <div>Wind: <span className="text-white font-bold">{m.reasoning.windSpeedKmh} km/h</span></div>
                      <div>Comfort: <span className="text-white font-bold">{m.reasoning.comfortScore}/100</span></div>
                    </div>
                  </div>
                )}
              </div>

              <span className="text-[9px] text-white/40 px-1 font-mono">{m.timestamp}</span>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-cyan-300 font-mono p-2 animate-pulse">
            <Sparkles className="w-3.5 h-3.5 animate-spin" />
            <span>Gemini thinking with live telemetry & grounding...</span>
          </div>
        )}
      </div>

      {/* Situational Quick Suggestion Chips */}
      <div className="py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {quickQuestions.map((q, i) => (
          <button
            key={i}
            onClick={() => handleSend(q)}
            disabled={isLoading}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/[0.08] hover:bg-white/[0.18] border border-white/10 text-[11px] text-white/80 hover:text-white transition cursor-pointer shrink-0"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <input
          type="text"
          id="user-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Ask ${selectedRole.replace('_', ' ')} (e.g. 'Carry umbrella?', 'Nearby shelter', 'Storm news')...`}
          disabled={isLoading}
        />
        <button
          id="send-btn"
          onClick={() => handleSend()}
          disabled={isLoading || !input.trim()}
          title="Send Question"
        >
          ✦
        </button>
      </div>
    </main>
  );
};
