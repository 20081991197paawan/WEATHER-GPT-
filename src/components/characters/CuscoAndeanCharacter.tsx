import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const CuscoAndeanCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
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
          {/* Deep Crimson Alpaca Wool Gradient */}
          <linearGradient id="cuscoPonchoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#b91c1c" />
            <stop offset="50%" stopColor="#991b1b" />
            <stop offset="100%" stopColor="#7f1d1d" />
          </linearGradient>

          {/* Andean Bronze Sun-Kissed Skin */}
          <linearGradient id="cuscoSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" />
            <stop offset="60%" stopColor="#fba359" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>

          {/* Technical Charcoal Trekking Pants */}
          <linearGradient id="trekPantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          {/* Sturdy Leather Trail Boots */}
          <linearGradient id="bootsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Chullo Hat Red & Gold Pattern */}
          <linearGradient id="chulloGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#dc2626" />
            <stop offset="100%" stopColor="#991b1b" />
          </linearGradient>
        </defs>

        {/* 1. Stone Pathway Ground Shadow */}
        <ellipse
          cx="110"
          cy="256"
          rx="42"
          ry="7.5"
          fill="#1c1917"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Walking Legs & Sturdy Trail Boots (Continuous Anatomical Paths) */}
        {/* Back Leg with Rugged Trail Boot */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 148px' }}
        >
          {/* Back Thigh & Calf Contour */}
          <path
            d="M106 142 C104 170 98 200 93 234 C94 238 103 239 107 236 C111 202 114 170 114 142 Z"
            fill="url(#trekPantsGrad)"
          />
          {/* Back Rugged Trail Boot */}
          <path
            d="M84 234 L106 234 C108 234 109 237 108 241 L82 241 C82 237 83 234 84 234 Z"
            fill="url(#bootsGrad)"
          />
          {/* Treaded Lug Sole */}
          <rect x="80" y="241" width="29" height="5" rx="1.5" fill="#0f172a" />
          {/* Boot Eyelet & Lace Accents */}
          <circle cx="95" cy="237" r="1" fill="#facc15" />
          <circle cx="99" cy="237" r="1" fill="#facc15" />
        </g>

        {/* Front Leg with Trail Boot */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 148px' }}
        >
          {/* Front Thigh & Calf Contour */}
          <path
            d="M112 142 C113 170 120 200 126 234 C128 238 138 238 138 234 C132 200 123 170 120 142 Z"
            fill="url(#trekPantsGrad)"
          />
          {/* Front Rugged Trail Boot */}
          <path
            d="M118 234 L142 234 C145 234 146 237 145 241 L116 241 C116 237 117 234 118 234 Z"
            fill="url(#bootsGrad)"
          />
          {/* Treaded Lug Sole */}
          <rect x="115" y="241" width="31" height="5" rx="1.5" fill="#0f172a" />
          {/* Laces */}
          <line x1="128" y1="236" x2="134" y2="238" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="128" y1="238" x2="134" y2="236" stroke="#facc15" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* 3. Authentic Heavy Alpaca Wool Poncho (Lliclla / Andean Poncho) */}
        <g className={isPaused ? '' : 'animate-fabric'}>
          {/* Poncho Heavy Wool Silhouette */}
          <path
            d="M76 74 C90 70 134 70 148 74 C160 110 162 128 148 144 L112 168 L74 144 C60 128 64 110 76 74 Z"
            fill="url(#cuscoPonchoGrad)"
          />

          {/* Inca Geometric Band 1: Ochre & Terracotta Tocapu */}
          <polygon points="70,100 154,100 148,116 76,116" fill="#78350f" />

          {/* Inca Geometric Band 2: Andean Turquoise / Cyan */}
          <polygon points="76,116 148,116 140,132 84,132" fill="#0284c7" />

          {/* Woven Inca Stepped Diamond (Chakana Motif) */}
          <g fill="#ffffff" opacity="0.95">
            <polygon points="96,124 100,120 104,124 100,128" />
            <polygon points="112,124 116,120 120,124 116,128" />
            <polygon points="128,124 132,120 136,124 132,128" />
          </g>

          {/* Inca Geometric Band 3: Marigold Yellow */}
          <polygon points="84,132 140,132 128,148 96,148" fill="#f59e0b" />

          {/* Lower Poncho Crimson Point */}
          <polygon points="96,148 128,148 112,168" fill="#7f1d1d" />

          {/* Natural Wool Hem Stitching */}
          <line x1="74" y1="144" x2="112" y2="168" stroke="#facc15" strokeWidth="1.2" strokeDasharray="3 2" />
          <line x1="112" y1="168" x2="148" y2="144" stroke="#facc15" strokeWidth="1.2" strokeDasharray="3 2" />
        </g>

        {/* 4. Crossbody Trail Camera / Field Bag Leather Strap */}
        <path
          d="M84 76 L134 148"
          stroke="#451a03"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        {/* Brass Buckle */}
        <rect x="106" y="108" width="5" height="7" rx="1" fill="#facc15" stroke="#78350f" strokeWidth="0.8" />

        {/* 5. Strong Neck & Chin Contour */}
        <path
          d="M106 58 L106 74 C110 76 114 76 118 74 L118 58 Z"
          fill="url(#cuscoSkinGrad)"
        />

        {/* 6. Focused Explorer Facial Profile (Andean features) */}
        <g>
          {/* Head & Strong Jawline */}
          <path
            d="M104 42 C104 32 118 30 122 38 C125 42 125 46 124 48 C125 51 124 54 122 56 C118 59 113 60 109 60 C104 60 103 52 104 42 Z"
            fill="url(#cuscoSkinGrad)"
          />
          {/* Sun-hardened high cheek contour */}
          <circle cx="119" cy="49" r="3" fill="#b45309" opacity="0.3" />
          {/* Focused explorer gaze */}
          <path d="M116 43 C118 42 121 42 123 44" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" fill="none" />
          {/* Determined brow */}
          <path d="M114 39 C118 37 122 37 124 40" stroke="#1c1917" strokeWidth="1.6" strokeLinecap="round" fill="none" />
          {/* Strong calm lip line */}
          <path d="M117 53 C119 54 122 53.5 122 52.5" stroke="#78350f" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>

        {/* 7. Traditional Andean Chullo Hat with Earflaps & Swaying Tassels */}
        <g>
          {/* Conical Knit Hat Body */}
          <path
            d="M100 42 C102 24 110 16 113 16 C116 16 124 24 126 42 Z"
            fill="url(#chulloGrad)"
          />
          {/* Traditional Knit Patterned Trim (Sun Motif & Diamond) */}
          <rect x="99" y="36" width="28" height="7" rx="1" fill="#facc15" />
          <g stroke="#991b1b" strokeWidth="1" fill="none">
            <path d="M102 39.5 L105 36.5 L108 39.5 L105 42.5 Z" fill="#991b1b" />
            <path d="M111 39.5 L114 36.5 L117 39.5 L114 42.5 Z" fill="#991b1b" />
            <path d="M120 39.5 L123 36.5 L126 39.5 L123 42.5 Z" fill="#991b1b" />
          </g>

          {/* Pom-pom on Hat Peak */}
          <circle cx="113" cy="15" r="3.5" fill="#facc15" />

          {/* Earflap Covering Back Ear */}
          <polygon points="99,40 96,54 103,48" fill="#991b1b" />
          {/* Earflap Covering Front Ear */}
          <polygon points="126,40 129,54 122,48" fill="#991b1b" />

          {/* Long Braided Yarn Tassels (Swaying in Mountain Wind) */}
          {/* Left Tassel */}
          <g
            className={isPaused ? '' : 'animate-tassel'}
            style={{ transformOrigin: '96px 54px' }}
          >
            <path
              d="M96 54 Q94 66 93 76"
              stroke="#facc15"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="93" cy="77" r="2.8" fill="#dc2626" />
          </g>

          {/* Right Tassel */}
          <g
            className={isPaused ? '' : 'animate-tassel'}
            style={{ transformOrigin: '129px 54px' }}
          >
            <path
              d="M129 54 Q131 66 132 76"
              stroke="#facc15"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="132" cy="77" r="2.8" fill="#dc2626" />
          </g>
        </g>
      </svg>
    </div>
  );
};
