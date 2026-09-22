import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  Sliders,
  Volume2,
  X,
  RotateCcw,
  Check,
  Sparkles,
  RefreshCw,
  Bell,
  Play,
  Square,
  ShieldCheck,
  Cpu,
  Clock,
  Radio,
} from 'lucide-react';
import {
  MicSettings,
  loadMicSettings,
  saveMicSettings,
  DEFAULT_MIC_SETTINGS,
  getAudioInputDevices,
  playAudioCue,
  SilenceSensitivity,
  TtsVoiceName,
} from '../utils/micSettings';
import { speakWithGeminiAiVoice, stopAllSpeech } from '../utils/geminiVoiceService';

export interface MicSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved?: (newSettings: MicSettings) => void;
}

export const MicSettingsModal: React.FC<MicSettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsSaved,
}) => {
  const [settings, setSettings] = useState<MicSettings>(loadMicSettings);
  const [devices, setDevices] = useState<Array<{ deviceId: string; label: string }>>([]);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [testVolume, setTestVolume] = useState(0);
  const [saveToast, setSaveToast] = useState(false);
  const [isPlayingTestVoice, setIsPlayingTestVoice] = useState(false);

  // Audio testing refs
  const testStreamRef = useRef<MediaStream | null>(null);
  const testAudioCtxRef = useRef<AudioContext | null>(null);
  const testAnimFrameRef = useRef<number | null>(null);

  // Load available devices
  const refreshDevices = async () => {
    setIsRefreshingDevices(true);
    try {
      const list = await getAudioInputDevices();
      setDevices(list);
    } finally {
      setIsRefreshingDevices(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setSettings(loadMicSettings());
      refreshDevices();
    } else {
      stopMicTest();
      stopAllSpeech();
      setIsPlayingTestVoice(false);
    }
  }, [isOpen]);

  // Clean up mic test on unmount
  useEffect(() => {
    return () => {
      stopMicTest();
    };
  }, []);

  // Stop testing audio stream
  const stopMicTest = () => {
    if (testAnimFrameRef.current) {
      cancelAnimationFrame(testAnimFrameRef.current);
      testAnimFrameRef.current = null;
    }
    if (testStreamRef.current) {
      testStreamRef.current.getTracks().forEach((track) => track.stop());
      testStreamRef.current = null;
    }
    if (testAudioCtxRef.current && testAudioCtxRef.current.state !== 'closed') {
      try {
        testAudioCtxRef.current.close();
      } catch {
        // Ignored
      }
      testAudioCtxRef.current = null;
    }
    setIsTestingMic(false);
    setTestVolume(0);
  };

  // Start live test with gain node to preview volume and calibration
  const startMicTest = async () => {
    stopMicTest();
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx || !navigator.mediaDevices?.getUserMedia) return;

      const constraints: MediaStreamConstraints = {
        audio: {
          echoCancellation: settings.echoCancellation,
          noiseSuppression: settings.noiseSuppression,
          autoGainControl: settings.autoGainControl,
          ...(settings.deviceId && settings.deviceId !== 'default'
            ? { deviceId: { exact: settings.deviceId } }
            : {}),
        },
        video: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      testStreamRef.current = stream;

      const audioCtx = new AudioCtx();
      testAudioCtxRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const gainNode = audioCtx.createGain();
      gainNode.gain.value = settings.micGain;

      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      source.connect(gainNode);
      gainNode.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);
      setIsTestingMic(true);

      const render = () => {
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / (dataArray.length || 1);
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setTestVolume(normalized);
        testAnimFrameRef.current = requestAnimationFrame(render);
      };

      render();
    } catch (err) {
      console.warn('Mic test error:', err);
      setIsTestingMic(false);
    }
  };

  const handleToggleTest = () => {
    if (isTestingMic) {
      stopMicTest();
    } else {
      startMicTest();
    }
  };

  // Save changes
  const handleSave = () => {
    const saved = saveMicSettings(settings);
    if (settings.soundCues) {
      playAudioCue('success');
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
    onSettingsSaved?.(saved);
  };

  // Reset to factory defaults
  const handleReset = () => {
    setSettings(DEFAULT_MIC_SETTINGS);
    saveMicSettings(DEFAULT_MIC_SETTINGS);
    if (DEFAULT_MIC_SETTINGS.soundCues) {
      playAudioCue('start');
    }
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2000);
    onSettingsSaved?.(DEFAULT_MIC_SETTINGS);
  };

  // Sample TTS playback to hear chosen voice persona
  const handleTestVoicePersona = async (voice: TtsVoiceName) => {
    stopAllSpeech();
    if (isPlayingTestVoice) {
      setIsPlayingTestVoice(false);
      return;
    }

    setIsPlayingTestVoice(true);
    const sampleText =
      voice === 'Kore'
        ? "Hello! I am Kore, your cool and composed Gemini weather voice."
        : `Hello! I am ${voice}, ready with your latest atmospheric forecast.`;

    await speakWithGeminiAiVoice(sampleText, {
      voiceName: voice,
      language: 'english',
      fastVoice: true,
      onStart: () => setIsPlayingTestVoice(true),
      onEnd: () => setIsPlayingTestVoice(false),
      onError: () => setIsPlayingTestVoice(false),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-5 bg-stone-950/80 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mic-settings-title"
    >
      <div className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-stone-900 border border-amber-300/40 text-stone-100 shadow-[0_20px_60px_rgba(0,0,0,0.7),0_0_30px_rgba(245,158,11,0.2)] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-800 bg-gradient-to-r from-stone-900 via-stone-900 to-amber-950/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.5)] text-stone-950">
              <Sliders className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h2 id="mic-settings-title" className="text-base font-bold text-amber-50">
                Microphone & Voice Settings
              </h2>
              <p className="text-xs text-stone-400">
                Calibrate hardware input, DSP filters, voice activity & speech synthesis
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition active:scale-95 cursor-pointer"
            aria-label="Close settings"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 text-sm">
          {/* 1. Input Device & Live VU Calibration Meter */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-stone-200">Microphone Input Device</span>
              </div>
              <button
                type="button"
                onClick={refreshDevices}
                disabled={isRefreshingDevices}
                className="flex items-center gap-1 text-xs text-amber-300 hover:text-amber-200 transition cursor-pointer"
                title="Refresh connected microphones"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingDevices ? 'animate-spin' : ''}`} />
                <span>Rescan</span>
              </button>
            </div>

            <select
              value={settings.deviceId}
              onChange={(e) => setSettings({ ...settings, deviceId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl bg-stone-900 border border-stone-700 text-stone-200 text-xs focus:outline-none focus:border-amber-400 transition"
            >
              <option value="default">Default System Microphone</option>
              {devices
                .filter((d) => d.deviceId !== 'default')
                .map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label}
                  </option>
                ))}
            </select>

            {/* Live Audio Test & VU Peak Meter */}
            <div className="pt-2 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Live Input Level & Sensitivity Test</span>
                <button
                  type="button"
                  onClick={handleToggleTest}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    isTestingMic
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40'
                  }`}
                >
                  <Radio className={`w-3 h-3 ${isTestingMic ? 'animate-pulse text-red-400' : ''}`} />
                  <span>{isTestingMic ? 'Stop Test' : 'Test Microphone'}</span>
                </button>
              </div>

              {/* Peak Bar Indicator */}
              <div className="w-full h-3 rounded-full bg-stone-900 border border-stone-800 overflow-hidden flex p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-75"
                  style={{
                    width: `${testVolume}%`,
                    backgroundColor:
                      testVolume > 85 ? '#ef4444' : testVolume > 60 ? '#f59e0b' : '#10b981',
                    boxShadow: testVolume > 20 ? '0 0 10px rgba(245,158,11,0.5)' : 'none',
                  }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-stone-500 font-mono">
                <span>0 dB (Silence)</span>
                <span>Optimal (25-70%)</span>
                <span>Peak (Clip)</span>
              </div>
            </div>

            {/* Mic Gain Boost Slider */}
            <div className="pt-2 border-t border-stone-800/80">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-stone-300">Software Gain Boost:</span>
                <span className="font-mono text-amber-300 font-bold">
                  {Math.round(settings.micGain * 100)}% ({settings.micGain.toFixed(1)}x)
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.micGain}
                onChange={(e) => setSettings({ ...settings, micGain: parseFloat(e.target.value) })}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <p className="text-[11px] text-stone-500 mt-1">
                Boost low-volume headsets or dampen sensitive condenser microphones.
              </p>
            </div>
          </div>

          {/* 2. Acoustic Processing (DSP Filters) */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-stone-200">Acoustic Signal Processing (DSP)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Echo Cancellation */}
              <label className="flex flex-col justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 cursor-pointer transition select-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">Echo Cancel</span>
                  <input
                    type="checkbox"
                    checked={settings.echoCancellation}
                    onChange={(e) =>
                      setSettings({ ...settings, echoCancellation: e.target.checked })
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-stone-400">Prevents speaker feedback loop.</p>
              </label>

              {/* Noise Suppression */}
              <label className="flex flex-col justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 cursor-pointer transition select-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">Noise Cancel</span>
                  <input
                    type="checkbox"
                    checked={settings.noiseSuppression}
                    onChange={(e) =>
                      setSettings({ ...settings, noiseSuppression: e.target.checked })
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-stone-400">Filters room fan & wind noise.</p>
              </label>

              {/* Auto Gain Control */}
              <label className="flex flex-col justify-between p-3 rounded-xl bg-stone-900/80 border border-stone-800 hover:border-stone-700 cursor-pointer transition select-none">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-stone-200">Auto Gain</span>
                  <input
                    type="checkbox"
                    checked={settings.autoGainControl}
                    onChange={(e) =>
                      setSettings({ ...settings, autoGainControl: e.target.checked })
                    }
                    className="accent-amber-400 w-4 h-4 cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-stone-400">Equalizes soft and loud voices.</p>
              </label>
            </div>
          </div>

          {/* 3. Voice Activity Detection (VAD) & Silence Timing */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-stone-200">Voice Activity & Silence Threshold</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                {
                  id: 'sensitive',
                  label: 'Fast',
                  delay: '0.8s',
                  desc: 'Snappy queries',
                },
                {
                  id: 'standard',
                  label: 'Standard',
                  delay: '1.4s',
                  desc: 'Natural cadence',
                },
                {
                  id: 'relaxed',
                  label: 'Relaxed',
                  delay: '2.3s',
                  desc: 'Thoughtful speech',
                },
                {
                  id: 'manual',
                  label: 'Manual',
                  delay: 'Tap only',
                  desc: 'Push-to-send',
                },
              ].map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() =>
                    setSettings({
                      ...settings,
                      silenceSensitivity: item.id as SilenceSensitivity,
                    })
                  }
                  className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                    settings.silenceSensitivity === item.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-stone-200">{item.label}</span>
                    <span className="text-[10px] font-mono text-amber-400">{item.delay}</span>
                  </div>
                  <span className="text-[10px] text-stone-400 mt-1">{item.desc}</span>
                </button>
              ))}
            </div>

            {/* Max Recording Window (Seconds Limit) */}
            <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between">
              <span className="text-xs text-stone-300">Max Auto-Submit Window:</span>
              <div className="flex items-center gap-1.5">
                {[5, 6, 8, 10, 15].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setSettings({ ...settings, timeLimitSeconds: sec })}
                    className={`px-2 py-1 rounded-md text-xs font-bold transition cursor-pointer ${
                      settings.timeLimitSeconds === sec
                        ? 'bg-amber-400 text-stone-950 font-bold shadow-sm'
                        : 'bg-stone-900 text-stone-400 hover:bg-stone-800'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 4. Gemini TTS Speech Output & Audio Persona */}
          <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800/90 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <span className="font-semibold text-stone-200">Gemini AI Voice Persona</span>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/30">
                🌸 Cool Female Calibrated
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { name: 'Kore', gender: 'Cool Female', tone: 'Calm & Precise' },
                { name: 'Aoede', gender: 'Warm Female', tone: 'Breezy & Natural' },
                { name: 'Fenrir', gender: 'Deep Male', tone: 'Authoritative' },
                { name: 'Puck', gender: 'Expressive', tone: 'Playful & Fast' },
              ].map((v) => (
                <div
                  key={v.name}
                  onClick={() => setSettings({ ...settings, voiceName: v.name as TtsVoiceName })}
                  className={`p-2.5 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                    settings.voiceName === v.name
                      ? 'bg-amber-500/20 border-amber-400 text-amber-200 shadow-sm'
                      : 'bg-stone-900 border-stone-800 hover:border-stone-700 text-stone-400'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-200">{v.name}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleTestVoicePersona(v.name as TtsVoiceName);
                        }}
                        className="p-1 rounded-md bg-stone-800 hover:bg-stone-700 text-amber-300 transition"
                        title="Preview voice"
                      >
                        <Play className="w-2.5 h-2.5 fill-current" />
                      </button>
                    </div>
                    <span className="text-[10px] text-amber-300/80 block mt-0.5">{v.gender}</span>
                  </div>
                  <span className="text-[9px] text-stone-500 mt-1">{v.tone}</span>
                </div>
              ))}
            </div>

            {/* General Audio Toggles */}
            <div className="pt-2 border-t border-stone-800/80 space-y-2">
              <label className="flex items-center justify-between text-xs text-stone-300 cursor-pointer">
                <span>Play acoustic chime sound cues (mic start / stop / success)</span>
                <input
                  type="checkbox"
                  checked={settings.soundCues}
                  onChange={(e) => setSettings({ ...settings, soundCues: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between text-xs text-stone-300 cursor-pointer">
                <span>Auto-play Gemini spoken voice response aloud</span>
                <input
                  type="checkbox"
                  checked={settings.autoPlayResponse}
                  onChange={(e) => setSettings({ ...settings, autoPlayResponse: e.target.checked })}
                  className="accent-amber-400 w-4 h-4 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-stone-800 bg-stone-950/90">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-200 text-xs transition cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <div className="flex items-center gap-2">
            {saveToast && (
              <span className="flex items-center gap-1 text-xs text-emerald-400 font-semibold animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Settings Saved!</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                handleSave();
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-300 hover:from-amber-400 hover:to-yellow-200 text-stone-950 font-bold text-xs shadow-[0_0_20px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer"
            >
              Save & Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
