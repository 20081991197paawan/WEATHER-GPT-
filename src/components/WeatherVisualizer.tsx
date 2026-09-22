import React, { useEffect, useRef } from 'react';
import { WeatherConditionInfo } from '../types';

interface WeatherVisualizerProps {
  category: WeatherConditionInfo['category'];
  isDay: boolean;
  intensity?: number;
  darkMode?: boolean;
}

export const WeatherVisualizer: React.FC<WeatherVisualizerProps> = ({
  category,
  isDay,
  intensity = 1,
  darkMode = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Rain particles
    interface RainDrop {
      x: number;
      y: number;
      length: number;
      speed: number;
      opacity: number;
    }
    const rainDrops: RainDrop[] = [];
    const dropCount = category === 'thunderstorm' ? 140 : category === 'rain' ? 100 : category === 'drizzle' ? 45 : 0;

    for (let i = 0; i < dropCount; i++) {
      rainDrops.push({
        x: Math.random() * width,
        y: Math.random() * height,
        length: 12 + Math.random() * 18,
        speed: 9 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }

    // Cloud wisps
    interface CloudBlob {
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
    }
    const clouds: CloudBlob[] = [];
    const cloudCount = (category === 'cloudy' || category === 'partly_cloudy' || category === 'fog') ? 6 : 0;
    for (let i = 0; i < cloudCount; i++) {
      clouds.push({
        x: Math.random() * width,
        y: 40 + Math.random() * 120,
        radius: 80 + Math.random() * 140,
        speed: 0.15 + Math.random() * 0.25,
        opacity: 0.04 + Math.random() * 0.08,
      });
    }

    let tick = 0;
    let lightningFlash = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Thunderstorm lightning logic
      if (category === 'thunderstorm') {
        if (Math.random() < 0.007 && lightningFlash <= 0) {
          lightningFlash = 12; // frames of flash
        }
        if (lightningFlash > 0) {
          ctx.fillStyle = `rgba(186, 230, 253, ${lightningFlash * 0.015})`;
          ctx.fillRect(0, 0, width, height);
          lightningFlash--;
        }
      }

      // Render Clear Sunlight aura
      if (category === 'clear' && isDay) {
        const sunX = width * 0.85;
        const sunY = 90;
        const grad = ctx.createRadialGradient(sunX, sunY, 10, sunX, sunY, Math.min(width * 0.5, 360));
        const pulse = Math.sin(tick * 0.02) * 0.03;
        grad.addColorStop(0, `rgba(251, 191, 36, ${0.12 + pulse})`);
        grad.addColorStop(0.4, `rgba(245, 158, 11, ${0.06 + pulse * 0.5})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sunX, sunY, Math.min(width * 0.5, 360), 0, Math.PI * 2);
        ctx.fill();
      }

      // Render Clouds
      if (clouds.length > 0) {
        for (const cloud of clouds) {
          cloud.x += cloud.speed;
          if (cloud.x - cloud.radius > width) {
            cloud.x = -cloud.radius;
          }
          const grad = ctx.createRadialGradient(cloud.x, cloud.y, cloud.radius * 0.2, cloud.x, cloud.y, cloud.radius);
          grad.addColorStop(0, darkMode ? `rgba(148, 163, 184, ${cloud.opacity * 1.5})` : `rgba(203, 213, 225, ${cloud.opacity * 2})`);
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cloud.x, cloud.y, cloud.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Render Rain
      if (rainDrops.length > 0) {
        ctx.strokeStyle = darkMode ? 'rgba(147, 197, 253, 0.45)' : 'rgba(59, 130, 246, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        for (const drop of rainDrops) {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 2, drop.y + drop.length);
          drop.y += drop.speed;
          drop.x -= 0.6; // slight diagonal wind drift
          if (drop.y > height) {
            drop.y = -drop.length;
            drop.x = Math.random() * (width + 50);
          }
        }
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [category, isDay, intensity, darkMode]);

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden z-0 transition-opacity duration-1000">
      <canvas ref={canvasRef} className="w-full h-full block opacity-85" />
    </div>
  );
};
