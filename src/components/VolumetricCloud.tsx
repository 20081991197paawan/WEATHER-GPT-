import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { WeatherConditionInfo } from '../types';

interface VolumetricCloudProps {
  category: WeatherConditionInfo['category'];
  rainProb?: number;
}

export const VolumetricCloud: React.FC<VolumetricCloudProps> = ({
  category,
  rainProb = 0,
}) => {
  const [lightning, setLightning] = useState(false);

  // Lightning effect for thunderstorms
  useEffect(() => {
    if (category !== 'thunderstorm') {
      setLightning(false);
      return;
    }

    const interval = setInterval(() => {
      if (Math.random() < 0.35) {
        setLightning(true);
        setTimeout(() => setLightning(false), 140);
        setTimeout(() => {
          if (Math.random() < 0.5) {
            setLightning(true);
            setTimeout(() => setLightning(false), 90);
          }
        }, 220);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [category]);

  const isRainy = category === 'rain' || category === 'thunderstorm' || category === 'drizzle';

  return (
    <div className="relative w-full max-w-2xl mx-auto flex items-center justify-center select-none pointer-events-none">
      <motion.div
        animate={{
          y: [-6, 8, -6],
          rotate: [-0.5, 0.6, -0.5],
        }}
        transition={{
          duration: 7,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-[340px] sm:w-[460px] md:w-[540px] h-[260px] sm:h-[320px] md:h-[360px] flex items-center justify-center"
      >
        {/* Ambient Backlight Glow */}
        <div
          className={`absolute inset-0 rounded-full blur-[80px] transition-all duration-700 ${
            lightning
              ? 'bg-cyan-200/50 scale-110'
              : category === 'clear'
              ? 'bg-amber-400/20'
              : 'bg-blue-400/15'
          }`}
        />

        {/* Rain streaks pouring directly from cloud base */}
        {isRainy && (
          <div className="absolute top-[65%] left-[15%] right-[15%] h-[120px] overflow-hidden opacity-75 pointer-events-none">
            <svg className="w-full h-full" viewBox="0 0 400 120" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cloudRainGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(215, 235, 255, 0.7)" />
                  <stop offset="100%" stopColor="rgba(180, 210, 245, 0.05)" />
                </linearGradient>
              </defs>
              {Array.from({ length: 28 }).map((_, i) => {
                const x = 20 + i * 13 + (i % 3) * 2;
                const strokeWidth = (i % 3 === 0 ? 1.5 : 1);
                const delay = (i * 0.12) % 1.2;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={0}
                    x2={x - 8}
                    y2={95 + (i % 4) * 6}
                    stroke="url(#cloudRainGrad)"
                    strokeWidth={strokeWidth}
                    strokeDasharray="14 12"
                    className="animate-[dash_1s_linear_infinite]"
                    style={{ animationDelay: `${delay}s` }}
                  />
                );
              })}
            </svg>
          </div>
        )}

        {/* Realistic Volumetric Cloud SVG Composite Structure */}
        <svg
          viewBox="0 0 600 400"
          className="w-full h-full drop-shadow-[0_20px_45px_rgba(0,0,0,0.65)] overflow-visible"
        >
          <defs>
            {/* Dark Storm Cloud Base Gradient */}
            <radialGradient id="stormDeep" cx="50%" cy="65%" r="60%">
              <stop offset="0%" stopColor={lightning ? '#3a4b66' : '#222b38'} />
              <stop offset="60%" stopColor="#18202b" />
              <stop offset="100%" stopColor="#10151d" />
            </radialGradient>

            {/* Mid Cloud Volumetric Puff Gradient */}
            <radialGradient id="cloudPuff1" cx="40%" cy="35%" r="65%">
              <stop offset="0%" stopColor={lightning ? '#eaf2ff' : '#9bb0c7'} />
              <stop offset="55%" stopColor="#55697f" />
              <stop offset="85%" stopColor="#2e3a49" />
              <stop offset="100%" stopColor="#1e2733" />
            </radialGradient>

            {/* Top Bright Volumetric Highlight Puff */}
            <radialGradient id="cloudPuffHighlight" cx="45%" cy="30%" r="60%">
              <stop offset="0%" stopColor={lightning ? '#ffffff' : '#d8e4f2'} />
              <stop offset="45%" stopColor="#9cb3cc" />
              <stop offset="80%" stopColor="#506277" />
              <stop offset="100%" stopColor="#2a3543" />
            </radialGradient>

            {/* Left Puff Volume */}
            <radialGradient id="cloudPuffLeft" cx="35%" cy="35%" r="60%">
              <stop offset="0%" stopColor={lightning ? '#d8e8fc' : '#889eb7'} />
              <stop offset="55%" stopColor="#415366" />
              <stop offset="100%" stopColor="#1c2530" />
            </radialGradient>

            {/* Right Puff Volume */}
            <radialGradient id="cloudPuffRight" cx="45%" cy="35%" r="60%">
              <stop offset="0%" stopColor={lightning ? '#f0f6ff' : '#a8bed6'} />
              <stop offset="50%" stopColor="#596f87" />
              <stop offset="100%" stopColor="#222c38" />
            </radialGradient>

            {/* Core Lightning Flash Glow Filter */}
            <filter id="cloudSoftGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Deep Underlying Storm Mass */}
          <g filter="url(#cloudSoftGlow)" opacity={lightning ? 0.95 : 0.85}>
            <ellipse cx="300" cy="240" rx="190" ry="75" fill="url(#stormDeep)" />
            <ellipse cx="230" cy="220" rx="140" ry="70" fill="url(#stormDeep)" />
            <ellipse cx="370" cy="225" rx="130" ry="65" fill="url(#stormDeep)" />
          </g>

          {/* Main Volumetric Billow Clusters (Layered 3D Puffs) */}
          {/* Bottom Left Billow */}
          <ellipse cx="190" cy="210" rx="90" ry="65" fill="url(#cloudPuffLeft)" />

          {/* Bottom Right Billow */}
          <ellipse cx="400" cy="205" rx="95" ry="65" fill="url(#cloudPuffRight)" />

          {/* Far Left Side Billow */}
          <circle cx="140" cy="210" r="50" fill="url(#cloudPuffLeft)" opacity="0.9" />

          {/* Far Right Side Billow */}
          <circle cx="450" cy="205" r="52" fill="url(#cloudPuffRight)" opacity="0.9" />

          {/* Mid Tier Billow Cluster */}
          <circle cx="230" cy="165" r="75" fill="url(#cloudPuff1)" />
          <circle cx="365" cy="160" r="78" fill="url(#cloudPuffRight)" />

          {/* Majestic Center Top Volumetric Peak */}
          <circle cx="295" cy="130" r="88" fill="url(#cloudPuffHighlight)" />

          {/* Subtle Secondary Top Nodes */}
          <circle cx="350" cy="135" r="70" fill="url(#cloudPuffHighlight)" />
          <circle cx="245" cy="140" r="68" fill="url(#cloudPuff1)" />

          {/* Fine Billowy Vapor Highlights along the crest */}
          <ellipse cx="290" cy="95" rx="55" ry="32" fill="url(#cloudPuffHighlight)" opacity={lightning ? 0.95 : 0.8} />
          <ellipse cx="340" cy="105" rx="42" ry="26" fill="url(#cloudPuffHighlight)" opacity={lightning ? 0.9 : 0.75} />
          <ellipse cx="235" cy="112" rx="45" ry="28" fill="url(#cloudPuffLeft)" opacity={lightning ? 0.85 : 0.7} />

          {/* Lightning Core Discharge effect inside cloud */}
          {lightning && (
            <g>
              <ellipse cx="300" cy="170" rx="140" ry="70" fill="rgba(195, 230, 255, 0.75)" filter="url(#cloudSoftGlow)" />
              <path
                d="M 295 110 L 285 160 L 315 170 L 290 230"
                stroke="#ffffff"
                strokeWidth="3.5"
                strokeLinecap="round"
                fill="none"
                filter="url(#cloudSoftGlow)"
              />
            </g>
          )}

          {/* Base Atmospheric Mist & Fog Wisps */}
          <g opacity="0.55" className="mix-blend-screen">
            <ellipse cx="290" cy="245" rx="170" ry="28" fill="rgba(145, 175, 205, 0.2)" filter="url(#cloudSoftGlow)" />
            <ellipse cx="330" cy="255" rx="130" ry="22" fill="rgba(120, 150, 180, 0.25)" filter="url(#cloudSoftGlow)" />
          </g>
        </svg>

        {/* Ambient floating vapor wisps around the cloud */}
        <div className="absolute -top-4 -left-4 w-28 h-28 rounded-full bg-slate-300/10 blur-xl pointer-events-none" />
        <div className="absolute top-8 -right-6 w-32 h-32 rounded-full bg-slate-200/10 blur-2xl pointer-events-none" />
      </motion.div>
    </div>
  );
};
