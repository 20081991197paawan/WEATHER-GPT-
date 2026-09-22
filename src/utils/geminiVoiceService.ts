/**
 * Gemini Voice Service
 * Integrates Gemini AI voice synthesis (gemini-3.1-flash-tts-preview with cool female voice 'Kore')
 * alongside native browser Web Speech fallback with cool female voice calibration.
 * Full bilingual processing for Telugu (తెలుగు) and English.
 */

// Global active audio reference to allow instant cancellation/stopping
let activeAudioElement: HTMLAudioElement | null = null;
let activeAudioUrl: string | null = null;

/**
 * Encodes raw 16-bit PCM audio bytes into a standard 44-byte RIFF/WAV container.
 * Essential for playing Gemini TTS 24kHz PCM streams reliably across all web browsers.
 */
export function pcmToWav(
  pcmData: Uint8Array,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): ArrayBuffer {
  const dataSize = pcmData.byteLength;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // 'RIFF' chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + dataSize, true); // chunkSize = 36 + dataSize
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // 'fmt ' sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size = 16 for PCM
  view.setUint16(20, 1, true); // AudioFormat = 1 (linear PCM)
  view.setUint16(22, numChannels, true); // NumChannels
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true); // BitsPerSample

  // 'data' sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, dataSize, true); // Subchunk2Size

  // Copy raw audio samples
  new Uint8Array(buffer, 44).set(pcmData);

  return buffer;
}

/**
 * Stops any currently playing audio track or speech synthesis immediately.
 */
export function stopAllSpeech(): void {
  if (activeAudioElement) {
    try {
      activeAudioElement.pause();
      activeAudioElement.currentTime = 0;
    } catch {
      // Ignored
    }
    activeAudioElement = null;
  }
  if (activeAudioUrl) {
    try {
      URL.revokeObjectURL(activeAudioUrl);
    } catch {
      // Ignored
    }
    activeAudioUrl = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignored
    }
  }
}

// Common Romanized Telugu keywords and expressions for bilingual detection
const TELUGU_PHONETIC_PATTERNS = [
  /\bvarsham\b/i,
  /\bvaana\b/i,
  /\bgodugu\b/i,
  /\bvatavaran(am|amlo)?\b/i,
  /\bushnograth(a|alu)?\b/i,
  /\bpaduthund(a|i)?\b/i,
  /\bvasthund(a|i)?\b/i,
  /\brepu\b/i,
  /\brepati\b/i,
  /\beroju\b/i,
  /\bippudu\b/i,
  /\bchepp(u|andi)?\b/i,
  /\bela\s+undi\b/i,
  /\bkaval(a|i)?\b/i,
  /\bunnay(a|i)?\b/i,
  /\bund(a|i)?\b/i,
  /\btelugu(lo)?\b/i,
  /\bgali\b/i,
  /\bvegam\b/i,
  /\bchalig(a)?\b/i,
  /\bend(a|alu)?\b/i,
  /\bved(i|iga)?\b/i,
  /\baat(a|alu)?\b/i,
  /\bbayat(a|aki|aku)?\b/i,
  /\bnamaskaram\b/i,
  /\bdhanyavadalu\b/i,
  /\bguntur(lo)?\b/i,
  /\bhyderabad(lo)?\b/i,
  /\bvijayawada(lo)?\b/i,
  /\bandhra\b/i,
  /\btelangana\b/i,
];

/**
 * Detects whether the input text is primarily Telugu (Telugu script or Romanized Telugu) or English.
 */
export function detectLanguage(text: string): 'telugu' | 'english' {
  if (!text) return 'english';

  // 1. Check Telugu Unicode block: U+0C00 to U+0C7F
  const teluguCharCount = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
  if (teluguCharCount > 0) return 'telugu';

  // 2. Check Romanized / Phonetic Telugu keywords
  const textLower = text.toLowerCase();
  for (const pattern of TELUGU_PHONETIC_PATTERNS) {
    if (pattern.test(textLower)) {
      return 'telugu';
    }
  }

  return 'english';
}

/**
 * Phonetically normalizes weather numbers, symbols, and units specifically for Telugu speech synthesis.
 * Converts raw units like °C, km/h, and % into natural spoken Telugu phrases.
 */
