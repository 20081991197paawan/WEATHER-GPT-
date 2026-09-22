import {
  CurrentWeather,
  DailyForecastItem,
  HourlyForecastItem,
  ComfortScore,
  WeatherAlert,
  WeatherIntelligence,
} from '../types';

export function calculateComfortScore(
  current: Pick<CurrentWeather, 'temp' | 'humidity' | 'rainProb' | 'windSpeed' | 'uvIndex'>
): ComfortScore {
  let score = 100;

  // Temperature factor (Optimal 20°C - 25°C)
  let tempDeduction = 0;
  let tempImpact: 'positive' | 'neutral' | 'negative' = 'positive';
  let tempNote = 'Ideal ambient thermal zone';
  if (current.temp < 15) {
    tempDeduction = Math.min(30, (15 - current.temp) * 2.5);
    tempImpact = tempDeduction > 15 ? 'negative' : 'neutral';
    tempNote = current.temp < 5 ? 'Near freezing chill' : 'Cooler temperature, layer up';
  } else if (current.temp > 27) {
    tempDeduction = Math.min(35, (current.temp - 27) * 3);
    tempImpact = tempDeduction > 15 ? 'negative' : 'neutral';
    tempNote = current.temp > 35 ? 'Severe heat stress' : 'Warm, elevated perspiration';
  }

  // Humidity factor (Optimal 40% - 60%)
  let humDeduction = 0;
  let humImpact: 'positive' | 'neutral' | 'negative' = 'positive';
  let humNote = 'Optimal humidity balance';
  if (current.humidity > 65) {
    humDeduction = Math.min(20, (current.humidity - 65) * 0.6);
    humImpact = humDeduction > 10 ? 'negative' : 'neutral';
    humNote = 'Sticky mugginess reduces evaporation';
  } else if (current.humidity < 30) {
    humDeduction = Math.min(15, (30 - current.humidity) * 0.5);
    humImpact = 'neutral';
    humNote = 'Dry air, hydrate lips and skin';
  }

  // Rain probability factor
  let rainDeduction = (current.rainProb / 100) * 30;
  let rainImpact: 'positive' | 'neutral' | 'negative' = 'positive';
  let rainNote = 'Dry conditions expected';
  if (current.rainProb >= 60) {
    rainImpact = 'negative';
    rainNote = 'High precipitation likelihood';
  } else if (current.rainProb >= 25) {
    rainImpact = 'neutral';
    rainNote = 'Spotty showers possible';
  }

  // Wind factor (Optimal 5 - 15 km/h)
  let windDeduction = 0;
  let windImpact: 'positive' | 'neutral' | 'negative' = 'positive';
  let windNote = 'Pleasant calm breeze';
  if (current.windSpeed > 25) {
    windDeduction = Math.min(20, (current.windSpeed - 25) * 0.8);
    windImpact = windDeduction > 10 ? 'negative' : 'neutral';
    windNote = current.windSpeed > 45 ? 'Buffeting gale winds' : 'Brisk gusty airflow';
  }

  // UV Index factor (0 - 2 minimal, 3-5 mod, 6-7 high, 8-10 very high, 11+ extreme)
  let uvDeduction = 0;
  let uvImpact: 'positive' | 'neutral' | 'negative' = 'positive';
  let uvNote = 'Low UV exposure danger';
  if (current.uvIndex >= 8) {
    uvDeduction = 15;
    uvImpact = 'negative';
    uvNote = 'Extreme UV radiation index';
  } else if (current.uvIndex >= 6) {
    uvDeduction = 10;
    uvImpact = 'negative';
    uvNote = 'High UV, sun protection needed';
  } else if (current.uvIndex >= 3) {
    uvDeduction = 4;
    uvImpact = 'neutral';
    uvNote = 'Moderate UV radiation';
  }

  score = Math.max(12, Math.min(99, Math.round(100 - tempDeduction - humDeduction - rainDeduction - windDeduction - uvDeduction)));

  let rating: ComfortScore['rating'] = 'Exceptional';
  let description = 'Prime conditions for outdoor recreation, sports, and transit.';
  if (score < 40) {
    rating = 'Hazardous';
    description = 'Adverse meteorological stress. Recommend sheltering or minimizing prolonged exposure.';
  } else if (score < 60) {
    rating = 'Poor';
    description = 'Suboptimal comfort. Rain risk or intense heat/wind may cause significant discomfort.';
  } else if (score < 80) {
    rating = 'Moderate';
    description = 'Acceptable outdoor conditions with standard situational preparation.';
  } else if (score < 90) {
    rating = 'Good';
    description = 'Very pleasant weather with minimal atmospheric friction.';
  }

  return {
    score,
    rating,
    description,
    factors: {
      temperature: { value: current.temp, impact: tempImpact, note: tempNote },
      humidity: { value: current.humidity, impact: humImpact, note: humNote },
      rain: { value: current.rainProb, impact: rainImpact, note: rainNote },
      wind: { value: current.windSpeed, impact: windImpact, note: windNote },
      uv: { value: current.uvIndex, impact: uvImpact, note: uvNote },
    },
  };
}

