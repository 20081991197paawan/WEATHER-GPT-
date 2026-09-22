import React, { useEffect, useRef, useState, useId } from 'react';
import {
  Volume2,
  Clock,
  Zap,
  Square,
  Sliders,
  Sparkles,
} from 'lucide-react';

export type SpectrumMode = 'bars' | 'wave' | 'mirror';

interface AudioSpectrumVisualizerProps {
  analyserNode: AnalyserNode | null;
  isListening: boolean;
  volumeLevel: number; // 0-100
  volumeBars?: number[]; // Fallback or external volume bars
  micCountdown: number;
  transcript: string;
  onSendNow: () => void;
  onStop: () => void;
  onOpenSettings?: () => void;
  variant?: 'floating' | 'embedded' | 'compact';
  className?: string;
}

export const AudioSpectrumVisualizer: React.FC<AudioSpectrumVisualizerProps> = ({
  analyserNode,
  isListening,
  volumeLevel,
  volumeBars = [],
  micCountdown,
  transcript,
  onSendNow,
  onStop,
  onOpenSettings,
  variant = 'floating',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const peakLevelsRef = useRef<number[]>(new Array(32).fill(0));
  const peakDecaySpeedRef = useRef<number[]>(new Array(32).fill(0));

  const [mode, setMode] = useState<SpectrumMode>('bars');
  const [liveDbfs, setLiveDbfs] = useState<number>(-48);
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);

  const canvasId = useId();

  // Primary Canvas Audio Spectrum rendering loop
  useEffect(() => {
    if (!isListening) {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let bufferLength = 64;
    let freqData = new Uint8Array(bufferLength);
    let timeData = new Uint8Array(bufferLength);

    if (analyserNode) {
      bufferLength = analyserNode.frequencyBinCount;
      freqData = new Uint8Array(bufferLength);
      timeData = new Uint8Array(bufferLength);
    }

    const numBands = 32;
    if (peakLevelsRef.current.length !== numBands) {
      peakLevelsRef.current = new Array(numBands).fill(0);
      peakDecaySpeedRef.current = new Array(numBands).fill(0);
    }

    const render = () => {
      if (!isListening) return;

      const width = canvas.width;
      const height = canvas.height;

      // Handle high-DPI scaling
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      if (canvas.width !== Math.floor(rect.width * dpr) || canvas.height !== Math.floor(rect.height * dpr)) {
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      const displayWidth = rect.width;
      const displayHeight = rect.height;

      ctx.clearRect(0, 0, displayWidth, displayHeight);

      let sum = 0;
      let rmsSum = 0;

      if (analyserNode) {
        analyserNode.getByteFrequencyData(freqData);
        analyserNode.getByteTimeDomainData(timeData);

        for (let i = 0; i < bufferLength; i++) {
          sum += freqData[i];
          const normalizedTime = (timeData[i] - 128) / 128;
          rmsSum += normalizedTime * normalizedTime;
        }

        const rms = Math.sqrt(rmsSum / bufferLength);
        const dbfs = rms > 0.0001 ? Math.max(-60, Math.round(20 * Math.log10(rms))) : -60;
        setLiveDbfs(dbfs);
        setIsVoiceActive(dbfs > -38 || volumeLevel > 18);
      } else {
        // Fallback simulation when analyser is initialising
        setIsVoiceActive(volumeLevel > 18);
        setLiveDbfs(Math.round(-50 + (volumeLevel / 100) * 44));
      }

      // 1. Draw subtle background frequency guide lines
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.08)';
      ctx.lineWidth = 1;
      for (let y = displayHeight * 0.25; y < displayHeight; y += displayHeight * 0.25) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(displayWidth, y);
        ctx.stroke();
      }

      // 2. Render depending on selected Mode
      if (mode === 'bars') {
        const gap = 2;
        const totalGaps = (numBands - 1) * gap;
        const barWidth = Math.max(2, (displayWidth - totalGaps) / numBands);
        const step = Math.max(1, Math.floor(bufferLength / numBands));

        for (let i = 0; i < numBands; i++) {
          let rawVal = 0;
          if (analyserNode) {
            rawVal = freqData[i * step] || 0;
          } else {
            // Map from volumeBars or volumeLevel
            const barIndex = i % (volumeBars.length || 1);
            rawVal = (volumeBars[barIndex] || 15) * 2.55;
          }

          // Perceptual boost for higher frequencies so spectrum looks balanced
          const trebleBoost = 1 + (i / numBands) * 0.45;
          const boostedVal = Math.min(255, rawVal * trebleBoost);

          // Bar Height calculation (min 4px)
          const barHeight = Math.max(4, (boostedVal / 255) * (displayHeight - 8));
          const x = i * (barWidth + gap);
          const y = displayHeight - barHeight;

          // Dynamic gradient based on current intensity
          const gradient = ctx.createLinearGradient(0, displayHeight, 0, y);
          if (volumeLevel > 55) {
            gradient.addColorStop(0, '#f59e0b'); // amber-500
            gradient.addColorStop(0.5, '#f97316'); // orange-500
            gradient.addColorStop(1, '#f43f5e'); // rose-500
          } else if (volumeLevel > 25) {
            gradient.addColorStop(0, '#d97706'); // amber-600
            gradient.addColorStop(0.6, '#f59e0b'); // amber-500
            gradient.addColorStop(1, '#fde047'); // yellow-300
          } else {
            gradient.addColorStop(0, '#b45309'); // amber-700
            gradient.addColorStop(0.7, '#f59e0b'); // amber-500
            gradient.addColorStop(1, '#fef08a'); // yellow-200
          }

          // Draw rounded bar
          ctx.fillStyle = gradient;
          const radius = Math.min(3, barWidth / 2);
          ctx.beginPath();
          ctx.roundRect(x, y, barWidth, barHeight, [radius, radius, 0, 0]);
          ctx.fill();

          // Peak hold and decay
          if (barHeight > peakLevelsRef.current[i]) {
            peakLevelsRef.current[i] = barHeight;
            peakDecaySpeedRef.current[i] = 0.4;
          } else {
            peakDecaySpeedRef.current[i] += 0.15; // Gravity
            peakLevelsRef.current[i] = Math.max(4, peakLevelsRef.current[i] - peakDecaySpeedRef.current[i]);
          }

          // Draw floating peak indicator dot / cap
          const peakY = displayHeight - peakLevelsRef.current[i] - 2;
          ctx.fillStyle = volumeLevel > 55 ? '#fb7185' : '#f59e0b';
          ctx.fillRect(x, Math.max(1, peakY), barWidth, 2);
        }
      } else if (mode === 'wave') {
        // Continuous oscilloscope line with area glow
        const step = displayWidth / bufferLength;
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeData[i] || 128) / 128.0;
          const y = (v * displayHeight) / 2;
          const x = i * step;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        // Fill under the wave
        ctx.lineTo(displayWidth, displayHeight);
        ctx.lineTo(0, displayHeight);
        ctx.closePath();

        const areaGrad = ctx.createLinearGradient(0, 0, 0, displayHeight);
        areaGrad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
        areaGrad.addColorStop(1, 'rgba(245, 158, 11, 0.02)');
        ctx.fillStyle = areaGrad;
        ctx.fill();

        // Stroke glowing line
        ctx.beginPath();
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeData[i] || 128) / 128.0;
          const y = (v * displayHeight) / 2;
          const x = i * step;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = volumeLevel > 55 ? '#f43f5e' : '#f59e0b';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = 'rgba(245, 158, 11, 0.8)';
        ctx.shadowBlur = 8;
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (mode === 'mirror') {
        // Mirrored spectrum centered vertically
        const gap = 2;
        const totalGaps = (numBands - 1) * gap;
        const barWidth = Math.max(2, (displayWidth - totalGaps) / numBands);
        const centerY = displayHeight / 2;
        const step = Math.max(1, Math.floor(bufferLength / numBands));

        for (let i = 0; i < numBands; i++) {
          const rawVal = analyserNode ? freqData[i * step] || 0 : (volumeBars[i % volumeBars.length] || 15) * 2.55;
          const halfHeight = Math.max(2, ((rawVal / 255) * (displayHeight - 6)) / 2);
          const x = i * (barWidth + gap);

          const grad = ctx.createLinearGradient(0, centerY - halfHeight, 0, centerY + halfHeight);
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(0.5, '#fbbf24');
          grad.addColorStop(1, '#f59e0b');

          ctx.fillStyle = grad;
          ctx.roundRect(x, centerY - halfHeight, barWidth, halfHeight * 2, 2);
          ctx.fill();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [isListening, analyserNode, mode, volumeLevel, volumeBars]);

  if (!isListening) return null;

  return (
    <div
      ref={containerRef}
      className={`relative rounded-2xl bg-gradient-to-b from-stone-900/95 via-stone-900/90 to-amber-950/90 border border-amber-400/40 shadow-[0_12px_36px_rgba(0,0,0,0.4),0_0_24px_rgba(245,158,11,0.25)] backdrop-blur-xl text-stone-100 overflow-hidden transition-all duration-300 animate-in fade-in zoom-in-95 ${className}`}
      role="region"
      aria-label="Microphone Audio Spectrum Analyzer"
    >
      {/* Specular edge highlight */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-300/80 to-transparent"
        aria-hidden="true"
      />

      {/* Dynamic ambient background glow synced to input intensity */}
      <div
        className="pointer-events-none absolute -inset-10 opacity-30 blur-2xl transition-opacity duration-150"
        style={{
          background: `radial-gradient(circle, rgba(245, 158, 11, ${Math.min(0.6, volumeLevel / 120)}) 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 p-3 sm:p-3.5 space-y-2.5">
        {/* Header telemetry row */}
        <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2">
          {/* Live Mic Activity & Status */}
          <div className="flex items-center gap-2 min-w-0">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-80" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
            </span>
            <span className="text-[11px] font-bold tracking-wider text-rose-300 uppercase shrink-0">
              Live Mic
            </span>

            {/* Voice Activity Status */}
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${
                isVoiceActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-stone-800 text-stone-400 border border-stone-700'
              }`}
            >
              {isVoiceActive ? 'Voice Detected' : 'Listening...'}
            </span>

            {/* RMS dBFS Level */}
            <span className="text-[10px] font-mono text-amber-200/80 hidden xs:inline">
              {liveDbfs > -60 ? `${liveDbfs} dBFS` : 'Noise Floor'}
            </span>
          </div>

          {/* Right Action Controls: Spectrum Mode Toggle, Settings, & Countdown Timer */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Visualizer Mode Switcher */}
            <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setMode('bars')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  mode === 'bars' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="32-Band Spectrum Analyzer"
              >
                FFT
              </button>
              <button
                type="button"
                onClick={() => setMode('wave')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  mode === 'wave' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Oscilloscope Waveform"
              >
                Wave
              </button>
              <button
                type="button"
                onClick={() => setMode('mirror')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                  mode === 'mirror' ? 'bg-amber-500 text-stone-950 font-bold' : 'text-stone-400 hover:text-stone-200'
                }`}
                title="Symmetrical Sonic Aura"
              >
                Aura
              </button>
            </div>

            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="p-1 rounded-lg bg-white/5 hover:bg-white/10 text-stone-300 hover:text-white border border-white/10 transition cursor-pointer"
                title="Adjust Microphone Sensitivity & DSP"
                aria-label="Open Microphone Settings"
              >
                <Sliders className="w-3 h-3 text-amber-400" />
              </button>
            )}

            {/* Auto-Process Timer */}
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/20 border border-amber-400/30 text-[10px] text-amber-200">
              <Clock className="w-2.5 h-2.5 text-amber-400 animate-spin" />
              <span className="font-mono font-bold">0:0{micCountdown}s</span>
            </div>
          </div>
        </div>

        {/* Dynamic Spectrum Canvas Stage */}
        <div className="relative w-full h-16 sm:h-20 rounded-xl bg-black/50 border border-white/10 overflow-hidden flex flex-col justify-end p-1">
          <canvas
            id={canvasId}
            ref={canvasRef}
            className="w-full h-full block"
            style={{ width: '100%', height: '100%' }}
          />

          {/* Frequency Band Guide Labels */}
          {mode === 'bars' && (
            <div className="absolute inset-x-2 bottom-1 flex justify-between pointer-events-none text-[8px] font-mono text-stone-500/80 uppercase">
              <span>Sub</span>
              <span>Bass</span>
              <span>Mid</span>
              <span>Presence</span>
              <span>Air</span>
            </div>
          )}

          {/* Dynamic Volume Meter Pill Overlay on top right of canvas */}
          <div className="absolute top-1.5 right-2 px-1.5 py-0.5 rounded bg-black/60 border border-amber-400/30 text-[9px] font-mono text-amber-300 flex items-center gap-1">
            <Volume2 className="w-2.5 h-2.5 text-amber-400" />
            <span>{volumeLevel}%</span>
          </div>
        </div>

        {/* Live Transcript / Speech Feedback */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <div className="flex-1 min-w-0">
            {transcript ? (
              <p className="text-xs sm:text-sm font-medium text-amber-100 truncate">
                <span className="text-amber-400/80 mr-1.5 font-sans text-[11px] font-bold uppercase tracking-wider">
                  You:
                </span>
                “{transcript}”
              </p>
            ) : (
              <p className="text-xs text-stone-400 italic truncate flex items-center gap-1.5 animate-pulse">
                <Sparkles className="w-3 h-3 text-amber-400 shrink-0" />
                <span>Speak your weather question (Telugu or English)...</span>
              </p>
            )}
          </div>

          {/* Action Buttons: Send Now & Cancel Recording */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onStop}
              className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-stone-200 text-xs font-medium flex items-center gap-1 transition active:scale-95 cursor-pointer border border-white/10"
              title="Cancel recording"
            >
              <Square className="w-3 h-3 fill-current text-rose-400" />
              <span>Cancel</span>
            </button>

            <button
              type="button"
              onClick={onSendNow}
              className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-400 hover:from-amber-300 hover:to-yellow-300 text-stone-950 text-xs font-bold flex items-center gap-1 shadow-[0_0_15px_rgba(245,158,11,0.5)] transition active:scale-95 cursor-pointer"
              title="Process and send query right now"
            >
              <Zap className="w-3 h-3 fill-current" />
              <span>Send Now</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
