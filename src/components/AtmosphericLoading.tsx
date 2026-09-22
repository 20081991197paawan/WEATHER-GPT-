import React from 'react';
import { motion } from 'motion/react';
import { Cloud, Loader2, Sparkles, Radio } from 'lucide-react';

interface AtmosphericLoadingProps {
  locationName?: string;
  isDetectingGps?: boolean;
  statusMessage?: string;
}

export const AtmosphericLoading: React.FC<AtmosphericLoadingProps> = ({
  locationName = 'Selected Region',
  isDetectingGps = false,
  statusMessage,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#17191d] text-white overflow-hidden select-none">
      {/* 1. Deep Atmospheric Vignette & Soft Warm Radiance */}
      <div className="absolute inset-0 bg-radial from-[#2a2420]/70 via-[#1c1b1a] to-[#121110]" />
      <div className="absolute top-1/3 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* 2. Centerpiece Volumetric Glowing Cloud with Radar Sweep */}
      <div className="relative z-10 flex flex-col items-center justify-center">
        <div className="relative w-48 h-48 sm:w-56 sm:h-56 flex items-center justify-center mb-8">
          {/* Radar Scanning Ring 1 */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 rounded-full border border-dashed border-amber-500/30"
          />

          {/* Radar Scanning Ring 2 with glowing pulse */}
          <motion.div
            animate={{ scale: [0.85, 1.15, 0.85], opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -inset-4 rounded-full border border-orange-400/30 blur-[1px]"
          />

          {/* Central Volumetric Cloud Silhouette */}
          <motion.div
            animate={{ y: [-4, 6, -4], scale: [0.98, 1.02, 0.98] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-32 h-32 rounded-full flex items-center justify-center drop-shadow-[0_0_35px_rgba(249,115,22,0.3)]"
          >
            <Cloud className="w-24 h-24 text-white fill-amber-500/10 stroke-[1.2]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin opacity-90" />
            </div>
          </motion.div>
        </div>

        {/* Brand & Loading Typography */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center space-y-2 max-w-sm px-4"
        >
          <div className="text-xl sm:text-2xl font-display font-medium tracking-wider text-white">
            NGIJIH<span className="text-orange-500">.</span> weather
          </div>

          <p className="text-xs sm:text-sm text-white/70 font-light tracking-wide">
            {isDetectingGps ? (
              <span className="font-medium text-amber-300">
                Acquiring live GPS coordinates & local radar station...
              </span>
            ) : (
              <>
                Calibrating atmospheric radar stations for{' '}
                <span className="font-semibold text-amber-200">{locationName}</span>...
              </>
            )}
          </p>

          {/* Shimmering Verification Steps */}
          <div className="pt-4 flex flex-col items-center gap-2 text-[11px] text-white/50 font-mono">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <Radio className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{statusMessage || (isDetectingGps ? 'Present GPS Location Telemetry' : 'Connecting Open-Meteo High-Res Model')}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md">
              <Sparkles className="w-3 h-3 text-orange-400" />
              <span>Calibrating Microclimate Forecast</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
