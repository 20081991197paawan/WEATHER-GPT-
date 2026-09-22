import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  MapPin,
  Layers,
  CloudRain,
  Cloud,
  Wind,
  Thermometer,
  Play,
  Pause,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Crosshair,
  Compass,
  Info,
  Sparkles,
  ChevronRight,
  Radio,
} from 'lucide-react';
import { LocationData, CurrentWeather } from '../types';

export type MapOverlayMode = 'radar' | 'clouds' | 'wind' | 'temp';

export interface RegionalWeatherMapProps {
  location: LocationData;
  current: CurrentWeather;
  useFahrenheit: boolean;
  className?: string;
  onOpenDetails?: () => void;
}

interface RegionalStation {
  name: string;
  offsetLat: number;
  offsetLon: number;
  tempOffset: number;
  condition: string;
  rainIntensity: number; // 0 to 1
  windBearing: number;
}

const TIMELINE_STEPS = [
  { id: -60, label: '-60m' },
  { id: -45, label: '-45m' },
  { id: -30, label: '-30m' },
  { id: -15, label: '-15m' },
  { id: 0, label: 'NOW', isLive: true },
  { id: 15, label: '+15m' },
  { id: 30, label: '+30m' },
];

export const RegionalWeatherMap: React.FC<RegionalWeatherMapProps> = ({
  location,
  current,
  useFahrenheit,
  className = '',
  onOpenDetails,
}) => {
  const [activeOverlay, setActiveOverlay] = useState<MapOverlayMode>('radar');
  const [zoom, setZoom] = useState<number>(1.5);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [selectedStation, setSelectedStation] = useState<RegionalStation | null>(null);
  const [isPlayingTimeline, setIsPlayingTimeline] = useState(false);
  const [timelineIndex, setTimelineIndex] = useState(4); // Default to NOW (index 4)
  const [isFullscreen, setIsFullscreen] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);

  // Derived regional surrounding observation stations
  const nearbyStations: RegionalStation[] = useMemo(() => {
    const lat = location.latitude;
    const lon = location.longitude;
    const baseTemp = current.temp;

    // Deterministic pseudo-random generation based on lat/lon
    const seed = Math.abs(Math.sin(lat * 12.9898 + lon * 78.233) * 43758.5453);
    const names = [
      `${location.name} North Heights`,
      `${location.name} Coast Bay`,
      `${location.name} Valley Point`,
      `${location.name} East Ridge`,
      `${location.name} West Plateau`,
    ];

    return [
      {
        name: names[0],
        offsetLat: 0.18,
        offsetLon: 0.05,
        tempOffset: -1.8,
        condition: current.tempMinToday ? 'Cooler & Breezy' : 'Partly Cloudy',
        rainIntensity: Math.min(1, Math.max(0, current.rainProb / 100 + 0.15)),
        windBearing: (current.windDirection + 15) % 360,
      },
      {
        name: names[1],
        offsetLat: -0.14,
        offsetLon: 0.22,
        tempOffset: 0.8,
        condition: 'Humid Shore',
        rainIntensity: Math.min(1, Math.max(0, current.rainProb / 100 - 0.1)),
        windBearing: (current.windDirection - 20 + 360) % 360,
      },
      {
        name: names[2],
        offsetLat: -0.22,
        offsetLon: -0.15,
        tempOffset: 1.4,
        condition: 'Mild Valley',
        rainIntensity: Math.min(1, Math.max(0, current.rainProb / 100 + 0.05)),
        windBearing: (current.windDirection + 5) % 360,
      },
      {
        name: names[3],
        offsetLat: 0.08,
        offsetLon: 0.28,
        tempOffset: -0.4,
        condition: 'Scattered Cloud',
        rainIntensity: Math.min(1, Math.max(0, current.rainProb / 100)),
        windBearing: current.windDirection,
      },
      {
        name: names[4],
        offsetLat: -0.05,
        offsetLon: -0.26,
        tempOffset: -1.0,
        condition: 'Overcast',
        rainIntensity: Math.min(1, Math.max(0, current.rainProb / 100 + 0.2)),
        windBearing: (current.windDirection - 10 + 360) % 360,
      },
    ];
  }, [location, current]);

  // Timeline auto-play timer
  useEffect(() => {
    if (!isPlayingTimeline) return;
    const interval = setInterval(() => {
      setTimelineIndex((prev) => (prev + 1) % TIMELINE_STEPS.length);
    }, 1400);
    return () => clearInterval(interval);
  }, [isPlayingTimeline]);

  // Pan interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    setPan({
      x: e.touches[0].clientX - dragStart.x,
      y: e.touches[0].clientY - dragStart.y,
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleResetView = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1.5);
  };

  const handleZoom = (delta: number) => {
    setZoom((prev) => Math.min(3.5, Math.max(0.8, prev + delta)));
  };

  // Convert temp helper
  const formatTemp = (c: number) => {
    if (useFahrenheit) {
      return `${Math.round((c * 9) / 5 + 32)}°F`;
    }
    return `${Math.round(c)}°C`;
  };

  // Canvas drawing animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 360);

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        width = canvas.width = entry.contentRect.width;
        height = canvas.height = entry.contentRect.height;
      }
    });

    if (canvas.parentElement) {
      resizeObserver.observe(canvas.parentElement);
    }

    let frameCount = 0;

    // Particle streamlines for wind overlay
    const particles: { x: number; y: number; life: number; maxLife: number; speed: number }[] = [];
    const maxParticles = 65;
    for (let i = 0; i < maxParticles; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        life: Math.random() * 80,
        maxLife: 60 + Math.random() * 50,
        speed: 1 + Math.random() * 1.8,
      });
    }

    const render = () => {
      frameCount++;
      ctx.clearRect(0, 0, width, height);

      // Save base transformation
      ctx.save();

      // Apply Pan and Zoom around center
      const centerX = width / 2;
      const centerY = height / 2;
      ctx.translate(centerX + pan.x, centerY + pan.y);
      ctx.scale(zoom, zoom);
      ctx.translate(-centerX, -centerY);

      // 1. BASE TERRAIN (Topographic styled landmass & coastal contour shading)
      const baseGrad = ctx.createLinearGradient(0, 0, width, height);
      baseGrad.addColorStop(0, '#f8fafc');
      baseGrad.addColorStop(0.5, '#f1f5f9');
      baseGrad.addColorStop(1, '#e2e8f0');
      ctx.fillStyle = baseGrad;
      ctx.fillRect(-width * 0.5, -height * 0.5, width * 2, height * 2);

      // Topographic elevation contours
      ctx.lineWidth = 1.2;
      ctx.strokeStyle = '#cbd5e1';
      ctx.setLineDash([4, 4]);

      for (let r = 80; r < 500; r += 70) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.setLineDash([]);

      // Coordinate Grid Lines (Parallels and Meridians)
      ctx.lineWidth = 0.8;
      ctx.strokeStyle = '#e2e8f0';
      const gridSpacing = 60;
      for (let x = -width; x < width * 2; x += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(x, -height);
        ctx.lineTo(x, height * 2);
        ctx.stroke();
      }
      for (let y = -height; y < height * 2; y += gridSpacing) {
        ctx.beginPath();
        ctx.moveTo(-width, y);
        ctx.lineTo(width * 2, y);
        ctx.stroke();
      }

      // Time displacement from timeline scrubber
      const timeOffset = (timelineIndex - 4) * 18; // minutes shift
      const windAngleRad = ((current.windDirection - 90) * Math.PI) / 180;
      const driftX = Math.cos(windAngleRad) * (timeOffset + frameCount * 0.4);
      const driftY = Math.sin(windAngleRad) * (timeOffset + frameCount * 0.4);

      // -------------------------------------------------------------
      // 2. ACTIVE OVERLAYS
      // -------------------------------------------------------------

      if (activeOverlay === 'radar') {
        // --- PRECIPITATION RADAR (Doppler Reflectivity Cells) ---
        const rainFactor = Math.max(0.2, (current.rainProb || 20) / 100);

        // Radar Cells definition
        const radarCells = [
          { cx: centerX - 80 + driftX, cy: centerY - 60 + driftY, radius: 110 * rainFactor, intensity: 0.85 },
          { cx: centerX + 70 + driftX * 0.9, cy: centerY + 40 + driftY * 0.9, radius: 90 * rainFactor, intensity: 0.65 },
          { cx: centerX - 30 + driftX * 1.1, cy: centerY + 90 + driftY * 1.1, radius: 75 * rainFactor, intensity: 0.5 },
          { cx: centerX + 110 + driftX * 0.8, cy: centerY - 80 + driftY * 0.8, radius: 80 * rainFactor, intensity: 0.4 },
        ];

        // Draw Doppler reflectivity blobs
        radarCells.forEach((cell) => {
          const grad = ctx.createRadialGradient(
            cell.cx,
            cell.cy,
            0,
            cell.cx,
            cell.cy,
            cell.radius
          );
          if (cell.intensity > 0.75) {
            // Intense core (Red / Orange / Yellow / Green)
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.75)');
            grad.addColorStop(0.3, 'rgba(249, 115, 22, 0.65)');
            grad.addColorStop(0.6, 'rgba(234, 179, 8, 0.5)');
            grad.addColorStop(0.85, 'rgba(34, 197, 94, 0.35)');
            grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
          } else if (cell.intensity > 0.5) {
            // Moderate rain (Yellow / Green)
            grad.addColorStop(0, 'rgba(245, 158, 11, 0.7)');
            grad.addColorStop(0.4, 'rgba(34, 197, 94, 0.55)');
            grad.addColorStop(0.8, 'rgba(56, 189, 248, 0.3)');
            grad.addColorStop(1, 'rgba(56, 189, 248, 0)');
          } else {
            // Light drizzle (Cyan / Blue)
            grad.addColorStop(0, 'rgba(56, 189, 248, 0.55)');
            grad.addColorStop(0.6, 'rgba(34, 197, 94, 0.3)');
            grad.addColorStop(1, 'rgba(34, 197, 94, 0)');
          }

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cell.cx, cell.cy, cell.radius, 0, Math.PI * 2);
          ctx.fill();
        });

        // Rotating Doppler Sweep Beam
        const sweepAngle = (frameCount * 0.02) % (Math.PI * 2);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(sweepAngle);

        const sweepGrad = ctx.createLinearGradient(0, 0, 180, 0);
        sweepGrad.addColorStop(0, 'rgba(34, 197, 94, 0.35)');
        sweepGrad.addColorStop(0.8, 'rgba(34, 197, 94, 0.08)');
        sweepGrad.addColorStop(1, 'rgba(34, 197, 94, 0)');

        ctx.fillStyle = sweepGrad;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, 260, 0, 0.25);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else if (activeOverlay === 'clouds') {
        // --- CLOUD COVER DENSITY (Satellite Visible & Infrared) ---
        const cloudiness = Math.max(0.25, (current.cloudCover || 45) / 100);

        const cloudClusters = [
          { cx: centerX - 90 + driftX * 0.6, cy: centerY - 50 + driftY * 0.6, r: 130 * cloudiness },
          { cx: centerX + 60 + driftX * 0.7, cy: centerY + 60 + driftY * 0.7, r: 160 * cloudiness },
          { cx: centerX + 110 + driftX * 0.5, cy: centerY - 70 + driftY * 0.5, r: 110 * cloudiness },
          { cx: centerX - 60 + driftX * 0.65, cy: centerY + 80 + driftY * 0.65, r: 125 * cloudiness },
        ];

        cloudClusters.forEach((c) => {
          const grad = ctx.createRadialGradient(c.cx, c.cy, 0, c.cx, c.cy, c.r);
          grad.addColorStop(0, 'rgba(255, 255, 255, 0.78)');
          grad.addColorStop(0.5, 'rgba(241, 245, 249, 0.6)');
          grad.addColorStop(0.85, 'rgba(203, 213, 225, 0.3)');
          grad.addColorStop(1, 'rgba(203, 213, 225, 0)');

          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(c.cx, c.cy, c.r, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (activeOverlay === 'wind') {
        // --- WIND STREAMLINES (Vector Airflow Velocity) ---
        const windSpeed = Math.max(6, current.windSpeed || 12);
        const dirRad = (current.windDirection * Math.PI) / 180;
        const vx = Math.sin(dirRad) * (windSpeed * 0.12);
        const vy = -Math.cos(dirRad) * (windSpeed * 0.12);

        ctx.lineWidth = 1.6;
        ctx.strokeStyle = '#0284c7';
        ctx.lineCap = 'round';

        particles.forEach((p) => {
          p.x += vx * p.speed;
          p.y += vy * p.speed;
          p.life++;

          if (p.life > p.maxLife || p.x < -100 || p.x > width + 100 || p.y < -100 || p.y > height + 100) {
            p.x = Math.random() * width;
            p.y = Math.random() * height;
            p.life = 0;
          }

          const opacity = Math.sin((p.life / p.maxLife) * Math.PI);
          ctx.strokeStyle = `rgba(14, 165, 233, ${Math.max(0.05, opacity * 0.85)})`;

          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - vx * 4 * p.speed, p.y - vy * 4 * p.speed);
          ctx.stroke();

          // Particle head
          ctx.fillStyle = `rgba(2, 132, 199, ${Math.max(0.1, opacity)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.8, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (activeOverlay === 'temp') {
        // --- TEMPERATURE ISOTHERMS (Thermal Gradient) ---
        const tempGrad = ctx.createLinearGradient(0, height, width, 0);
        if (current.temp > 26) {
          tempGrad.addColorStop(0, 'rgba(234, 88, 12, 0.35)');
          tempGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.28)');
          tempGrad.addColorStop(1, 'rgba(239, 68, 68, 0.4)');
        } else if (current.temp < 10) {
          tempGrad.addColorStop(0, 'rgba(14, 165, 233, 0.35)');
          tempGrad.addColorStop(0.5, 'rgba(56, 189, 248, 0.25)');
          tempGrad.addColorStop(1, 'rgba(99, 102, 241, 0.35)');
        } else {
          tempGrad.addColorStop(0, 'rgba(34, 197, 94, 0.25)');
          tempGrad.addColorStop(0.5, 'rgba(245, 158, 11, 0.22)');
          tempGrad.addColorStop(1, 'rgba(14, 165, 233, 0.25)');
        }

        ctx.fillStyle = tempGrad;
        ctx.fillRect(-width, -height, width * 3, height * 3);
      }

      // -------------------------------------------------------------
      // 3. REGIONAL STATION NODES
      // -------------------------------------------------------------
      nearbyStations.forEach((st) => {
        const sx = centerX + st.offsetLon * 420;
        const sy = centerY - st.offsetLat * 420;

        // Station pin base circle
        ctx.fillStyle = '#ffffff';
        ctx.strokeStyle = '#475569';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Mini temp pill
        ctx.fillStyle = '#1e293b';
        ctx.font = '600 10px sans-serif';
        const labelText = `${Math.round(current.temp + st.tempOffset)}°`;
        ctx.fillText(labelText, sx + 8, sy - 4);
      });

      // -------------------------------------------------------------
      // 4. USER PRIMARY LOCATION PIN & PULSING BEACON
      // -------------------------------------------------------------
      // Animated Beacon Rings
      const pulseSize = (frameCount % 60) / 60;
      ctx.strokeStyle = `rgba(249, 115, 22, ${1 - pulseSize})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8 + pulseSize * 24, 0, Math.PI * 2);
      ctx.stroke();

      // Location Hub Pin
      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(centerX, centerY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      // Pin Ring Border
      ctx.strokeStyle = '#c2410c';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Location Name Tag
      ctx.fillStyle = '#1c1917';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${location.name} (You)`, centerX, centerY - 14);

      ctx.restore();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      resizeObserver.disconnect();
    };
  }, [
    activeOverlay,
    zoom,
    pan,
    timelineIndex,
    current,
    location,
    nearbyStations,
  ]);

  return (
    <div
      ref={containerRef}
      className={`relative bg-white rounded-[28px] p-5 sm:p-6 border border-stone-100 shadow-2xs overflow-hidden flex flex-col justify-between ${
        isFullscreen ? 'fixed inset-4 z-50 shadow-2xl border-stone-300' : 'w-full'
      } ${className}`}
    >
      {/* ------------------------------------------------------------- */}
      {/* MAP HEADER: TITLE, OVERLAY SWITCHER & ZOOM / RESET CONTROLS */}
      {/* ------------------------------------------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3.5 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-100 shadow-2xs">
            <Radio className="w-4 h-4 text-orange-600 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h3 className="font-bold text-base text-stone-900 tracking-tight">
                Regional Weather Radar & Cloud Map
              </h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Live Open-Meteo Mesh
              </span>
            </div>
            <p className="text-[11px] text-stone-500">
              Interactive satellite & Doppler sweep centered on {location.name} ({location.latitude.toFixed(2)}°, {location.longitude.toFixed(2)}°)
            </p>
          </div>
        </div>

        {/* Overlay Mode Switcher Pills */}
        <div className="flex items-center gap-1 bg-stone-100/80 p-1 rounded-2xl border border-stone-200/60 shadow-2xs flex-wrap">
          {[
            { id: 'radar', label: 'Radar (dBZ)', icon: CloudRain },
            { id: 'clouds', label: 'Cloud Cover', icon: Cloud },
            { id: 'wind', label: 'Wind Flow', icon: Wind },
            { id: 'temp', label: 'Thermal', icon: Thermometer },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeOverlay === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveOverlay(tab.id as MapOverlayMode)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isSelected
                    ? 'bg-white text-stone-900 shadow-xs border border-stone-200/80'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-white/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-orange-500' : 'text-stone-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* INTERACTIVE CANVAS MAP CONTAINER */}
      {/* ------------------------------------------------------------- */}
      <div
        className="relative w-full h-[280px] sm:h-[340px] rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-50 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <canvas ref={canvasRef} className="w-full h-full block" />

        {/* HUD: Compass Rose Indicator (Top Right) */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-stone-200/80 shadow-xs flex items-center gap-2 pointer-events-none text-stone-700">
          <Compass
            className="w-4 h-4 text-orange-500 transition-transform duration-700 ease-out"
            style={{ transform: `rotate(${current.windDirection}deg)` }}
          />
          <div className="text-[11px] font-bold">
            <span>{current.windSpeed} km/h</span>
            <span className="text-stone-400 font-normal ml-1">({current.windDirection}°)</span>
          </div>
        </div>

        {/* HUD: Interactive Zoom & Viewport Controls (Bottom Right) */}
        <div className="absolute bottom-3 right-3 flex flex-col gap-1.5 z-10">
          <button
            onClick={() => handleZoom(0.3)}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md text-stone-700 hover:text-stone-900 hover:bg-white border border-stone-200 shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.3)}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md text-stone-700 hover:text-stone-900 hover:bg-white border border-stone-200 shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md text-stone-700 hover:text-orange-600 hover:bg-white border border-stone-200 shadow-sm flex items-center justify-center transition cursor-pointer"
            title="Recenter on current location"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="w-8 h-8 rounded-xl bg-white/95 backdrop-blur-md text-stone-700 hover:text-stone-900 hover:bg-white border border-stone-200 shadow-sm flex items-center justify-center transition cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Expand Regional Map'}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>

        {/* HUD: Active Overlay Dynamic Legend (Bottom Left) */}
        <div className="absolute bottom-3 left-3 bg-white/90 backdrop-blur-md p-2.5 rounded-2xl border border-stone-200/80 shadow-xs pointer-events-none text-stone-800">
          <div className="text-[10px] font-bold text-stone-500 uppercase tracking-wider mb-1 flex items-center gap-1">
            <Layers className="w-3 h-3 text-orange-500" />
            <span>
              {activeOverlay === 'radar' && 'Precipitation Intensity (dBZ)'}
              {activeOverlay === 'clouds' && 'Cloud Density (%)'}
              {activeOverlay === 'wind' && 'Wind Velocity (km/h)'}
              {activeOverlay === 'temp' && 'Thermal Profile'}
            </span>
          </div>

          {activeOverlay === 'radar' && (
            <div className="flex items-center gap-1 text-[9px] font-semibold text-stone-600">
              <span className="w-3 h-2 rounded-xs bg-sky-400" /> 15 Light
              <span className="w-3 h-2 rounded-xs bg-emerald-500 ml-1" /> 30 Moderate
              <span className="w-3 h-2 rounded-xs bg-amber-500 ml-1" /> 45 Heavy
              <span className="w-3 h-2 rounded-xs bg-red-500 ml-1" /> 60 Severe
            </div>
          )}

          {activeOverlay === 'clouds' && (
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-stone-600">
              <div className="w-24 h-2 rounded-full bg-gradient-to-r from-transparent via-slate-300 to-slate-700" />
              <span>{current.cloudCover || 45}% Cloud Ceiling</span>
            </div>
          )}

          {activeOverlay === 'wind' && (
            <div className="text-[10px] font-bold text-sky-700 flex items-center gap-1">
              <Wind className="w-3.5 h-3.5" />
              <span>Vector Stream: {current.windSpeed} km/h from {current.windDirection}°</span>
            </div>
          )}

          {activeOverlay === 'temp' && (
            <div className="flex items-center gap-1.5 text-[9px] font-semibold text-stone-600">
              <span>Cool</span>
              <div className="w-20 h-2 rounded-full bg-gradient-to-r from-sky-400 via-amber-400 to-rose-500" />
              <span>Warm ({formatTemp(current.temp)})</span>
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TIMELINE SCRUBBER & ANIMATION PLAYBACK CONTROLLER */}
      {/* ------------------------------------------------------------- */}
      <div className="mt-3.5 pt-3 border-t border-stone-100 flex flex-wrap items-center justify-between gap-3 text-stone-700">
        {/* Play/Pause Button + Status */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlayingTimeline(!isPlayingTimeline)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isPlayingTimeline
                ? 'bg-orange-500 text-white border-orange-600 shadow-xs'
                : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
            }`}
          >
            {isPlayingTimeline ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlayingTimeline ? 'Pause Loop' : 'Play Radar Loop'}</span>
          </button>

          <span className="text-[11px] text-stone-500 hidden sm:inline">
            Frame: <strong className="text-stone-800">{TIMELINE_STEPS[timelineIndex].label}</strong>
          </span>
        </div>

        {/* Timeline Frame Steps */}
        <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-xl border border-stone-100">
          {TIMELINE_STEPS.map((step, idx) => {
            const isSelected = timelineIndex === idx;
            return (
              <button
                key={step.id}
                onClick={() => {
                  setTimelineIndex(idx);
                  setIsPlayingTimeline(false);
                }}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                  isSelected
                    ? 'bg-stone-900 text-white shadow-2xs'
                    : 'text-stone-400 hover:text-stone-700'
                }`}
              >
                {step.label}
              </button>
            );
          })}
        </div>

        {/* Surrounding Regional Stations Hint */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
          <MapPin className="w-3.5 h-3.5 text-orange-500" />
          <span>{nearbyStations.length} regional mesonet stations active</span>
        </div>
      </div>
    </div>
  );
};
