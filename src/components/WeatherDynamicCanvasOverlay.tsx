import React, { useEffect, useRef, useId } from 'react';
import { WeatherConditionInfo } from '../types';

export type WeatherOverlayMode = 'auto' | 'snow' | 'rain' | 'thunderstorm' | 'haze' | 'fog';
export type WeatherOverlayIntensity = 'subtle' | 'standard' | 'vivid';

export interface WeatherDynamicCanvasOverlayProps {
  conditionCategory: WeatherConditionInfo['category'];
  temperature: number; // in Celsius
  windSpeed?: number; // km/h
  isDay?: boolean;
  forcedOverlay?: WeatherOverlayMode;
  intensity?: WeatherOverlayIntensity;
  className?: string;
}

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  swayFreq: number;
  swayAmp: number;
  phase: number;
  alpha: number;
  blur: number;
}

interface Raindrop {
  x: number;
  y: number;
  length: number;
  speed: number;
  thickness: number;
  alpha: number;
  layer: number; // 0 (far), 1 (mid), 2 (near)
}

interface Splash {
  x: number;
  y: number;
  radius: number;
  alpha: number;
  maxRadius: number;
  decay: number;
}

interface SolarMote {
  x: number;
  y: number;
  radius: number;
  speedY: number;
  speedX: number;
  alpha: number;
  maxAlpha: number;
  pulseSpeed: number;
  pulsePhase: number;
}

interface MistPuff {
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  speedX: number;
  alpha: number;
  phase: number;
}

interface WindStreamline {
  x: number;
  y: number;
  length: number;
  speed: number;
  alpha: number;
  thickness: number;
}

