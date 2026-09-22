import React from 'react';
import { WeatherConditionInfo } from '../types';

interface WeatherScene2DBackgroundProps {
  conditionCategory: WeatherConditionInfo['category'];
  isDay?: boolean;
}

export const WeatherScene2DBackground: React.FC<WeatherScene2DBackgroundProps> = ({
  conditionCategory,
  isDay = true,
}) => {
  // Normalize weather condition into supported 2D scene modes
  const isRain =
    conditionCategory === 'rain' ||
    conditionCategory === 'drizzle' ||
    conditionCategory === 'thunderstorm';
  const isSnow = conditionCategory === 'snow';
  const isClear = conditionCategory === 'clear' || conditionCategory === 'partly_cloudy';
  const isCloudy = conditionCategory === 'cloudy' || conditionCategory === 'fog';

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0">
      {/* ------------------------------------------------------------- */}
      {/* 1. ATMOSPHERIC SKY GRADIENT BASELINE                           */}
      {/* ------------------------------------------------------------- */}
      {isClear && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#ffeedd] via-[#fef3c7]/60 to-[#f8fafc] transition-colors duration-1000" />
      )}
      {isRain && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#e2e8f0] via-[#cbd5e1]/50 to-[#f1f5f9] transition-colors duration-1000" />
      )}
      {isSnow && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#f1f5f9] via-[#e2e8f0]/60 to-[#f8fafc] transition-colors duration-1000" />
      )}
      {isCloudy && (
        <div className="absolute inset-0 bg-gradient-to-b from-[#fed7aa]/40 via-[#fef08a]/30 to-[#f8fafc] transition-colors duration-1000" />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. SCENIC TOPOGRAPHY & WEATHER AMBIENCE (Distant Hills/Clouds) */}
      {/* ------------------------------------------------------------- */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 1600 900"
        preserveAspectRatio="xMidYMax slice"
      >
        <defs>
          {/* Sunny Meadow Gradient */}
          <linearGradient id="meadowGradFar" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fed7aa" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fed7aa" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id="meadowGradNear" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#ffedd5" stopOpacity="0.1" />
          </linearGradient>

          {/* Rainy Mist Hills Gradient */}
          <linearGradient id="rainHillsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.1" />
          </linearGradient>

          {/* Snow Hills Gradient */}
          <linearGradient id="snowHillsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#f8fafc" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {/* Far Background Rolling Hills */}
        <path
          d="M0 600 Q300 480 650 560 T1300 520 Q1500 560 1600 540 L1600 900 L0 900 Z"
          fill={isRain ? 'url(#rainHillsGrad)' : isSnow ? 'url(#snowHillsGrad)' : 'url(#meadowGradFar)'}
        />

        {/* Near Foreground Rolling Pathway Ridge */}
        <path
          d="M0 690 Q400 620 850 670 T1600 640 L1600 900 L0 900 Z"
          fill={isRain ? 'url(#rainHillsGrad)' : isSnow ? 'url(#snowHillsGrad)' : 'url(#meadowGradNear)'}
        />

        {/* Distant Windmill (Turning in Sunny / Windy conditions) */}
        {(isClear || isCloudy) && (
          <g transform="translate(1380, 470) scale(0.65)" opacity="0.65">
            {/* Windmill Tower */}
            <polygon points="40,110 48,20 52,20 60,110" fill="#94a3b8" />
            <rect x="47" y="14" width="6" height="8" rx="2" fill="#64748b" />
            {/* Windmill Rotating Blades */}
            <g transform="translate(50, 20)">
              <g className="animate-windmill">
                <line x1="0" y1="0" x2="0" y2="-45" stroke="#64748b" strokeWidth="2.5" />
                <polygon points="-5,-35 0,-45 5,-35" fill="#f97316" opacity="0.8" />
                <line x1="0" y1="0" x2="45" y2="0" stroke="#64748b" strokeWidth="2.5" />
                <polygon points="35,-5 45,0 35,5" fill="#f97316" opacity="0.8" />
                <line x1="0" y1="0" x2="0" y2="45" stroke="#64748b" strokeWidth="2.5" />
                <polygon points="-5,35 0,45 5,35" fill="#f97316" opacity="0.8" />
                <line x1="0" y1="0" x2="-45" y2="0" stroke="#64748b" strokeWidth="2.5" />
                <polygon points="-35,-5 -45,0 -35,5" fill="#f97316" opacity="0.8" />
                <circle cx="0" cy="0" r="3.5" fill="#ea580c" />
              </g>
            </g>
          </g>
        )}

        {/* Flying Swallows / Birds in Clear Weather */}
        {isClear && (
          <g opacity="0.5">
            <path
              d="M320 220 Q328 210 336 220 Q344 210 352 220"
              stroke="#f97316"
              strokeWidth="2"
              strokeLinecap="round"
              fill="none"
              className="animate-float-gentle"
            />
            <path
              d="M360 200 Q366 192 372 200 Q378 192 384 200"
              stroke="#f97316"
              strokeWidth="1.8"
              strokeLinecap="round"
              fill="none"
              className="animate-float-gentle"
              style={{ animationDelay: '0.8s' }}
            />
          </g>
        )}

        {/* Drifting Clouds in Cloudy Weather */}
        {isCloudy && (
          <g className="animate-cloud-drift" opacity="0.6">
            <path
              d="M200 180 C210 150 250 150 265 170 C280 165 305 175 305 195 C320 200 330 220 320 240 L180 240 Z"
              fill="#ffffff"
            />
            <path
              d="M1250 140 C1260 110 1300 110 1315 130 C1330 125 1355 135 1355 155 C1370 160 1380 180 1370 200 L1230 200 Z"
              fill="#ffffff"
            />
          </g>
        )}
      </svg>

      {/* ------------------------------------------------------------- */}
      {/* 3. PARTICLES LAYER (Rain Streaks / Snow Flakes / Leaves)      */}
      {/* ------------------------------------------------------------- */}
      {isRain && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
            {Array.from({ length: 18 }).map((_, i) => (
              <line
                key={i}
                x1={40 + i * 42}
                y1={10 + (i % 5) * 15}
                x2={25 + i * 42}
                y2={65 + (i % 5) * 15}
                stroke="#64748b"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.35"
                className="animate-realistic-rain"
                style={{
                  animationDelay: `${(i * 0.12) % 1.4}s`,
                  animationDuration: `${0.9 + (i % 3) * 0.25}s`,
                }}
              />
            ))}
          </svg>
        </div>
      )}

      {isSnow && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <svg className="w-full h-full" viewBox="0 0 800 600" preserveAspectRatio="none">
            {Array.from({ length: 16 }).map((_, i) => (
              <circle
                key={i}
                cx={30 + i * 50}
                cy={20 + (i % 4) * 30}
                r={2 + (i % 3)}
                fill="#ffffff"
                opacity="0.8"
                className="animate-snow-flake"
                style={{
                  animationDelay: `${(i * 0.2) % 2.5}s`,
                  animationDuration: `${2.2 + (i % 4) * 0.4}s`,
                }}
              />
            ))}
          </svg>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 4. DYNAMIC 2D REALISTIC CHARACTER ANIMATION (Left/Right Wings) */}
      {/* ------------------------------------------------------------- */}

      {/* ============================================================= */}
      {/* CASE A: SUNNY / CLEAR -> Character Cycling in the Sun         */}
      {/* ============================================================= */}
      {isClear && (
        <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 lg:left-20 pointer-events-none">
          <div className="relative w-44 h-48 sm:w-56 sm:h-60 filter drop-shadow-md">
            <svg viewBox="0 0 240 260" className="w-full h-full overflow-visible">
              <defs>
                {/* Bike Frame Gradient */}
                <linearGradient id="bikeFrameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
                {/* Rider Jacket Gradient */}
                <linearGradient id="riderJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#292524" />
                  <stop offset="100%" stopColor="#1c1917" />
                </linearGradient>
                {/* Rider Scarf Gradient */}
                <linearGradient id="scarfGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>
              </defs>

              {/* Ground Shadow with bob sync */}
              <ellipse cx="120" cy="242" rx="75" ry="8" fill="#1c1917" opacity="0.18" className="animate-bike-bob" />

              {/* ================= BICYCLE ================= */}
              {/* Back Wheel (Spinning Spokes & Rim) */}
              <g transform="translate(50, 205)">
                <circle cx="0" cy="0" r="34" stroke="#1c1917" strokeWidth="4.5" fill="none" />
                <circle cx="0" cy="0" r="31" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                {/* Spinning Spokes */}
                <g className="animate-spin-wheel">
                  <line x1="0" y1="-31" x2="0" y2="31" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-31" y1="0" x2="31" y2="0" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-22" y1="-22" x2="22" y2="22" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-22" y1="22" x2="22" y2="-22" stroke="#94a3b8" strokeWidth="1" />
                </g>
                <circle cx="0" cy="0" r="4.5" fill="#f97316" />
              </g>

              {/* Front Wheel (Spinning Spokes & Rim) */}
              <g transform="translate(185, 205)">
                <circle cx="0" cy="0" r="34" stroke="#1c1917" strokeWidth="4.5" fill="none" />
                <circle cx="0" cy="0" r="31" stroke="#cbd5e1" strokeWidth="1.5" fill="none" />
                {/* Spinning Spokes */}
                <g className="animate-spin-wheel">
                  <line x1="0" y1="-31" x2="0" y2="31" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-31" y1="0" x2="31" y2="0" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-22" y1="-22" x2="22" y2="22" stroke="#94a3b8" strokeWidth="1" />
                  <line x1="-22" y1="22" x2="22" y2="-22" stroke="#94a3b8" strokeWidth="1" />
                </g>
                <circle cx="0" cy="0" r="4.5" fill="#f97316" />
              </g>

              {/* Bicycle Frame & Rider Dynamic Bob */}
              <g className="animate-bike-bob">
                {/* Rear Chainstay & Seatstay Tubes */}
                <line x1="50" y1="205" x2="115" y2="205" stroke="url(#bikeFrameGrad)" strokeWidth="4" strokeLinecap="round" />
                <line x1="50" y1="205" x2="95" y2="148" stroke="url(#bikeFrameGrad)" strokeWidth="4" strokeLinecap="round" />
                {/* Main Triangle */}
                <line x1="115" y1="205" x2="95" y2="148" stroke="url(#bikeFrameGrad)" strokeWidth="4.5" strokeLinecap="round" />
                <line x1="95" y1="148" x2="165" y2="148" stroke="url(#bikeFrameGrad)" strokeWidth="4" strokeLinecap="round" />
                <line x1="115" y1="205" x2="165" y2="148" stroke="url(#bikeFrameGrad)" strokeWidth="4.5" strokeLinecap="round" />
                {/* Front Fork & Headtube */}
                <line x1="185" y1="205" x2="165" y2="135" stroke="url(#bikeFrameGrad)" strokeWidth="4" strokeLinecap="round" />
                {/* Handlebars with Ergonomic Grips */}
                <path d="M165 135 L160 120 L175 118" stroke="#292524" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Saddle Seat */}
                <path d="M85 144 C85 142 108 142 108 144 L102 148 L90 148 Z" fill="#1c1917" />

                {/* Bottom Bracket / Chainring */}
                <circle cx="115" cy="205" r="9" fill="#94a3b8" stroke="#1c1917" strokeWidth="2" />

                {/* Pedals & Animated Pedaling Legs */}
                {/* Back Leg Pedaling */}
                <g transform="translate(115, 205)">
                  <g className="animate-pedal-left">
                    <line x1="0" y1="0" x2="-14" y2="0" stroke="#475569" strokeWidth="2.5" />
                    <rect x="-18" y="-3" width="7" height="6" rx="1.5" fill="#1c1917" />
                  </g>
                </g>

                {/* Front Leg Pedaling */}
                <g transform="translate(115, 205)">
                  <g className="animate-pedal-right">
                    <line x1="0" y1="0" x2="14" y2="0" stroke="#475569" strokeWidth="2.5" />
                    <rect x="11" y="-3" width="7" height="6" rx="1.5" fill="#1c1917" />
                  </g>
                </g>

                {/* ================= RIDER BODY ================= */}
                {/* Rider Torso with Dynamic Gentle Sway */}
                <g className="animate-rider-sway" style={{ transformOrigin: '95px 148px' }}>
                  {/* Leg Thigh & Shin Pedaling Silhouette */}
                  <path d="M95 146 L118 178 L126 205" stroke="#1c1917" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  {/* Shoe */}
                  <path d="M124 205 L136 207 L134 211 L122 210 Z" fill="#ea580c" />

                  {/* Rider Upper Torso Lean */}
                  <path d="M94 146 L130 92 L146 98 L110 152 Z" fill="url(#riderJacketGrad)" />
                  {/* White collar detail */}
                  <polygon points="132,92 128,102 138,100" fill="#ffffff" />

                  {/* Rider Arm Reaching to Handlebar */}
                  <path d="M130 96 L152 114 L165 120" stroke="url(#riderJacketGrad)" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                  <circle cx="165" cy="120" r="3.5" fill="#fed7aa" />

                  {/* Fluttering Warm Amber Scarf */}
                  <g transform="translate(132, 90)">
                    <g className="animate-scarf">
                      <path d="M0 0 C-12 -6 -28 -2 -42 -8 C-46 -9 -48 -4 -42 -2 C-26 4 -12 2 0 4 Z" fill="url(#scarfGrad)" />
                      <path d="M0 2 C-14 0 -26 8 -38 6 C-42 5 -44 9 -38 11 C-24 13 -12 7 0 5 Z" fill="#f59e0b" opacity="0.85" />
                    </g>
                  </g>

                  {/* Rider Head & Profile */}
                  <circle cx="138" cy="74" r="13" fill="#fed7aa" />
                  {/* Cute Eyeglasses / Goggles */}
                  <circle cx="144" cy="73" r="4.5" stroke="#ea580c" strokeWidth="1.8" fill="white" opacity="0.9" />
                  <circle cx="144" cy="73" r="1.3" fill="#1c1917" />
                  {/* Smiling Mouth */}
                  <path d="M141 81 Q145 84 148 81" stroke="#1c1917" strokeWidth="1.2" strokeLinecap="round" fill="none" />
                  {/* Dark Hair with Flutter */}
                  <path d="M128 72 C128 58 148 58 152 70 C146 64 132 64 128 72 Z" fill="#451a03" />
                  {/* Cycling Helmet / Cap with Visor */}
                  <path d="M126 68 C126 52 152 52 154 68 L158 69 L148 65 L126 68 Z" fill="#ea580c" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CASE B: RAIN / THUNDERSTORM -> Character Walking in the Rain  */}
      {/* ============================================================= */}
      {isRain && (
        <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 lg:left-20 pointer-events-none">
          <div className="relative w-40 h-52 sm:w-52 sm:h-64 filter drop-shadow-md">
            <svg viewBox="0 0 200 260" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="rainTrenchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#292524" />
                  <stop offset="100%" stopColor="#1c1917" />
                </linearGradient>
                <linearGradient id="rainUmbrellaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>
              </defs>

              {/* Wet Pavement Reflection Shadow with Step Pulse */}
              <ellipse cx="100" cy="245" rx="42" ry="7" fill="#1c1917" opacity="0.3" className="animate-shadow-pulse" />

              {/* Water Splash Ripples at Footstrike */}
              <g transform="translate(75, 245)">
                <ellipse cx="0" cy="0" rx="14" ry="4" stroke="#94a3b8" strokeWidth="1.2" fill="none" opacity="0.6" className="animate-puddle-ripple" />
              </g>

              {/* Realistic Striding Legs */}
              {/* Back Leg */}
              <g className="animate-stride-back" style={{ transformOrigin: '95px 170px' }}>
                <path d="M95 170 L78 220 L88 224" stroke="#1c1917" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Yellow / Orange Rainboot */}
                <path d="M78 220 L96 222 L94 228 L74 226 Z" fill="#f59e0b" />
              </g>

              {/* Front Leg */}
              <g className="animate-stride-front" style={{ transformOrigin: '105px 170px' }}>
                <path d="M105 170 L124 220 L136 220" stroke="#1c1917" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                {/* Yellow / Orange Rainboot */}
                <path d="M120 220 L140 222 L138 228 L118 226 Z" fill="#f59e0b" />
              </g>

              {/* Walking Cadence Upper Body */}
              <g className="animate-walk-cadence">
                {/* Dark Navy / Charcoal Trench Coat */}
                <path d="M82 110 C82 102 122 102 122 110 L130 178 L74 178 Z" fill="url(#rainTrenchGrad)" />
                {/* Crisp White Shirt Collar & Amber Tie */}
                <polygon points="102,110 94,124 110,124" fill="#ffffff" />
                <polygon points="102,124 99,142 102,148 105,142" fill="#f59e0b" />

                {/* Character Face & Hair */}
                <circle cx="102" cy="86" r="14" fill="#fed7aa" />
                {/* Spectacles / Smile */}
                <circle cx="107" cy="85" r="2" fill="#0f172a" />
                <path d="M106 91 Q110 95 114 91" stroke="#0f172a" strokeWidth="1.5" strokeLinecap="round" fill="none" />
                {/* Dark Brown Hairstyle */}
                <path d="M90 84 C90 68 116 68 118 84 C112 76 96 76 90 84 Z" fill="#451a03" />

                {/* Right Arm Holding Umbrella Shaft */}
                <path d="M112 114 L126 138 L108 144" stroke="url(#rainTrenchGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="108" cy="144" r="4.5" fill="#fed7aa" />

                {/* Large Warm Orange Umbrella with Bobbing Dynamics */}
                <g className="animate-umbrella-bob" style={{ transformOrigin: '108px 156px' }}>
                  {/* Shaft & J-Hook Handle */}
                  <line x1="108" y1="52" x2="108" y2="156" stroke="#451a03" strokeWidth="3" strokeLinecap="round" />
                  <path d="M108 156 C108 164 100 164 100 158" stroke="#451a03" strokeWidth="3" strokeLinecap="round" fill="none" />

                  {/* Umbrella Canopy Shell */}
                  <path
                    d="M48 58 C48 -2 168 -2 168 58 C148 54 128 58 108 54 C88 58 68 54 48 58 Z"
                    fill="url(#rainUmbrellaGrad)"
                  />
                  {/* Panel Ribs & Highlights */}
                  <path d="M78 56 C78 20 108 12 108 54" stroke="#fb923c" strokeWidth="1.5" fill="none" />
                  <path d="M138 56 C138 20 108 12 108 54" stroke="#c2410c" strokeWidth="1.5" fill="none" />
                  {/* Finial Tip */}
                  <rect x="106" y="-8" width="4" height="8" rx="1.5" fill="#451a03" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CASE C: CLOUDY / OVERCAST / FOG -> Character Strolling        */}
      {/* ============================================================= */}
      {isCloudy && (
        <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 lg:left-20 pointer-events-none">
          <div className="relative w-40 h-52 sm:w-52 sm:h-64 filter drop-shadow-md">
            <svg viewBox="0 0 200 260" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="cloudyJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#c2410c" />
                </linearGradient>
              </defs>

              {/* Ground Shadow */}
              <ellipse cx="100" cy="245" rx="40" ry="7" fill="#1c1917" opacity="0.2" className="animate-shadow-pulse" />

              {/* Strolling Legs */}
              {/* Back Leg */}
              <g className="animate-walker-leg-left" style={{ transformOrigin: '95px 165px' }}>
                <path d="M95 165 L82 215 L92 220" stroke="#1c1917" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M82 215 L100 217 L98 223 L80 221 Z" fill="#292524" />
              </g>
              {/* Front Leg */}
              <g className="animate-walker-leg-right" style={{ transformOrigin: '105px 165px' }}>
                <path d="M105 165 L120 215 L132 216" stroke="#1c1917" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M118 215 L136 217 L134 223 L116 221 Z" fill="#292524" />
              </g>

              {/* Walking Torso */}
              <g className="animate-walk-cadence">
                {/* Back Arm Swinging */}
                <g className="animate-walker-arm-left" style={{ transformOrigin: '96px 115px' }}>
                  <path d="M96 115 L78 145" stroke="#9a3412" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <circle cx="78" cy="145" r="3.5" fill="#fed7aa" />
                </g>

                {/* Terracotta Puffer Bomber Jacket */}
                <path d="M86 110 C86 102 118 102 118 110 L122 170 L82 170 Z" fill="url(#cloudyJacketGrad)" />
                <polygon points="102,110 96,122 108,122" fill="#fed7aa" />

                {/* Head & Beanie */}
                <circle cx="102" cy="86" r="14" fill="#fed7aa" />
                <circle cx="106" cy="85" r="1.8" fill="#1c1917" />
                <path d="M105 91 Q108 94 112 91" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                {/* Warm Knit Beanie */}
                <path d="M90 82 C90 66 116 66 116 82 Z" fill="#292524" />
                <circle cx="103" cy="65" r="4" fill="#f59e0b" />

                {/* Front Arm Swinging */}
                <g className="animate-walker-arm-right" style={{ transformOrigin: '108px 115px' }}>
                  <path d="M108 115 L128 145" stroke="url(#cloudyJacketGrad)" strokeWidth="6" strokeLinecap="round" fill="none" />
                  <circle cx="128" cy="145" r="3.5" fill="#fed7aa" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* CASE D: SNOW / WINTER -> Character in Cozy Winter Coat       */}
      {/* ============================================================= */}
      {isSnow && (
        <div className="absolute bottom-6 sm:bottom-12 left-4 sm:left-12 lg:left-20 pointer-events-none">
          <div className="relative w-40 h-52 sm:w-52 sm:h-64 filter drop-shadow-md">
            <svg viewBox="0 0 200 260" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id="snowJacketGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#9a3412" />
                </linearGradient>
              </defs>

              {/* Snow Ground Footprints */}
              <ellipse cx="100" cy="245" rx="38" ry="6" fill="#cbd5e1" opacity="0.6" className="animate-shadow-pulse" />

              {/* Striding Winter Boots */}
              <g className="animate-stride-back" style={{ transformOrigin: '95px 170px' }}>
                <path d="M95 170 L80 220 L88 224" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M78 220 L96 222 L94 228 L74 226 Z" fill="#451a03" />
              </g>
              <g className="animate-stride-front" style={{ transformOrigin: '105px 170px' }}>
                <path d="M105 170 L122 220 L134 220" stroke="#1e293b" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <path d="M118 220 L138 222 L136 228 L116 226 Z" fill="#451a03" />
              </g>

              {/* Winter Body with Warm Hood & Fur Trim */}
              <g className="animate-walk-cadence">
                {/* Thick Winter Parka */}
                <path d="M80 110 C80 98 124 98 124 110 L128 178 L76 178 Z" fill="url(#snowJacketGrad)" />
                {/* White Fur Trim around hem */}
                <rect x="74" y="174" width="56" height="8" rx="4" fill="#f8fafc" />

                {/* Warm Cozy Scarf */}
                <g className="animate-scarf" style={{ transformOrigin: '102px 105px' }}>
                  <rect x="88" y="98" width="28" height="14" rx="6" fill="#f59e0b" />
                  <path d="M108 108 L114 135 L124 133 L116 108 Z" fill="#f59e0b" />
                </g>

                {/* Head with Warm Beanie & Pompom */}
                <circle cx="102" cy="84" r="14" fill="#fed7aa" />
                <circle cx="106" cy="83" r="1.8" fill="#1c1917" />
                <path d="M105 89 Q108 92 112 89" stroke="#1c1917" strokeWidth="1.4" strokeLinecap="round" fill="none" />
                {/* Beanie with Snowflake pattern */}
                <path d="M88 80 C88 62 116 62 116 80 Z" fill="#1c1917" />
                <circle cx="102" cy="61" r="5" fill="#f8fafc" />

                {/* Mittened Arms */}
                <path d="M84 112 L70 142 L80 148" stroke="url(#snowJacketGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="80" cy="148" r="4.5" fill="#f59e0b" />

                <path d="M120 112 L134 142 L124 148" stroke="url(#snowJacketGrad)" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                <circle cx="124" cy="148" r="4.5" fill="#f59e0b" />
              </g>
            </svg>
          </div>
        </div>
      )}
    </div>
  );
};
