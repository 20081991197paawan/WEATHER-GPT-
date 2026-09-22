import React from 'react';

interface CharacterProps {
  isPaused?: boolean;
}

export const KyotoKimonoCharacter: React.FC<CharacterProps> = ({ isPaused = false }) => {
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
          {/* Kimono Silk Pastel Gradient */}
          <linearGradient id="kyotoKimonoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f472b6" />
            <stop offset="40%" stopColor="#e879f9" />
            <stop offset="100%" stopColor="#c084fc" />
          </linearGradient>

          {/* Obi Royal Purple & Gold Brocade */}
          <linearGradient id="kyotoObiGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#581c87" />
            <stop offset="50%" stopColor="#7e22ce" />
            <stop offset="100%" stopColor="#581c87" />
          </linearGradient>

          {/* Lustrous Hair Gradient */}
          <linearGradient id="kyotoHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#372f2f" />
            <stop offset="50%" stopColor="#1e1b18" />
            <stop offset="100%" stopColor="#0f0e0d" />
          </linearGradient>

          {/* Skin Soft Ambient Gradient */}
          <linearGradient id="kyotoSkinGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fff1e6" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>

          {/* Wooden Geta Texture */}
          <linearGradient id="getaWoodGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#713f12" />
          </linearGradient>
        </defs>

        {/* 1. Ground Shadow with Natural Step Pulse */}
        <ellipse
          cx="110"
          cy="256"
          rx="38"
          ry="7"
          fill="#1e293b"
          className={isPaused ? '' : 'animate-shadow-pulse'}
        />

        {/* 2. Legs & Traditional Footwear (Continuous Anatomical Paths) */}
        {/* Back Leg with White Tabi Sock & Lacquered Wooden Geta */}
        <g
          className={isPaused ? '' : 'animate-stride-back'}
          style={{ transformOrigin: '110px 170px' }}
        >
          {/* Back Ankle & Calf */}
          <path
            d="M103 180 C102 200 99 220 97 236 C97 240 106 242 109 238 C111 222 112 200 112 180 Z"
            fill="#ffffff"
            stroke="#e2e8f0"
            strokeWidth="0.8"
          />
          {/* Back Wooden Geta Sole */}
          <rect x="91" y="242" width="22" height="4" rx="1.5" fill="url(#getaWoodGrad)" />
          {/* Back Geta Teeth (Ha) */}
          <rect x="94" y="246" width="3.5" height="6" rx="0.5" fill="#713f12" />
          <rect x="106" y="246" width="3.5" height="6" rx="0.5" fill="#713f12" />
          {/* Crimson Velvet Hanao (Toe Thong) */}
          <path d="M100 238 C100 242 102 243 103 243" stroke="#e11d48" strokeWidth="2.5" strokeLinecap="round" />
        </g>

        {/* Front Leg with White Tabi Sock & Wooden Geta */}
        <g
          className={isPaused ? '' : 'animate-stride-front'}
          style={{ transformOrigin: '110px 170px' }}
        >
          {/* Front Ankle & Tabi Foot */}
          <path
            d="M112 180 C113 200 117 222 121 238 C122 243 133 243 134 239 C130 222 124 200 121 180 Z"
            fill="#ffffff"
            stroke="#f1f5f9"
            strokeWidth="0.8"
          />
          {/* Front Wooden Geta Sole */}
          <rect x="114" y="244" width="24" height="4.5" rx="1.5" fill="url(#getaWoodGrad)" />
          {/* Front Geta Teeth (Ha) */}
          <rect x="117" y="248.5" width="4" height="6.5" rx="0.5" fill="#713f12" />
          <rect x="130" y="248.5" width="4" height="6.5" rx="0.5" fill="#713f12" />
          {/* Crimson Velvet Hanao Straps */}
          <path d="M124 240 C124 244 127 245 128 245" stroke="#e11d48" strokeWidth="2.8" strokeLinecap="round" />
          <path d="M120 244 L124 240 L129 244" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" fill="none" />
        </g>

        {/* 3. Lower Kimono Robe & Skirt (Susomawashi) with Flowing Silhouette */}
        <g className={isPaused ? '' : 'animate-hem-swish'}>
          {/* Outer Wrapped Layer */}
          <path
            d="M86 130 C82 165 84 205 92 232 C105 236 126 236 138 232 C145 205 146 165 142 130 Z"
            fill="url(#kyotoKimonoGrad)"
          />
          {/* Delicate Kimono Fold Shadow */}
          <path
            d="M102 130 C101 165 103 205 106 233 L120 234 C123 205 125 165 122 130 Z"
            fill="#a855f7"
            opacity="0.25"
          />
          {/* Kimono Overlap Edge (Left-over-Right) */}
          <path
            d="M96 130 C98 165 105 200 114 234"
            stroke="#fbcfe8"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          {/* Cherry Blossom Floral Crests on Fabric */}
          <g opacity="0.9">
            <circle cx="98" cy="165" r="4.5" fill="#fff1f2" />
            <circle cx="98" cy="165" r="1.5" fill="#f43f5e" />
            <circle cx="128" cy="180" r="5" fill="#fff1f2" />
            <circle cx="128" cy="180" r="1.6" fill="#f43f5e" />
            <circle cx="106" cy="208" r="4.5" fill="#fff1f2" />
            <circle cx="106" cy="208" r="1.4" fill="#f43f5e" />
            <circle cx="130" cy="216" r="3.8" fill="#fff1f2" />
            <circle cx="130" cy="216" r="1.2" fill="#f43f5e" />
          </g>
        </g>

        {/* 4. Wide Royal Purple Obi Sash & Golden Obi-jime Cord */}
        <g>
          {/* Obi Base */}
          <rect x="85" y="112" width="52" height="26" rx="3" fill="url(#kyotoObiGrad)" />
          {/* Obi Brocade Subtle Diamond Pattern */}
          <g opacity="0.4" stroke="#fef08a" strokeWidth="1" fill="none">
            <path d="M92 125 L97 118 L102 125 L97 132 Z" />
            <path d="M106 125 L111 118 L116 125 L111 132 Z" />
            <path d="M120 125 L125 118 L130 125 L125 132 Z" />
          </g>
          {/* Obi-age (Pale Pink Silk Sash Top Border) */}
          <rect x="86" y="112" width="50" height="4" rx="1.5" fill="#fbcfe8" />
          {/* Obi-jime Golden Braided Cord with Center Brooch */}
          <line x1="85" y1="125" x2="137" y2="125" stroke="#fbbf24" strokeWidth="2.5" />
          <circle cx="111" cy="125" r="3.2" fill="#ef4444" stroke="#fbbf24" strokeWidth="1" />
        </g>

        {/* 5. Kimono Torso & Crossed Neckline (Eri) */}
        <g>
          {/* Torso Silhouette */}
          <path
            d="M90 68 C88 85 86 102 86 114 L136 114 C136 102 134 85 132 68 Z"
            fill="url(#kyotoKimonoGrad)"
          />
          {/* Inner White Han-eri Collar */}
          <path
            d="M102 68 L111 88 L118 68"
            stroke="#ffffff"
            strokeWidth="3.2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Outer Kimono Eri Collar (Graceful V-neck) */}
          <path
            d="M97 68 L111 96 L124 68"
            stroke="#581c87"
            strokeWidth="3.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 6. Long Flowing Furisode Sleeves (Swaying in Spring Breeze) */}
        {/* Left Sleeve (Backside) */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '87px 72px' }}
        >
          <path
            d="M87 72 C77 95 72 135 68 175 C80 182 92 170 94 135 L94 82 Z"
            fill="#c084fc"
            stroke="#a855f7"
            strokeWidth="0.8"
          />
          <circle cx="78" cy="145" r="3.5" fill="#fff1f2" opacity="0.9" />
          <circle cx="78" cy="145" r="1.2" fill="#f43f5e" opacity="0.9" />
          {/* Delicate Poised Hand inside sleeve opening */}
          <ellipse cx="88" cy="136" rx="4.5" ry="6" fill="url(#kyotoSkinGrad)" />
        </g>

        {/* Right Sleeve (Frontside) */}
        <g
          className={isPaused ? '' : 'animate-sleeve'}
          style={{ transformOrigin: '135px 72px' }}
        >
          <path
            d="M135 72 C145 95 150 135 154 175 C142 182 130 170 128 135 L128 82 Z"
            fill="#e879f9"
            stroke="#d946ef"
            strokeWidth="0.8"
          />
          <circle cx="144" cy="140" r="3.5" fill="#fff1f2" opacity="0.9" />
          <circle cx="144" cy="140" r="1.2" fill="#f43f5e" opacity="0.9" />
          {/* Poised Front Hand */}
          <ellipse cx="132" cy="136" rx="4.5" ry="6" fill="url(#kyotoSkinGrad)" />
          {/* Delicate fingers contour */}
          <path d="M132 142 C134 144 136 142 136 140" stroke="#fed7aa" strokeWidth="1" fill="none" />
        </g>

        {/* 7. Elegant Slender Neck */}
        <path
          d="M106 54 L106 70 C109 72 113 72 116 70 L116 54 Z"
          fill="url(#kyotoSkinGrad)"
        />

        {/* 8. Graceful Feminine Facial Profile */}
        <g>
          {/* Head & Jawline Profile (Three-quarter perspective facing right) */}
          <path
            d="M104 42 C104 32 118 30 122 38 C124 42 124 46 123 48 C124 50 123 52 121 54 C118 57 114 58 110 58 C105 58 103 52 104 42 Z"
            fill="url(#kyotoSkinGrad)"
          />
          {/* Subtle Pink Blush on Cheek */}
          <circle cx="118" cy="48" r="3" fill="#f43f5e" opacity="0.25" />
          {/* Graceful Almond Eye with Eyelash */}
          <path d="M116 43 C118 41 121 41 122 43" stroke="#1e1b18" strokeWidth="1.2" strokeLinecap="round" fill="none" />
          <line x1="121" y1="42" x2="123" y2="41" stroke="#1e1b18" strokeWidth="1" strokeLinecap="round" />
          {/* Eyebrow */}
          <path d="M115 39 C118 38 121 38 123 40" stroke="#372f2f" strokeWidth="1" strokeLinecap="round" fill="none" />
          {/* Refined Lip Line with Crimson Touch */}
          <path d="M118 52 C120 53 122 52 122 51" stroke="#e11d48" strokeWidth="1.3" strokeLinecap="round" fill="none" />
        </g>

        {/* 9. Nihongami Chignon Hair & Gold Kanzashi Hairpin */}
        <g>
          {/* Main Hair Volume with Lustrous Texture */}
          <path
            d="M103 44 C100 30 122 26 124 40 C125 46 121 48 116 48 C110 48 106 48 103 44 Z"
            fill="url(#kyotoHairGrad)"
          />
          {/* Low Chignon Bun at the Back */}
          <ellipse cx="102" cy="38" rx="8.5" ry="9" fill="url(#kyotoHairGrad)" />
          <path
            d="M96 36 C95 32 108 30 109 36"
            stroke="#44403c"
            strokeWidth="1.2"
            fill="none"
          />
          {/* Traditional Gold Kanzashi Hairpin */}
          <line x1="94" y1="32" x2="114" y2="42" stroke="#f59e0b" strokeWidth="2.4" strokeLinecap="round" />
          {/* Dangling Coral Bead & Blossom on Hairpin */}
          <circle cx="93" cy="31" r="3.2" fill="#ef4444" stroke="#fbbf24" strokeWidth="0.8" />
          <circle cx="92" cy="36" r="2" fill="#ef4444" />
        </g>
      </svg>
    </div>
  );
};