export function generateAlerts(
  current: CurrentWeather,
  hourly: HourlyForecastItem[]
): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  // Check Severe Thunderstorms
  const severeThunderstormHour = hourly.slice(0, 12).find(h => h.conditionCode >= 95);
  if (current.conditionCode >= 95 || severeThunderstormHour) {
    alerts.push({
      id: 'alert-severe-thunderstorm',
      type: 'severe',
      severity: 'danger',
      title: 'Severe Thunderstorm Warning',
      condition: 'Lightning & High Gust Potential',
      expectedTime: current.conditionCode >= 95 ? 'Active now' : `Expected around ${severeThunderstormHour?.hourFormatted}`,
      headline: 'Intense atmospheric instability detected with potential cloud-to-ground lightning.',
      measurements: {
        'Storm Severity Code': current.conditionCode >= 95 ? current.conditionCode : severeThunderstormHour?.conditionCode || 95,
        'Rain Probability': `${Math.max(current.rainProb, severeThunderstormHour?.rainProb || 80)}%`,
        'Peak Wind Gusts': `${Math.round(Math.max(current.windSpeed * 1.4, (severeThunderstormHour?.windSpeed || 30) * 1.4))} km/h`,
      },
      recommendedAction: 'Stay indoors away from tall trees and metallic objects. Unplug sensitive electronics and avoid open sports grounds.',
    });
  }

  // Check Rain / Heavy Precipitation
  const highRainHour = hourly.slice(0, 8).find(h => h.rainProb >= 65 || h.precipitationMm >= 2.5);
  if (current.rainProb >= 70 || current.precipitationMm >= 3.0 || highRainHour) {
    const isHeavy = (current.precipitationMm >= 5) || (highRainHour && highRainHour.precipitationMm >= 5);
    alerts.push({
      id: 'alert-rain-precipitation',
      type: 'rain',
      severity: isHeavy ? 'warning' : 'advisory',
      title: isHeavy ? 'Heavy Downpour & Flash Ponding Alert' : 'Active Precipitation & Rain Alert',
      condition: isHeavy ? 'Torrential Showers' : 'Persistent Rainfall',
      expectedTime: current.rainProb >= 70 ? 'Current window' : `Anticipated at ${highRainHour?.hourFormatted}`,
      headline: isHeavy
        ? 'High-intensity rainfall expected to cause localized road waterlogging and reduced visibility.'
        : 'Sustained rain showers developing across the immediate sector.',
      measurements: {
        'Rain Probability': `${Math.max(current.rainProb, highRainHour?.rainProb || 75)}%`,
        'Hourly Accumulation': `${Math.max(current.precipitationMm, highRainHour?.precipitationMm || 4.2).toFixed(1)} mm`,
        'Surface Visibility': `${current.visibility} km`,
      },
      recommendedAction: 'Carry a sturdy water-resistant umbrella or hooded rain poncho. Allow 15–20 minutes extra transit buffer.',
    });
  }

  // Check Extreme Heat
  if (current.temp >= 38 || current.feelsLike >= 42) {
    alerts.push({
      id: 'alert-extreme-heat',
      type: 'heat',
      severity: current.temp >= 41 ? 'danger' : 'warning',
      title: 'Elevated Heatwave & Thermal Stress Advisory',
      condition: 'Extreme Ambient Temperature',
      expectedTime: 'Mid-afternoon peak',
      headline: 'Elevated thermal index creates heightened risk of dehydration and heat exhaustion.',
      measurements: {
        'Actual Ambient': `${current.temp}°C`,
        'Heat Index (Feels Like)': `${current.feelsLike}°C`,
        'Solar UV Index': `${current.uvIndex} (${current.uvIndex >= 8 ? 'Very High' : 'High'})`,
      },
      recommendedAction: 'Drink at least 500ml electrolytes/water per hour outdoors. Avoid heavy aerobic training in direct afternoon sunlight.',
    });
  }

  // Check High Wind
  const highWindHour = hourly.slice(0, 12).find(h => h.windSpeed >= 40);
  if (current.windSpeed >= 38 || highWindHour) {
    alerts.push({
      id: 'alert-high-wind',
      type: 'wind',
      severity: 'advisory',
      title: 'Strong Gale & Gust Advisory',
      condition: 'High Velocity Winds',
      expectedTime: current.windSpeed >= 38 ? 'Currently active' : `Peak expected around ${highWindHour?.hourFormatted}`,
      headline: 'Sustained elevated wind velocities may dislodge lightweight outdoor objects.',
      measurements: {
        'Sustained Wind': `${Math.max(current.windSpeed, highWindHour?.windSpeed || 40)} km/h`,
        'Estimated Gusts': `${Math.round(Math.max(current.windSpeed, highWindHour?.windSpeed || 40) * 1.35)} km/h`,
        'Direction': `${current.windDirection}°`,
      },
      recommendedAction: 'Secure patio furniture and terrace items. Exercise elevated caution when riding two-wheelers on open highways.',
    });
  }

  return alerts;
}

