import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const AlpsSnowCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
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
          {/* Quilted Crimson Puffer Jacket Gradient */}
          <linearGradient id="pufferGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>

          {/* Heavy Thermal Snow Pants */}
          <linearGradient id="snowPantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Winter Mountaineering Boots */}
          <linearGradient id="snowBootsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>

          {/* Beanie Forest Green Knit */}
          <linearGradient id="beanieGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#16a34a" />
            <stop offset="100%" stopColor="#14532d" />
          </linearGradient>

          {/* Skin */}
          <linearGradient id="alpsSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
        </defs>

        {/* 1. Snow Terrain Ground Shadow */}
        <ellipse
          cx="110"
          cy="256"
          rx="40"
          ry="7"
          fill="#64748b"
          opacity="0.3"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Walking Legs with Insulated Snow Boots */}
        {/* Back Leg */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 145px' }}
        >
          <path
            d="M106 142 C104 170 98 200 93 234 C94 238 103 239 107 236 C111 202 114 170 114 142 Z"
            fill="url(#snowPantsGrad)"
          />
          {/* Back Boot */}
          <path
            d="M84 234 L106 234 C108 234 109 237 108 241 L82 241 C82 237 83 234 84 234 Z"
            fill="url(#snowBootsGrad)"
          />
          <rect x="80" y="241" width="29" height="5" rx="1.5" fill="#0f172a" />
        </g>

        {/* Front Leg */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 145px' }}
        >
          <path
            d="M112 142 C113 170 120 200 126 234 C128 238 138 238 138 234 C132 200 123 170 120 142 Z"
            fill="url(#snowPantsGrad)"
          />
          {/* Front Boot */}
          <path
            d="M118 234 L142 234 C145 234 146 237 145 241 L116 241 C116 237 117 234 118 234 Z"
            fill="url(#snowBootsGrad)"
          />
          <rect x="115" y="241" width="31" height="5" rx="1.5" fill="#0f172a" />
        </g>

        {/* 3. Volumetric Quilted Puffer Jacket */}
        <g className={isPaused ? '' : 'animate-fabric'}>
          {/* Main Puffer Silhouette */}
          <path
            d="M82 76 C88 72 134 72 140 76 C150 96 150 124 144 150 C134 154 88 154 78 150 C72 124 72 96 82 76 Z"
            fill="url(#pufferGrad)"
          />
          {/* Down Baffles / Horizontal Quilting Seams with Puffy Shadows */}
          <path d="M78 94 Q111 98 144 94" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M76 112 Q111 116 146 112" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <path d="M78 130 Q111 134 144 130" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Heavy Winter Front Zipper */}
          <line x1="111" y1="76" x2="111" y2="152" stroke="#0f172a" strokeWidth="2.8" />
        </g>

        {/* 4. Quilted Sleeves & Warm Wool Mittens */}
        {/* Left Sleeve */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '82px 76px' }}
        >
          <path
            d="M82 76 C74 96 70 118 68 130 C74 132 80 132 82 128 C84 116 90 98 94 78 Z"
            fill="url(#pufferGrad)"
          />
          {/* Left Warm Mitten */}
          <ellipse cx="74" cy="135" rx="5" ry="6" fill="#1e293b" />
        </g>

        {/* Right Sleeve */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '140px 76px' }}
        >
          <path
            d="M140 76 C148 96 152 118 154 130 C148 132 142 132 140 128 C138 116 132 98 128 78 Z"
            fill="url(#pufferGrad)"
          />
          {/* Right Warm Mitten */}
          <ellipse cx="148" cy="135" rx="5" ry="6" fill="#1e293b" />
        </g>

        {/* 5. Head, Rosy Winter Cheeks & Knit Beanie with Pom-pom */}
        <g>
          {/* Face */}
          <path
            d="M104 44 C104 34 118 32 122 40 C125 44 125 48 124 50 C125 53 124 55 122 57 C118 60 114 60 110 60 C104 60 103 54 104 44 Z"
            fill="url(#alpsSkinGrad)"
          />
          {/* Rosy Cheeks from Crisp Mountain Cold */}
          <circle cx="119" cy="50" r="3.5" fill="#f43f5e" opacity="0.35" />
          <path d="M116 44 C118 43 121 43 122 45" stroke="#1e293b" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <path d="M118 54 C120 55.5 122 55 122 54" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" fill="none" />

          {/* Ribbed Knit Beanie */}
          <path
            d="M100 44 C100 28 124 28 124 44 Z"
            fill="url(#beanieGrad)"
          />
          {/* Folded Beanie Cuff */}
          <rect x="98" y="40" width="28" height="7" rx="2" fill="#15803d" />
          {/* Fluffy Pom-pom on Top */}
          <circle cx="112" cy="26" r="6" fill="#fef08a" />
          <circle cx="112" cy="26" r="3" fill="#ffffff" opacity="0.7" />
        </g>
      </svg>
    </div>
  );
};
