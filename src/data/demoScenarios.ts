import { NormalizedWeatherData, NearbyPlace } from '../types';
import { calculateComfortScore, generateAlerts, synthesizeRuleBasedIntelligence } from '../utils/weatherCalculator';
import { parseWmoCode } from '../utils/weatherCodes';

export interface DemoScenario {
  id: string;
  name: string;
  description: string;
  badge: string;
  data: NormalizedWeatherData;
  nearbyPlaces: NearbyPlace[];
}

// Scenario 1: Guntur - Approaching Monsoon Rainstorm (Hackathon Demo Centerpiece)
export const scenarioRainstorm: DemoScenario = (() => {
  const current = {
    temp: 28.4,
    feelsLike: 32.1,
    tempMinToday: 24.2,
    tempMaxToday: 31.0,
    condition: 'Heavy Rain Showers Developing',
    conditionCode: 65,
    conditionCategory: 'rain' as const,
    humidity: 86,
    rainProb: 84,
    precipitationMm: 6.8,
    windSpeed: 26,
    windDirection: 215,
    windGusts: 42,
    uvIndex: 3.2,
    visibility: 4.8,
    pressure: 1004,
    cloudCover: 92,
    isDay: true,
    dewPoint: 25.8,
    timestamp: new Date().toISOString(),
  };

  const hourlyTimes = [
    { hour: 7, rain: 20, mm: 0.1, temp: 25.4, code: 2 },
    { hour: 8, rain: 35, mm: 0.8, temp: 26.2, code: 3 },
    { hour: 9, rain: 65, mm: 2.4, temp: 27.0, code: 61 },
    { hour: 10, rain: 88, mm: 5.6, temp: 27.5, code: 63 },
    { hour: 11, rain: 92, mm: 8.2, temp: 28.0, code: 65 },
    { hour: 12, rain: 85, mm: 7.1, temp: 28.4, code: 65 },
    { hour: 13, rain: 78, mm: 4.9, temp: 28.2, code: 63 },
    { hour: 14, rain: 62, mm: 2.8, temp: 27.8, code: 61 },
    { hour: 15, rain: 45, mm: 1.1, temp: 27.5, code: 80 },
    { hour: 16, rain: 30, mm: 0.4, temp: 27.1, code: 3 },
    { hour: 17, rain: 20, mm: 0.0, temp: 26.6, code: 2 },
    { hour: 18, rain: 15, mm: 0.0, temp: 26.0, code: 1 },
    { hour: 19, rain: 10, mm: 0.0, temp: 25.5, code: 1 },
    { hour: 20, rain: 10, mm: 0.0, temp: 25.2, code: 0 },
    { hour: 21, rain: 5, mm: 0.0, temp: 24.8, code: 0 },
    { hour: 22, rain: 5, mm: 0.0, temp: 24.5, code: 0 },
    { hour: 23, rain: 5, mm: 0.0, temp: 24.3, code: 0 },
  ];

  const hourly = hourlyTimes.map(item => {
    const isDay = item.hour >= 6 && item.hour < 18;
    const cond = parseWmoCode(item.code, isDay);
    const dateObj = new Date();
    dateObj.setHours(item.hour, 0, 0, 0);
    const hourFormatted = dateObj.toLocaleTimeString([], { hour: 'numeric', hour12: true });

    return {
      time: dateObj.toISOString(),
      hourFormatted,
      hourNum: item.hour,
      temp: item.temp,
      feelsLike: item.temp + 3.2,
      condition: cond.label,
      conditionCode: item.code,
      conditionCategory: cond.category,
      rainProb: item.rain,
      precipitationMm: item.mm,
      windSpeed: 20 + Math.floor(item.rain * 0.15),
      windDirection: 210,
      uvIndex: isDay ? (item.rain > 50 ? 2.5 : 5.5) : 0,
      humidity: 80 + Math.floor(item.rain * 0.12),
      isDay,
    };
  });

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const daily = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dayFormatted = `${daysOfWeek[d.getDay()]}, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`;
    const dayShort = daysOfWeek[d.getDay()];
    const code = idx === 0 ? 65 : idx === 1 ? 63 : idx === 2 ? 80 : idx === 3 ? 2 : 1;
    const cond = parseWmoCode(code, true);

    return {
      date: d.toISOString().split('T')[0],
      dayFormatted,
      dayShort,
      tempMax: 31 - (idx === 0 ? 2 : 0) + idx * 0.5,
      tempMin: 24 + (idx % 2),
      condition: cond.label,
      conditionCode: code,
      conditionCategory: cond.category,
      rainProb: idx === 0 ? 88 : idx === 1 ? 75 : idx === 2 ? 40 : 15,
      precipitationSumMm: idx === 0 ? 24.5 : idx === 1 ? 14.2 : idx === 2 ? 3.5 : 0.0,
      windSpeedMax: 32 - idx * 2,
      uvIndexMax: idx < 2 ? 4.5 : 8.0,
      sunrise: '05:58 AM',
      sunset: '06:18 PM',
    };
  });

  const alerts = generateAlerts(current, hourly);
  const comfortScore = calculateComfortScore(current);
  const intelligence = synthesizeRuleBasedIntelligence(current, hourly, daily);

  const nearbyPlaces: NearbyPlace[] = [
    {
      id: 'place-1',
      name: 'City Weather Shield & Rain Protection Hub',
      category: 'umbrella_shop',
      address: 'Shop 14, Main Road, Guntur Central',
      distanceKm: 0.4,
      openStatus: 'Open Now • High Stock of Windproof Umbrellas & Ponchos',
      weatherUtility: 'Heavy duty 8-rib umbrellas, raincoats, waterproof backpacks',
      coordinates: { lat: 16.3067, lng: 80.4365 },
      phone: '+91 863 224 8192',
    },
    {
      id: 'place-2',
      name: 'Municipal Transit Shelter & Elevated Concourse',
      category: 'shelter',
      address: 'Platform 1, Guntur Inter-State Bus Terminal',
      distanceKm: 0.8,
      openStatus: 'Open 24/7 • Covered Storm Shelter Area',
      weatherUtility: 'Waterproof passenger canopy, dry seating, charging points',
      coordinates: { lat: 16.2995, lng: 80.4421 },
    },
    {
      id: 'place-3',
      name: 'Apollo 24/7 Medical Pharmacy & Emergency First Aid',
      category: 'pharmacy',
      address: 'Lakshmipuram Main Road, Guntur',
      distanceKm: 1.1,
      openStatus: 'Open 24 Hours',
      weatherUtility: 'Emergency medical aid, rain-exposure flu medicines, waterproof packaging',
      coordinates: { lat: 16.3121, lng: 80.4289 },
      phone: '+91 863 223 9000',
    },
  ];

  return {
    id: 'scenario-rain',
    name: 'Guntur (Monsoon Rain & Alert Active)',
    description: '84% precipitation probability, rainstorm alert, umbrella strongly recommended',
    badge: '🌧️ Heavy Rain Alert',
    data: {
      location: {
        name: 'Guntur',
        region: 'Andhra Pradesh',
        country: 'India',
        latitude: 16.3067,
        longitude: 80.4365,
        timezone: 'Asia/Kolkata',
      },
      current,
      hourly,
      daily,
      alerts,
      comfortScore,
      intelligence,
      nearbyAssistance: nearbyPlaces,
      isDemoData: true,
      dataSource: 'Simulated Hackathon Demo Station (WMO ECMWF Model Match)',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    nearbyPlaces,
  };
})();

