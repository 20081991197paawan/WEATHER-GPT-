/**
 * Microphone & Audio Studio Settings Utility
 * Provides device management, acoustic DSP constraints, Web Audio gain calibration,
 * silence detection profiling, and synthesized audio cues.
 */

export type SilenceSensitivity = 'sensitive' | 'standard' | 'relaxed' | 'manual';
export type TtsVoiceName = 'Kore' | 'Aoede' | 'Fenrir' | 'Puck' | 'Charon';

export interface MicSettings {
  deviceId: string; // 'default' or specific device ID
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  micGain: number; // 0.5 to 2.0 (default 1.0)
  silenceSensitivity: SilenceSensitivity;
  timeLimitSeconds: number; // 5, 6, 8, 10, or 15
  soundCues: boolean; // pleasant chime on start/stop
  autoPlayResponse: boolean; // read aloud automatically
  voiceName: TtsVoiceName;
  speechRate: number; // 0.85, 1.0, 1.15
  pushToTalkMode: boolean; // manual tap to start / tap to send
}

export const DEFAULT_MIC_SETTINGS: MicSettings = {
  deviceId: 'default',
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  micGain: 1.0,
  silenceSensitivity: 'standard',
  timeLimitSeconds: 6,
  soundCues: true,
  autoPlayResponse: true,
  voiceName: 'Kore',
  speechRate: 1.0,
  pushToTalkMode: false,
};

const STORAGE_KEY = 'weathergpt_mic_settings_v2';

/**
 * Loads persisted microphone settings from localStorage with safe fallback to defaults.
 */
export function loadMicSettings(): MicSettings {
  if (typeof window === 'undefined') return DEFAULT_MIC_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_MIC_SETTINGS;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_MIC_SETTINGS,
      ...parsed,
    };
  } catch {
    return DEFAULT_MIC_SETTINGS;
  }
}

/**
 * Saves updated microphone settings to localStorage.
 */
export function saveMicSettings(updated: Partial<MicSettings>): MicSettings {
  const current = loadMicSettings();
  const next: MicSettings = { ...current, ...updated };
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Ignored
    }
  }
  return next;
}

/**
 * Maps silence sensitivity to millisecond delay before auto-processing speech.
 */
export function getSilenceTimeoutMs(sensitivity: SilenceSensitivity): number {
  switch (sensitivity) {
    case 'sensitive':
      return 850; // Rapid speech pauses trigger quick auto-send
    case 'standard':
      return 1400; // Balanced conversational pause
    case 'relaxed':
      return 2300; // Extra breathing room for slow speech or language switching
    case 'manual':
      return 0; // Disabled: only user explicit button send
    default:
      return 1400;
  }
}

/**
 * Enumerates available microphone hardware devices on user's system.
 */
export async function getAudioInputDevices(): Promise<Array<{ deviceId: string; label: string }>> {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
    return [{ deviceId: 'default', label: 'Default System Microphone' }];
  }

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioInputs = devices.filter((d) => d.kind === 'audioinput');

    if (audioInputs.length === 0) {
      return [{ deviceId: 'default', label: 'Default Microphone' }];
    }

    return audioInputs.map((d, idx) => ({
      deviceId: d.deviceId || (idx === 0 ? 'default' : `device-${idx}`),
      label: d.label || `Microphone ${idx + 1}${idx === 0 ? ' (Default)' : ''}`,
    }));
  } catch (err) {
    console.warn('Could not enumerate audio devices:', err);
    return [{ deviceId: 'default', label: 'Default Microphone' }];
  }
}

/**
 * Builds MediaStreamConstraints tailored to the user's active mic settings.
 */
export function buildAudioConstraints(settings: MicSettings): MediaStreamConstraints {
  const audioConstraints: MediaTrackConstraints = {
    echoCancellation: settings.echoCancellation,
    noiseSuppression: settings.noiseSuppression,
    autoGainControl: settings.autoGainControl,
  };

  if (settings.deviceId && settings.deviceId !== 'default') {
    audioConstraints.deviceId = { exact: settings.deviceId };
  }

  return {
    audio: audioConstraints,
    video: false,
  };
}

/**
 * Synthesizes subtle, pleasant acoustic sound cues using the Web Audio API.
 * 100% self-contained, no external mp3 files required.
 */
export function playAudioCue(type: 'start' | 'stop' | 'success' | 'alert'): void {
  if (typeof window === 'undefined') return;

  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === 'start') {
      // Warm rising chime (C5 to E5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.12); // E5

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'stop') {
      // Soft gentle descending release (E5 to C5)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(440.0, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.1, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === 'success') {
      // Crisp confirmation bell (G5 -> C6)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(783.99, now);
      osc.frequency.setValueAtTime(1046.5, now + 0.09);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.14, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'alert') {
      // Gentle warning double-tap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(329.63, now);
      osc.frequency.setValueAtTime(293.66, now + 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.26);
    }

    // Auto-clean audio context after playback completes
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') ctx.close();
      } catch {
        // Ignored
      }
    }, 400);
  } catch {
    // Audio context may be restricted by autoplay policy
  }
}
