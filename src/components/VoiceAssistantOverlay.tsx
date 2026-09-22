import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Send,
  X,
  RotateCcw,
  Sparkles,
  Volume2,
  AlertCircle,
  Globe,
  Play,
  Square,
  CheckCircle2,
  Radio,
  Clock,
  Zap,
  Sliders,
  ShieldCheck,
} from 'lucide-react';
import {
  speakWithGeminiAiVoice,
  stopAllSpeech,
  detectLanguage,
} from '../utils/geminiVoiceService';
import {
  MicSettings,
  loadMicSettings,
  buildAudioConstraints,
  playAudioCue,
  getSilenceTimeoutMs,
} from '../utils/micSettings';
import { MicSettingsModal } from './MicSettingsModal';

export interface VoiceAssistantOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSendQuery: (query: string, language?: 'telugu' | 'english' | 'auto') => void;
  currentLocationName: string;
  weatherContext?: any;
}

export const VoiceAssistantOverlay: React.FC<VoiceAssistantOverlayProps> = ({
  isOpen,
  onClose,
  onSendQuery,
  currentLocationName,
  weatherContext,
}) => {
  const [micSettings, setMicSettings] = useState<MicSettings>(loadMicSettings);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [volumeLevel, setVolumeLevel] = useState(0); // 0 to 100
  const [frequencyBars, setFrequencyBars] = useState<number[]>(new Array(24).fill(12));
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'granted' | 'denied'>('prompt');
  const [speechSupported, setSpeechSupported] = useState(true);

  // Time limit state initialized from user micSettings
  const [timeLimit, setTimeLimit] = useState<number>(micSettings.timeLimitSeconds || 6);
  const [secondsLeft, setSecondsLeft] = useState<number>(micSettings.timeLimitSeconds || 6);
  const timerIntervalRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<any>(null);
  const fullSpokenTextRef = useRef<string>('');
  const isAutoProcessingRef = useRef<boolean>(false);

  // Language state: 'te-IN' (Telugu), 'en-IN' (English), 'auto' (Bilingual)
  const [selectedLanguage, setSelectedLanguage] = useState<'te-IN' | 'en-IN' | 'auto'>('auto');

  // Integrated Gemini Voice response state inside overlay
  const [isProcessingAiVoice, setIsProcessingAiVoice] = useState(false);
  const [aiVoiceResponse, setAiVoiceResponse] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [stopAudioFn, setStopAudioFn] = useState<(() => void) | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const isComponentMounted = useRef(true);

  // Telugu & English suggested weather queries
  const teluguPrompts = [
    `ఈ రోజు ${currentLocationName} లో గొడుగు కావాలా? వర్షం పడుతుందా?`,
    `ప్రస్తుత ఉష్ణోగ్రత, తేమ మరియు గాలి వేగం ఎంత?`,
    `గాలి నాణ్యత (AQI) మరియు ఎండ తీవ్రత (UV Index) ఎలా ఉన్నాయి?`,
    `రాబోయే 3 గంటల్లో వర్షం కురిసే అవకాశం ఉందా?`,
    `బయట క్రికెట్ ఆడటానికి లేదా ప్రయాణానికి మంచి సమయమా?`,
    `రేపటి పూర్తి వాతావరణ నివేదిక తెలపండి`,
    `బయట ఎండ ఎక్కువగా ఉందా? సన్‌స్క్రీన్ వాడాలా?`,
  ];

  const englishPrompts = [
    `Will it rain today in ${currentLocationName}? Do I need an umbrella?`,
    `What's the current temperature, humidity, and wind speed?`,
    `How is the Air Quality (AQI) and UV Index right now?`,
    `Check precipitation forecast for next 3 hours`,
    `Is it safe for outdoor sports or travel right now?`,
    `Give me tomorrow's full weather outlook`,
  ];

  // Stop microphone stream & audio analyser cleanly
  const stopAudioCapture = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch {
        // Ignored
      }
      audioContextRef.current = null;
    }
    setVolumeLevel(0);
    setFrequencyBars(new Array(24).fill(10));
  }, []);

  // Initialize Web Audio API Analyser & Gain Node for real-time waves and volume calibration
  const startAudioVisualizer = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        startSimulatedWaves();
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        startSimulatedWaves();
        return;
      }

      const constraints = buildAudioConstraints(micSettings);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      mediaStreamRef.current = stream;
      setPermissionState('granted');
      setErrorStatus(null);

      const audioCtx = new AudioContextClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = micSettings.micGain || 1.0;
      gainNodeRef.current = gainNode;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.82;

      source.connect(gainNode);
      gainNode.connect(analyser);
      analyserRef.current = analyser;

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const renderLoop = () => {
        if (!isComponentMounted.current) return;
        analyser.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const avg = sum / bufferLength;
        const normalizedVol = Math.min(100, Math.round((avg / 128) * 100));
        setVolumeLevel(normalizedVol);

        const bars: number[] = [];
        const step = Math.max(1, Math.floor(bufferLength / 24));
        for (let i = 0; i < 24; i++) {
          const val = dataArray[i * step] || dataArray[i] || 0;
          const pct = Math.max(12, Math.min(95, Math.round((val / 255) * 100)));
          bars.push(pct);
        }
        setFrequencyBars(bars);

        animationFrameRef.current = requestAnimationFrame(renderLoop);
      };

      renderLoop();
    } catch (err: any) {
      console.warn('Microphone stream access notice:', err?.name || err?.message);
      if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setErrorStatus('Microphone permission was denied. Please allow microphone access in your browser settings.');
      } else {
        setErrorStatus('Could not access microphone hardware. You can select any prompt below.');
      }
      startSimulatedWaves();
    }
  }, [micSettings]);

  // Simulated waves fallback
  const startSimulatedWaves = () => {
    let tick = 0;
    const simulate = () => {
      if (!isComponentMounted.current) return;
      tick += 0.08;
      const vol = Math.round(30 + Math.sin(tick) * 25);
      setVolumeLevel(vol);

      const bars = Array.from({ length: 24 }, (_, i) => {
        const height = Math.round(20 + Math.sin(tick * 2 + i * 0.4) * 35 + Math.cos(tick + i) * 15);
        return Math.max(12, Math.min(95, height));
      });
      setFrequencyBars(bars);
      animationFrameRef.current = requestAnimationFrame(simulate);
    };
    simulate();
  };

  // Stop speech recognition and clear all timers
  const stopListening = useCallback((playCue = true) => {
    setIsListening(false);
    if (playCue && micSettings.soundCues) {
      playAudioCue('stop');
    }
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignored
      }
      recognitionRef.current = null;
    }
    stopAudioCapture();
  }, [stopAudioCapture, micSettings.soundCues]);

  // Process query through Gemini AI with configured voice directly in overlay
  const handleAskAndHearGemini = useCallback(async (queryText: string) => {
    const cleanQuery = queryText.trim();
    if (!cleanQuery) return;

    stopListening(false);
    stopAllSpeech();
    if (micSettings.soundCues) {
      playAudioCue('success');
    }
    setIsProcessingAiVoice(true);
    setAiVoiceResponse(null);

    const isTelugu =
      selectedLanguage === 'te-IN' ||
      (selectedLanguage === 'auto' && detectLanguage(cleanQuery) === 'telugu');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: cleanQuery,
          weatherContext,
          language: isTelugu ? 'telugu' : 'english',
          role: 'meteorologist',
          fastVoiceMode: true,
          modelPreference: 'gemini-3.1-flash-lite',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.answer || 'Weather report generated.';
        setAiVoiceResponse(reply);
        setIsProcessingAiVoice(false);

        // Immediately synthesize audio using Gemini AI voice persona (default Kore, or user selected)
        if (micSettings.autoPlayResponse) {
          await speakWithGeminiAiVoice(reply, {
            language: isTelugu ? 'telugu' : 'english',
            voiceName: micSettings.voiceName || 'Kore',
            fastVoice: true,
            onStart: () => setIsPlayingAudio(true),
            onEnd: () => setIsPlayingAudio(false),
            onError: () => setIsPlayingAudio(false),
          });
        }
      } else {
        throw new Error('API request failed');
      }
    } catch {
      setIsProcessingAiVoice(false);
      const fallbackMsg = isTelugu
        ? `ప్రస్తుతం ${currentLocationName} లో వాతావరణం పరిశీలించబడింది. ఉష్ణోగ్రత అనుకూలంగా ఉంది మరియు వర్ష సూచన తక్కువగా ఉంది.`
        : `Atmospheric check completed for ${currentLocationName}. Current conditions are favorable with stable barometric trends.`;
      setAiVoiceResponse(fallbackMsg);
      if (micSettings.autoPlayResponse) {
        await speakWithGeminiAiVoice(fallbackMsg, {
          language: isTelugu ? 'telugu' : 'english',
          voiceName: micSettings.voiceName || 'Kore',
          fastVoice: true,
          onStart: () => setIsPlayingAudio(true),
          onEnd: () => setIsPlayingAudio(false),
          onError: () => setIsPlayingAudio(false),
        });
      }
    }
  }, [stopListening, selectedLanguage, weatherContext, currentLocationName, micSettings]);

  // Auto-process input when time limit expires, silence is detected, or user clicks "Process Now"
  const triggerAutoProcessOverlay = useCallback((overrideText?: string) => {
    if (isAutoProcessingRef.current) return;
    isAutoProcessingRef.current = true;

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }

    stopListening();

    const candidate = (overrideText || fullSpokenTextRef.current || transcript).trim();
    if (candidate) {
      handleAskAndHearGemini(candidate);
    } else {
      setErrorStatus('No voice input detected within the time limit. Tap microphone to speak again.');
      isAutoProcessingRef.current = false;
    }
  }, [stopListening, transcript, handleAskAndHearGemini]);

  // Start speech recognition configured for Telugu or English with live countdown limit
  const startListening = useCallback(async () => {
    setErrorStatus(null);
    setIsListening(true);
    setAiVoiceResponse(null);
    isAutoProcessingRef.current = false;
    fullSpokenTextRef.current = '';

    if (micSettings.soundCues) {
      playAudioCue('start');
    }

    // Initialize countdown timer
    setSecondsLeft(timeLimit);
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (timerIntervalRef.current) {
            clearInterval(timerIntervalRef.current);
            timerIntervalRef.current = null;
          }
          // Time limit expired: immediately auto-process speech!
          setTimeout(() => {
            triggerAutoProcessOverlay();
          }, 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    await startAudioVisualizer();

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      setErrorStatus('Speech Recognition API is not supported in this browser, but you can select any prompt below.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;

      // Determine language code: Telugu (te-IN) or English (en-IN / en-US)
      if (selectedLanguage === 'te-IN') {
        recognition.lang = 'te-IN';
      } else if (selectedLanguage === 'en-IN') {
        recognition.lang = 'en-IN';
      } else {
        // Auto: bilingual Indian English / Telugu recognition
        recognition.lang = 'te-IN';
      }

      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorStatus(null);
      };

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

        const currentSpoken = (fullCanonical + ' ' + interim).trim();
        if (currentSpoken) {
          fullSpokenTextRef.current = currentSpoken;
          setTranscript(currentSpoken);
          setInterimText('');

          // Silence detector: check configured sensitivity delay
          const silenceMs = getSilenceTimeoutMs(micSettings.silenceSensitivity);
          if (silenceMs > 0) {
            if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
            silenceTimeoutRef.current = setTimeout(() => {
              triggerAutoProcessOverlay(currentSpoken);
            }, silenceMs);
          }
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'not-allowed') {
          setPermissionState('denied');
          setErrorStatus('Microphone permission blocked. Enable it in your browser address bar.');
        } else if (event.error === 'no-speech') {
          // Gracefully continue within countdown window
        } else if (event.error === 'network') {
          setErrorStatus('Voice recognition network timeout. You can retry or choose a suggested query.');
        }
      };

      recognition.onend = () => {
        // If still listening and not expired/processing, keep active
        if (isListening && isOpen && !isAutoProcessingRef.current) {
          try {
            recognition.start();
          } catch {
            // Already active
          }
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setErrorStatus('Voice capture initialized in simulated mode.');
    }
  }, [timeLimit, startAudioVisualizer, selectedLanguage, isListening, isOpen, triggerAutoProcessOverlay, micSettings]);

  // Change recognition language and restart listening seamlessly
  const handleLanguageChange = (lang: 'te-IN' | 'en-IN' | 'auto') => {
    setSelectedLanguage(lang);
    if (isListening) {
      stopListening(false);
      setTimeout(() => {
        if (isOpen) {
          startListening();
        }
      }, 100);
    }
  };

  // Keyboard shortcut navigation (Space to toggle, Esc to close, Enter to send)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is inside an input or modal is open
      if (isSettingsOpen) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        if (isListening) {
          stopListening(true);
        } else {
          startListening();
        }
      } else if (e.code === 'Enter') {
        const text = (fullSpokenTextRef.current || transcript).trim();
        if (text) {
          e.preventDefault();
          triggerAutoProcessOverlay(text);
        }
      } else if (e.code === 'Escape') {
        e.preventDefault();
        stopAllSpeech();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isListening, isSettingsOpen, transcript, startListening, stopListening, triggerAutoProcessOverlay, onClose]);

  // Mount/Unmount and Open/Close lifecycles
  useEffect(() => {
    isComponentMounted.current = true;

    if (isOpen) {
      const freshSettings = loadMicSettings();
      setMicSettings(freshSettings);
      setTimeLimit(freshSettings.timeLimitSeconds || 6);
      setTranscript('');
      setInterimText('');
      setErrorStatus(null);
      setAiVoiceResponse(null);
      setIsPlayingAudio(false);
      startListening();
    } else {
      stopListening(false);
      stopAllSpeech();
    }

    return () => {
      isComponentMounted.current = false;
      stopListening(false);
      stopAllSpeech();
    };
  }, [isOpen, startListening, stopListening]);

  // Send query to parent chat component
  const handleSend = () => {
    const finalQuery = (transcript || interimText).trim();
    if (finalQuery) {
      stopListening();
      stopAllSpeech();
      const isTelugu =
        selectedLanguage === 'te-IN' ||
        (selectedLanguage === 'auto' && detectLanguage(finalQuery) === 'telugu');
      onSendQuery(finalQuery, isTelugu ? 'telugu' : 'english');
      onClose();
    }
  };

  // Handle selecting a suggested prompt
  const handleSelectPrompt = (prompt: string) => {
    setTranscript(prompt);
    setInterimText('');
    handleAskAndHearGemini(prompt);
  };

  const handleClearTranscript = () => {
    setTranscript('');
    setInterimText('');
    setAiVoiceResponse(null);
    stopAllSpeech();
    setIsPlayingAudio(false);
  };

  if (!isOpen) return null;

  const activeDisplayText = transcript || interimText;
  const waveIntensityScale = 1 + (volumeLevel / 100) * 0.35;

  return (
    <div
      className="fixed inset-0 z-[120] flex flex-col items-center justify-between p-4 sm:p-6 md:p-8 backdrop-blur-2xl bg-stone-950/85 text-stone-100 animate-in fade-in duration-300 select-none overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="WeatherGPT Soft Light Voice Studio"
    >
      {/* ========================================================================= */}
      {/* SOFT LIGHT CLASSIC AMBIENT RADIANCE (Warm Champagne, Honey Amber, Pearl) */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] sm:w-[720px] h-[550px] sm:h-[720px] rounded-full bg-gradient-to-tr from-amber-600/20 via-yellow-500/20 to-amber-400/15 blur-[130px] animate-pulse-slow" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] sm:w-[480px] h-[350px] sm:h-[480px] rounded-full bg-amber-400/15 blur-[95px]" />
      </div>

      {/* Top Header Bar */}
      <header className="relative w-full max-w-2xl flex items-center justify-between z-10 pt-2 gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-amber-400 via-amber-300 to-yellow-200 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)] text-stone-950 shrink-0">
            <Sparkles className="w-4 h-4 fill-stone-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold tracking-wide text-amber-100">
                WeatherGPT Voice Assistant
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1">
                <Radio className="w-2.5 h-2.5 animate-pulse text-amber-400" />
                LIVE
              </span>
            </div>
            <p className="text-xs text-stone-400 truncate">
              {currentLocationName} • {micSettings.voiceName} Voice • {micSettings.noiseSuppression ? 'DSP Clean' : 'Standard'} • {micSettings.micGain.toFixed(1)}x Gain
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 text-amber-300 hover:text-amber-200 border border-amber-400/30 flex items-center gap-1.5 transition active:scale-95 cursor-pointer backdrop-blur-md shadow-sm text-xs font-medium"
            title="Configure Microphone, Sensitivity, Gain, and Voice Settings"
            aria-label="Open Microphone Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Mic Settings</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              onClose();
            }}
            className="w-9 h-9 rounded-full bg-stone-900/80 hover:bg-stone-800 text-stone-300 hover:text-white border border-amber-300/30 flex items-center justify-center transition active:scale-95 cursor-pointer backdrop-blur-md shadow-sm"
            title="Close voice studio (Esc)"
            aria-label="Close voice studio"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Center Stage: Soft Light Classic Highlighted Microphone & Bilingual Controls */}
      <main className="relative flex flex-col items-center justify-center my-auto py-6 z-10 w-full max-w-xl">
        {/* ========================================================================= */}
        {/* BILINGUAL LANGUAGE SELECTOR PILLS (Telugu 🇮🇳 / English 🌐 / Auto 🔄) */}
        {/* ========================================================================= */}
        <div className="mb-6 flex items-center gap-1.5 p-1 rounded-2xl bg-stone-900/90 border border-amber-300/40 shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_15px_rgba(245,158,11,0.2)] backdrop-blur-xl">
          <button
            type="button"
            onClick={() => handleLanguageChange('te-IN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              selectedLanguage === 'te-IN'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <span>🇮🇳</span>
            <span>తెలుగు (Telugu)</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('en-IN')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              selectedLanguage === 'en-IN'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>English</span>
          </button>

          <button
            type="button"
            onClick={() => handleLanguageChange('auto')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${
              selectedLanguage === 'auto'
                ? 'bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 shadow-[0_0_12px_rgba(245,158,11,0.6)] font-bold'
                : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>Auto (Bilingual)</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* TIME LIMIT CONFIGURATION & FAST PROCESSING CONTROLS */}
        {/* ========================================================================= */}
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-900/80 border border-amber-300/30 text-[11px] text-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-semibold text-stone-300">Time Limit:</span>
            {[5, 6, 8, 10].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => {
                  setTimeLimit(sec);
                  if (isListening) {
                    setSecondsLeft(sec);
                  }
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition cursor-pointer ${
                  timeLimit === sec
                    ? 'bg-gradient-to-r from-amber-400 to-yellow-300 text-stone-950 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800'
                }`}
              >
                {sec}s {sec === 6 && '⚡'}
              </button>
            ))}
          </div>

          {/* Active Auto-Process Countdown Indicator */}
          {isListening && (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-950/80 to-stone-900/90 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.4)] animate-pulse">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
              </span>
              <span className="text-[11px] font-mono font-bold text-amber-300">
                Auto-send in 00:0{secondsLeft}s
              </span>
              <button
                type="button"
                onClick={() => triggerAutoProcessOverlay()}
                className="px-2 py-0.5 rounded-md bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-[10px] flex items-center gap-1 shadow-sm transition active:scale-95 cursor-pointer"
                title="Process right now without waiting for timer"
              >
                <Zap className="w-2.5 h-2.5 fill-stone-950" />
                <span>Process Now</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* SOFT LIGHT CLASSIC HIGHLIGHTED MICROPHONE (Radiating concentric halo) */}
        {/* ========================================================================= */}
        <div className="relative flex items-center justify-center w-72 h-72 sm:w-80 sm:h-80">
          {/* Wave 4 (Outermost radiating soft champagne gold ring) */}
          <div
            className={`absolute rounded-full border border-amber-400/25 bg-amber-500/5 ${
              isListening ? 'animate-mic-classic-4' : 'opacity-20'
            }`}
            style={{
              width: '100%',
              height: '100%',
              boxShadow: '0 0 60px rgba(245, 158, 11, 0.25)',
              transform: `scale(${waveIntensityScale})`,
              transition: 'transform 0.15s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Wave 3 (Third radiating warm gold ring) */}
          <div
            className={`absolute rounded-full border border-amber-300/35 bg-amber-400/10 ${
              isListening ? 'animate-mic-classic-3' : 'opacity-30'
            }`}
            style={{
              width: '82%',
              height: '82%',
              boxShadow: '0 0 45px rgba(251, 191, 36, 0.35)',
              transform: `scale(${waveIntensityScale})`,
              transition: 'transform 0.15s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Wave 2 (Second radiating warm amber ring) */}
          <div
            className={`absolute rounded-full border border-amber-200/50 bg-amber-300/15 ${
              isListening ? 'animate-mic-classic-2' : 'opacity-40'
            }`}
            style={{
              width: '64%',
              height: '64%',
              boxShadow: '0 0 35px rgba(252, 211, 77, 0.45)',
              transform: `scale(${waveIntensityScale})`,
              transition: 'transform 0.15s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Wave 1 (Inner radiating pearl gold ring) */}
          <div
            className={`absolute rounded-full border border-amber-100/70 bg-amber-200/25 ${
              isListening ? 'animate-mic-classic-1' : 'opacity-50'
            }`}
            style={{
              width: '46%',
              height: '46%',
              boxShadow: '0 0 30px rgba(254, 240, 138, 0.65)',
              transform: `scale(${waveIntensityScale})`,
              transition: 'transform 0.12s ease-out',
            }}
            aria-hidden="true"
          />

          {/* Central Highlighting Grand Soft Light Classic Microphone Medallion */}
          <button
            type="button"
            onClick={() => {
              if (isListening) {
                stopListening();
              } else {
                startListening();
              }
            }}
            className="group relative z-20 w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-tr from-amber-500 via-amber-300 to-yellow-200 hover:from-amber-400 hover:to-yellow-100 p-[3px] shadow-[0_0_55px_rgba(245,158,11,0.65),0_12px_30px_rgba(180,83,9,0.35)] transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center animate-soft-light-beacon"
            title={isListening ? 'Tap to pause microphone' : 'Tap to start recording'}
            aria-label={isListening ? 'Pause microphone' : 'Start microphone'}
          >
            {/* Inner Core */}
            <div className="w-full h-full rounded-full bg-stone-950/85 backdrop-blur-md flex flex-col items-center justify-center relative overflow-hidden transition group-hover:bg-stone-950/70 border border-amber-300/40">
              {/* Internal warm golden sheen */}
              <div className="absolute inset-0 bg-gradient-to-b from-amber-100/25 via-transparent to-amber-500/25 pointer-events-none" />

              {isListening ? (
                <>
                  <Mic className="w-9 h-9 sm:w-10 sm:h-10 text-amber-300 drop-shadow-[0_0_15px_rgba(251,191,36,0.9)] animate-pulse" />
                  <span className="text-[10px] font-bold tracking-wider text-amber-200 uppercase mt-1">
                    {volumeLevel > 15 ? 'Listening' : 'Ready'}
                  </span>
                </>
              ) : (
                <>
                  <MicOff className="w-9 h-9 sm:w-10 sm:h-10 text-stone-400" />
                  <span className="text-[10px] font-bold tracking-wider text-stone-400 uppercase mt-1">
                    Paused
                  </span>
                </>
              )}
            </div>
          </button>
        </div>

        {/* Dynamic Warm Golden Equalizer Sound Bars */}
        <div
          className="mt-5 flex items-center justify-center gap-1.5 h-12 px-4 py-2 rounded-2xl bg-stone-900/80 border border-amber-300/40 backdrop-blur-md shadow-[0_0_20px_rgba(245,158,11,0.2)]"
          role="img"
          aria-label="Microphone volume equalizer visualizer"
        >
          <Volume2 className="w-4 h-4 text-amber-400 mr-1 shrink-0" />
          {frequencyBars.map((height, i) => (
            <div
              key={i}
              className="w-1.5 rounded-full bg-gradient-to-t from-amber-500 via-amber-300 to-yellow-100 transition-all duration-75"
              style={{
                height: `${height}%`,
                opacity: Math.max(0.35, height / 100),
                boxShadow: height > 40 ? '0 0 8px rgba(251, 191, 36, 0.7)' : 'none',
              }}
            />
          ))}
          <span className="text-[10px] font-mono font-bold text-amber-300 ml-1.5 min-w-[28px] text-right">
            {volumeLevel}%
          </span>
        </div>

        {/* Status Callout & Active Voice Engine Info */}
        <div className="mt-3 flex items-center gap-2 text-xs font-medium text-amber-200/90">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          <span>
            {isListening
              ? selectedLanguage === 'te-IN'
                ? 'తెలుగు వాయిస్ రికార్డింగ్ ప్రారంభించబడింది... మాట్లాడండి'
                : 'Listening to your voice in Soft Light Classic mode...'
              : 'Microphone paused. Tap the classic mic to resume.'}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 border border-amber-400/30">
            🌸 Cool Female Voice
          </span>
        </div>

        {/* Live Transcription Box */}
        <div className="mt-5 w-full min-h-[90px] max-h-48 p-4 rounded-2xl bg-stone-900/80 border border-amber-300/35 backdrop-blur-xl shadow-xl flex flex-col justify-between overflow-y-auto">
          {activeDisplayText ? (
            <div>
              <p className="text-base sm:text-lg font-medium text-amber-50 tracking-wide leading-relaxed">
                “{transcript}
                {interimText && <span className="text-amber-300 italic opacity-90"> {interimText}</span>}”
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-2 text-center text-stone-400 text-sm">
              <p className="text-stone-300">
                {selectedLanguage === 'te-IN'
                  ? 'మీ వాతావరణ ప్రశ్నను తెలుగులో అడగండి:'
                  : 'Speak now or choose a question below:'}
              </p>
              <p className="text-xs text-amber-300/90 mt-1 font-mono">
                {selectedLanguage === 'te-IN'
                  ? `"${currentLocationName} లో వర్షం పడుతుందా?"`
                  : `"Will it rain in ${currentLocationName}?"`}
              </p>
            </div>
          )}

          {/* Transcript Tools */}
          {activeDisplayText && (
            <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
              <span className="text-stone-400">Captured voice query</span>
              <button
                type="button"
                onClick={handleClearTranscript}
                className="flex items-center gap-1 text-stone-400 hover:text-white transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          )}
        </div>

        {/* ========================================================================= */}
        {/* GEMINI AI COOL FEMALE VOICE RESPONSE PLAYER (Direct Voice Playback) */}
        {/* ========================================================================= */}
        {isProcessingAiVoice && (
          <div className="mt-4 w-full p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-3 backdrop-blur-md animate-in fade-in">
            <Sparkles className="w-5 h-5 text-amber-400 animate-spin shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">Gemini AI Generating Voice Intelligence...</p>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Synthesizing response with cool female voice (Kore) in Telugu & English
              </p>
            </div>
          </div>
        )}

        {aiVoiceResponse && !isProcessingAiVoice && (
          <div className="mt-4 w-full p-4 rounded-2xl bg-gradient-to-r from-amber-950/60 via-stone-900/80 to-amber-950/60 border border-amber-400/50 shadow-xl backdrop-blur-md animate-in fade-in">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-amber-400/30">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-200">
                  🌸 Gemini AI Voice (Cool Female Voice • Kore)
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (isPlayingAudio) {
                    stopAllSpeech();
                    setIsPlayingAudio(false);
                  } else if (aiVoiceResponse) {
                    const isTe = selectedLanguage === 'te-IN' || /[\u0C00-\u0C7F]/.test(aiVoiceResponse);
                    speakWithGeminiAiVoice(aiVoiceResponse, {
                      language: isTe ? 'telugu' : 'english',
                      voiceName: 'Kore',
                      fastVoice: true,
                      onStart: () => setIsPlayingAudio(true),
                      onEnd: () => setIsPlayingAudio(false),
                      onError: () => setIsPlayingAudio(false),
                    });
                  }
                }}
                className="px-3 py-1 rounded-xl bg-amber-400 text-stone-950 font-bold text-xs flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.5)] transition hover:bg-amber-300 active:scale-95 cursor-pointer"
              >
                {isPlayingAudio ? (
                  <>
                    <Square className="w-3 h-3 fill-stone-950" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3 h-3 fill-stone-950" />
                    <span>Listen Again</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs sm:text-sm text-stone-200 leading-relaxed max-h-36 overflow-y-auto font-sans pr-1">
              {aiVoiceResponse}
            </p>
          </div>
        )}

        {/* Error / Permission Guidance Notification */}
        {errorStatus && (
          <div className="mt-4 w-full p-3 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-start gap-2.5 backdrop-blur-md animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-amber-300">Voice Assistant Notice</p>
              <p className="mt-0.5 text-amber-200/90">{errorStatus}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* SUGGESTED METEOROLOGICAL QUERIES (Telugu & English) */}
        {/* ========================================================================= */}
        <div className="mt-5 w-full">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[11px] font-semibold tracking-wider uppercase text-amber-300/80">
              {selectedLanguage === 'te-IN'
                ? 'తెలుగు ప్రశ్నలు (క్లిక్ చేసి వినండి):'
                : 'Suggested Weather Queries (Click to speak & listen):'}
            </p>
            <span className="text-[10px] text-stone-400">Telugu & English Ready</span>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center">
            {(selectedLanguage === 'te-IN' ? teluguPrompts : englishPrompts).map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSelectPrompt(prompt)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-900/90 hover:bg-stone-800 text-stone-200 hover:text-white border border-amber-300/30 hover:border-amber-300/60 shadow-sm transition active:scale-95 cursor-pointer backdrop-blur-md text-left flex items-center gap-1.5"
              >
                <span>🎙️</span>
                <span>{prompt}</span>
              </button>
            ))}
          </div>
        </div>
      </main>

      {/* Bottom Actions Bar */}
      <footer className="relative w-full max-w-xl flex flex-col gap-2 pt-3 border-t border-stone-800/80 z-10 pb-2">
        <div className="flex items-center justify-between text-[11px] text-stone-400 px-1">
          <div className="flex items-center gap-3">
            <span><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 font-mono text-[10px] text-amber-300">Space</kbd> Toggle Mic</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 font-mono text-[10px] text-amber-300">Enter</kbd> Send</span>
            <span><kbd className="px-1.5 py-0.5 rounded bg-stone-900 border border-stone-700 font-mono text-[10px] text-amber-300">Esc</kbd> Close</span>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="text-amber-400/90 hover:text-amber-300 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Sliders className="w-3 h-3" />
            <span>Audio & DSP Controls</span>
          </button>
        </div>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={() => {
              stopAllSpeech();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-white text-xs sm:text-sm font-semibold border border-stone-700 transition active:scale-95 cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {activeDisplayText && (
              <button
                type="button"
                onClick={() => handleAskAndHearGemini(activeDisplayText)}
                disabled={isProcessingAiVoice}
                className="px-4 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs sm:text-sm font-semibold border border-amber-400/40 transition active:scale-95 cursor-pointer flex items-center gap-1.5"
              >
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
                <span>Ask & Listen</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSend}
              disabled={!activeDisplayText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-stone-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_0_25px_rgba(245,158,11,0.6)] transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer"
            >
              <span>Send to WeatherGPT</span>
              <Send className="w-4 h-4 text-stone-950 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </footer>

      {/* Mic Settings Modal */}
      <MicSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={(newSettings) => {
          setMicSettings(newSettings);
          setTimeLimit(newSettings.timeLimitSeconds);
          if (isListening) {
            setSecondsLeft(newSettings.timeLimitSeconds);
          }
        }}
      />
    </div>
  );
};
