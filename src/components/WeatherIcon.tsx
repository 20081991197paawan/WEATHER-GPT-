import React from 'react';
import {
  Sun,
  SunMedium,
  Moon,
  MoonStar,
  Cloud,
  CloudSun,
  CloudMoon,
  CloudRain,
  CloudLightning,
  CloudDrizzle,
  CloudFog,
  CloudSnow,
  Snowflake,
  Wind,
  Zap,
} from 'lucide-react';
import { WeatherConditionInfo } from '../types';

interface WeatherIconProps {
  category: WeatherConditionInfo['category'];
  isDay?: boolean;
  className?: string;
  size?: number;
}

export const WeatherIcon: React.FC<WeatherIconProps> = ({
  category,
  isDay = true,
  className = 'w-6 h-6',
  size,
}) => {
  const iconProps = { className, ...(size ? { size } : {}) };

  switch (category) {
    case 'clear':
      return isDay ? (
        <Sun {...iconProps} className={`${className} text-amber-400`} />
      ) : (
        <Moon {...iconProps} className={`${className} text-amber-200`} />
      );
    case 'partly_cloudy':
      return isDay ? (
        <CloudSun {...iconProps} className={`${className} text-amber-300`} />
      ) : (
        <CloudMoon {...iconProps} className={`${className} text-amber-200`} />
      );
    case 'cloudy':
      return <Cloud {...iconProps} className={`${className} text-stone-300`} />;
    case 'fog':
      return <CloudFog {...iconProps} className={`${className} text-stone-400`} />;
    case 'drizzle':
      return <CloudDrizzle {...iconProps} className={`${className} text-amber-300`} />;
    case 'rain':
      return <CloudRain {...iconProps} className={`${className} text-orange-400`} />;
    case 'snow':
      return <Snowflake {...iconProps} className={`${className} text-stone-200`} />;
    case 'thunderstorm':
      return <CloudLightning {...iconProps} className={`${className} text-amber-400`} />;
    default:
      return isDay ? (
        <SunMedium {...iconProps} className={`${className} text-amber-400`} />
      ) : (
        <MoonStar {...iconProps} className={`${className} text-amber-200`} />
      );
  }
};
