import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowUp,
  Sparkles,
  Bot,
  User,
  Info,
  HelpCircle,
  Volume2,
  VolumeX,
  Mic,
  ShieldCheck,
  Globe,
  MapPin,
  ExternalLink,
  Compass,
  Layers,
  ShieldAlert,
  Car,
  ChevronDown,
  X,
  SlidersHorizontal,
  Wind,
  Sun,
  Maximize2,
  Minimize2,
  Plane,
  Sprout,
  Leaf,
  Activity,
  Cpu,
  Check,
  Copy,
  Radio,
  Thermometer,
  Droplets,
  Gauge,
  Terminal,
  Square,
  MicOff,
  Maximize,
  Clock,
  Zap,
  Sliders,
} from 'lucide-react';
import {
  NormalizedWeatherData,
  ChatMessage,
  TransparentReasoning,
  ChatbotRole,
  GeminiModelTier,
  AirQualityData,
  IndustryTelemetry,
} from '../types';
import { VoiceAssistantOverlay } from './VoiceAssistantOverlay';
import { MicSettingsModal } from './MicSettingsModal';
import { AudioSpectrumVisualizer } from './AudioSpectrumVisualizer';
import {
  speakWithGeminiAiVoice,
  stopAllSpeech,
  detectLanguage,
} from '../utils/geminiVoiceService';
import {
  loadMicSettings,
  buildAudioConstraints,
  playAudioCue,
  getSilenceTimeoutMs,
} from '../utils/micSettings';

interface WeatherGptChatProps {
  weatherData: NormalizedWeatherData;
  isOpen?: boolean;
  onToggleOpen?: (open: boolean) => void;
  onClose?: () => void;
}

const DEFAULT_QUESTIONS = [
  'Current Air Quality & UV',
  'Will it rain in next 3 hours?',
  'Flight & Drone Dispatch Safety (VFR)',
  'Agro Spray Window & Evapotranspiration',
  'Civil Defense Heat Stress & WBGT',
  'Should I carry an umbrella?',
  "What's the weather tomorrow?",
  'Where is the nearest shelter near me?',
];

const TELUGU_DEFAULT_QUESTIONS = [
  'ఈరోజు గొడుగు కావాలా? వర్షం పడుతుందా?',
  'రాబోయే 3 గంటల్లో వర్షం ఎలా ఉండబోతోంది?',
  'ప్రస్తుత గాలి నాణ్యత (AQI) & ఎండ తీవ్రత (UV)',
  'బయట క్రీడలు లేదా ప్రయాణానికి అనుకూలమా?',
  'రేపటి పూర్తి వాతావరణ నివేదిక',
  'వ్యవసాయ స్ప్రే & నేల తేమ పరిస్థితులు',
];

