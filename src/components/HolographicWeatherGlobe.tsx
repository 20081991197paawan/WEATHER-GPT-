import React, { useEffect, useRef } from 'react';

interface HolographicWeatherGlobeProps {
  currentTemp?: number;
  condition?: string;
  size?: number;
}

export const HolographicWeatherGlobe: React.FC<HolographicWeatherGlobeProps> = ({
  currentTemp = 28,
  condition = 'Partly Cloudy',
  size = 220,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let rotation = 0;

    // Streamline particles for wind currents around the globe
    const streamlines: { lat: number; lon: number; speed: number; length: number; color: string }[] = [];
    for (let i = 0; i < 35; i++) {
      streamlines.push({
        lat: (Math.random() - 0.5) * Math.PI * 0.8,
        lon: Math.random() * Math.PI * 2,
        speed: 0.008 + Math.random() * 0.015,
        length: 0.2 + Math.random() * 0.35,
        color: Math.random() > 0.4 ? 'rgba(56, 189, 248, 0.85)' : 'rgba(138, 180, 248, 0.9)',
      });
    }

    const render = () => {
      rotation += 0.004;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const R = size * 0.4;

      // 1. Deep Space Atmosphere Backglow
      const spaceGrad = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.5);
      spaceGrad.addColorStop(0, 'rgba(14, 116, 144, 0.3)');
      spaceGrad.addColorStop(0.6, 'rgba(56, 189, 248, 0.12)');
      spaceGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = spaceGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Base 3D Sphere shading
      const sphereGrad = ctx.createRadialGradient(
        cx - R * 0.35,
        cy - R * 0.35,
        R * 0.1,
        cx,
        cy,
        R
      );
      sphereGrad.addColorStop(0, '#162d44');
      sphereGrad.addColorStop(0.7, '#0c1a27');
      sphereGrad.addColorStop(1, '#050a10');
      ctx.fillStyle = sphereGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      // 3. Coordinate Graticule Latitude & Longitude lines (Holographic HUD)
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.clip();

      // Longitudes rotating
      ctx.lineWidth = 1;
      for (let lonDeg = 0; lonDeg < 360; lonDeg += 45) {
        const rad = ((lonDeg * Math.PI) / 180 + rotation) % (Math.PI * 2);
        const rx = Math.cos(rad) * R;
        // Only render visible front side
        if (Math.sin(rad) >= -0.2) {
          ctx.strokeStyle = `rgba(138, 180, 248, ${0.15 + Math.sin(rad) * 0.2})`;
          ctx.beginPath();
          ctx.ellipse(cx, cy, Math.abs(rx), R, 0, 0, Math.PI * 2);
          ctx.stroke();
        }
      }

      // Latitudes
      for (const latDeg of [-60, -30, 0, 30, 60]) {
        const yOffset = Math.sin((latDeg * Math.PI) / 180) * (R * 0.85);
        const rAtLat = Math.sqrt(Math.max(0, R * R - yOffset * yOffset));
        ctx.strokeStyle = latDeg === 0 ? 'rgba(56, 189, 248, 0.4)' : 'rgba(138, 180, 248, 0.2)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + yOffset, rAtLat, rAtLat * 0.28, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // 4. Continents Holographic Dots Pattern (Earth representation)
      const numDots = 140;
      for (let i = 0; i < numDots; i++) {
        // Deterministic continent clusters
        const lat = Math.sin(i * 12.3) * 1.1;
        const lon = (i * 0.45 + rotation) % (Math.PI * 2);

        if (Math.sin(lon) > 0) { // On visible front hemisphere
          const x = cx + Math.cos(lon) * Math.cos(lat) * R;
          const y = cy + Math.sin(lat) * R;
          const alpha = Math.sin(lon) * 0.65;

          ctx.fillStyle = `rgba(110, 231, 183, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 5. Dynamic Wind Streamlines (flowing vector arrows around the globe from Video 2)
      streamlines.forEach((s) => {
        s.lon += s.speed;
        const currentLon = (s.lon + rotation) % (Math.PI * 2);
        if (Math.sin(currentLon) > 0.1) {
          const xStart = cx + Math.cos(currentLon) * Math.cos(s.lat) * (R * 1.02);
          const yStart = cy + Math.sin(s.lat) * (R * 1.02);

          const endLon = currentLon + s.length;
          const xEnd = cx + Math.cos(endLon) * Math.cos(s.lat) * (R * 1.02);
          const yEnd = cy + Math.sin(s.lat) * (R * 1.02);

          ctx.strokeStyle = s.color;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(xStart, yStart);
          ctx.lineTo(xEnd, yEnd);
          ctx.stroke();

          // Arrow head
          ctx.fillStyle = s.color;
          ctx.beginPath();
          ctx.arc(xEnd, yEnd, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // 6. Glowing Atmospheric Limb & Rim Light
      const rimGrad = ctx.createRadialGradient(cx, cy, R * 0.88, cx, cy, R);
      rimGrad.addColorStop(0, 'rgba(56, 189, 248, 0)');
      rimGrad.addColorStop(0.85, 'rgba(56, 189, 248, 0.45)');
      rimGrad.addColorStop(1, 'rgba(186, 230, 253, 0.85)');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // Outer thin orbital HUD rings with dash
      ctx.strokeStyle = 'rgba(138, 180, 248, 0.35)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.beginPath();
      ctx.arc(cx, cy, R * 1.18, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, [size]);

  return (
    <div className="relative flex items-center justify-center select-none">
      <canvas
        ref={canvasRef}
        width={size * 1.5}
        height={size * 1.5}
        className="w-full h-full max-w-[260px] max-h-[260px] drop-shadow-[0_12px_40px_rgba(14,165,233,0.35)]"
      />

      {/* Floating Holographic Telemetry Cards from Video 2 */}
      {/* Top Right Pin: 13°C Cloud */}
      <div className="absolute top-4 right-2 px-2.5 py-1 rounded-xl backdrop-blur-md bg-cyan-950/70 border border-cyan-400/40 text-[11px] font-mono text-cyan-200 flex items-center gap-1.5 shadow-lg shadow-cyan-900/30 animate-pulse">
        <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
        <span className="font-bold">13°C</span>
        <span className="text-[9px] text-cyan-400/70">W 14 km/h</span>
      </div>

      {/* Center Left Pin: 29°F / High-Res Telemetry */}
      <div className="absolute top-1/2 -translate-y-1/2 -left-3 px-2.5 py-1 rounded-xl backdrop-blur-md bg-indigo-950/70 border border-indigo-400/40 text-[11px] font-mono text-indigo-200 flex items-center gap-1.5 shadow-lg shadow-indigo-900/30">
        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
        <span className="font-bold">{Math.round(currentTemp)}°C</span>
        <span className="text-[9px] text-indigo-300/70">RADAR</span>
      </div>

      {/* Bottom Right Pin: 34°C Thermal */}
      <div className="absolute bottom-4 right-4 px-2.5 py-1 rounded-xl backdrop-blur-md bg-emerald-950/70 border border-emerald-400/40 text-[11px] font-mono text-emerald-200 flex items-center gap-1.5 shadow-lg shadow-emerald-900/30">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        <span className="font-bold">34°C</span>
        <span className="text-[9px] text-emerald-400/70">TROPICAL</span>
      </div>
    </div>
  );
};
