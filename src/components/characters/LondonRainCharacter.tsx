import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const LondonRainCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
  return (
    <div className={`relative flex items-center justify-center ${isPaused ? '' : 'animate-walk-cadence'}`}>
      <svg
        width="220"
        height="270"
        viewBox="0 0 220 270"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="overflow-visible select-none pointer-events-none drop-shadow-sm"
      >
        <defs>
          {/* Classic London Yellow Rain Slicker Gradient */}
          <linearGradient id="raincoatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#facc15" />
            <stop offset="100%" stopColor="#eab308" />
          </linearGradient>

          {/* Dark Charcoal Waterproof Pants */}
          <linearGradient id="rainPantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Skin */}
          <linearGradient id="londonSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>

          {/* Glossy Black Chelsea Rainboots */}
          <linearGradient id="rainbootGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#020617" />
          </linearGradient>
        </defs>

        {/* 1. Wet Pavement Reflection Shadow */}
        <ellipse
          cx="110"
          cy="256"
          rx="40"
          ry="7"
          fill="#0f172a"
          opacity="0.35"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Walking Legs with Glossy Rainboots */}
        {/* Back Leg */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 145px' }}
        >
          <path
            d="M106 142 C104 170 98 200 93 234 C94 238 103 239 107 236 C111 202 114 170 114 142 Z"
            fill="url(#rainPantsGrad)"
          />
          {/* Back Glossy Boot */}
          <path
            d="M84 234 L106 234 C108 234 109 237 108 241 L82 241 C82 237 83 234 84 234 Z"
            fill="url(#rainbootGrad)"
          />
          <rect x="80" y="241" width="29" height="5" rx="1.5" fill="#020617" />
          {/* Gloss highlight on boot */}
          <line x1="88" y1="235" x2="98" y2="235" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* Front Leg */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 145px' }}
        >
          <path
            d="M112 142 C113 170 120 200 126 234 C128 238 138 238 138 234 C132 200 123 170 120 142 Z"
            fill="url(#rainPantsGrad)"
          />
          {/* Front Boot */}
          <path
            d="M118 234 L142 234 C145 234 146 237 145 241 L116 241 C116 237 117 234 118 234 Z"
            fill="url(#rainbootGrad)"
          />
          <rect x="115" y="241" width="31" height="5" rx="1.5" fill="#020617" />
          <line x1="124" y1="235" x2="136" y2="235" stroke="#94a3b8" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
        </g>

        {/* 3. Classic Yellow Waterproof Rain Slicker */}
        <g className={isPaused ? '' : 'animate-fabric'}>
          {/* Main Coat Silhouette */}
          <path
            d="M84 76 C90 72 132 72 138 76 C146 100 148 128 144 154 C134 158 88 158 78 154 C74 128 76 100 84 76 Z"
            fill="url(#raincoatGrad)"
          />
          {/* Storm Flap & Snap Fasteners */}
          <line x1="112" y1="76" x2="112" y2="156" stroke="#ca8a04" strokeWidth="2.5" />
          <circle cx="112" cy="88" r="2" fill="#713f12" />
          <circle cx="112" cy="106" r="2" fill="#713f12" />
          <circle cx="112" cy="124" r="2" fill="#713f12" />
          <circle cx="112" cy="142" r="2" fill="#713f12" />

          {/* Flap Pockets */}
          <rect x="84" y="126" width="16" height="14" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
          <rect x="122" y="126" width="16" height="14" rx="2" fill="#eab308" stroke="#ca8a04" strokeWidth="1" />
        </g>

        {/* 4. Sleeves & Hands */}
        {/* Left Sleeve */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '84px 76px' }}
        >
          <path
            d="M84 76 C76 96 72 118 70 130 C76 132 82 132 84 128 C86 116 92 98 96 78 Z"
            fill="url(#raincoatGrad)"
          />
          <ellipse cx="76" cy="134" rx="4" ry="5.5" fill="url(#londonSkinGrad)" />
        </g>

        {/* Right Sleeve holding Umbrella Handle */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '138px 76px' }}
        >
          <path
            d="M138 76 C146 96 150 118 152 130 C146 132 140 132 138 128 C136 116 130 98 126 78 Z"
            fill="url(#raincoatGrad)"
          />
          <ellipse cx="146" cy="134" rx="4" ry="5.5" fill="url(#londonSkinGrad)" />
        </g>

        {/* 5. Raincoat Hood & Face Profile */}
        <g>
          {/* Yellow Hood Drape behind head */}
          <path
            d="M100 36 C100 20 126 20 126 36 C128 46 126 56 122 62 C116 66 104 66 100 58 Z"
            fill="url(#raincoatGrad)"
          />
          {/* Hood Brim Opening */}
          <path
            d="M106 38 C106 30 120 28 122 36 C124 44 120 54 116 56 C112 56 108 54 106 48 Z"
            fill="url(#londonSkinGrad)"
          />
          {/* Eye & Brow */}
          <path d="M116 42 C118 41 121 41 122 43" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M115 38 C118 37 121 37 123 39" stroke="#334155" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Smile */}
          <path d="M118 50 C120 51.5 122 51 122 50" stroke="#be123c" strokeWidth="1.2" strokeLinecap="round" fill="none" />
        </g>
      </svg>
    </div>
  );
};