export function synthesizeRuleBasedIntelligence(
  current: CurrentWeather,
  hourly: HourlyForecastItem[],
  daily: DailyForecastItem[]
): WeatherIntelligence {
  const next8Hours = hourly.slice(0, 8);
  const rainHours = next8Hours.filter(h => h.rainProb >= 50);

  let summary = '';
  let headline = '';
  let bestWindow = 'Morning window (7:00 AM – 10:30 AM)';

  if (rainHours.length > 0) {
    const firstRain = rainHours[0];
    headline = `Precipitation anticipated around ${firstRain.hourFormatted} with ${firstRain.rainProb}% probability`;
    summary = `Atmospheric barometric readings indicate increasing shower probability starting near ${firstRain.hourFormatted}. Total expected accumulation is approximately ${firstRain.precipitationMm.toFixed(1)} mm. Morning periods remain comparatively stable before moisture convergence peaks.`;
    bestWindow = 'Prior to ' + firstRain.hourFormatted + ' or late evening post-shower clearing';
  } else if (current.temp >= 34) {
    headline = `Warm conditions dominating through peak daylight hours`;
    summary = `Temperatures will climb toward a peak of ${Math.round(current.tempMaxToday)}°C during the early afternoon with a UV index reaching ${current.uvIndex}. Conditions remain completely dry with low cloud cover.`;
    bestWindow = 'Early morning (6:30 AM – 9:00 AM) or after 5:30 PM sundown';
  } else {
    headline = `Stable, comfortable meteorological profile across the region`;
    summary = `Favorable thermal balance with ambient temperatures hovering around ${Math.round(current.temp)}°C and wind velocity under ${current.windSpeed} km/h. No significant precipitation disturbances are identified within the immediate 24-hour forecast corridor.`;
    bestWindow = 'Mid-morning through late afternoon (9:00 AM – 4:30 PM)';
  }

  return {
    headline,
    summary,
    bestOutdoorWindow: bestWindow,
    keyTakeaways: [
      `Peak diurnal temperature reaching ${Math.round(current.tempMaxToday)}°C (Low ${Math.round(current.tempMinToday)}°C)`,
      rainHours.length > 0
        ? `Rain risk peaks between ${rainHours[0].hourFormatted} and ${rainHours[rainHours.length - 1].hourFormatted}`
        : '0% significant rainfall risk within the next 8 hours',
      `Average wind velocity of ${current.windSpeed} km/h with humidity at ${current.humidity}%`,
    ],
    travelSafetyAdvice: rainHours.length > 0
      ? 'Slick road asphalt expected during afternoon hours. Maintain greater vehicular braking distance.'
      : 'Clear visibility and dry roadways provide optimal driving and commuting conditions.',
  };
}