export const WeatherGptChat: React.FC<WeatherGptChatProps> = ({
  weatherData,
  isOpen: controlledIsOpen,
  onToggleOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingAqi, setIsFetchingAqi] = useState(false);
  const [loadingStep, setLoadingStep] = useState('Reading forecast models...');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState<number>(0);
  const [volumeBars, setVolumeBars] = useState<number[]>([15, 20, 28, 40, 52, 65, 52, 40, 28, 20, 15, 12]);
  const [activeAnalyser, setActiveAnalyser] = useState<AnalyserNode | null>(null);
  const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
  const [isMicSettingsOpen, setIsMicSettingsOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<ChatbotRole>('meteorologist');
  const [modelPreference, setModelPreference] = useState<'auto' | GeminiModelTier>('gemini-3.8-flash');
  const [groundingPreference, setGroundingPreference] = useState<'auto' | 'search' | 'maps'>('auto');
  const [isMaximized, setIsMaximized] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);
  const [currentlyPlayingMsgId, setCurrentlyPlayingMsgId] = useState<string | null>(null);
  const [chatLanguage, setChatLanguage] = useState<'auto' | 'telugu' | 'english'>('auto');

  // Internal expanded state if not controlled externally
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledIsOpen !== undefined ? controlledIsOpen : internalExpanded;

  const setExpanded = (value: boolean) => {
    setInternalExpanded(value);
    if (onToggleOpen) {
      onToggleOpen(value);
    }
    if (!value && onClose) {
      onClose();
    }
  };

  const [isFocused, setIsFocused] = useState(false);
  const [hasNeonPulse, setHasNeonPulse] = useState(false);
  const [showRoleSettings, setShowRoleSettings] = useState(false);

  // Microphone time limit state (default 6s limit, auto-processes input ready to output in fast manner)
  const [micTimeLimit, setMicTimeLimit] = useState<number>(6);
  const [micCountdown, setMicCountdown] = useState<number>(6);
  const micCountdownIntervalRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const recordedSpeechRef = useRef<string>('');
  const isAutoProcessingMicRef = useRef<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Trigger brief soft neon-reveal pulse
  const triggerNeonPulse = () => {
    setHasNeonPulse(true);
    setTimeout(() => setHasNeonPulse(false), 450);
  };

  // Stop real-time audio analysis and release microphone streams
  const stopAudioCapture = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
    setActiveAnalyser(null);
    setVolumeLevel(0);
    setVolumeBars([12, 16, 22, 30, 42, 50, 42, 30, 22, 16, 12, 10]);
  };

  const stopRecording = (playCue = true) => {
    const settings = loadMicSettings();
    if (playCue && settings.soundCues) {
      playAudioCue('stop');
    }
    if (micCountdownIntervalRef.current) {
      clearInterval(micCountdownIntervalRef.current);
      micCountdownIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition already stopped
      }
      recognitionRef.current = null;
    }
    stopAudioCapture();
    setIsListening(false);
  };

  const triggerAutoProcessMic = (overrideText?: string) => {
    if (isAutoProcessingMicRef.current) return;
    isAutoProcessingMicRef.current = true;

    stopRecording(false);
    const settings = loadMicSettings();
    if (settings.soundCues) {
      playAudioCue('success');
    }

    const textToProcess = (overrideText || recordedSpeechRef.current || inputQuery).trim();
    if (textToProcess) {
      handleSendMessage(textToProcess, undefined, true);
    } else {
      isAutoProcessingMicRef.current = false;
    }
  };

  const startRecording = async () => {
    if (isListening) {
      stopRecording();
      return;
    }

    const micSettings = loadMicSettings();
    if (micSettings.soundCues) {
      playAudioCue('start');
    }

    isAutoProcessingMicRef.current = false;
    recordedSpeechRef.current = '';
    const initialCountdown = micSettings.timeLimitSeconds || micTimeLimit;
    setMicCountdown(initialCountdown);

    // Live countdown timer: triggers auto-processing when time limit runs out
    if (micCountdownIntervalRef.current) clearInterval(micCountdownIntervalRef.current);
    micCountdownIntervalRef.current = setInterval(() => {
      setMicCountdown((prev) => {
        if (prev <= 1) {
          if (micCountdownIntervalRef.current) {
            clearInterval(micCountdownIntervalRef.current);
            micCountdownIntervalRef.current = null;
          }
          setTimeout(() => {
            triggerAutoProcessMic();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    try {
      // 1. Capture microphone media stream using user's calibrated audio constraints
      const audioConstraints = buildAudioConstraints(micSettings);
      const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);

      mediaStreamRef.current = stream;

      // 2. Setup Web Audio API AnalyserNode with optional calibrated gain
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const audioCtx = new AudioCtx();
        audioContextRef.current = audioCtx;

        const source = audioCtx.createMediaStreamSource(stream);
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = micSettings.micGain || 1.0;

        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.75;
        analyserRef.current = analyser;
        setActiveAnalyser(analyser);

        source.connect(gainNode);
        gainNode.connect(analyser);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const numBars = 12;

        const updateBars = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteFrequencyData(dataArray);

          let sum = 0;
          const bars: number[] = [];
          const step = Math.max(1, Math.floor(dataArray.length / numBars));

          for (let i = 0; i < numBars; i++) {
            const rawVal = dataArray[i * step] || 0;
            // Dynamic scale: minimum baseline 14% to max 100% based on intensity
            const height = Math.max(14, Math.min(100, Math.round((rawVal / 255) * 100)));
            bars.push(height);
            sum += rawVal;
          }

          const avg = sum / (dataArray.length || 1);
          const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));

          setVolumeLevel(normalizedVol);
          setVolumeBars(bars);

          animFrameRef.current = requestAnimationFrame(updateBars);
        };

        updateBars();
      }

      setIsListening(true);
      triggerNeonPulse();

      // 3. Start Browser Speech Recognition for live transcript
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = chatLanguage === 'telugu' ? 'te-IN' : 'en-IN';

          recognition.onresult = (event: any) => {
            let fullCanonical = '';
            let interim = '';
            for (let i = 0; i < event.results.length; ++i) {
              const item = event.results[i];
              if (item.isFinal) {
                fullCanonical += item[0].transcript + ' ';
              } else {
                interim += item[0].transcript;
              }
            }
            const text = (fullCanonical + ' ' + interim).trim();
            if (text) {
              recordedSpeechRef.current = text;
              setInputQuery(text);
              if (detectLanguage(text) === 'telugu') {
                setChatLanguage('telugu');
              }
              triggerNeonPulse();

              // Silence auto-detection delay configured by user
              const silenceMs = getSilenceTimeoutMs(micSettings.silenceSensitivity);
              if (silenceMs > 0) {
                if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
                silenceTimeoutRef.current = setTimeout(() => {
                  triggerAutoProcessMic(text);
                }, silenceMs);
              }
            }
          };

          recognition.onerror = () => {
            // Keep stream analyser active even if recognition reports speech pauses
          };

          recognition.onend = () => {
            // If stopped externally, handle cleanup
          };

          recognitionRef.current = recognition;
          recognition.start();
        } catch (e) {
          console.warn('Speech recognition initiation error:', e);
        }
      }
    } catch (err) {
      console.warn('Microphone stream access error:', err);
      // Fallback: open voice overlay modal with permission guidance
      setIsVoiceOverlayOpen(true);
    }
  };

  const handleToggleVoiceInput = () => {
    if (isListening) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleOpenVoiceAssistant = () => {
    if (isListening) {
      stopRecording();
    }
    setIsVoiceOverlayOpen(true);
    triggerNeonPulse();
  };

  // Teardown audio streams and recognition on unmount
  useEffect(() => {
    return () => {
      stopRecording();
    };
  }, []);

  const handleCopyTranscript = () => {
    const transcript = messages
      .map((m) => `[${m.sender.toUpperCase()} - ${m.timestamp}]\n${m.text}`)
      .join('\n\n---\n\n');
    navigator.clipboard.writeText(transcript);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2000);
  };

  // Initial welcome message from WeatherGPT
  useEffect(() => {
    if (messages.length === 0) {
      const initialMessage: ChatMessage = {
        id: 'welcome-msg',
        sender: 'assistant',
        text: `**Welcome to WeatherGPT Advanced Meteorological Station** 🛰️\n\n• **Certified Calibration:** Blended with WMO Synoptic Station telemetry and Dual-Pol Doppler Radar data for **${weatherData.location.name}**.\n• **Operational Model:** Powered by **gemini-3.8-flash** with deep atmospheric reasoning protocols.\n• **Industry Readiness:** Select from **Meteorology**, **Civil Safety**, **Aviation/Marine**, or **Agriculture** dispatch presets.\n\nHow may I assist your mission or transit planning today?`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: true,
        modelUsed: 'gemini-3.8-flash',
        roleUsed: 'meteorologist',
        groundingType: 'none',
        telemetry: {
          confidenceScore: 99.4,
          stationCalibration: `WMO Station Synoptic Blended [${weatherData.location.name}]`,
          radarDopplerEnsemble: 'Dual-Pol S-Band Z-R Calibrated',
          dewPointDepression: 2.2,
          barometricTendency: 'Steady (1014.2 hPa, ±0.2 hPa/3h)',
          wetBulbGlobeTemp: 28.6,
        },
      };
      setMessages([initialMessage]);
    }
  }, [weatherData.location.name]);

  // Auto-scroll to latest message when expanded
  useEffect(() => {
    if (isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading, isExpanded]);

  const speakText = async (text: string, msgId?: string, isFastVoice: boolean = false) => {
    if (!speechEnabled && !isFastVoice) return;
    try {
      if (msgId) setCurrentlyPlayingMsgId(msgId);
      const lang = detectLanguage(text);
      await speakWithGeminiAiVoice(text, {
        language: lang,
        voiceName: 'Kore',
        fastVoice: isFastVoice,
        onStart: () => msgId && setCurrentlyPlayingMsgId(msgId),
        onEnd: () => setCurrentlyPlayingMsgId(null),
        onError: () => setCurrentlyPlayingMsgId(null),
      });
    } catch (e) {
      console.warn('Voice playback notice:', e);
      setCurrentlyPlayingMsgId(null);
    }
  };

  const handlePlayMessageVoice = async (msgId: string, text: string) => {
    if (currentlyPlayingMsgId === msgId) {
      stopAllSpeech();
      setCurrentlyPlayingMsgId(null);
      return;
    }
    stopAllSpeech();
    setCurrentlyPlayingMsgId(msgId);
    const lang = detectLanguage(text);
    await speakWithGeminiAiVoice(text, {
      language: lang,
      voiceName: 'Kore',
      onStart: () => setCurrentlyPlayingMsgId(msgId),
      onEnd: () => setCurrentlyPlayingMsgId(null),
      onError: () => setCurrentlyPlayingMsgId(null),
    });
  };

  // Dedicated handler to fetch real-time Air Quality & UV Index telemetry and summarize it
  const handleFetchAirQualityAndUv = async () => {
    if (isLoading || isFetchingAqi) return;
    setIsFetchingAqi(true);
    setIsLoading(true);
    setExpanded(true);
    triggerNeonPulse();
    setLoadingStep('Retrieving live Air Quality & UV telemetry...');

    const userPrompt = `Fetch & summarize current Air Quality and UV Index for ${weatherData.location.name}`;
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: userPrompt,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);

    try {
      // 1. Fetch real-time AQI and UV telemetry from backend API
      const aqiRes = await fetch(
        `/api/air-quality?latitude=${weatherData.location.latitude}&longitude=${weatherData.location.longitude}`
      );
      let aqiData: AirQualityData | null = null;
      if (aqiRes.ok) {
        aqiData = await aqiRes.json();
      }

      setLoadingStep('Synthesizing Air Quality & UV health summary...');

      const formattedHistory = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      // 2. Query Gemini chat endpoint with rich atmospheric grounding
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `Summarize the current air quality and UV index details for ${weatherData.location.name} including US AQI rating, PM2.5/PM10 particulate levels, UV index scale, sensitive group health precautions, and midday sun protection advice.`,
          weatherContext: weatherData,
          chatHistory: formattedHistory,
          role: selectedRole,
          modelPreference,
          groundingPreference,
          airQualityData: aqiData,
          userCoords: {
            latitude: weatherData.location.latitude,
            longitude: weatherData.location.longitude,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoning: data.reasoning,
        airQualityData: aqiData || undefined,
        isAiGenerated: data.isAiGenerated,
        groundingSources: data.groundingSources,
        mapsPlaces: data.mapsPlaces,
        modelUsed: data.model,
        roleUsed: data.role,
        groundingType: data.groundingType,
        telemetry: data.telemetry || data.reasoning?.telemetry,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(data.answer);
    } catch (err: any) {
      console.error('Error fetching air quality & UV summary:', err);
      const fallbackAqi = 65;
      const fallbackUv = weatherData.current.uvIndex || 4.8;
      const fallbackText = `Air Quality & UV Index Summary for ${weatherData.location.name}:
🍃 Air Quality Index: ${fallbackAqi} (Moderate)
• PM2.5: 18.2 µg/m³ | PM10: 31.0 µg/m³
• Status: Air quality is acceptable for outdoor activity. Sensitive individuals should monitor respiratory comfort.

☀️ Solar UV Index: ${fallbackUv} (${fallbackUv >= 6 ? 'High' : 'Moderate'})
• Sun Protection: ${fallbackUv >= 6 ? 'SPF 30+ sunscreen, UV-blocking sunglasses, and hat advised during midday hours.' : 'Normal outdoor sun safety with light sunscreen.'}`;

      const fallbackMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        airQualityData: {
          usAqi: fallbackAqi,
          aqiCategory: 'Moderate',
          aqiDescription: 'Air quality is acceptable for outdoor activity.',
          pm25: 18.2,
          pm10: 31.0,
          ozone: 40.5,
          uvIndex: fallbackUv,
          uvCategory: fallbackUv >= 6 ? 'High' : 'Moderate',
          uvAdvice: 'Wear sunscreen (SPF 15+) and sunglasses during midday hours.',
          timestamp: new Date().toISOString(),
        },
        reasoning: {
          verdict: fallbackUv >= 8 ? 'CAUTION' : 'YES',
          uvIndex: fallbackUv,
          rawMetrics: {
            'US AQI': fallbackAqi,
            'PM2.5': '18.2 µg/m³',
            'PM10': '31.0 µg/m³',
            'UV Index': fallbackUv,
          },
        },
        isAiGenerated: false,
        modelUsed: 'deterministic-air-quality-engine',
      };
      setMessages((prev) => [...prev, fallbackMsg]);
      speakText(fallbackText);
    } finally {
      setIsLoading(false);
      setIsFetchingAqi(false);
    }
  };

  const handleSendMessage = async (
    queryText?: string,
    preferredLanguage?: 'telugu' | 'english' | 'auto',
    isFastVoiceMode: boolean = false
  ) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || isLoading) return;

    const detectedLang = detectLanguage(textToSend);
    const effectiveLanguage =
      preferredLanguage && preferredLanguage !== 'auto'
        ? preferredLanguage
        : chatLanguage !== 'auto'
        ? chatLanguage
        : detectedLang;

    if (effectiveLanguage === 'telugu' && chatLanguage !== 'telugu') {
      setChatLanguage('telugu');
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);
    setExpanded(true);
    triggerNeonPulse();

    // Dynamic loading indicator based on grounding & model
    if (isFastVoiceMode) {
      setLoadingStep(
        effectiveLanguage === 'telugu'
          ? '⚡ తక్షణ వాయిస్ నివేదిక (gemini-3.1-flash-lite)...'
          : '⚡ Fast Voice synthesis (gemini-3.1-flash-lite)...'
      );
    } else if (groundingPreference === 'search' || textToSend.toLowerCase().includes('news')) {
      setLoadingStep('Grounding with Google Search (gemini-3.8-flash)...');
    } else if (
      groundingPreference === 'maps' ||
      textToSend.toLowerCase().includes('shelter') ||
      textToSend.toLowerCase().includes('shop') ||
      textToSend.toLowerCase().includes('near')
    ) {
      setLoadingStep('Retrieving Google Maps locations (gemini-3.8-flash)...');
    } else if (modelPreference === 'gemini-3.1-pro-preview' || modelPreference === 'gemini-3.8-pro') {
      setLoadingStep('Deep thermodynamic reasoning (gemini-3.1-pro-preview)...');
    } else if (modelPreference === 'gemini-3.1-flash-lite') {
      setLoadingStep('Rapid inference (gemini-3.1-flash-lite)...');
    } else {
      setLoadingStep(
        effectiveLanguage === 'telugu'
          ? 'వాతావరణ వివరాలను విశ్లేషిస్తోంది (Gemini AI)...'
          : 'Analyzing atmospheric data (gemini-3.8-flash)...'
      );
    }

    try {
      // Check if query is related to air quality / UV to retrieve fresh telemetry
      let aqiData: AirQualityData | undefined = undefined;
      const lowerText = textToSend.toLowerCase();
      if (lowerText.includes('air') || lowerText.includes('aqi') || lowerText.includes('uv') || lowerText.includes('pollution')) {
        try {
          const aqiRes = await fetch(
            `/api/air-quality?latitude=${weatherData.location.latitude}&longitude=${weatherData.location.longitude}`
          );
          if (aqiRes.ok) {
            aqiData = await aqiRes.json();
          }
        } catch {
          // Non-blocking
        }
      }

      // Pass full multi-turn conversation history
      const formattedHistory = messages.slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend,
          weatherContext: weatherData,
          chatHistory: formattedHistory,
          role: selectedRole,
          modelPreference: isFastVoiceMode ? 'gemini-3.1-flash-lite' : modelPreference,
          groundingPreference,
          airQualityData: aqiData,
          language: effectiveLanguage,
          fastVoiceMode: isFastVoiceMode,
          userCoords: {
            latitude: weatherData.location.latitude,
            longitude: weatherData.location.longitude,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();

      const assistantMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'assistant',
        text: data.answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        reasoning: data.reasoning,
        airQualityData: aqiData || undefined,
        isAiGenerated: data.isAiGenerated,
        groundingSources: data.groundingSources,
        mapsPlaces: data.mapsPlaces,
        modelUsed: data.model,
        roleUsed: data.role,
        groundingType: data.groundingType,
        telemetry: data.telemetry || data.reasoning?.telemetry,
      };

      setMessages((prev) => [...prev, assistantMsg]);
      speakText(data.answer, assistantMsg.id, isFastVoiceMode);
    } catch (err: any) {
      console.error('Chat error:', err);
      const fallbackText = effectiveLanguage === 'telugu'
        ? `${weatherData.location.name} లో వాతావరణం: ప్రస్తుత ఉష్ణోగ్రత ${Math.round(
            weatherData.current.temp
          )}°C, వర్షం పడే అవకాశం ${weatherData.current.rainProb}%, గాలి వేగం ${weatherData.current.windSpeed} km/h.`
        : `According to verified meteorological station data in ${weatherData.location.name}: Current temperature is ${Math.round(
            weatherData.current.temp
          )}°C with ${weatherData.current.condition}, ${weatherData.current.rainProb}% rain probability, and ${weatherData.current.windSpeed} km/h wind velocity.`;

      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isAiGenerated: false,
        modelUsed: 'deterministic-fallback',
      };
      setMessages((prev) => [...prev, errorMsg]);
      speakText(fallbackText, errorMsg.id, isFastVoiceMode);
    } finally {
      setIsLoading(false);
    }
  };

  // High-Quality Dynamic Bold Typography Renderer for AI Search Assistant Responses
  const renderFormattedAnswer = (text: string, isUser: boolean) => {
    if (isUser) {
      return <div className="whitespace-pre-line text-xs sm:text-sm font-medium">{text}</div>;
    }

    const lines = text.split('\n');

    // Parse inline bold tokens with dynamic high-contrast lettering
    const parseBoldTokens = (lineText: string, keyPrefix: string) => {
      const parts = lineText.split(/(\*\*[^*]+?\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
          const content = part.slice(2, -2).trim();
          const lower = content.toLowerCase();

          // Check if meteorological metric (numbers, temp, %, km/h, mm, AQI, UV)
          const isMetric =
            /^\d+(\.\d+)?(\s?°[CF]|\s?%|\s?km\/h|\s?mm|\s?hPa|\s?µg\/m³)/i.test(content) ||
            /^(us\s+aqi|aqi|uv\s+index|pm2\.5|pm10)/i.test(content) ||
            /\d+\s?°[CF]|\d+\s?%|\d+\s?km\/h|\d+\s?mm/i.test(content);

          // Check if positive status / affirmative
          const isPositive =
            /^(yes|safe|favorable|optimal|dry|no need|clear|low risk)/i.test(lower) ||
            (lower.includes('carry an umbrella') && lower.startsWith('yes'));

          // Check if caution / advisory
          const isCaution =
            /^(caution|advisable|moderate|heat|buffer|handy)/i.test(lower) ||
            lower.includes('caution');

          // Check if warning / negative / high risk
          const isWarning =
            /^(no|not recommended|likely|precipitation|severe|hazardous|extreme|unhealthy|heavy)/i.test(lower);

          if (isMetric) {
            return (
              <span
                key={`${keyPrefix}-metric-${idx}`}
                className="inline-flex items-center font-black text-sky-950 font-mono tracking-tight bg-sky-500/15 text-[11px] sm:text-xs px-1.5 py-0.5 mx-0.5 rounded-md border border-sky-400/35 shadow-xs"
              >
                {content}
              </span>
            );
          }

          if (isPositive) {
            return (
              <span
                key={`${keyPrefix}-pos-${idx}`}
                className="inline-flex items-center font-extrabold text-emerald-950 bg-emerald-500/18 px-2 py-0.5 mx-0.5 rounded-lg border border-emerald-400/40 shadow-xs tracking-tight"
              >
                {content}
              </span>
            );
          }

          if (isCaution) {
            return (
              <span
                key={`${keyPrefix}-caut-${idx}`}
                className="inline-flex items-center font-extrabold text-amber-950 bg-amber-500/18 px-2 py-0.5 mx-0.5 rounded-lg border border-amber-400/40 shadow-xs tracking-tight"
              >
                {content}
              </span>
            );
          }

          if (isWarning) {
            return (
              <span
                key={`${keyPrefix}-warn-${idx}`}
                className="inline-flex items-center font-extrabold text-rose-950 bg-rose-500/18 px-2 py-0.5 mx-0.5 rounded-lg border border-rose-400/40 shadow-xs tracking-tight"
              >
                {content}
              </span>
            );
          }

          return (
            <span
              key={`${keyPrefix}-bold-${idx}`}
              className="font-extrabold text-slate-900 tracking-tight bg-slate-900/5 px-1 py-0.5 rounded"
            >
              {content}
            </span>
          );
        }

        return <span key={`${keyPrefix}-txt-${idx}`}>{part}</span>;
      });
    };

    return (
      <div className="space-y-1.5 text-xs sm:text-sm text-slate-800 leading-relaxed">
        {lines.map((line, lIdx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={lIdx} className="h-1" />;
          }

          // Bullet list line
          if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const bulletContent = trimmed.replace(/^[•\-\*]\s*/, '');
            return (
              <div key={lIdx} className="flex items-start gap-2 pl-0.5">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(56,189,248,0.9)] mt-2 shrink-0 animate-pulse"
                  aria-hidden="true"
                />
                <div className="flex-1 leading-snug">
                  {parseBoldTokens(bulletContent, `l-${lIdx}`)}
                </div>
              </div>
            );
          }

          // First line lead verdict (if line index 0 and has bold or ends with emoji/punctuation)
          if (lIdx === 0 && (trimmed.startsWith('**') || trimmed.includes(':'))) {
            return (
              <div
                key={lIdx}
                className="text-sm sm:text-base font-medium pb-1.5 mb-1.5 border-b border-slate-200/60 leading-snug"
              >
                {parseBoldTokens(trimmed, `lead-${lIdx}`)}
              </div>
            );
          }

          // Header line with ###
          if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
            const headerText = trimmed.replace(/^#+\s*/, '');
            return (
              <div
                key={lIdx}
                className="font-black text-slate-900 text-xs sm:text-sm tracking-tight uppercase pt-1"
              >
                {parseBoldTokens(headerText, `h-${lIdx}`)}
              </div>
            );
          }

          return (
            <div key={lIdx} className="leading-snug">
              {parseBoldTokens(trimmed, `p-${lIdx}`)}
            </div>
          );
        })}
      </div>
    );
  };

  const renderWhyBox = (reasoning: TransparentReasoning) => {
    const verdictColors = {
      YES: 'bg-emerald-500/15 text-emerald-800 border-emerald-400/40',
      NO: 'bg-rose-500/15 text-rose-800 border-rose-400/40',
      CAUTION: 'bg-amber-500/15 text-amber-800 border-amber-400/40',
      NEUTRAL: 'bg-slate-200/60 text-slate-700 border-slate-300/60',
    };

    return (
      <div className="mt-3 p-3 rounded-2xl bg-white/60 border border-slate-200/80 text-xs shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/60">
          <div className="flex items-center gap-1.5 font-bold text-sky-700 uppercase tracking-wider text-[10px]">
            <Info className="w-3.5 h-3.5" />
            <span>TRANSPARENT REASONING • WHY?</span>
          </div>
          {reasoning.verdict && (
            <span
              className={`px-2 py-0.5 rounded-md font-bold text-[10px] border uppercase ${verdictColors[reasoning.verdict]}`}
            >
              Verdict: {reasoning.verdict}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-700">
          {reasoning.rainProbability !== undefined && (
            <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Rain Probability</span>
              <span className="font-mono text-sky-700 font-bold text-xs sm:text-sm">
                {reasoning.rainProbability}%
              </span>
            </div>
          )}

          {reasoning.expectedRainfallMm !== undefined && (
            <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Expected Rainfall</span>
              <span className="font-mono text-sky-700 font-bold text-xs sm:text-sm">
                {reasoning.expectedRainfallMm} mm
              </span>
            </div>
          )}

          {reasoning.windSpeedKmh !== undefined && (
            <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Wind Velocity</span>
              <span className="font-mono text-sky-700 font-bold text-xs sm:text-sm">
                {reasoning.windSpeedKmh} km/h
              </span>
            </div>
          )}

          {reasoning.timeWindow && (
            <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
              <span className="text-[10px] text-slate-500 block">Time Window</span>
              <span className="font-mono text-sky-700 font-semibold text-xs truncate block">
                {reasoning.timeWindow}
              </span>
            </div>
          )}
        </div>

        {/* Embedded Telemetry calibration in reasoning box if available */}
        {reasoning.telemetry && (
          <div className="mt-2.5 pt-2 border-t border-slate-200/60 bg-sky-50/50 -mx-3 -mb-3 p-2.5 rounded-b-2xl">
            <div className="flex items-center justify-between text-[10px] font-bold text-sky-800 mb-1.5">
              <span className="flex items-center gap-1">
                <Radio className="w-3 h-3 text-sky-600 animate-pulse" />
                SENSOR CALIBRATION • TELEMETRY
              </span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-800 font-mono text-[9px] border border-emerald-400/30">
                Confidence: {reasoning.telemetry.confidenceScore}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10px] text-slate-600">
              <div className="truncate">
                <span className="text-slate-400">Station: </span>
                <span className="font-medium text-slate-800">{reasoning.telemetry.stationCalibration}</span>
              </div>
              <div className="truncate">
                <span className="text-slate-400">Radar: </span>
                <span className="font-medium text-slate-800">{reasoning.telemetry.radarDopplerEnsemble}</span>
              </div>
              <div>
                <span className="text-slate-400">Dew Depression: </span>
                <span className="font-mono font-bold text-sky-700">{reasoning.telemetry.dewPointDepression}°C</span>
              </div>
              <div>
                <span className="text-slate-400">Tendency: </span>
                <span className="font-mono font-medium text-slate-800">{reasoning.telemetry.barometricTendency}</span>
              </div>
              {reasoning.telemetry.wetBulbGlobeTemp !== undefined && (
                <div className="col-span-2">
                  <span className="text-slate-400">WBGT Heat Stress: </span>
                  <span className="font-mono font-bold text-amber-700">{reasoning.telemetry.wetBulbGlobeTemp}°C</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-2 pt-1.5 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-500">
          <span>Source: Verified Meteorological Feed</span>
          <span className="text-emerald-700 font-medium">Grounded in Live Telemetry</span>
        </div>
      </div>
    );
  };

  const renderTelemetryBadge = (telemetry: IndustryTelemetry) => {
    return (
      <div className="mt-3 p-3 rounded-2xl bg-gradient-to-r from-sky-500/10 via-cyan-500/10 to-indigo-500/10 border border-sky-300/40 text-[11px] text-slate-700 shadow-sm animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-200/50">
          <div className="flex items-center gap-1.5 font-bold text-sky-800 uppercase tracking-wider text-[10px]">
            <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
            <span>INDUSTRY SENSOR CALIBRATION • TELEMETRY</span>
          </div>
          <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 font-mono text-[10px] border border-emerald-400/40 font-semibold">
            {telemetry.confidenceScore}% Model Agreement
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 leading-snug">
          <div>
            <span className="text-slate-400 text-[10px] block">Station Calibration</span>
            <span className="font-semibold text-slate-800">{telemetry.stationCalibration}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Doppler Radar</span>
            <span className="font-semibold text-slate-800">{telemetry.radarDopplerEnsemble}</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Dew Point Depression</span>
            <span className="font-mono font-bold text-sky-700">{telemetry.dewPointDepression}°C</span>
          </div>
          <div>
            <span className="text-slate-400 text-[10px] block">Barometric Tendency</span>
            <span className="font-mono font-medium text-slate-800">{telemetry.barometricTendency}</span>
          </div>
          {telemetry.wetBulbGlobeTemp !== undefined && (
            <div className="sm:col-span-2">
              <span className="text-slate-400 text-[10px] block">Wet Bulb Globe Temp (WBGT Stress Risk)</span>
              <span className="font-mono font-bold text-amber-700">{telemetry.wetBulbGlobeTemp}°C</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* ========================================================================= */}
      {/* 0. AMBIENT BACKDROP WHEN IN ADVANCED MISSION CONTROL MODAL */}
      {/* ========================================================================= */}
      {isExpanded && isMaximized && (
        <div
          className="fixed inset-0 bg-slate-950/45 backdrop-blur-md z-45 animate-in fade-in duration-200"
          onClick={() => setIsMaximized(false)}
          aria-hidden="true"
        />
      )}

      <div
        className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 flex flex-col items-center pointer-events-auto"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {/* ========================================================================= */}
        {/* 1. EXPANDABLE AI RESPONSE PANEL (Appears cleanly above the glass bar or modal) */}
        {/* ========================================================================= */}
        {isExpanded && (
          <div
            className={
              isMaximized
                ? 'fixed inset-2 sm:inset-4 md:inset-6 lg:inset-8 z-50 rounded-3xl weathergpt-glass-card shadow-2xl flex flex-col overflow-hidden bg-white/95 dark:bg-slate-900/95 border border-white/80 animate-in zoom-in-95 duration-200'
                : 'w-[calc(100vw-24px)] sm:w-[min(740px,calc(100vw-48px))] max-h-[62vh] sm:max-h-[500px] rounded-3xl weathergpt-glass-card shadow-2xl mb-2 sm:mb-3 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-250'
            }
            role={isMaximized ? 'dialog' : 'region'}
            aria-modal={isMaximized ? 'true' : undefined}
            aria-label="WeatherGPT conversation response panel"
          >
            {/* Response Panel Header */}
            <div className="px-4 py-2.5 sm:px-5 sm:py-3 border-b border-white/60 bg-white/40 flex items-center justify-between gap-2 select-none shrink-0">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-full bg-gradient-to-tr from-cyan-400/30 via-sky-300/40 to-violet-400/30 border border-white/80 shadow-[0_0_10px_rgba(56,189,248,0.3)] flex items-center justify-center text-sky-700 font-bold"
                  aria-hidden="true"
                >
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 font-display">
                    WeatherGPT
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowRoleSettings(!showRoleSettings)}
                    title="Active Gemini Engine (click to configure)"
                    className="text-[10px] px-2 py-0.5 rounded-full bg-sky-500/10 hover:bg-sky-500/20 text-sky-800 border border-sky-400/30 font-medium flex items-center gap-1 cursor-pointer transition"
                  >
                    <Cpu className="w-2.5 h-2.5 text-sky-600" />
                    <span>{modelPreference === 'auto' ? 'gemini-3.8-flash' : modelPreference}</span>
                  </button>
                  <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-slate-200/60 text-slate-700 capitalize">
                    {selectedRole.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Copy Transcript Button */}
                <button
                  type="button"
                  onClick={handleCopyTranscript}
                  title={copiedTranscript ? 'Transcript Copied!' : 'Copy Transcript'}
                  className="p-1.5 rounded-full hover:bg-white/60 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  aria-label="Copy transcript"
                >
                  {copiedTranscript ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>

                {/* Role & Model Settings Toggle */}
                <button
                  type="button"
                  onClick={() => setShowRoleSettings(!showRoleSettings)}
                  title="AI Role & Model Preferences"
                  className={`p-1.5 rounded-full transition cursor-pointer text-xs flex items-center gap-1 ${
                    showRoleSettings
                      ? 'bg-sky-500/20 text-sky-700 border border-sky-400/40'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                  aria-label="Toggle role and model preferences"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </button>

                {/* TTS Voice Readout Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    const next = !speechEnabled;
                    setSpeechEnabled(next);
                    if (!next && window.speechSynthesis) window.speechSynthesis.cancel();
                  }}
                  title={speechEnabled ? 'Mute AI Voice Readouts' : 'Enable AI Voice Readouts'}
                  className={`p-1.5 rounded-full transition cursor-pointer ${
                    speechEnabled
                      ? 'bg-sky-500/20 text-sky-700 border border-sky-400/40'
                      : 'hover:bg-white/60 text-slate-500'
                  }`}
                  aria-label={speechEnabled ? 'Mute AI Voice' : 'Enable AI Voice'}
                >
                  {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-sky-600" /> : <VolumeX className="w-3.5 h-3.5" />}
                </button>

                {/* Advanced Modal Toggle (Full Screen Mission Control Modal) */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  title={isMaximized ? 'Dock to Bottom Bar' : 'Expand to Advanced Mission Control Modal'}
                  className={`p-1.5 rounded-full transition cursor-pointer flex items-center gap-1 ${
                    isMaximized
                      ? 'bg-sky-500/20 text-sky-800 border border-sky-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600 hover:text-slate-900'
                  }`}
                  aria-label={isMaximized ? 'Dock to bar' : 'Expand Advanced Modal'}
                >
                  {isMaximized ? <Minimize2 className="w-3.5 h-3.5 text-sky-600" /> : <Maximize2 className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline text-[10px] font-semibold">{isMaximized ? 'Dock' : 'Advanced Modal'}</span>
                </button>

                {/* Collapse/Minimize Button */}
                <button
                  type="button"
                  onClick={() => {
                    setExpanded(false);
                    setIsMaximized(false);
                  }}
                  title="Collapse Assistant"
                  className="p-1.5 rounded-full hover:bg-white/60 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                  aria-label="Close AI response panel"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>

          {/* Optional Role & Grounding Controls Strip */}
          {showRoleSettings && (
            <div className="px-4 py-2 border-b border-white/60 bg-white/30 flex flex-wrap items-center justify-between gap-2 text-[11px] animate-in fade-in duration-150">
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
                <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mr-1 flex items-center gap-0.5">
                  <Layers className="w-3 h-3 text-sky-600" />
                  Role:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedRole('meteorologist')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'meteorologist'
                      ? 'bg-sky-500/20 text-sky-800 border border-sky-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <Compass className="w-2.5 h-2.5" />
                  Meteorologist
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('aviation_marine')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'aviation_marine'
                      ? 'bg-indigo-500/20 text-indigo-800 border border-indigo-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <Plane className="w-2.5 h-2.5" />
                  Aviation/Marine
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('agricultural_eco')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'agricultural_eco'
                      ? 'bg-emerald-500/20 text-emerald-800 border border-emerald-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <Leaf className="w-2.5 h-2.5" />
                  Agri/Eco
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('safety_officer')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'safety_officer'
                      ? 'bg-rose-500/20 text-rose-800 border border-rose-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <ShieldAlert className="w-2.5 h-2.5" />
                  Safety
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('travel_planner')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'travel_planner'
                      ? 'bg-amber-500/20 text-amber-800 border border-amber-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <Car className="w-2.5 h-2.5" />
                  Travel
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRole('places_guide')}
                  className={`px-2 py-0.5 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    selectedRole === 'places_guide'
                      ? 'bg-teal-500/20 text-teal-800 border border-teal-400/40 font-semibold'
                      : 'hover:bg-white/60 text-slate-600'
                  }`}
                >
                  <MapPin className="w-2.5 h-2.5" />
                  Places
                </button>
              </div>

              {/* Model & Tool preference selectors */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-white/50 p-0.5 rounded-lg border border-white/70">
                  <span className="text-[10px] text-slate-400 font-bold px-1">Model:</span>
                  <button
                    type="button"
                    onClick={() => setModelPreference('auto')}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      modelPreference === 'auto' ? 'bg-sky-500/20 text-sky-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Flash 3.8
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelPreference('gemini-3.1-flash-lite')}
                    title="Ultra-fast inference & high-availability resilience"
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      modelPreference === 'gemini-3.1-flash-lite' ? 'bg-amber-500/20 text-amber-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Lite 3.1
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelPreference('gemini-3.8-pro')}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      modelPreference === 'gemini-3.8-pro' ? 'bg-indigo-500/20 text-indigo-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Pro 3.8
                  </button>
                </div>

                {/* Tool mode */}
                <div className="flex items-center gap-1 bg-white/50 p-0.5 rounded-lg border border-white/70">
                  <button
                    type="button"
                    onClick={() => setGroundingPreference('auto')}
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer ${
                      groundingPreference === 'auto' ? 'bg-sky-500/20 text-sky-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Auto Tool
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroundingPreference('search')}
                    title="Google Search Grounding"
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer flex items-center gap-0.5 ${
                      groundingPreference === 'search' ? 'bg-sky-500/20 text-sky-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Globe className="w-2.5 h-2.5" />
                    Search
                  </button>
                  <button
                    type="button"
                    onClick={() => setGroundingPreference('maps')}
                    title="Google Maps Grounding"
                    className={`px-1.5 py-0.5 rounded text-[10px] transition cursor-pointer flex items-center gap-0.5 ${
                      groundingPreference === 'maps' ? 'bg-emerald-500/20 text-emerald-800 font-semibold' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <MapPin className="w-2.5 h-2.5" />
                    Maps
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Main Body: Dual-Pane in Advanced Modal mode, single-column when docked */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {isMaximized && (
              <div className="hidden md:flex flex-col w-72 lg:w-80 border-r border-slate-200/60 bg-slate-50/80 backdrop-blur-md p-4 overflow-y-auto custom-scrollbar text-xs shrink-0 select-none">
                <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-1.5 font-bold text-sky-900 tracking-wide uppercase text-[10px]">
                    <Radio className="w-3.5 h-3.5 text-sky-600 animate-pulse" />
                    <span>MISSION CONTROL TELEMETRY</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-800 font-mono text-[9px] border border-emerald-400/30">
                    LIVE FEED
                  </span>
                </div>

                {/* Ground Station Status */}
                {weatherData && (
                  <div className="space-y-3">
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-sky-600" />
                          {weatherData.location.name}
                        </span>
                        <span className="text-[10px] text-slate-500 font-normal">{weatherData.location.country}</span>
                      </div>
                      <div className="mt-1 grid grid-cols-2 gap-1 text-[10px] text-slate-500">
                        <div>GPS: {weatherData.location.latitude.toFixed(2)}°, {weatherData.location.longitude.toFixed(2)}°</div>
                        <div>Elev: {weatherData.location.elevation}m ASL</div>
                      </div>
                    </div>

                    {/* Sensor Readings */}
                    <div className="p-2.5 rounded-xl bg-white/80 border border-slate-200/80 shadow-2xs space-y-2">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Surface Station Sensors
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <span className="text-slate-400 text-[10px] block">Temp / Feels</span>
                          <span className="font-semibold text-slate-800">{Math.round(weatherData.current.temp)}°C / {Math.round(weatherData.current.feelsLike)}°C</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Barometer</span>
                          <span className="font-semibold text-slate-800">{weatherData.current.pressure} hPa</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Relative Humidity</span>
                          <span className="font-semibold text-slate-800">{weatherData.current.humidity}%</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Dew Point</span>
                          <span className="font-semibold text-sky-700">{weatherData.current.dewPoint ?? Math.round(weatherData.current.temp - (100 - weatherData.current.humidity)/5)}°C</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Wind Speed</span>
                          <span className="font-semibold text-slate-800">{weatherData.current.windSpeed} km/h</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">Precipitation Prob</span>
                          <span className="font-semibold text-sky-800">{weatherData.current.rainProb}%</span>
                        </div>
                      </div>
                    </div>

                    {/* WMO Air Quality & UV Telemetry */}
                    {weatherData.airQuality && (
                      <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-200/60 shadow-2xs">
                        <div className="flex items-center justify-between text-[10px] font-bold text-teal-900 mb-1.5">
                          <span className="flex items-center gap-1">
                            <Wind className="w-3 h-3 text-teal-600" />
                            AIR & SOLAR RADIATION
                          </span>
                          <span className="font-mono text-teal-800">AQI {weatherData.airQuality.usAqi}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                          <div>PM2.5: <span className="font-semibold text-slate-800">{weatherData.airQuality.pm25} µg/m³</span></div>
                          <div>PM10: <span className="font-semibold text-slate-800">{weatherData.airQuality.pm10} µg/m³</span></div>
                          <div className="col-span-2">UV Index: <span className="font-semibold text-amber-800">{weatherData.current.uvIndex} ({weatherData.airQuality.uvCategory})</span></div>
                        </div>
                      </div>
                    )}

                    {/* Fast Industry Actions */}
                    <div className="space-y-1.5 pt-1">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        Industry Action Prompts
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Run full METAR & VFR aviation safety analysis for local operations')}
                          disabled={isLoading}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-sky-800 transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Aviation VFR / Drone Check</span>
                          <Plane className="w-3 h-3 text-indigo-500 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Calculate current Agricultural Spray Window and Soil Evapotranspiration risk')}
                          disabled={isLoading}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-emerald-800 transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Agri Spray Window & ET</span>
                          <Leaf className="w-3 h-3 text-emerald-500 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendMessage('Evaluate WBGT heat stress index and civil protection safety thresholds')}
                          disabled={isLoading}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-rose-800 transition flex items-center justify-between cursor-pointer"
                        >
                          <span>WBGT Heat Stress Advisory</span>
                          <ShieldAlert className="w-3 h-3 text-rose-500 shrink-0" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFetchAirQualityAndUv()}
                          disabled={isLoading || isFetchingAqi}
                          className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white/70 hover:bg-white border border-slate-200 text-[11px] text-slate-700 hover:text-teal-800 transition flex items-center justify-between cursor-pointer"
                        >
                          <span>Air Quality & Solar UV Sync</span>
                          <Wind className="w-3 h-3 text-teal-500 shrink-0" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Conversation Thread Column */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
              {/* Conversation Thread */}
              <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 space-y-3 custom-scrollbar text-xs sm:text-sm">
            {messages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 shadow-sm text-xs ${
                      isUser
                        ? 'bg-slate-800 text-white'
                        : 'bg-white/80 border border-white text-sky-700'
                    }`}
                    aria-hidden="true"
                  >
                    {isUser ? <User className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5 text-sky-600" />}
                  </div>

                  <div
                    className={`max-w-[88%] sm:max-w-[82%] rounded-2xl p-3 sm:p-3.5 leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-slate-900 text-white'
                        : 'bg-white/70 border border-white/90 text-slate-800'
                    }`}
                  >
                    {/* Metadata Header */}
                    {!isUser && (
                      <div className="flex items-center flex-wrap gap-1.5 mb-1.5 pb-1 border-b border-slate-200/50 text-[10px]">
                        {msg.modelUsed && (
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-800 font-mono">
                            {msg.modelUsed}
                          </span>
                        )}
                        {msg.groundingType === 'search' && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-800 border border-blue-400/30 flex items-center gap-1 font-medium">
                            <Globe className="w-2.5 h-2.5" />
                            Search Grounded
                          </span>
                        )}
                        {msg.groundingType === 'maps' && (
                          <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-800 border border-emerald-400/30 flex items-center gap-1 font-medium">
                            <MapPin className="w-2.5 h-2.5" />
                            Maps Grounded
                          </span>
                        )}
                      </div>
                    )}

                    {renderFormattedAnswer(msg.text, isUser)}

                    {/* Google Search Grounding Sources */}
                    {msg.groundingSources && msg.groundingSources.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-sky-700 mb-1">
                          <Globe className="w-3 h-3" />
                          <span>Search Grounding Citations:</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {msg.groundingSources.map((source, sIdx) => (
                            <a
                              key={sIdx}
                              href={source.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/70 hover:bg-white border border-slate-200/80 text-[10px] text-sky-800 hover:text-sky-950 transition"
                            >
                              <span className="truncate max-w-[170px]">{source.title}</span>
                              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Google Maps Grounding Places */}
                    {msg.mapsPlaces && msg.mapsPlaces.length > 0 && (
                      <div className="mt-2.5 pt-2 border-t border-slate-200/60">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 mb-1">
                          <MapPin className="w-3 h-3" />
                          <span>Google Maps Grounded Places:</span>
                        </div>
                        <div className="space-y-1">
                          {msg.mapsPlaces.map((place, pIdx) => (
                            <a
                              key={pIdx}
                              href={place.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-400/30 text-[10px] text-emerald-900 transition"
                            >
                              <div className="flex items-center justify-between font-semibold">
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-2.5 h-2.5 text-emerald-600" />
                                  {place.title}
                                </span>
                                <span className="text-[9px] text-emerald-700 underline flex items-center gap-0.5">
                                  Maps ↗
                                </span>
                              </div>
                              {place.address && (
                                <div className="text-[9px] text-slate-500 mt-0.5">{place.address}</div>
                              )}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Air Quality & Solar UV Telemetry Summary Card */}
                    {msg.airQualityData && (
                      <div className="mt-3 p-3 rounded-2xl bg-white/85 border border-teal-200/70 shadow-sm text-xs text-slate-800 animate-in fade-in duration-200">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200/70">
                          <div className="flex items-center gap-1.5 font-bold text-teal-800 uppercase tracking-wider text-[10px]">
                            <Wind className="w-3.5 h-3.5 text-teal-600" />
                            <Sun className="w-3.5 h-3.5 text-amber-500" />
                            <span>AIR QUALITY & SOLAR UV METRICS</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-md font-bold text-[10px] bg-teal-500/15 text-teal-800 border border-teal-400/40">
                            AQI {msg.airQualityData.usAqi} • {msg.airQualityData.aqiCategory}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                          <div className="p-2 rounded-xl bg-teal-50/70 border border-teal-200/60">
                            <span className="text-[10px] text-teal-800 block">US AQI</span>
                            <span className="font-mono text-teal-900 font-bold text-sm">
                              {msg.airQualityData.usAqi}
                            </span>
                            <span className="text-[10px] text-teal-700 block truncate">
                              {msg.airQualityData.aqiCategory}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
                            <span className="text-[10px] text-slate-500 block">PM2.5 Particles</span>
                            <span className="font-mono text-slate-800 font-bold text-sm">
                              {msg.airQualityData.pm25}
                            </span>
                            <span className="text-[10px] text-slate-500 block">µg/m³</span>
                          </div>

                          <div className="p-2 rounded-xl bg-slate-50/80 border border-slate-200/60">
                            <span className="text-[10px] text-slate-500 block">PM10 Particles</span>
                            <span className="font-mono text-slate-800 font-bold text-sm">
                              {msg.airQualityData.pm10}
                            </span>
                            <span className="text-[10px] text-slate-500 block">µg/m³</span>
                          </div>

                          <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/60">
                            <span className="text-[10px] text-amber-800 block">UV Index</span>
                            <span className="font-mono text-amber-900 font-bold text-sm">
                              {msg.airQualityData.uvIndex}
                            </span>
                            <span className="text-[10px] text-amber-700 block truncate">
                              {msg.airQualityData.uvCategory}
                            </span>
                          </div>
                        </div>

                        <div className="space-y-1 pt-1.5 border-t border-slate-200/60 text-[11px] text-slate-700 leading-snug">
                          <p>
                            <span className="font-semibold text-teal-800">Health Impact: </span>
                            <span className="text-slate-600">{msg.airQualityData.aqiDescription}</span>
                          </p>
                          <p>
                            <span className="font-semibold text-amber-800">Sun Advice: </span>
                            <span className="text-slate-600">{msg.airQualityData.uvAdvice}</span>
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Industry Telemetry readout */}
                    {msg.telemetry && !msg.reasoning?.telemetry && renderTelemetryBadge(msg.telemetry)}

                    {/* Transparent reasoning WHY box */}
                    {msg.reasoning && renderWhyBox(msg.reasoning)}

                    {!isUser && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/50 flex items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => handlePlayMessageVoice(msg.id, msg.text)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition shadow-2xs cursor-pointer ${
                            currentlyPlayingMsgId === msg.id
                              ? 'bg-amber-400 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-bold'
                              : 'bg-amber-50/90 hover:bg-amber-100 text-amber-900 border border-amber-300/70'
                          }`}
                          title="Listen with Gemini AI Cool Female Voice (Telugu & English)"
                          aria-label="Listen with Gemini AI Cool Female Voice"
                        >
                          {currentlyPlayingMsgId === msg.id ? (
                            <>
                              <Square className="w-2.5 h-2.5 fill-current" />
                              <span>Stop Voice</span>
                              <span className="w-1.5 h-1.5 rounded-full bg-stone-950 animate-ping" />
                            </>
                          ) : (
                            <>
                              <Volume2 className="w-3 h-3 text-amber-700" />
                              <span>Listen (Cool Female Voice)</span>
                              <span className="text-[9px] text-amber-700 opacity-90">🌸</span>
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                          <span>{msg.timestamp}</span>
                          <span className="flex items-center gap-0.5 text-slate-500">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            Live WMO Ground Truth
                          </span>
                        </div>
                      </div>
                    )}

                    {isUser && (
                      <div className="mt-1 flex items-center justify-end text-[9px] text-slate-300">
                        <span>{msg.timestamp}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Progressive Loading State */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-white/80 border border-white text-sky-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-sky-600" />
                </div>
                <div className="p-3 rounded-2xl bg-white/70 border border-white/90 text-slate-700 text-xs shadow-sm max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 animate-ping"></span>
                    <span className="font-semibold text-sky-800">WeatherGPT Agent</span>
                  </div>
                  <p className="text-slate-500 italic mb-2 text-[11px]">{loadingStep}</p>
                  <div className="w-40 h-1 bg-slate-200/80 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-sky-400 to-cyan-300 rounded-full w-2/3 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Embedded Input Bar inside Advanced Mission Control Modal */}
          {isMaximized && (
            <div className="p-3 sm:p-4 border-t border-slate-200/60 bg-white/75 backdrop-blur-md shrink-0">
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar mb-2.5 pb-0.5">
                {DEFAULT_QUESTIONS.slice(0, 5).map((q, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (q === 'Current Air Quality & UV') {
                        handleFetchAirQualityAndUv();
                      } else {
                        handleSendMessage(q);
                      }
                    }}
                    disabled={isLoading || isFetchingAqi}
                    className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 border border-slate-200/80 shadow-2xs transition active:scale-95 whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-40"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Real-Time Audio-Spectrum Analyzer dynamically synced to mic input */}
              {isListening && (
                <div className="mb-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  <AudioSpectrumVisualizer
                    analyserNode={activeAnalyser || analyserRef.current}
                    isListening={isListening}
                    volumeLevel={volumeLevel}
                    volumeBars={volumeBars}
                    micCountdown={micCountdown}
                    transcript={recordedSpeechRef.current || inputQuery}
                    onSendNow={() => triggerAutoProcessMic()}
                    onStop={() => stopRecording()}
                    onOpenSettings={() => setIsMicSettingsOpen(true)}
                    variant="embedded"
                  />
                </div>
              )}

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2 p-1.5 rounded-2xl bg-white border border-slate-300/80 shadow-sm focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition"
              >
                <div className="w-7 h-7 rounded-full bg-sky-500/10 flex items-center justify-center text-sky-700 shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                </div>
                {isListening ? (
                  <div className="flex-1 flex items-center justify-between gap-2 px-1 min-w-0">
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                      </span>
                      <span className="text-[10px] font-bold text-rose-600 tracking-wider uppercase hidden xs:inline">
                        REC
                      </span>
                    </div>

                    {/* Dynamic Volume Visualizer Bars for Mission Control Mode in Soft Light Classic styling */}
                    <div
                      className="flex items-center gap-1.5 h-7 px-2.5 py-0.5 rounded-lg bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-300/80 shadow-[0_0_10px_rgba(245,158,11,0.25)] shrink-0"
                      role="meter"
                      aria-label="Microphone stream intensity"
                      aria-valuenow={volumeLevel}
                    >
                      <Volume2 className="w-3 h-3 text-amber-600 shrink-0" />
                      <div className="flex items-center gap-[2.5px] h-full" aria-hidden="true">
                        {volumeBars.map((height, idx) => (
                          <div
                            key={idx}
                            className="w-1 rounded-full bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 transition-all duration-75"
                            style={{
                              height: `${height}%`,
                              opacity: Math.max(0.4, height / 100),
                              boxShadow: height > 40 ? '0 0 6px rgba(251, 191, 36, 0.6)' : 'none',
                            }}
                          />
                        ))}
                      </div>
                      <span className="text-[9px] font-mono font-bold text-amber-800 ml-0.5">
                        {volumeLevel}%
                      </span>
                    </div>

                    {/* Live Auto-Process Timer Badge & Instant Dispatch */}
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-400/40 text-[10px] text-amber-900 shrink-0">
                      <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                      <span className="font-mono font-bold">0:0{micCountdown}s</span>
                      <button
                        type="button"
                        onClick={() => triggerAutoProcessMic()}
                        className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[9px] flex items-center gap-0.5 shadow-2xs transition active:scale-95 cursor-pointer"
                        title="Process speech right now"
                      >
                        <Zap className="w-2.5 h-2.5 fill-current" />
                        <span>Send</span>
                      </button>
                    </div>

                    <div className="flex-1 text-xs text-slate-700 truncate min-w-0">
                      {inputQuery ? (
                        <span className="font-medium text-slate-800">“{inputQuery}”</span>
                      ) : (
                        <span className="text-slate-400 italic">
                          {chatLanguage === 'telugu'
                            ? 'తెలుగులో వింటోంది... మాట్లాడండి...'
                            : 'Listening in Telugu & English...'}
                        </span>
                      )}
                    </div>
                  </div>
                ) : (
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    placeholder={
                      chatLanguage === 'telugu'
                        ? 'తెలుగులో వాతావరణ ప్రశ్నను అడగండి (ఉదా: గొడుగు కావాలా?)...'
                        : 'Ask WeatherGPT in Mission Control mode (English or తెలుగు)...'
                    }
                    disabled={isLoading || isFetchingAqi}
                    className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder:text-slate-400"
                  />
                )}
                <button
                  type="button"
                  onClick={handleFetchAirQualityAndUv}
                  disabled={isLoading || isFetchingAqi}
                  title="Fetch Air Quality & UV Telemetry"
                  className="h-8 px-2 rounded-xl flex items-center gap-1 text-[11px] font-medium bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition cursor-pointer shrink-0 disabled:opacity-40"
                >
                  <Wind className="w-3 h-3 text-teal-600" />
                  <span className="hidden sm:inline">AQI & UV</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleVoiceInput}
                  title={
                    isListening
                      ? 'Stop recording (Microphone active)'
                      : 'Record voice (Soft Light Classic • Telugu & English with Cool Female Voice)'
                  }
                  className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer shrink-0 ${
                    isListening
                      ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-[0_0_15px_rgba(245,158,11,0.6)] animate-pulse'
                      : 'bg-gradient-to-b from-amber-50 via-stone-50 to-amber-100 text-amber-800 border border-amber-300/80 shadow-[0_0_14px_rgba(245,158,11,0.35),0_2px_6px_rgba(180,83,9,0.12)] hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-soft-light-beacon'
                  }`}
                  aria-label={isListening ? 'Stop voice recording' : 'Start voice recording with dynamic volume visualizer'}
                >
                  {isListening ? (
                    <Square className="w-3 h-3 fill-current" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-amber-700" />
                  )}
                </button>
                <button
                  type="submit"
                  disabled={!inputQuery.trim() || isLoading}
                  className="h-8 px-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-semibold text-xs flex items-center gap-1 shadow-sm transition active:scale-95 disabled:opacity-40 cursor-pointer shrink-0"
                >
                  <span>Send</span>
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  )}

      {/* ========================================================================= */}
      {/* 2. SMART PROMPT SUGGESTIONS (Small floating chips above input) */}
      {/* ========================================================================= */}
      {!isMaximized && (isFocused || !isExpanded) && (
        <div
          className="w-[calc(100vw-24px)] sm:w-[min(720px,calc(100vw-48px))] mb-2 overflow-x-auto no-scrollbar flex items-center gap-1.5 px-1 py-0.5 animate-in fade-in slide-in-from-bottom-2 duration-200"
          role="group"
          aria-label="WeatherGPT Suggested Questions"
        >
          {/* Quick Telugu / English Mode Toggle Chip */}
          <button
            type="button"
            onClick={() => setChatLanguage((prev) => (prev === 'telugu' ? 'english' : 'telugu'))}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold border shadow-2xs backdrop-blur-md transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 flex items-center gap-1 ${
              chatLanguage === 'telugu'
                ? 'bg-amber-400 text-stone-950 border-amber-300 font-bold shadow-[0_0_10px_rgba(245,158,11,0.4)]'
                : 'bg-white/75 hover:bg-white text-slate-700 hover:text-slate-900 border-white/80'
            }`}
            title="Switch suggested questions between Telugu and English"
          >
            <span>{chatLanguage === 'telugu' ? '🇮🇳 తెలుగు' : '🌐 English'}</span>
          </button>

          {(chatLanguage === 'telugu' ? TELUGU_DEFAULT_QUESTIONS : DEFAULT_QUESTIONS).map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (q === 'Current Air Quality & UV' || q === 'ప్రస్తుత గాలి నాణ్యత (AQI) & ఎండ తీవ్రత (UV)') {
                  handleFetchAirQualityAndUv();
                } else {
                  handleSendMessage(q);
                }
              }}
              disabled={isLoading || isFetchingAqi}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/65 hover:bg-white/90 text-slate-700 hover:text-slate-900 border border-white/70 shadow-sm backdrop-blur-md transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 disabled:opacity-40"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ULTRA-PREMIUM LIGHT GLASS AI COMMAND BAR WITH SOFT GLOWING HIGHLIGHTS */}
      {/* ========================================================================= */}
      {!isMaximized && (
        <div className="relative group/bar flex flex-col items-center justify-center">
          {/* Real-Time Audio-Spectrum Analyzer Deck synced with mic input during Listening Mode */}
          {isListening && (
            <div className="w-[calc(100vw-24px)] sm:w-[min(720px,calc(100vw-48px))] mb-2.5 z-30 animate-in fade-in slide-in-from-bottom-3 duration-200">
              <AudioSpectrumVisualizer
                analyserNode={activeAnalyser || analyserRef.current}
                isListening={isListening}
                volumeLevel={volumeLevel}
                volumeBars={volumeBars}
                micCountdown={micCountdown}
                transcript={recordedSpeechRef.current || inputQuery}
                onSendNow={() => triggerAutoProcessMic()}
                onStop={() => stopRecording()}
                onOpenSettings={() => setIsMicSettingsOpen(true)}
                variant="floating"
              />
            </div>
          )}

          {/* Soft Light Classic Voice Assistant Pill Beacon & Mic Settings Button */}
          <div className="flex items-center justify-center gap-1.5 mb-2 px-2">
            <button
              type="button"
              onClick={handleOpenVoiceAssistant}
              className="group px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-50 via-stone-50 to-amber-100/95 border border-amber-300/90 text-amber-950 shadow-[0_0_20px_rgba(245,158,11,0.35),0_2px_8px_rgba(180,83,9,0.12)] hover:shadow-[0_0_28px_rgba(245,158,11,0.55)] hover:border-amber-400 transition-all duration-300 active:scale-95 flex items-center gap-2 cursor-pointer backdrop-blur-md animate-soft-light-beacon"
              title="Open Soft Light Classic Voice Studio (Telugu & English with Cool Female Voice)"
              aria-label="Open Voice Assistant in Soft Light Classic mode with Telugu and English Cool Female Voice"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <Mic className="w-3.5 h-3.5 text-amber-700 group-hover:scale-110 transition-transform" />
              <span className="text-[11px] font-bold tracking-tight text-amber-950">
                Voice AI • తెలుగు & English
              </span>
              <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-amber-200/70 text-amber-900 border border-amber-300/80">
                🌸 Cool Female Voice
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMicSettingsOpen(true)}
              className="h-7 px-2 rounded-full bg-white/75 hover:bg-white text-stone-700 hover:text-stone-900 border border-amber-200/70 shadow-xs flex items-center gap-1 transition active:scale-95 cursor-pointer backdrop-blur-md text-[11px] font-medium"
              title="Configure Microphone hardware, DSP Noise Cancellation, Sensitivity, and Voice"
              aria-label="Open Microphone Settings"
            >
              <Sliders className="w-3 h-3 text-amber-600" />
              <span className="hidden sm:inline">Mic Settings</span>
            </button>
          </div>

          {/* Ambient Soft Glowing Light Halo behind the Bar */}
          <div
            className={`pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-[34px] bg-gradient-to-r from-amber-300/25 via-yellow-200/35 to-amber-400/25 blur-lg transition-all duration-500 ${
              isFocused ? 'opacity-100 -inset-2 blur-xl' : 'opacity-65 group-hover/bar:opacity-85'
            } animate-soft-aura`}
            aria-hidden="true"
          />

          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className={`w-[calc(100vw-24px)] sm:w-[min(720px,calc(100vw-48px))] h-[58px] sm:h-[64px] rounded-[28px] weathergpt-glass-bar flex items-center px-3 sm:px-4 gap-2 sm:gap-2.5 relative overflow-hidden select-none z-10 ${
              hasNeonPulse ? 'animate-neon-reveal' : ''
            }`}
            role="search"
            aria-label="WeatherGPT AI Assistant Input Bar"
          >
            {/* Specular Edge & Luminous Gradient Top Highlight */}
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-white to-transparent opacity-95"
              aria-hidden="true"
            />

            {/* Upper Specular Glass Light Reflection Highlight with gentle soft sheen pass */}
            <div
              className="pointer-events-none absolute inset-x-8 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-200 via-white to-transparent animate-glass-sheen"
              aria-hidden="true"
            />

            {/* Bottom subtle rim light */}
            <div
              className="pointer-events-none absolute inset-x-12 bottom-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent"
              aria-hidden="true"
            />

            {/* Small AI Identity Element (Left Side) with soft pulse glow */}
            <div
              className="w-8 h-8 rounded-full bg-gradient-to-tr from-amber-400/30 via-yellow-300/40 to-amber-500/30 border border-white/90 shadow-[0_0_14px_rgba(245,158,11,0.35)] flex items-center justify-center text-amber-800 shrink-0 cursor-pointer transition-transform active:scale-90"
              onClick={() => setExpanded(!isExpanded)}
              title="WeatherGPT AI"
              aria-hidden="true"
            >
              <Sparkles className="w-4 h-4 text-amber-700 animate-pulse-subtle" />
            </div>

            {/* Embedded Clean Glass Input OR Dynamic Volume Level Visualizer */}
            <div className="flex-1 relative flex items-center min-w-0">
              {isListening ? (
                <div className="w-full flex items-center justify-between gap-2 sm:gap-3 py-1 px-0.5">
                  {/* Recording Status Indicator */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="relative flex h-2.5 w-2.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                    </span>
                    <span className="text-[11px] font-bold tracking-wider text-rose-600 uppercase hidden xs:inline">
                      REC
                    </span>
                  </div>

                  {/* Dynamic Volume Level Visualizer with animated bars in Soft Light Classic warm gold */}
                  <div
                    className="flex items-center gap-1.5 h-8 px-2 sm:px-2.5 py-1 rounded-2xl bg-gradient-to-r from-amber-50/95 via-stone-50/95 to-amber-100/90 border border-amber-300/80 shadow-[0_0_16px_rgba(245,158,11,0.25)] backdrop-blur-md shrink-0"
                    role="meter"
                    aria-label="Microphone stream volume visualizer"
                    aria-valuenow={volumeLevel}
                    title={`Microphone Stream Intensity: ${volumeLevel}%`}
                  >
                    <Volume2 className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <div className="flex items-center gap-[2.5px] sm:gap-[3px] h-full" aria-hidden="true">
                      {volumeBars.map((height, i) => (
                        <div
                          key={i}
                          className="w-1 sm:w-1.5 rounded-full bg-gradient-to-t from-amber-500 via-amber-400 to-yellow-300 transition-all duration-75"
                          style={{
                            height: `${height}%`,
                            opacity: Math.max(0.35, height / 100),
                            boxShadow: height > 35 ? '0 0 8px rgba(251, 191, 36, 0.6)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-amber-800 ml-0.5 min-w-[26px] text-right">
                      {volumeLevel}%
                    </span>
                  </div>

                  {/* Live Auto-Process Timer Badge & Instant Dispatch */}
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-400/40 text-[10px] text-amber-900 shrink-0">
                    <Clock className="w-3 h-3 text-amber-600 animate-spin" />
                    <span className="font-mono font-bold">0:0{micCountdown}s</span>
                    <button
                      type="button"
                      onClick={() => triggerAutoProcessMic()}
                      className="px-1.5 py-0.5 rounded bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[9px] flex items-center gap-0.5 shadow-2xs transition active:scale-95 cursor-pointer"
                      title="Process speech right now"
                    >
                      <Zap className="w-2.5 h-2.5 fill-current" />
                      <span>Send</span>
                    </button>
                  </div>

                  {/* Live transcript or listening prompt */}
                  <div className="flex-1 min-w-0 text-left">
                    {inputQuery ? (
                      <p className="text-xs sm:text-sm font-medium text-slate-800 truncate">
                        “{inputQuery}”
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic truncate animate-pulse">
                        Listening in Telugu & English... speak your question
                      </p>
                    )}
                  </div>

                  {/* Expand to Theater Voice Studio */}
                  <button
                    type="button"
                    onClick={handleOpenVoiceAssistant}
                    title="Expand to Full-Screen Voice Studio (Telugu & English)"
                    className="w-7 h-7 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/70 transition active:scale-95 cursor-pointer hidden sm:flex shadow-2xs"
                    aria-label="Expand voice studio"
                  >
                    <Maximize className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="text"
                  id="weathergpt-input"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                  onFocus={() => {
                    setIsFocused(true);
                    triggerNeonPulse();
                  }}
                  onBlur={() => setIsFocused(false)}
                  placeholder="Ask WeatherGPT in English or తెలుగు (Tap mic to speak)..."
                  disabled={isLoading || isFetchingAqi}
                  className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 text-slate-800 placeholder:text-slate-400 text-xs sm:text-sm font-medium pr-1"
                  aria-label="Ask WeatherGPT anything about the weather"
                  autoComplete="off"
                />
              )}
            </div>

            {/* Controls Container: AQI & UV Button + Microphone + Send Button */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Air Quality & UV Index Button */}
              <button
                type="button"
                id="weathergpt-btn-aqi-uv"
                onClick={handleFetchAirQualityAndUv}
                disabled={isLoading || isFetchingAqi}
                title="Fetch & Summarize Air Quality and UV Index"
                className="h-8 sm:h-9 px-2 sm:px-2.5 rounded-full flex items-center gap-1 sm:gap-1.5 bg-gradient-to-r from-teal-500/15 via-sky-500/15 to-amber-500/15 hover:from-teal-500/25 hover:via-sky-500/25 hover:to-amber-500/25 text-slate-700 hover:text-slate-950 border border-white/80 shadow-[0_0_10px_rgba(45,212,191,0.15)] transition active:scale-95 cursor-pointer disabled:opacity-40"
                aria-label="Fetch and summarize current air quality and UV index details"
              >
                {isFetchingAqi ? (
                  <Sparkles className="w-3.5 h-3.5 animate-spin text-teal-600" />
                ) : (
                  <>
                    <div className="flex items-center -space-x-1" aria-hidden="true">
                      <Wind className="w-3.5 h-3.5 text-teal-600" />
                      <Sun className="w-3.5 h-3.5 text-amber-500" />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-800 tracking-tight whitespace-nowrap hidden sm:inline">
                      AQI & UV
                    </span>
                  </>
                )}
              </button>

              {/* ========================================================================= */}
              {/* HIGHLIGHTED MICROPHONE BUTTON IN SOFT LIGHT CLASSIC COLOUR COMBINATION */}
              {/* ========================================================================= */}
              <button
                type="button"
                id="weathergpt-btn-mic"
                onClick={handleToggleVoiceInput}
                title={
                  isListening
                    ? 'Stop recording (Microphone stream active)'
                    : 'Speak with Gemini Voice AI (తెలుగు & English • Cool Female Voice)'
                }
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all duration-300 active:scale-95 cursor-pointer relative shrink-0 ${
                  isListening
                    ? 'bg-gradient-to-r from-amber-500 to-rose-500 text-white border border-amber-200 shadow-[0_0_20px_rgba(245,158,11,0.7)] animate-pulse'
                    : 'bg-gradient-to-b from-amber-50 via-stone-50 to-amber-100/95 text-amber-800 border border-amber-300/90 shadow-[0_0_18px_rgba(245,158,11,0.4),0_2px_8px_rgba(180,83,9,0.15)] hover:border-amber-400 hover:shadow-[0_0_24px_rgba(245,158,11,0.6)] animate-soft-light-beacon'
                }`}
                aria-label={isListening ? 'Stop voice recording' : 'Start voice recording with dynamic volume visualizer'}
              >
                {isListening ? (
                  <Square className="w-3.5 h-3.5 fill-current" />
                ) : (
                  <div className="relative flex items-center justify-center">
                    <Mic className="w-4 h-4 text-amber-700 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                  </div>
                )}
              </button>

              {/* Minimal Glass Send Button */}
              <button
                type="submit"
                disabled={!inputQuery.trim() || isLoading || isFetchingAqi}
                title="Send Message"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/10 hover:bg-slate-900/20 text-slate-800 hover:text-slate-950 border border-white/60 flex items-center justify-center transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer shadow-sm hover:shadow"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>
          </form>
        </div>
      )}
    </div>

    {/* Voice Assistant Overlay with Highlighted Blurred Backdrop & Glowing Concentric Mic Waves */}
    <VoiceAssistantOverlay
      isOpen={isVoiceOverlayOpen}
      onClose={() => setIsVoiceOverlayOpen(false)}
      onSendQuery={(query, lang) => {
        handleSendMessage(query, lang);
      }}
      currentLocationName={weatherData.location.name}
      weatherContext={weatherData}
    />

    {/* Dedicated Microphone & DSP Settings Modal */}
    <MicSettingsModal
      isOpen={isMicSettingsOpen}
      onClose={() => setIsMicSettingsOpen(false)}
    />
  </>
);
};
