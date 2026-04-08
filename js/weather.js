/* ============================================================
   weather.js — Phase 4: Open-Meteo weather integration
   ============================================================ */

import { OPEN_METEO_URL, RISK_LEVELS } from './config.js';
import { state } from './state.js';
import { weatherCard, weatherLoading, weatherError, wxTemp, wxHumidity, wxWind, wxDewpoint, wxContext } from './dom.js';

/**
 * Fetches current weather conditions from Open-Meteo for the
 * given latitude/longitude and populates the weather card.
 */
export async function fetchWeather(lat, lng) {
  weatherCard.classList.add('hidden');
  weatherError.classList.add('hidden');
  weatherLoading.classList.remove('hidden');

  try {
    const params = new URLSearchParams({
      latitude:         lat.toFixed(4),
      longitude:        lng.toFixed(4),
      current:          'temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m,dew_point_2m',
      temperature_unit: 'fahrenheit',
      wind_speed_unit:  'mph',
      timezone:         'auto',
    });

    const response = await fetch(`${OPEN_METEO_URL}?${params}`);

    if (!response.ok) {
      throw new Error(`Weather API responded with ${response.status}`);
    }

    const data = await response.json();

    if (!data || !data.current) {
      throw new Error('Invalid weather data received');
    }

    const c = data.current;
    const temp      = Math.round(c.temperature_2m);
    const humidity  = Math.round(c.relative_humidity_2m);
    const windSpeed = Math.round(c.wind_speed_10m);
    const windDir   = degreesToCompass(c.wind_direction_10m);
    const dewpoint  = Math.round(c.dew_point_2m);

    wxTemp.textContent     = `${temp} F`;
    wxHumidity.textContent = `${humidity}%`;
    wxWind.textContent     = `${windSpeed} mph ${windDir}`;
    wxDewpoint.textContent = `${dewpoint} F`;

    // Build contextual note tying conditions to outlook
    wxContext.textContent = buildWeatherContext(temp, dewpoint, windSpeed, windDir, humidity);

    weatherLoading.classList.add('hidden');
    weatherCard.classList.remove('hidden');

  } catch (err) {
    console.error('Failed to load weather data:', err);
    weatherLoading.classList.add('hidden');
    weatherError.textContent = 'Unable to load current weather conditions.';
    weatherError.classList.remove('hidden');
  }
}

/**
 * Converts wind direction in degrees to a compass abbreviation.
 */
function degreesToCompass(deg) {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(deg / 22.5) % 16;
  return directions[index];
}

/**
 * Builds a one-line contextual note connecting the current weather
 * conditions to the SPC outlook in plain language.
 */
function buildWeatherContext(temp, dewpoint, windSpeed, windDir, humidity) {
  const parts = [];

  // Assess moisture
  if (dewpoint >= 65) {
    parts.push('Dewpoints are high, indicating rich moisture that could fuel thunderstorms.');
  } else if (dewpoint >= 55) {
    parts.push('Moderate moisture is present in the area.');
  } else {
    parts.push('Dewpoints are relatively low, suggesting limited moisture for storm development.');
  }

  // Assess wind
  if (windSpeed >= 20) {
    parts.push(`Winds are breezy at ${windSpeed} mph from the ${windDir}.`);
  } else if (windSpeed >= 10) {
    parts.push(`Light winds from the ${windDir} at ${windSpeed} mph.`);
  }

  // Tie to risk
  if (state.currentRisk && RISK_LEVELS[state.currentRisk] && RISK_LEVELS[state.currentRisk].order >= 2) {
    parts.push('These conditions are consistent with the elevated risk in your area today.');
  }

  return parts.join(' ');
}