// Scenario 2: Bengaluru - Ideal Outdoor Comfort
export const scenarioBengaluruPleasant: DemoScenario = (() => {
  const current = {
    temp: 23.5,
    feelsLike: 23.2,
    tempMinToday: 18.0,
    tempMaxToday: 26.5,
    condition: 'Pleasant & Partly Cloudy',
    conditionCode: 2,
    conditionCategory: 'partly_cloudy' as const,
    humidity: 52,
    rainProb: 8,
    precipitationMm: 0.0,
    windSpeed: 14,
    windDirection: 110,
    windGusts: 20,
    uvIndex: 5.5,
    visibility: 10.0,
    pressure: 1016,
    cloudCover: 35,
    isDay: true,
    dewPoint: 13.5,
    timestamp: new Date().toISOString(),
  };

  const hourly = Array.from({ length: 16 }).map((_, idx) => {
    const hour = (7 + idx) % 24;
    const isDay = hour >= 6 && hour < 18;
    const temp = hour < 13 ? 20 + idx * 0.8 : 26.5 - (hour - 13) * 0.7;
    const d = new Date();
    d.setHours(hour, 0, 0, 0);

    return {
      time: d.toISOString(),
      hourFormatted: d.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      hourNum: hour,
      temp: parseFloat(temp.toFixed(1)),
      feelsLike: parseFloat(temp.toFixed(1)),
      condition: hour < 12 ? 'Mostly Clear' : 'Gentle Clouds',
      conditionCode: 1,
      conditionCategory: 'partly_cloudy' as const,
      rainProb: 5 + (idx % 5),
      precipitationMm: 0.0,
      windSpeed: 12 + (idx % 4),
      windDirection: 115,
      uvIndex: isDay ? (hour > 10 && hour < 15 ? 6.2 : 2.5) : 0,
      humidity: 50 + (idx % 6),
      isDay,
    };
  });

  const daily = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

    return {
      date: d.toISOString().split('T')[0],
      dayFormatted: `${dayShort}, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
      dayShort,
      tempMax: 26.5,
      tempMin: 18.2,
      condition: 'Partly Cloudy',
      conditionCode: 2,
      conditionCategory: 'partly_cloudy' as const,
      rainProb: 10,
      precipitationSumMm: 0.0,
      windSpeedMax: 16,
      uvIndexMax: 6.5,
      sunrise: '06:08 AM',
      sunset: '06:22 PM',
    };
  });

  const alerts = generateAlerts(current, hourly);
  const comfortScore = calculateComfortScore(current);
  const intelligence = synthesizeRuleBasedIntelligence(current, hourly, daily);

  const nearbyPlaces: NearbyPlace[] = [
    {
      id: 'place-b1',
      name: 'Cubbon Park Open Recreation Pavilions',
      category: 'shelter',
      address: 'Kasturba Road, Bengaluru Central',
      distanceKm: 0.9,
      openStatus: 'Open All Day • Scenic Jogging & Sports Feasibility: 96%',
      weatherUtility: 'Shaded canopy walks, drinking water fountains, fitness stations',
      coordinates: { lat: 12.9763, lng: 77.5929 },
    },
    {
      id: 'place-b2',
      name: 'Decathlon Sports & Outdoor Gear Hub',
      category: 'umbrella_shop',
      address: 'Brigade Road, Bengaluru',
      distanceKm: 1.4,
      openStatus: 'Open Now',
      weatherUtility: 'Sun caps, UV protection shirts, sports gear',
      coordinates: { lat: 12.9719, lng: 77.607 },
      phone: '+91 80 4112 3456',
    },
  ];

  return {
    id: 'scenario-bengaluru',
    name: 'Bengaluru (Pleasant Spring & Ideal Outdoor Comfort)',
    description: '23.5°C, gentle breeze, 88/100 outdoor comfort score',
    badge: '☀️ Prime Weather',
    data: {
      location: {
        name: 'Bengaluru',
        region: 'Karnataka',
        country: 'India',
        latitude: 12.9716,
        longitude: 77.5946,
        timezone: 'Asia/Kolkata',
      },
      current,
      hourly,
      daily,
      alerts,
      comfortScore,
      intelligence,
      nearbyAssistance: nearbyPlaces,
      isDemoData: true,
      dataSource: 'Simulated Hackathon Demo Station (WMO ECMWF Model Match)',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    nearbyPlaces,
  };
})();

// Scenario 3: Delhi / Chennai - Extreme Heatwave 42°C
export const scenarioHeatwave: DemoScenario = (() => {
  const current = {
    temp: 41.8,
    feelsLike: 46.2,
    tempMinToday: 29.5,
    tempMaxToday: 43.0,
    condition: 'Blistering Sun & Intense Thermal Stress',
    conditionCode: 0,
    conditionCategory: 'clear' as const,
    humidity: 34,
    rainProb: 0,
    precipitationMm: 0.0,
    windSpeed: 16,
    windDirection: 270,
    windGusts: 24,
    uvIndex: 10.4,
    visibility: 8.0,
    pressure: 1001,
    cloudCover: 5,
    isDay: true,
    dewPoint: 22.0,
    timestamp: new Date().toISOString(),
  };

  const hourly = Array.from({ length: 16 }).map((_, idx) => {
    const hour = (7 + idx) % 24;
    const isDay = hour >= 6 && hour < 18;
    const temp = hour < 14 ? 32 + idx * 1.5 : 43.0 - (hour - 14) * 1.2;
    const d = new Date();
    d.setHours(hour, 0, 0, 0);

    return {
      time: d.toISOString(),
      hourFormatted: d.toLocaleTimeString([], { hour: 'numeric', hour12: true }),
      hourNum: hour,
      temp: parseFloat(temp.toFixed(1)),
      feelsLike: parseFloat((temp + 4.5).toFixed(1)),
      condition: 'Blistering Sun',
      conditionCode: 0,
      conditionCategory: 'clear' as const,
      rainProb: 0,
      precipitationMm: 0.0,
      windSpeed: 15,
      windDirection: 270,
      uvIndex: isDay ? (hour >= 11 && hour <= 15 ? 10.4 : 4.0) : 0,
      humidity: 32,
      isDay,
    };
  });

  const daily = Array.from({ length: 7 }).map((_, idx) => {
    const d = new Date();
    d.setDate(d.getDate() + idx);
    const dayShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];

    return {
      date: d.toISOString().split('T')[0],
      dayFormatted: `${dayShort}, ${d.toLocaleDateString([], { month: 'short', day: 'numeric' })}`,
      dayShort,
      tempMax: 43.0,
      tempMin: 29.0,
      condition: 'Heatwave',
      conditionCode: 0,
      conditionCategory: 'clear' as const,
      rainProb: 0,
      precipitationSumMm: 0.0,
      windSpeedMax: 22,
      uvIndexMax: 10.8,
      sunrise: '05:35 AM',
      sunset: '07:05 PM',
    };
  });

  const alerts = generateAlerts(current, hourly);
  const comfortScore = calculateComfortScore(current);
  const intelligence = synthesizeRuleBasedIntelligence(current, hourly, daily);

  const nearbyPlaces: NearbyPlace[] = [
    {
      id: 'place-h1',
      name: 'Metro Transit Air-Conditioned Cooling Concourse',
      category: 'cooling_center',
      address: 'Rajiv Chowk Metro Central Concourse',
      distanceKm: 0.5,
      openStatus: 'Open Now • Climate Controlled (24°C Constant)',
      weatherUtility: 'Hydration dispensers, free chilled drinking water, emergency medical staff',
      coordinates: { lat: 28.6328, lng: 77.2197 },
    },
    {
      id: 'place-h2',
      name: 'City Civic Center Shaded Resting Plaza',
      category: 'shelter',
      address: 'Connaught Place Outer Circle',
      distanceKm: 0.9,
      openStatus: 'Open 24/7 • Mist Coolers Active',
      weatherUtility: 'Water misting fans, covered thermal seating',
      coordinates: { lat: 28.6304, lng: 77.2177 },
    },
  ];

  return {
    id: 'scenario-heat',
    name: 'New Delhi (Severe Heatwave Alert & UV 10+)',
    description: '41.8°C feels like 46.2°C, extreme UV index, heat exhaustion warnings',
    badge: '🔥 Severe Heatwave',
    data: {
      location: {
        name: 'New Delhi',
        region: 'Delhi NCR',
        country: 'India',
        latitude: 28.6139,
        longitude: 77.209,
        timezone: 'Asia/Kolkata',
      },
      current,
      hourly,
      daily,
      alerts,
      comfortScore,
      intelligence,
      nearbyAssistance: nearbyPlaces,
      isDemoData: true,
      dataSource: 'Simulated Hackathon Demo Station (WMO ECMWF Model Match)',
      lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
    nearbyPlaces,
  };
})();

export const ALL_DEMO_SCENARIOS = [
  scenarioRainstorm,
  scenarioBengaluruPleasant,
  scenarioHeatwave,
];

export const DEMO_SCENARIO_RAINSTORM = scenarioRainstorm.data;
export const DEMO_SCENARIO_BENGALURU = scenarioBengaluruPleasant.data;
export const DEMO_SCENARIO_HEATWAVE = scenarioHeatwave.data;