export const WeatherDynamicCanvasOverlay: React.FC<WeatherDynamicCanvasOverlayProps> = ({
  conditionCategory,
  temperature,
  windSpeed = 14,
  isDay = true,
  forcedOverlay = 'auto',
  intensity = 'standard',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasId = useId();

  // Mode deduction (allows override for easy demo/testing)
  const effectiveMode = React.useMemo<WeatherOverlayMode>(() => {
    if (forcedOverlay !== 'auto') {
      return forcedOverlay;
    }
    if (conditionCategory === 'snow') return 'snow';
    if (conditionCategory === 'thunderstorm') return 'thunderstorm';
    if (conditionCategory === 'rain' || conditionCategory === 'drizzle') return 'rain';
    if (conditionCategory === 'fog' || conditionCategory === 'cloudy') return 'fog';
    // Clear or partly cloudy
    return 'haze';
  }, [forcedOverlay, conditionCategory]);

  const isSnow = effectiveMode === 'snow';
  const isRain = effectiveMode === 'rain';
  const isThunderstorm = effectiveMode === 'thunderstorm';
  const isFog = effectiveMode === 'fog';
  const isHaze = effectiveMode === 'haze';
  const isWarmOrSunny = isHaze && (temperature >= 24 || forcedOverlay === 'haze');
  const isExtremeHeat = isHaze && (temperature >= 32 || forcedOverlay === 'haze');

  // Particle banks stored in refs to avoid reallocations on every render frame
  const snowflakesRef = useRef<Snowflake[]>([]);
  const raindropsRef = useRef<Raindrop[]>([]);
  const splashesRef = useRef<Splash[]>([]);
  const solarMotesRef = useRef<SolarMote[]>([]);
  const mistPuffsRef = useRef<MistPuff[]>([]);
  const windStreamlinesRef = useRef<WindStreamline[]>([]);

  // Thunderstorm flash state
  const lightningRef = useRef({
    active: false,
    alpha: 0,
    nextFlashTime: Date.now() + 3500 + Math.random() * 6000,
  });

  // Haze animation phase
  const hazePhaseRef = useRef<number>(0);

  // Intensity multiplier
  const intensityMultiplier = intensity === 'subtle' ? 0.6 : intensity === 'vivid' ? 1.4 : 1.0;

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle container resize
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newWidth, height: newHeight } = entry.contentRect;
        if (newWidth > 0 && newHeight > 0) {
          width = newWidth;
          height = newHeight;
          canvas.width = Math.floor(width * dpr);
          canvas.height = Math.floor(height * dpr);
          initParticles(width, height);
        }
      }
    });

    resizeObserver.observe(container);

    // Initialize particles based on weather type
    function initParticles(w: number, h: number) {
      const windFactor = Math.min(1.5, Math.max(-1.5, (windSpeed - 10) / 25));

      // 1. Snowflakes
      if (isSnow) {
        const count = Math.floor(48 * intensityMultiplier);
        snowflakesRef.current = Array.from({ length: count }, () => {
          const radius = 1.2 + Math.random() * 3.4;
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            radius,
            speedY: 0.65 + (radius / 4) * 0.9 + Math.random() * 0.45,
            speedX: 0.35 * windFactor + (Math.random() - 0.5) * 0.3,
            swayFreq: 0.015 + Math.random() * 0.02,
            swayAmp: 0.6 + Math.random() * 1.6,
            phase: Math.random() * Math.PI * 2,
            alpha: 0.28 + (radius / 4) * 0.55,
            blur: radius > 3 ? 1.5 : 0,
          };
        });
      }

      // 2. Raindrops
      if (isRain || isThunderstorm) {
        const baseCount = isThunderstorm ? 85 : 55;
        const count = Math.floor(baseCount * intensityMultiplier);
        raindropsRef.current = Array.from({ length: count }, () => {
          const layer = Math.random() < 0.28 ? 2 : Math.random() < 0.65 ? 1 : 0;
          const speedMult = layer === 2 ? 1.45 : layer === 1 ? 1.0 : 0.72;
          return {
            x: Math.random() * (w + 140) - 70,
            y: Math.random() * h,
            length: layer === 2 ? 15 : layer === 1 ? 11 : 7.5,
            speed: (13 + Math.random() * 10) * speedMult,
            thickness: layer === 2 ? 1.5 : layer === 1 ? 1.0 : 0.7,
            alpha: layer === 2 ? 0.45 : layer === 1 ? 0.28 : 0.16,
            layer,
          };
        });
        splashesRef.current = [];
      }

      // 3. Solar Motes (Warm / Clear / Sunny heat haze or ambient daylight shimmer)
      if (isHaze) {
        const count = Math.floor((isExtremeHeat ? 42 : isWarmOrSunny ? 28 : 20) * intensityMultiplier);
        solarMotesRef.current = Array.from({ length: count }, () => {
          const maxAlpha = 0.22 + Math.random() * 0.38;
          return {
            x: Math.random() * w,
            y: Math.random() * h,
            radius: 1.5 + Math.random() * 3.5,
            speedY: -(0.2 + Math.random() * (isWarmOrSunny ? 0.6 : 0.35)),
            speedX: (Math.random() - 0.5) * 0.35 + windFactor * 0.25,
            alpha: Math.random() * maxAlpha,
            maxAlpha,
            pulseSpeed: 0.02 + Math.random() * 0.035,
            pulsePhase: Math.random() * Math.PI * 2,
          };
        });
      }

      // 4. Mist / Fog Puffs
      if (isFog) {
        const count = Math.floor(8 * intensityMultiplier);
        mistPuffsRef.current = Array.from({ length: count }, (_, idx) => {
          return {
            x: (w / count) * idx + (Math.random() - 0.5) * 120,
            y: h * 0.2 + Math.random() * (h * 0.6),
            radiusX: 130 + Math.random() * 180,
            radiusY: 45 + Math.random() * 65,
            speedX: 0.18 + Math.random() * 0.25 + windFactor * 0.15,
            alpha: 0.09 + Math.random() * 0.12,
            phase: Math.random() * Math.PI * 2,
          };
        });
      }

      // 5. Wind streamlines if windy (windSpeed >= 18)
      if (windSpeed >= 18) {
        const count = Math.floor(10 * intensityMultiplier);
        windStreamlinesRef.current = Array.from({ length: count }, () => ({
          x: Math.random() * (w + 200) - 100,
          y: Math.random() * h,
          length: 40 + Math.random() * 70,
          speed: 3 + (windSpeed / 10) * 1.5 + Math.random() * 2,
          alpha: 0.12 + Math.random() * 0.18,
          thickness: 0.8 + Math.random() * 0.8,
        }));
      } else {
        windStreamlinesRef.current = [];
      }
    }

    initParticles(width, height);

    let lastTime = performance.now();
    let isTabVisible = !document.hidden;

    const handleVisibilityChange = () => {
      isTabVisible = !document.hidden;
      if (isTabVisible) {
        lastTime = performance.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Main animation loop
    const animate = (currentTime: number) => {
      if (!isTabVisible) {
        animFrameRef.current = requestAnimationFrame(animate);
        return;
      }

      const dt = Math.min((currentTime - lastTime) / 1000, 0.1);
      lastTime = currentTime;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const windDrift = (windSpeed / 20) * 1.5;

      // -------------------------------------------------------------
      // EFFECT 1: FALLING SNOW
      // -------------------------------------------------------------
      if (isSnow && snowflakesRef.current.length > 0) {
        for (const flake of snowflakesRef.current) {
          flake.phase += flake.swayFreq;
          flake.y += flake.speedY;
          flake.x += Math.sin(flake.phase) * flake.swayAmp + flake.speedX + windDrift * 0.2;

          // Wrap around edges
          if (flake.y > height + 10) {
            flake.y = -10;
            flake.x = Math.random() * width;
          }
          if (flake.x > width + 10) flake.x = -10;
          if (flake.x < -10) flake.x = width + 10;

          // Render snowflake with soft radial falloff
          ctx.beginPath();
          ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 255, 255, ${flake.alpha})`;
          ctx.fill();

          // Subtle crystalline bokeh core for larger flakes
          if (flake.radius > 2.5) {
            ctx.beginPath();
            ctx.arc(flake.x, flake.y, flake.radius * 0.45, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, flake.alpha * 1.6)})`;
            ctx.fill();
          }
        }
      }

      // -------------------------------------------------------------
      // EFFECT 2: DRIFTING RAIN & THUNDERSTORM
      // -------------------------------------------------------------
      if ((isRain || isThunderstorm) && raindropsRef.current.length > 0) {
        const angleRad = Math.PI / 2 + Math.min(0.35, Math.max(-0.35, windDrift * 0.12));
        const cosAngle = Math.cos(angleRad);
        const sinAngle = Math.sin(angleRad);

        // Thunderstorm lightning sky pulse
        if (isThunderstorm) {
          const now = Date.now();
          if (!lightningRef.current.active && now > lightningRef.current.nextFlashTime) {
            lightningRef.current.active = true;
            lightningRef.current.alpha = 0.24 + Math.random() * 0.16;
            lightningRef.current.nextFlashTime = now + 4500 + Math.random() * 8000;
          }

          if (lightningRef.current.active) {
            ctx.fillStyle = `rgba(240, 245, 255, ${lightningRef.current.alpha})`;
            ctx.fillRect(0, 0, width, height);
            lightningRef.current.alpha -= dt * 1.8;
            if (lightningRef.current.alpha <= 0) {
              lightningRef.current.active = false;
            }
          }
        }

        // Draw raindrops
        ctx.lineCap = 'round';
        for (const drop of raindropsRef.current) {
          drop.y += drop.speed * sinAngle;
          drop.x += drop.speed * cosAngle;

          // Check if droplet hits the bottom boundary to spawn splash
          if (drop.y > height - 16 && Math.random() < 0.26) {
            splashesRef.current.push({
              x: drop.x,
              y: height - 8 + (Math.random() - 0.5) * 6,
              radius: 1,
              maxRadius: 3 + Math.random() * 4,
              alpha: drop.alpha * 1.25,
              decay: 0.08,
            });
          }

          // Wrap raindrop
          if (drop.y > height + 20) {
            drop.y = -drop.length - 10;
            drop.x = Math.random() * (width + 140) - 70;
          }
          if (drop.x > width + 60) drop.x = -40;
          if (drop.x < -60) drop.x = width + 40;

          // Render raindrop streak
          ctx.beginPath();
          ctx.lineWidth = drop.thickness;
          ctx.strokeStyle = `rgba(148, 163, 184, ${drop.alpha})`;
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - drop.length * cosAngle, drop.y - drop.length * sinAngle);
          ctx.stroke();
        }

        // Update and draw splashes
        for (let i = splashesRef.current.length - 1; i >= 0; i--) {
          const s = splashesRef.current[i];
          s.radius += (s.maxRadius - s.radius) * 0.2;
          s.alpha -= s.decay;

          if (s.alpha <= 0 || s.radius >= s.maxRadius - 0.2) {
            splashesRef.current.splice(i, 1);
            continue;
          }

          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.radius, s.radius * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(186, 230, 253, ${s.alpha})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      // -------------------------------------------------------------
      // EFFECT 3: HEAT HAZE & SOLAR SHIMMER (Warm / Sunny Days)
      // -------------------------------------------------------------
      if (isHaze) {
        hazePhaseRef.current += dt * 1.8;

        // 3a. Subtle lower thermal refractive shimmer bands (only if warm/hot)
        if (isWarmOrSunny) {
          const shimmerCount = isExtremeHeat ? 4 : 2;
          for (let b = 0; b < shimmerCount; b++) {
            const baseY = height - 25 - b * 35;
            const bandAlpha = (isExtremeHeat ? 0.055 : 0.032) * (1 - b / shimmerCount);
            ctx.beginPath();
            ctx.moveTo(0, baseY);

            const waveFreq = 0.008 + b * 0.004;
            const waveAmp = (4 + b * 2) * (isExtremeHeat ? 1.5 : 1);
            for (let x = 0; x <= width; x += 20) {
              const y = baseY + Math.sin(x * waveFreq + hazePhaseRef.current + b) * waveAmp;
              ctx.lineTo(x, y);
            }

            ctx.lineTo(width, height);
            ctx.lineTo(0, height);
            ctx.closePath();

            const hazeGrad = ctx.createLinearGradient(0, baseY, 0, height);
            hazeGrad.addColorStop(0, `rgba(251, 146, 60, ${bandAlpha})`);
            hazeGrad.addColorStop(1, 'rgba(254, 215, 170, 0)');
            ctx.fillStyle = hazeGrad;
            ctx.fill();
          }
        }

        // 3b. Shimmering solar dust motes ascending gently
        for (const mote of solarMotesRef.current) {
          mote.pulsePhase += mote.pulseSpeed;
          mote.alpha = mote.maxAlpha * (0.5 + 0.5 * Math.sin(mote.pulsePhase));
          mote.y += mote.speedY;
          mote.x += mote.speedX + Math.sin(mote.pulsePhase * 0.7) * 0.3;

          // Wrap motes
          if (mote.y < -10) {
            mote.y = height + 10;
            mote.x = Math.random() * width;
          }
          if (mote.x > width + 10) mote.x = -10;
          if (mote.x < -10) mote.x = width + 10;

          // Render glowing golden dust mote
          const grad = ctx.createRadialGradient(
            mote.x,
            mote.y,
            0,
            mote.x,
            mote.y,
            mote.radius * 2
          );
          const colorCore = isDay
            ? isWarmOrSunny
              ? 'rgba(253, 186, 116,'
              : 'rgba(254, 240, 138,'
            : 'rgba(224, 231, 255,';
          grad.addColorStop(0, `${colorCore} ${mote.alpha})`);
          grad.addColorStop(0.5, `${colorCore} ${mote.alpha * 0.4})`);
          grad.addColorStop(1, 'rgba(251, 191, 36, 0)');

          ctx.beginPath();
          ctx.arc(mote.x, mote.y, mote.radius * 2, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // EFFECT 4: DRIFTING MIST & FOG WISPS
      // -------------------------------------------------------------
      if (isFog && mistPuffsRef.current.length > 0) {
        for (const puff of mistPuffsRef.current) {
          puff.phase += dt * 0.4;
          puff.x += puff.speedX;

          // Wrap mist puffs
          if (puff.x - puff.radiusX > width) {
            puff.x = -puff.radiusX;
            puff.y = height * 0.25 + Math.random() * (height * 0.5);
          }

          const puffY = puff.y + Math.sin(puff.phase) * 12;

          const grad = ctx.createRadialGradient(
            puff.x,
            puffY,
            0,
            puff.x,
            puffY,
            puff.radiusX
          );
          grad.addColorStop(0, `rgba(241, 245, 249, ${puff.alpha * 1.25})`);
          grad.addColorStop(0.6, `rgba(226, 232, 240, ${puff.alpha * 0.5})`);
          grad.addColorStop(1, 'rgba(248, 250, 252, 0)');

          ctx.beginPath();
          ctx.ellipse(puff.x, puffY, puff.radiusX, puff.radiusY, 0, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
        }
      }

      // -------------------------------------------------------------
      // EFFECT 5: WIND STREAMLINES (When windy)
      // -------------------------------------------------------------
      if (windStreamlinesRef.current.length > 0) {
        ctx.lineCap = 'round';
        for (const stream of windStreamlinesRef.current) {
          stream.x += stream.speed;
          if (stream.x > width + stream.length) {
            stream.x = -stream.length - 20;
            stream.y = Math.random() * height;
          }

          ctx.beginPath();
          ctx.lineWidth = stream.thickness;
          const streamGrad = ctx.createLinearGradient(
            stream.x - stream.length,
            stream.y,
            stream.x,
            stream.y
          );
          streamGrad.addColorStop(0, 'rgba(214, 211, 209, 0)');
          streamGrad.addColorStop(0.5, `rgba(214, 211, 209, ${stream.alpha})`);
          streamGrad.addColorStop(1, 'rgba(214, 211, 209, 0)');
          ctx.strokeStyle = streamGrad;
          ctx.moveTo(stream.x - stream.length, stream.y);
          ctx.lineTo(stream.x, stream.y);
          ctx.stroke();
        }
      }

      ctx.restore();
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [
    effectiveMode,
    isSnow,
    isRain,
    isThunderstorm,
    isWarmOrSunny,
    isExtremeHeat,
    isFog,
    isHaze,
    windSpeed,
    isDay,
    intensityMultiplier,
  ]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 pointer-events-none overflow-hidden select-none z-[1] ${className}`}
      aria-hidden="true"
    >
      <canvas
        id={canvasId}
        ref={canvasRef}
        className="w-full h-full block opacity-95 transition-opacity duration-1000"
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};
