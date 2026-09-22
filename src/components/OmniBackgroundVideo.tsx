import React, { useEffect, useRef, useState } from 'react';

export type WeatherVideoMode = 'sunny' | 'rainy' | 'snowy';

interface OmniBackgroundVideoProps {
  currentMode: WeatherVideoMode;
  onVideoError?: () => void;
}

export const OmniBackgroundVideo: React.FC<OmniBackgroundVideoProps> = ({
  currentMode,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoLoaded, setVideoLoaded] = useState<boolean>(false);

  // Map mode to requested video filenames
  const videoSrcMap: Record<WeatherVideoMode, string> = {
    sunny: 'omni-weather-sunny.mp4',
    rainy: 'omni-weather-rainy.mp4',
    snowy: 'omni-weather-snowy.mp4',
  };

  const activeSrc = videoSrcMap[currentMode] || 'omni-weather-sunny.mp4';

  // Attempt to play whenever src changes
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.src = activeSrc;
      video.load();
      video.play().then(() => {
        setVideoLoaded(true);
      }).catch(() => {
        // Video file may not be physically present; fallback procedural video canvas activates seamlessly
        setVideoLoaded(false);
      });
    }
  }, [activeSrc]);

  // High-framerate procedural atmospheric video-grade canvas fallback
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle pool for rain / snow / sunbeams
    const particles: { x: number; y: number; speedY: number; speedX: number; size: number; alpha: number }[] = [];
    const count = currentMode === 'rainy' ? 180 : currentMode === 'snowy' ? 120 : 50;

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        speedY: currentMode === 'rainy' ? 14 + Math.random() * 10 : currentMode === 'snowy' ? 1.5 + Math.random() * 2 : 0.4 + Math.random() * 0.8,
        speedX: currentMode === 'rainy' ? -2.5 - Math.random() * 2 : currentMode === 'snowy' ? (Math.random() - 0.5) * 1.5 : (Math.random() - 0.5) * 0.6,
        size: currentMode === 'rainy' ? 1.2 : currentMode === 'snowy' ? 2.5 + Math.random() * 2.5 : 2 + Math.random() * 3,
        alpha: 0.2 + Math.random() * 0.6,
      });
    }

    let frame = 0;

    const render = () => {
      frame++;
      ctx.clearRect(0, 0, width, height);

      // 1. Atmosphere Base Backdrop
      if (currentMode === 'sunny') {
        const bgGrad = ctx.createRadialGradient(width * 0.75, height * 0.2, 50, width * 0.5, height * 0.5, width);
        bgGrad.addColorStop(0, '#1c2d42');
        bgGrad.addColorStop(0.4, '#132130');
        bgGrad.addColorStop(1, '#091017');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Golden Solar Corona & Sun Flare
        const sunGrad = ctx.createRadialGradient(width * 0.75, height * 0.15, 10, width * 0.75, height * 0.15, 450);
        sunGrad.addColorStop(0, 'rgba(253, 224, 71, 0.4)');
        sunGrad.addColorStop(0.3, 'rgba(245, 158, 11, 0.15)');
        sunGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = sunGrad;
        ctx.beginPath();
        ctx.arc(width * 0.75, height * 0.15, 450, 0, Math.PI * 2);
        ctx.fill();
      } else if (currentMode === 'rainy') {
        const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
        bgGrad.addColorStop(0, '#0f1722');
        bgGrad.addColorStop(0.6, '#0b1017');
        bgGrad.addColorStop(1, '#060a0f');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Periodic distant lightning flash
        if (frame % 280 > 274) {
          ctx.fillStyle = 'rgba(224, 242, 254, 0.12)';
          ctx.fillRect(0, 0, width, height);
        }
      } else { // snowy
        const bgGrad = ctx.createRadialGradient(width * 0.5, height * 0.2, 50, width * 0.5, height * 0.5, width);
        bgGrad.addColorStop(0, '#1e293b');
        bgGrad.addColorStop(0.5, '#0f172a');
        bgGrad.addColorStop(1, '#090d16');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);
      }

      // 2. Animate Environmental Particles
      particles.forEach((p) => {
        p.y += p.speedY;
        p.x += p.speedX;

        if (p.y > height) {
          p.y = -10;
          p.x = Math.random() * width;
        }
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;

        if (currentMode === 'rainy') {
          ctx.strokeStyle = `rgba(186, 230, 253, ${p.alpha * 0.75})`;
          ctx.lineWidth = p.size;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 4, p.y + 18);
          ctx.stroke();
        } else if (currentMode === 'snowy') {
          ctx.fillStyle = `rgba(255, 255, 255, ${p.alpha * 0.8})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Floating solar dust specks
          ctx.fillStyle = `rgba(253, 230, 138, ${p.alpha * 0.5})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [currentMode]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none -z-10">
      {/* 1. The requested <video id="weather-bg"> element */}
      <video
        ref={videoRef}
        id="weather-bg"
        autoPlay
        muted
        loop
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          filter: 'brightness(0.6) contrast(1.1)',
        }}
      >
        <source src={activeSrc} type="video/mp4" />
      </video>

      {/* 2. Procedural dynamic atmospheric video canvas (active fallback and layered atmosphere) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
          videoLoaded ? 'opacity-40 mix-blend-screen' : 'opacity-100'
        }`}
      />

      {/* Subtle cinematic vignette */}
      <div className="absolute inset-0 bg-radial from-transparent via-black/20 to-black/60 pointer-events-none" />
    </div>
  );
};
