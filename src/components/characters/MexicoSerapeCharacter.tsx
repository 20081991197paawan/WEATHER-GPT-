import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const MexicoSerapeCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
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
          {/* Serape Primary Vibrant Magenta-Coral Gradient */}
          <linearGradient id="serapeBaseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#db2777" />
          </linearGradient>

          {/* Cyan Artisan Greca Gradient */}
          <linearGradient id="grecaCyanGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#06b6d4" />
            <stop offset="100%" stopColor="#0891b2" />
          </linearGradient>

          {/* Warm Mexican Sunlit Skin */}
          <linearGradient id="mexicoSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>

          {/* Brunette Wavy Hair Gradient */}
          <linearGradient id="mexicoHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="50%" stopColor="#451a03" />
            <stop offset="100%" stopColor="#291102" />
          </linearGradient>

          {/* Woven Canasta Basket Texture */}
          <linearGradient id="basketStrawGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f59e0b" />
            <stop offset="60%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>

          {/* Tailored Pants Dark Earth Tone */}
          <linearGradient id="pantsGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>
        </defs>

        {/* 1. Ground Shadow (Synchronized with Step Downforce) */}
        <ellipse
          cx="110"
          cy="256"
          rx="40"
          ry="7"
          fill="#1e293b"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Walking Legs & Tailored Ankle Trousers with Natural Curvature */}
        {/* Back Leg with Sneaker/Espadrille */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 148px' }}
        >
          {/* Back Thigh & Calf Silhouette */}
          <path
            d="M106 142 C104 170 98 200 93 234 C94 238 103 239 107 236 C111 202 114 170 114 142 Z"
            fill="url(#pantsGrad)"
          />
          {/* Ankle Cuff */}
          <path d="M93 232 L107 234" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          {/* Back Shoe (Espadrille / Casual Sneaker with Espadrille Jute Sole) */}
          <path
            d="M85 240 C85 236 94 234 104 234 C107 234 109 237 108 240 L85 240 Z"
            fill="#f8fafc"
          />
          {/* Jute Sole */}
          <rect x="83" y="240" width="26" height="4" rx="1.5" fill="#d97706" />
        </g>

        {/* Front Leg with Sneaker/Espadrille */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 148px' }}
        >
          {/* Front Thigh, Knee & Calf Silhouette */}
          <path
            d="M112 142 C113 170 120 200 126 234 C128 238 138 238 138 234 C132 200 123 170 120 142 Z"
            fill="url(#pantsGrad)"
          />
          {/* Front Ankle Cuff */}
          <path d="M125 233 L138 233" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
          {/* Front Shoe */}
          <path
            d="M120 240 C120 236 128 234 140 234 C144 234 146 237 144 240 L120 240 Z"
            fill="#ffffff"
          />
          {/* Jute Sole */}
          <rect x="119" y="240" width="27" height="4" rx="1.5" fill="#d97706" />
          {/* White Sneaker Accent Stripe */}
          <line x1="126" y1="237" x2="136" y2="237" stroke="#ec4899" strokeWidth="1.2" />
        </g>

        {/* 3. Woven Market Canasta Basket held in Hand (Pendulum Motion) */}
        <g
          className={isPaused ? '' : 'animate-basket'}
          style={{ transformOrigin: '66px 125px' }}
        >
          {/* Braided Cane Handle */}
          <path
            d="M58 126 C58 106 74 106 74 126"
            stroke="#92400e"
            strokeWidth="3.2"
            fill="none"
            strokeLinecap="round"
          />
          {/* Basket Body (Trapezoid with Curved Base) */}
          <path
            d="M48 126 L84 126 L78 158 C78 162 54 162 54 158 Z"
            fill="url(#basketStrawGrad)"
          />
          {/* Basket Woven Crosshatch Ribs */}
          <g stroke="#92400e" strokeWidth="1.3" opacity="0.6" fill="none">
            <line x1="50" y1="135" x2="82" y2="135" />
            <line x1="52" y1="144" x2="80" y2="144" />
            <line x1="54" y1="152" x2="78" y2="152" />
            <path d="M56 126 L72 158" />
            <path d="M76 126 L60 158" />
          </g>
          {/* Fresh Market Goods Peeking Out (Greenery & Colorful Wrap) */}
          <path d="M52 126 C54 118 64 120 66 126" fill="#16a34a" />
          <path d="M64 126 C68 116 78 118 78 126" fill="#f43f5e" />
        </g>

        {/* 4. The Authentic Mexican Serape Poncho (Layered Geometric Grecas) */}
        <g className={isPaused ? '' : 'animate-fabric'}>
          {/* Base Triangular / Draped Poncho Body */}
          <path
            d="M78 74 C90 70 134 70 146 74 C158 108 162 124 148 142 L112 165 L74 142 C62 124 66 108 78 74 Z"
            fill="url(#serapeBaseGrad)"
          />

          {/* Turquoise / Cyan Greca Band */}
          <polygon points="70,102 154,102 148,118 76,118" fill="url(#grecaCyanGrad)" />

          {/* Golden Yellow Stepped Pattern Band */}
          <polygon points="76,118 148,118 140,134 84,134" fill="#facc15" />
          {/* Traditional Geometric Stepped Insets */}
          <g fill="#78350f" opacity="0.7">
            <polygon points="90,122 95,122 95,130 90,130" />
            <polygon points="105,122 110,122 110,130 105,130" />
            <polygon points="120,122 125,122 125,130 120,130" />
            <polygon points="133,122 138,122 138,130 133,130" />
          </g>

          {/* Deep Navy Diamond Stripe */}
          <polygon points="84,134 140,134 128,150 96,150" fill="#1e1b4b" />
          {/* White Diamond Centers */}
          <polygon points="104,142 112,137 120,142 112,147" fill="#ffffff" />

          {/* Lower Pointed Serape Accent */}
          <polygon points="96,150 128,150 112,165" fill="#f43f5e" />

          {/* Artisanal Wool Fringes dangling along the bottom edge */}
          <g strokeWidth="2.2" strokeLinecap="round">
            <line x1="82" y1="138" x2="82" y2="147" stroke="#facc15" />
            <line x1="92" y1="146" x2="92" y2="155" stroke="#ec4899" />
            <line x1="102" y1="154" x2="102" y2="164" stroke="#06b6d4" />
            <line x1="112" y1="165" x2="112" y2="175" stroke="#ffffff" />
            <line x1="122" y1="154" x2="122" y2="164" stroke="#06b6d4" />
            <line x1="132" y1="146" x2="132" y2="155" stroke="#ec4899" />
            <line x1="142" y1="138" x2="142" y2="147" stroke="#facc15" />
          </g>
        </g>

        {/* 5. Hand holding the Canasta Handle */}
        <g>
          <ellipse cx="66" cy="122" rx="4.5" ry="5.5" fill="url(#mexicoSkinGrad)" />
          {/* Fingers wrapping handle */}
          <path d="M63 120 C64 126 69 126 70 120" stroke="#f59e0b" strokeWidth="1.2" fill="none" />
        </g>

        {/* 6. Graceful Feminine Neck & Collar */}
        <path
          d="M106 56 L106 72 C110 74 114 74 118 72 L118 56 Z"
          fill="url(#mexicoSkinGrad)"
        />
        {/* Subtle Turquoise Bead Necklace */}
        <path d="M106 66 C110 71 114 71 118 66" stroke="#0891b2" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* 7. Expressive Facial Profile */}
        <g>
          {/* Head & Jawline Profile (facing forward-right) */}
          <path
            d="M104 42 C104 32 118 30 122 38 C125 42 125 46 124 48 C125 50 124 53 122 55 C118 58 114 59 110 59 C104 59 103 52 104 42 Z"
            fill="url(#mexicoSkinGrad)"
          />
          {/* Warm Coral Blush */}
          <circle cx="119" cy="48" r="3.2" fill="#f43f5e" opacity="0.28" />
          {/* Almond Eye with Expressive Lash */}
          <path d="M116 43 C118 41 122 41 123 44" stroke="#291102" strokeWidth="1.3" strokeLinecap="round" fill="none" />
          <line x1="122" y1="42" x2="124" y2="41" stroke="#291102" strokeWidth="1.1" strokeLinecap="round" />
          {/* Well-defined Eyebrow */}
          <path d="M114 39 C118 37 122 37 124 40" stroke="#451a03" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          {/* Friendly Warm Terracotta Smile */}
          <path d="M118 53 C120 54.5 123 53.5 123 52" stroke="#be123c" strokeWidth="1.4" strokeLinecap="round" fill="none" />
        </g>

        {/* 8. Lush Wavy Brunette Hair Flowing in Market Breeze */}
        <g>
          {/* Hair Base Crown */}
          <path
            d="M104 44 C100 28 124 24 125 38 C126 44 120 46 114 46 C108 46 106 46 104 44 Z"
            fill="url(#mexicoHairGrad)"
          />
          {/* Cascading Waves Flowing Behind and Over Shoulder */}
          <path
            d="M102 42 C98 52 96 68 100 82 C104 76 106 66 106 58 Z"
            fill="url(#mexicoHairGrad)"
          />
          <path
            d="M105 48 C108 62 110 74 116 84 C118 78 116 66 114 54 Z"
            fill="url(#mexicoHairGrad)"
            opacity="0.9"
          />
          {/* Sunlit Hair Highlight Strand */}
          <path
            d="M108 34 C116 30 122 32 124 38"
            stroke="#92400e"
            strokeWidth="1.2"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
};