export function prepareTeluguSpokenText(rawText: string): string {
  if (!rawText) return '';

  let processed = rawText
    // Temperatures
    .replace(/(\d+)\s*°\s*C\b/gi, '$1 డిగ్రీల సెల్సియస్')
    .replace(/(\d+)\s*°\s*F\b/gi, '$1 డిగ్రీల ఫారెన్‌హీట్')
    .replace(/°\s*C\b/gi, ' డిగ్రీల సెల్సియస్')
    .replace(/°\s*F\b/gi, ' డిగ్రీల ఫారెన్‌హీట్')
    // Percentages (Rain prob, humidity)
    .replace(/(\d+)\s*%/g, '$1 శాతం')
    .replace(/%/g, ' శాతం')
    // Wind velocity & speed
    .replace(/(\d+)\s*km\/h\b/gi, '$1 కిలోమీటర్ల వేగం')
    .replace(/km\/h\b/gi, ' కిలోమీటర్ల వేగం')
    // Rainfall accumulation
    .replace(/(\d+(\.\d+)?)\s*mm\b/gi, '$1 మిల్లీమీటర్లు')
    // AQI & UV
    .replace(/\bAQI\b/gi, 'గాలి నాణ్యత సూచిక')
    .replace(/\bUV\s*(Index)?\b/gi, 'ఎండ తీవ్రత సూచిక')
    .replace(/\bPM2\.5\b/gi, 'పీఎం 2.5 కణాలు')
    .replace(/\bPM10\b/gi, 'పీఎం 10 కణాలు')
    // Time windows
    .replace(/(\d+)\s*AM\b/gi, 'ఉదయం $1 గంటలు')
    .replace(/(\d+)\s*PM\b/gi, 'సాయంత్రం $1 గంటలు');

  return sanitizeTextForSpeech(processed);
}

/**
 * Cleans text for pleasant, natural spoken flow (removes markdown syntax, emojis, URL brackets).
 */
