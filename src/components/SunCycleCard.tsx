import React from 'react';
import { Sunrise, Sunset } from 'lucide-react';

interface SunCycleCardProps {
  sunriseTime?: string;
  sunsetTime?: string;
}

export const SunCycleCard: React.FC<SunCycleCardProps> = ({
  sunriseTime = '05:48 AM',
  sunsetTime = '06:32 PM',
}) => {
  // Compute progress of sun across the day
  // Semicircle arc: from 180 deg (left) to 0 deg (right)
  // Let's position a glowing sun dot around ~35-45% of daylight (or afternoon around 65%)
  const cx = 150;
  const cy = 110;
  const r = 85;

  // Let's calculate based on current time or an aesthetic sweetspot matching the screenshot
  const angleDeg = 135; // Positioned along upper arc as in screenshot
  const angleRad = (angleDeg * Math.PI) / 180;
  const sunX = cx - r * Math.cos(angleRad);
  const sunY = cy - r * Math.sin(angleRad);

  return (
    <div className="w-full max-w-sm rounded-3xl p-5 backdrop-blur-2xl bg-white/[0.07] border border-white/[0.12] shadow-[0_16px_40px_rgba(0,0,0,0.35)] text-white transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18]">
      {/* Top Header Row */}
      <div className="flex items-center justify-between text-xs sm:text-sm text-white/85 mb-2">
        <div className="flex items-center gap-1.5">
          <Sunrise className="w-4 h-4 text-amber-300" />
          <span className="font-normal text-white/90">Sunrise ↗</span>
          <span className="text-white/60 text-xs ml-1 font-mono">{sunriseTime.replace(' AM', '')}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Sunset className="w-4 h-4 text-orange-300" />
          <span className="font-normal text-white/90">Sunset ↘</span>
          <span className="text-white/60 text-xs ml-1 font-mono">{sunsetTime.replace(' PM', '')}</span>
        </div>
      </div>

      {/* Semicircular Dotted Celestial Arc Diagram */}
      <div className="relative w-full h-28 sm:h-32 flex items-center justify-center overflow-visible">
        <svg
          viewBox="0 0 300 130"
          className="w-full h-full overflow-visible"
        >
          <defs>
            <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(251, 191, 36, 1)" />
              <stop offset="50%" stopColor="rgba(245, 158, 11, 0.4)" />
              <stop offset="100%" stopColor="rgba(245, 158, 11, 0)" />
            </radialGradient>
            <radialGradient id="sunAura" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(255, 255, 255, 0.9)" />
              <stop offset="60%" stopColor="rgba(255, 255, 255, 0.3)" />
              <stop offset="100%" stopColor="rgba(255, 255, 255, 0)" />
            </radialGradient>
          </defs>

          {/* Dotted Semicircle Celestial Arc */}
          <path
            d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.35)"
            strokeWidth="2"
            strokeDasharray="4 5"
          />

          {/* Sunrise horizon dot (left) */}
          <circle cx={cx - r} cy={cy} r="3.5" fill="#f59e0b" opacity="0.8" />

          {/* Sunset horizon dot (right) */}
          <circle cx={cx + r} cy={cy} r="3.5" fill="#f97316" opacity="0.8" />

          {/* Glowing Sun Position Indicator along the arc */}
          <circle cx={sunX} cy={sunY} r="14" fill="url(#sunGlow)" />
          <circle cx={sunX} cy={sunY} r="4.5" fill="#ffffff" className="shadow-[0_0_10px_#ffffff]" />

          {/* Subtle connecting ray down to horizon */}
          <line
            x1={sunX}
            y1={sunY}
            x2={cx}
            y2={cy}
            stroke="rgba(255, 255, 255, 0.12)"
            strokeDasharray="2 3"
          />

          {/* Stylized Horizon Arch & Concentric Rays Symbol */}
          {/* Inner half circle */}
          <path
            d={`M ${cx - 24} ${cy} A 24 24 0 0 1 ${cx + 24} ${cy}`}
            fill="none"
            stroke="rgba(255, 255, 255, 0.7)"
            strokeWidth="2"
          />

          {/* Core half circle */}
          <path
            d={`M ${cx - 14} ${cy} A 14 14 0 0 1 ${cx + 14} ${cy}`}
            fill="rgba(255, 255, 255, 0.1)"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth="2"
          />

          {/* Horizon baseline */}
          <line
            x1={cx - 36}
            y1={cy}
            x2={cx + 36}
            y2={cy}
            stroke="rgba(255, 255, 255, 0.5)"
            strokeWidth="1.5"
          />
          <line
            x1={cx - 26}
            y1={cy + 4}
            x2={cx + 26}
            y2={cy + 4}
            stroke="rgba(255, 255, 255, 0.3)"
            strokeWidth="1.5"
          />
        </svg>
      </div>
    </div>
  );
};
