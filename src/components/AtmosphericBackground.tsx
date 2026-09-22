import React, { useEffect, useRef } from 'react';
import { WeatherConditionInfo } from '../types';

interface AtmosphericBackgroundProps {
  category: WeatherConditionInfo['category'];
  isDay?: boolean;
}

export const AtmosphericBackground: React.FC<AtmosphericBackgroundProps> = ({
  category,
  isDay = true,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    // Rain particles
    interface RainParticle {
      x: number;
      y: number;
      len: number;
      speed: number;
      opacity: number;
    }

    const rainParticles: RainParticle[] = [];
    const dropCount = category === 'thunderstorm' ? 120 : category === 'rain' ? 80 : category === 'drizzle' ? 35 : 0;

    for (let i = 0; i < dropCount; i++) {
      rainParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        len: 15 + Math.random() * 25,
        speed: 12 + Math.random() * 14,
        opacity: 0.15 + Math.random() * 0.35,
      });
    }

    // Mist / Fog particles
    interface MistParticle {
      x: number;
      y: number;
      radius: number;
      speedX: number;
      opacity: number;
    }

    const mistParticles: MistParticle[] = [];
    const mistCount = 18;
    for (let i = 0; i < mistCount; i++) {
      mistParticles.push({
        x: Math.random() * width,
        y: height * 0.2 + Math.random() * (height * 0.7),
        radius: 140 + Math.random() * 220,
        speedX: 0.2 + Math.random() * 0.4,
        opacity: 0.02 + Math.random() * 0.04,
      });
    }

    let tick = 0;
    let lightningFrame = 0;

    const render = () => {
      tick++;
      ctx.clearRect(0, 0, width, height);

      // Random lightning flash during thunderstorms
      if (category === 'thunderstorm') {
        if (Math.random() < 0.008 && lightningFrame <= 0) {
          lightningFrame = 14;
        }
        if (lightningFrame > 0) {
          const intensity = (lightningFrame / 14) * 0.18;
          ctx.fillStyle = `rgba(215, 235, 255, ${intensity})`;
          ctx.fillRect(0, 0, width, height);
          lightningFrame--;
        }
      }

      // Render drifting soft mist
      for (const m of mistParticles) {
        m.x += m.speedX;
        if (m.x - m.radius > width) {
          m.x = -m.radius;
        }

        const grad = ctx.createRadialGradient(m.x, m.y, 0, m.x, m.y, m.radius);
        grad.addColorStop(0, `rgba(180, 200, 220, ${m.opacity})`);
        grad.addColorStop(0.6, `rgba(140, 165, 190, ${m.opacity * 0.4})`);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Render falling rain streaks
      if (rainParticles.length > 0) {
        ctx.strokeStyle = 'rgba(210, 230, 255, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (const drop of rainParticles) {
          ctx.moveTo(drop.x, drop.y);
          ctx.lineTo(drop.x - 3, drop.y + drop.len);

          drop.y += drop.speed;
          drop.x -= 0.8; // wind slant

          if (drop.y > height) {
            drop.y = -drop.len;
            drop.x = Math.random() * (width + 100);
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
  }, [category]);

  return (
    <div className="fixed inset-0 pointer-events-none -z-20 overflow-hidden select-none">
      {/* 1. Deep Atmospheric Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1c2430] via-[#242e3d] to-[#141b24]" />

      {/* 2. Textured Cloud Billow Overlays */}
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen bg-cover bg-center"
        style={{
          backgroundImage: `
            radial-gradient(circle at 50% 35%, rgba(130, 155, 185, 0.45) 0%, rgba(55, 70, 90, 0.25) 45%, transparent 75%),
            radial-gradient(circle at 20% 40%, rgba(90, 115, 145, 0.35) 0%, transparent 60%),
            radial-gradient(circle at 80% 30%, rgba(110, 135, 165, 0.35) 0%, transparent 60%)
          `,
        }}
      />

      {/* 3. Atmospheric Dark Vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#141a22]/40 to-[#0e131a]/85" />

      {/* 4. Canvas for dynamic rain streaks and lightning flashes */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
    </div>
  );
};
