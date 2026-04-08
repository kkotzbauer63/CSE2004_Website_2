/* ============================================================
   location.js — Phase 2: Geolocation & city/zip search
   ============================================================ */

import { RISK_LEVELS, NOMINATIM_URL, RADIUS_METERS } from './config.js';
import { map, state } from './state.js';
import { locationBanner, locationTextEl, searchForm, searchInput, searchBtn, searchError } from './dom.js';
import { openEduPanel } from './edu.js';
import { fetchWeather } from './weather.js';

// ── Geolocation ──────────────────────────────────────────────

export function requestUserLocation() {
  // Show the banner immediately
  locationBanner.classList.remove('hidden');
  locationTextEl.textContent = 'Locating you...';

  if (!navigator.geolocation) {
    locationTextEl.textContent = 'Location unavailable — search below.';
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      handleLocationFound(lat, lng);
    },
    (error) => {
      let reason = 'Location denied — search below.';
      if (error.code === error.TIMEOUT) {
        reason = 'Location timed out — search below.';
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        reason = 'Location unavailable — search below.';
      }
      locationTextEl.textContent = reason;
      console.info('Geolocation fallback:', reason);
    },
    {
      enableHighAccuracy: false,
      timeout: 8000,
      maximumAge: 300000,
    }
  );
}

export function handleLocationFound(lat, lng) {
  state.userCoords = { lat, lng };

  map.flyTo([lat, lng], 7, { duration: 1.2 });
  placeUserMarker(lat, lng);

  // Draw or reposition the 25-mile SPC probability radius circle at the user's location
  if (state.radiusCircle) {
    state.radiusCircle.setLatLng([lat, lng]);
  } else {
    state.radiusCircle = L.circle([lat, lng], {
      radius:      RADIUS_METERS,
      color:       '#334155',
      weight:      1.5,
      opacity:     0.65,
      dashArray:   '6 5',
      fillColor:   '#0ea5e9',
      fillOpacity: 0.05,
      interactive: false,
    }).addTo(map);
  }

  if (state.outlookData) {
    determineUserRisk(lat, lng);
  } else {
    locationTextEl.textContent = 'Outlook data is still loading — please wait.';
  }

  // Phase 4: Fetch weather for this location
  fetchWeather(lat, lng);
}

export function determineUserRisk(lat, lng) {
  const point = turf.point([lng, lat]);

  const validFeatures = state.outlookData.features
    .filter(filterValidGeometry)
    .sort((a, b) => getRiskOrder(b.properties.LABEL) - getRiskOrder(a.properties.LABEL));

  let matchedRisk = null;

  for (const feature of validFeatures) {
    try {
      const geom = feature.geometry;

      if (geom.type === 'Polygon') {
        const poly = turf.polygon(geom.coordinates);
        if (turf.booleanPointInPolygon(point, poly)) {
          matchedRisk = feature.properties.LABEL;
          break;
        }
      } else if (geom.type === 'MultiPolygon') {
        for (const coords of geom.coordinates) {
          const poly = turf.polygon(coords);
          if (turf.booleanPointInPolygon(point, poly)) {
            matchedRisk = feature.properties.LABEL;
            break;
          }
        }
        if (matchedRisk) break;
      }
    } catch (e) {
      console.warn('Turf point-in-polygon error for feature:', e);
    }
  }

  state.currentRisk = matchedRisk ? matchedRisk.toUpperCase().trim() : null;
  updateBannerWithRisk(state.currentRisk);

  // Auto-open the edu panel — risk area or no-risk, always show info for the location
  const riskKey = (state.currentRisk && RISK_LEVELS[state.currentRisk]) ? state.currentRisk : 'NONE';
  openEduPanel(riskKey, { lat, lng });
}

function updateBannerWithRisk(riskKey) {
  locationBanner.className = '';

  if (!riskKey) {
    locationBanner.classList.add('risk-none');
    locationTextEl.textContent = 'No severe weather is expected in your area today.';
    return;
  }

  const risk = RISK_LEVELS[riskKey];

  if (risk) {
    locationBanner.classList.add(`risk-${riskKey.toLowerCase()}`);
    locationTextEl.textContent = `You are currently in a ${risk.label} Risk (${risk.short}) area.`;
  } else {
    locationBanner.classList.add('risk-none');
    locationTextEl.textContent = `You are in an outlook area: ${riskKey}`;
  }
}

function placeUserMarker(lat, lng) {
  if (state.userMarker) {
    state.userMarker.setLatLng([lat, lng]);
    return;
  }

  const icon = L.divIcon({
    className: 'user-marker',
    html: '<div class="user-marker-pulse"></div><div class="user-marker-dot"></div>',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });

  state.userMarker = L.marker([lat, lng], { icon, zIndexOffset: 1000 })
    .addTo(map)
    .bindPopup('<div class="popup-content"><strong>Your Location</strong></div>', {
      className: 'spc-popup',
    });
}

// ── Search Fallback (Nominatim) ──────────────────────────────

async function geocodeSearch(query) {
  searchBtn.disabled = true;
  searchBtn.textContent = 'Searching...';
  hideSearchError();

  try {
    const params = new URLSearchParams({
      q:            query,
      format:       'json',
      limit:        '1',
      countrycodes: 'us',
    });

    const response = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept': 'application/json' },
    });

    if (!response.ok) {
      throw new Error('Geocoding service error');
    }

    const results = await response.json();

    if (!results || results.length === 0) {
      showSearchError('No results found. Try a different city name or zip code.');
      return;
    }

    const { lat, lon, display_name } = results[0];
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lon);

    searchInput.value = display_name.split(',').slice(0, 2).join(',');
    handleLocationFound(parsedLat, parsedLng);

  } catch (err) {
    console.error('Geocoding error:', err);
    showSearchError('Unable to search. Please check your connection and try again.');
  } finally {
    searchBtn.disabled = false;
    searchBtn.textContent = 'Search';
  }
}

function showSearchError(msg) {
  searchError.textContent = msg;
  searchError.classList.remove('hidden');
}

function hideSearchError() {
  searchError.classList.add('hidden');
  searchError.textContent = '';
}

searchForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const query = searchInput.value.trim();
  if (query.length < 2) {
    showSearchError('Please enter at least 2 characters.');
    return;
  }
  geocodeSearch(query);
});

// ── Geometry / risk helpers (kept local to avoid circular imports) ──

function filterValidGeometry(feature) {
  const geom = feature.geometry;
  if (!geom) return false;
  if (geom.type === 'GeometryCollection') {
    return geom.geometries && geom.geometries.length > 0;
  }
  if (geom.coordinates) {
    return geom.coordinates.length > 0;
  }
  return false;
}

function getRiskOrder(label) {
  const key = (label || '').toUpperCase().trim();
  const risk = RISK_LEVELS[key];
  return risk ? risk.order : -1;
}
