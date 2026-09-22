export type SeverityLevel = 'info' | 'advisory' | 'warning' | 'danger';

export interface WeatherConditionInfo {
  code: number;
  label: string;
  category: 'clear' | 'partly_cloudy' | 'cloudy' | 'fog' | 'drizzle' | 'rain' | 'snow' | 'thunderstorm';
  icon: string;
}

export interface CurrentWeather {
  temp: number;
  feelsLike: number;
  tempMinToday: number;
  tempMaxToday: number;
  condition: string;
  conditionCode: number;
  conditionCategory: WeatherConditionInfo['category'];
  humidity: number;
  rainProb: number;
  precipitationMm: number;
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts?: number;
  uvIndex: number;
  visibility: number; // km
  pressure: number; // hPa
  cloudCover: number; // %
  isDay: boolean;
  dewPoint?: number;
  timestamp: string;
}

export interface HourlyForecastItem {
  time: string; // ISO string
  hourFormatted: string; // "10 AM"
  hourNum: number; // 0-23
  temp: number;
  feelsLike: number;
  condition: string;
  conditionCode: number;
  conditionCategory: WeatherConditionInfo['category'];
  rainProb: number; // %
  precipitationMm: number;
  windSpeed: number;
  windDirection: number;
  uvIndex: number;
  humidity: number;
  visibility?: number;
  isDay: boolean;
}

export interface DailyForecastItem {
  date: string; // YYYY-MM-DD
  dayFormatted: string; // "Mon, Sep 22"
  dayShort: string; // "Mon"
  tempMax: number;
  tempMin: number;
  condition: string;
  conditionCode: number;
  conditionCategory: WeatherConditionInfo['category'];
  rainProb: number;
  precipitationSumMm: number;
  windSpeedMax: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherAlert {
  id: string;
  type: 'rain' | 'heat' | 'wind' | 'severe' | 'air_quality';
  title: string;
  severity: SeverityLevel;
  condition: string;
  expectedTime: string;
  measurements: Record<string, string | number>;
  recommendedAction: string;
  headline: string;
}

export interface ComfortScore {
  score: number; // 0 - 100
  rating: 'Exceptional' | 'Good' | 'Moderate' | 'Poor' | 'Hazardous';
  description: string;
  factors: {
    temperature: { value: number; impact: 'positive' | 'neutral' | 'negative'; note: string };
    humidity: { value: number; impact: 'positive' | 'neutral' | 'negative'; note: string };
    rain: { value: number; impact: 'positive' | 'neutral' | 'negative'; note: string };
    wind: { value: number; impact: 'positive' | 'neutral' | 'negative'; note: string };
    uv: { value: number; impact: 'positive' | 'neutral' | 'negative'; note: string };
  };
}

export interface WeatherIntelligence {
  headline: string;
  summary: string;
  bestOutdoorWindow: string;
  keyTakeaways: string[];
  travelSafetyAdvice: string;
}

export interface LocationData {
  name: string;
  region?: string;
  country: string;
  latitude: number;
  longitude: number;
  timezone?: string;
  elevation?: number;
}

export interface NormalizedWeatherData {
  location: LocationData;
  current: CurrentWeather;
  hourly: HourlyForecastItem[];
  daily: DailyForecastItem[];
  alerts: WeatherAlert[];
  comfortScore: ComfortScore;
  intelligence: WeatherIntelligence;
  nearbyAssistance: NearbyPlace[];
  isDemoData: boolean;
  dataSource: string;
  lastUpdated: string;
  airQuality?: AirQualityData;
}

export interface TransparentReasoning {
  rainProbability?: number;
  expectedRainfallMm?: number;
  windSpeedKmh?: number;
  timeWindow?: string;
  temperature?: number;
  uvIndex?: number;
  comfortScore?: number;
  verdict: 'YES' | 'NO' | 'CAUTION' | 'NEUTRAL';
  rawMetrics?: Record<string, string | number>;
  telemetry?: IndustryTelemetry;
}

export interface GroundingWebSource {
  title: string;
  url: string;
}

export interface GroundingMapPlace {
  title: string;
  url: string;
  address?: string;
  reviewSnippets?: string[];
}

export type ChatbotRole =
  | 'meteorologist'
  | 'safety_officer'
  | 'aviation_marine'
  | 'agricultural_eco'
  | 'travel_planner'
  | 'places_guide';

export type GeminiModelTier =
  | 'gemini-3.8-flash'
  | 'gemini-3.8-pro'
  | 'gemini-3.1-pro-preview'
  | 'gemini-3.1-flash-lite'
  | 'gemini-3.5-flash';

export interface IndustryTelemetry {
  confidenceScore: number;
  stationCalibration: string;
  radarDopplerEnsemble: string;
  dewPointDepression: number;
  barometricTendency: string;
  wetBulbGlobeTemp?: number;
}

export interface AirQualityData {
  usAqi: number;
  europeanAqi?: number | null;
  aqiCategory: string;
  aqiDescription: string;
  pm25: number;
  pm10: number;
  ozone: number;
  nitrogenDioxide?: number | null;
  carbonMonoxide?: number | null;
  uvIndex: number;
  uvCategory: string;
  uvAdvice: string;
  timestamp: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  reasoning?: TransparentReasoning;
  airQualityData?: AirQualityData;
  intent?: string;
  suggestedQuestions?: string[];
  isAiGenerated?: boolean;
  groundingSources?: GroundingWebSource[];
  mapsPlaces?: GroundingMapPlace[];
  modelUsed?: string;
  roleUsed?: ChatbotRole;
  groundingType?: 'search' | 'maps' | 'none';
  telemetry?: IndustryTelemetry;
}

export interface NearbyPlace {
  id: string;
  name: string;
  category: 'shelter' | 'umbrella_shop' | 'pharmacy' | 'cooling_center' | 'transit_hub';
  address: string;
  distanceKm: number;
  openStatus: string;
  weatherUtility: string;
  coordinates: { lat: number; lng: number };
  phone?: string;
}

export interface SavedLocationItem {
  id: string;
  name: string;
  region?: string;
  country?: string;
  lat: number;
  lon: number;
  userId: string;
  createdAt?: any;
}

export interface UserPreferencesItem {
  userId: string;
  temperatureUnit: 'celsius' | 'fahrenheit';
  voiceEnabled?: boolean;
  visualMode?: 'orb' | 'globe';
  updatedAt?: any;
}