export function sanitizeTextForSpeech(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/#{1,6}\s+/g, '')
    .replace(/`{1,3}[^`]*`{1,3}/g, '')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/•/g, ', ')
    .replace(/[\u{1F300}-\u{1F9FF}]/gu, '')
    .replace(/[\u{2600}-\u{26FF}]/gu, '')
    .replace(/[\u{2700}-\u{27BF}]/gu, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Plays base64 audio data returned by Gemini API.
 */
export function playBase64Audio(
  base64Data: string,
  mimeType = 'audio/wav',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  stopAllSpeech();

  try {
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check if the stream starts with "RIFF" (WAV container)
    let audioBlob: Blob;
    const isRiff =
      bytes.length > 4 &&
      bytes[0] === 0x52 && // 'R'
      bytes[1] === 0x49 && // 'I'
      bytes[2] === 0x46 && // 'F'
      bytes[3] === 0x46; // 'F'

    if (isRiff || mimeType.includes('mp3') || mimeType.includes('ogg')) {
      audioBlob = new Blob([bytes], { type: mimeType });
    } else {
      // Gemini 24kHz raw PCM conversion to standard WAV
      const wavBuffer = pcmToWav(bytes, 24000, 1, 16);
      audioBlob = new Blob([wavBuffer], { type: 'audio/wav' });
    }

    const audioUrl = URL.createObjectURL(audioBlob);
    activeAudioUrl = audioUrl;

    const audio = new Audio(audioUrl);
    activeAudioElement = audio;

    audio.onplay = () => {
      onStart?.();
    };

    audio.onended = () => {
      stopAllSpeech();
      onEnd?.();
    };

    audio.onerror = (e) => {
      console.warn('Audio playback error event:', e);
      stopAllSpeech();
      onError?.(e);
    };

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn('Autoplay prevented or audio error:', err);
        stopAllSpeech();
        onError?.(err);
      });
    }

    return () => {
      stopAllSpeech();
    };
  } catch (err) {
    console.error('Failed to parse or play base64 audio:', err);
    onError?.(err);
    return () => {};
  }
}

/**
 * Fallback synthesizer using browser Web Speech API calibrated with a cool female voice.
 * Supports Telugu (te-IN) and English (en-US / en-IN).
 */
export function speakWithBrowserSynthesis(
  text: string,
  language: 'te-IN' | 'en-US' | 'en-IN' | string = 'en-US',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (err: any) => void
): () => void {
  stopAllSpeech();

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onError?.(new Error('Speech synthesis not available'));
    return () => {};
  }

  const isTelugu = language.startsWith('te') || detectLanguage(text) === 'telugu';
  const clean = isTelugu ? prepareTeluguSpokenText(text) : sanitizeTextForSpeech(text);
  if (!clean) {
    onEnd?.();
    return () => {};
  }

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.lang = isTelugu ? 'te-IN' : language || 'en-US';

  // Cool, calm female voice tuning: gentle pitch, smooth conversational cadence
  // For Telugu, a slightly lower rate (0.88) ensures each akshara syllable is enunciated clearly.
  utterance.pitch = isTelugu ? 1.02 : 1.06;
  utterance.rate = isTelugu ? 0.88 : 0.94;
  utterance.volume = 1.0;

  const setBestFemaleVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices && voices.length > 0) {
      if (isTelugu) {
        // Find dedicated Telugu voice first (Google తెలుగు, Microsoft Shruti, Microsoft Mohan, etc.)
        const teVoice = voices.find(
          (v) =>
            v.lang.toLowerCase() === 'te-in' ||
            v.lang.toLowerCase() === 'te_in' ||
            v.lang.toLowerCase().startsWith('te') ||
            v.name.toLowerCase().includes('telugu')
        );
        if (teVoice) {
          utterance.voice = teVoice;
        } else {
          // Fallback to high-quality Indian regional female voice
          const inVoice = voices.find(
            (v) =>
              (v.lang.includes('IN') || v.lang.includes('in') || v.lang.includes('hi')) &&
              (v.name.toLowerCase().includes('female') ||
                v.name.toLowerCase().includes('shruti') ||
                v.name.toLowerCase().includes('veena') ||
                v.name.toLowerCase().includes('lekha') ||
                v.name.toLowerCase().includes('heera') ||
                v.name.toLowerCase().includes('geeta'))
          );
          if (inVoice) utterance.voice = inVoice;
        }
      } else {
        // English cool female voice
        const coolFemaleVoice = voices.find(
          (v) =>
            (v.lang.startsWith('en') || v.lang.includes('US') || v.lang.includes('GB')) &&
            (v.name.toLowerCase().includes('female') ||
              v.name.toLowerCase().includes('samantha') ||
              v.name.toLowerCase().includes('victoria') ||
              v.name.toLowerCase().includes('karen') ||
              v.name.toLowerCase().includes('zira') ||
              v.name.toLowerCase().includes('natural') ||
              v.name.toLowerCase().includes('google us english'))
        );
        if (coolFemaleVoice) {
          utterance.voice = coolFemaleVoice;
        }
      }
    }
  };

  setBestFemaleVoice();
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = setBestFemaleVoice;
  }

  utterance.onstart = () => {
    onStart?.();
  };

  utterance.onend = () => {
    onEnd?.();
  };

  utterance.onerror = (e) => {
    console.warn('Speech synthesis error event:', e);
    onError?.(e);
  };

  try {
    window.speechSynthesis.speak(utterance);
  } catch (err) {
    console.warn('Error starting speech synthesis:', err);
    onError?.(err);
  }

  return () => {
    stopAllSpeech();
  };
}

/**
 * Master speech function:
 * First queries the server Gemini TTS endpoint (`gemini-3.1-flash-tts-preview` with 'Kore' cool female voice).
 * If the Gemini server voice succeeds, plays high-definition studio audio.
 * If server TTS is buffering or unavailable, seamlessly falls back to browser synthesis.
 * Guarantees zero runtime errors.
 */
export async function speakWithGeminiAiVoice(
  text: string,
  options: {
    language?: 'telugu' | 'english' | 'auto';
    voiceName?: string;
    fastVoice?: boolean;
    onStart?: () => void;
    onEnd?: () => void;
    onError?: (err: any) => void;
  } = {}
): Promise<() => void> {
  stopAllSpeech();

  const {
    language = 'auto',
    voiceName = 'Kore',
    fastVoice = true,
    onStart,
    onEnd,
    onError,
  } = options;

  const isTelugu =
    language === 'telugu' ||
    (language === 'auto' && detectLanguage(text) === 'telugu');

  const cleaned = isTelugu ? prepareTeluguSpokenText(text) : sanitizeTextForSpeech(text);
  if (!cleaned) {
    onEnd?.();
    return () => {};
  }

  const langCode = isTelugu ? 'te-IN' : 'en-US';

  // For ultra-fast voice output, if fastVoice is requested and client has browser synthesis ready,
  // we attempt server TTS with a snappy 950ms race timeout, then seamlessly use browser voice
  // to ensure audio starts speaking immediately without perceptible lag.
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), fastVoice ? 950 : 2500);

    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        text: cleaned,
        language: isTelugu ? 'telugu' : 'english',
        voiceName: voiceName || 'Kore',
      }),
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.success && data.audioData) {
        return playBase64Audio(
          data.audioData,
          data.mimeType || 'audio/wav',
          onStart,
          onEnd,
          onError
        );
      }
    }
  } catch (fetchErr) {
    // Timeout or network notice - instantly fall through to high-speed browser speech
  }

  // Instant browser cool female voice fallback (< 50ms latency)
  return speakWithBrowserSynthesis(cleaned, langCode, onStart, onEnd, onError);
}
