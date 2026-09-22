import { WeatherConditionInfo } from '../types';

export function parseWmoCode(code: number, isDay: boolean = true): WeatherConditionInfo {
  switch (code) {
    case 0:
      return {
        code,
        label: isDay ? 'Clear Sky' : 'Clear Night',
        category: 'clear',
        icon: isDay ? 'Sun' : 'Moon',
      };
    case 1:
      return {
        code,
        label: isDay ? 'Mainly Clear' : 'Mostly Clear',
        category: 'clear',
        icon: isDay ? 'SunMedium' : 'MoonStar',
      };
    case 2:
      return {
        code,
        label: 'Partly Cloudy',
        category: 'partly_cloudy',
        icon: isDay ? 'CloudSun' : 'CloudMoon',
      };
    case 3:
      return {
        code,
        label: 'Overcast',
        category: 'cloudy',
        icon: 'Cloud',
      };
    case 45:
    case 48:
      return {
        code,
        label: 'Foggy',
        category: 'fog',
        icon: 'CloudFog',
      };
    case 51:
    case 53:
    case 55:
      return {
        code,
        label: code === 51 ? 'Light Drizzle' : 'Drizzle',
        category: 'drizzle',
        icon: 'CloudDrizzle',
      };
    case 56:
    case 57:
      return {
        code,
        label: 'Freezing Drizzle',
        category: 'drizzle',
        icon: 'CloudSnow',
      };
    case 61:
      return {
        code,
        label: 'Light Rain',
        category: 'rain',
        icon: 'CloudRain',
      };
    case 63:
      return {
        code,
        label: 'Moderate Rain',
        category: 'rain',
        icon: 'CloudRain',
      };
    case 65:
      return {
        code,
        label: 'Heavy Rain',
        category: 'rain',
        icon: 'CloudRain',
      };
    case 66:
    case 67:
      return {
        code,
        label: 'Freezing Rain',
        category: 'rain',
        icon: 'CloudSnow',
      };
    case 71:
    case 73:
    case 75:
    case 77:
      return {
        code,
        label: 'Snow',
        category: 'snow',
        icon: 'Snowflake',
      };
    case 80:
    case 81:
    case 82:
      return {
        code,
        label: code === 82 ? 'Violent Rain Showers' : 'Rain Showers',
        category: 'rain',
        icon: 'CloudRain',
      };
    case 85:
    case 86:
      return {
        code,
        label: 'Snow Showers',
        category: 'snow',
        icon: 'Snowflake',
      };
    case 95:
      return {
        code,
        label: 'Thunderstorm',
        category: 'thunderstorm',
        icon: 'CloudLightning',
      };
    case 96:
    case 99:
      return {
        code,
        label: 'Severe Thunderstorm',
        category: 'thunderstorm',
        icon: 'Zap',
      };
    default:
      return {
        code,
        label: 'Moderate Weather',
        category: 'partly_cloudy',
        icon: 'CloudSun',
      };
  }
}
