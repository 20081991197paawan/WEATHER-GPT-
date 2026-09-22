import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const SaharaLinenCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
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
          {/* Airy Linen Tunic Natural Gradient */}
          <linearGradient id="linenTunicGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="60%" stopColor="#f5f5f4" />
            <stop offset="100%" stopColor="#e7e5e4" />
          </linearGradient>

          {/* Linen Pants Soft Sandy Stone */}
          <linearGradient id="linenPantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e7e5e4" />
            <stop offset="60%" stopColor="#d6d3d1" />
            <stop offset="100%" stopColor="#a8a29e" />
          </linearGradient>

          {/* Sun-Kissed Warm Skin */}
          <linearGradient id="saharaSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="60%" stopColor="#fdba74" />
            <stop offset="100%" stopColor="#fb923c" />
          </linearGradient>

          {/* Woven Raffia Straw Hat Gradient */}
          <linearGradient id="raffiaHatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="50%" stopColor="#fde047" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Suede Desert Slip-On Shoes */}
          <linearGradient id="desertShoeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a8a29e" />
            <stop offset="100%" stopColor="#78716c" />
          </linearGradient>
        </defs>

        {/* 1. Golden Sand Dune Ground Shadow */}
        <ellipse
          cx="110"
          cy="256"
          rx="40"
          ry="7"
          fill="#78350f"
          opacity="0.3"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Walking Legs & Relaxed Linen Trousers (Continuous Anatomical Paths) */}
        {/* Back Leg with Desert Shoe */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 145px' }}
        >
          {/* Back Thigh & Calf in Flowing Linen */}
          <path
            d="M106 138 C103 165 97 195 91 234 C92 238 102 240 106 236 C111 200 114 165 114 138 Z"
            fill="url(#linenPantsGrad)"
          />
          {/* Linen Drape Wrinkle Line */}
          <path d="M101 170 C99 190 98 210 97 230" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
          {/* Back Desert Shoe */}
          <path
            d="M84 240 C84 236 93 234 103 234 C106 234 108 237 107 240 L84 240 Z"
            fill="url(#desertShoeGrad)"
          />
          <rect x="82" y="240" width="26" height="3.5" rx="1.5" fill="#57534e" />
        </g>

        {/* Front Leg with Desert Shoe */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 145px' }}
        >
          {/* Front Thigh & Calf */}
          <path
            d="M112 138 C113 165 120 195 126 234 C128 238 138 238 138 234 C132 195 123 165 120 138 Z"
            fill="url(#linenPantsGrad)"
          />
          <path d="M119 170 C122 190 124 210 127 230" stroke="#a8a29e" strokeWidth="1.2" strokeLinecap="round" />
          {/* Front Desert Shoe */}
          <path
            d="M120 240 C120 236 128 234 140 234 C144 234 146 237 144 240 L120 240 Z"
            fill="url(#desertShoeGrad)"
          />
          <rect x="119" y="240" width="27" height="3.5" rx="1.5" fill="#57534e" />
        </g>

        {/* 3. Airy Flowing Linen Caftan / Tunic with Natural Fabric Drape */}
        <g className={isPaused ? '' : 'animate-fabric'}>
          {/* Main Tunic Body */}
          <path
            d="M88 74 C92 70 128 70 134 74 C142 98 144 122 140 148 C130 152 92 152 82 148 C78 122 80 98 88 74 Z"
            fill="url(#linenTunicGrad)"
          />
          {/* Side Slits */}
          <path d="M83 148 C85 136 86 124 87 114" stroke="#d6d3d1" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M139 148 C137 136 136 124 135 114" stroke="#d6d3d1" strokeWidth="1.8" strokeLinecap="round" />

          {/* Mandarin Split Collar & Placket */}
          <path d="M107 72 L111 96 L115 72" stroke="#d6d3d1" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          {/* Delicate Shell Buttons */}
          <circle cx="111" cy="80" r="1.2" fill="#a8a29e" />
          <circle cx="111" cy="88" r="1.2" fill="#a8a29e" />

          {/* Soft Linen Belt Tie */}
          <path d="M86 114 C96 117 126 117 136 114" stroke="#d6d3d1" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          {/* Tie Knot & Tails */}
          <ellipse cx="111" cy="116" rx="2.5" ry="3" fill="#e7e5e4" />
          <path d="M110 118 C108 126 106 134 107 140" stroke="#e7e5e4" strokeWidth="2" strokeLinecap="round" fill="none" />
          <path d="M112 118 C114 125 115 132 113 138" stroke="#e7e5e4" strokeWidth="2" strokeLinecap="round" fill="none" />

          {/* Natural Linen Fold Shadows */}
          <path d="M96 85 C94 105 92 125 94 144" stroke="#e7e5e4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
          <path d="M126 85 C128 105 130 125 128 144" stroke="#e7e5e4" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </g>

        {/* 4. Relaxed Linen Rolled Sleeves & Slender Hands */}
        {/* Left Arm (Swaying gently) */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '88px 75px' }}
        >
          <path
            d="M88 75 C82 92 76 110 74 122 C78 124 84 124 86 120 C88 108 94 92 98 78 Z"
            fill="url(#linenTunicGrad)"
          />
          {/* Rolled Cuff */}
          <rect x="73" y="118" width="14" height="4" rx="1.5" fill="#e7e5e4" />
          {/* Slender Hand */}
          <ellipse cx="78" cy="128" rx="3.8" ry="6" fill="url(#saharaSkinGrad)" />
        </g>

        {/* Right Arm */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '134px 75px' }}
        >
          <path
            d="M134 75 C140 92 146 110 148 122 C144 124 138 124 136 120 C134 108 128 92 124 78 Z"
            fill="url(#linenTunicGrad)"
          />
          {/* Rolled Cuff */}
          <rect x="135" y="118" width="14" height="4" rx="1.5" fill="#e7e5e4" />
          {/* Slender Hand */}
          <ellipse cx="144" cy="128" rx="3.8" ry="6" fill="url(#saharaSkinGrad)" />
        </g>

        {/* 5. Slender Neck & Sun Pendant */}
        <path
          d="M107 56 L107 72 C110 74 114 74 117 72 L117 56 Z"
          fill="url(#saharaSkinGrad)"
        />
        <path d="M108 66 C111 70 113 70 116 66" stroke="#d97706" strokeWidth="1.4" fill="none" />
        <circle cx="112" cy="70" r="1.8" fill="#f59e0b" />

        {/* 6. Chic Facial Profile with Tortoiseshell Sunglasses */}
        <g>
          {/* Head & Refined Jaw Profile */}
          <path
            d="M104 42 C104 32 118 30 122 38 C124 42 124 46 123 48 C124 50 123 52 121 54 C118 57 114 58 110 58 C105 58 103 52 104 42 Z"
            fill="url(#saharaSkinGrad)"
          />
          {/* Subtle Warm Blush */}
          <circle cx="118" cy="48" r="2.8" fill="#ea580c" opacity="0.25" />
          {/* Stylish Desert Sunglasses */}
          <path
            d="M112 41 C114 39 123 39 124 42 C125 45 121 47 116 47 C113 47 111 44 112 41 Z"
            fill="#451a03"
            stroke="#78350f"
            strokeWidth="1.2"
          />
          {/* Lens Glass Highlight Glare */}
          <line x1="117" y1="41" x2="121" y2="44" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" opacity="0.8" />
          {/* Sunglasses Temple Arm */}
          <line x1="112" y1="42" x2="105" y2="41" stroke="#78350f" strokeWidth="1.2" />
          {/* Poised Warm Lip Contour */}
          <path d="M117 52 C119 53.5 122 53 122 51.5" stroke="#c2410c" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>

        {/* 7. Iconic Wide-Brim Woven Raffia Straw Sun Hat (Undulating Brim with Breeze Tilt) */}
        <g
          className={isPaused ? '' : 'animate-hat'}
          style={{ transformOrigin: '112px 42px' }}
        >
          {/* Crown of the Straw Hat */}
          <ellipse cx="112" cy="35" rx="14" ry="9" fill="url(#raffiaHatGrad)" />
          <ellipse cx="112" cy="32" rx="12" ry="6" fill="#fef08a" opacity="0.8" />

          {/* Dark Leather Hat Band with Brass Clasp */}
          <ellipse cx="112" cy="38" rx="14.5" ry="4" fill="#451a03" />
          <rect x="110" y="36.5" width="4" height="3" rx="0.5" fill="#facc15" />

          {/* Wide Undulating Straw Brim */}
          <path
            d="M74 44 C82 38 142 38 150 44 C152 48 142 50 112 50 C82 50 72 48 74 44 Z"
            fill="url(#raffiaHatGrad)"
          />
          {/* Brim Undulation Rim */}
          <path
            d="M74 44 C84 39 140 39 150 44"
            stroke="#f59e0b"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Straw Weave Texture Arc */}
          <path
            d="M78 45 C86 42 138 42 146 45"
            stroke="#d97706"
            strokeWidth="1"
            strokeDasharray="4 3"
            fill="none"
            opacity="0.6"
          />
        </g>
      </svg>
    </div>
  );
};
