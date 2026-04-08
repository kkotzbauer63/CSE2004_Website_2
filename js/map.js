/* ============================================================
   map.js — Phase 1: SPC outlook fetching & map rendering
   ============================================================ */

import { RISK_LEVELS, SPC_CAT_URL, SPC_TORN_URL, SPC_HAIL_URL, SPC_WIND_URL, RADIUS_METERS } from './config.js';
import { map, state } from './state.js';
import { validEl, forecasterEl, legendList } from './dom.js';
import { showLoading, hideLoading, showError, hideError, setStatus } from './ui.js';
import { requestUserLocation } from './location.js';
import { fetchWeather } from './weather.js';

// ══════════════════════════════════════════════════════════════
//  PHASE 1 — Fetch & Render SPC Outlook
// ══════════════════════════════════════════════════════════════

export async function loadOutlook() {
  showLoading();
  hideError();

  try {
    // Fetch categorical outlook and probability layers in parallel
    const [catResponse, tornResp, hailResp, windResp] = await Promise.all([
      fetch(SPC_CAT_URL),
      fetch(SPC_TORN_URL).catch(() => null),
      fetch(SPC_HAIL_URL).catch(() => null),
      fetch(SPC_WIND_URL).catch(() => null),
    ]);

    if (!catResponse.ok) {
      throw new Error(`Server responded with ${catResponse.status}`);
    }

    const data = await catResponse.json();

    if (!data || !data.features) {
      throw new Error('Invalid GeoJSON data received');
    }

    state.outlookData = data;

    // Parse probability data (non-critical — we don't fail if they error)
    if (tornResp && tornResp.ok) state.probData.tornado = await tornResp.json();
    if (hailResp && hailResp.ok) state.probData.hail    = await hailResp.json();
    if (windResp && windResp.ok) state.probData.wind    = await windResp.json();

    if (state.outlookLayer) {
      map.removeLayer(state.outlookLayer);
    }

    const sortedFeatures = sortFeaturesByRisk(data.features);

    state.outlookLayer = L.geoJSON(
      { type: 'FeatureCollection', features: sortedFeatures },
      {
        style: styleFeature,
        onEachFeature: bindPopup,
        filter: filterValidGeometry,
      }
    ).addTo(map);

    updateInfoBar(data.features);
    buildLegend(data.features);
    setStatus('live', 'Outlook data loaded');
    hideLoading();

    // Kick off geolocation after data loaded
    requestUserLocation();

    // Map-level click — only fires when clicking outside all outlook polygons
    // (polygon clicks call L.DomEvent.stopPropagation, so they never reach here)
    map.on('click', function (e) {
      const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

      if (state.radiusCircle) {
        state.radiusCircle.setLatLng(e.latlng);
      } else {
        state.radiusCircle = L.circle(e.latlng, {
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

      fetchWeather(coords.lat, coords.lng);
      import('./edu.js').then(({ openEduPanel }) => openEduPanel('NONE', coords));
    });

  } catch (err) {
    console.error('Failed to load SPC outlook:', err);
    setStatus('error', 'Failed to load data');
    showError(err.message || 'Unable to load outlook data. Please try again later.');
    hideLoading();
  }
}

// ── GeoJSON helpers ──────────────────────────────────────────

export function filterValidGeometry(feature) {
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

function sortFeaturesByRisk(features) {
  return [...features].sort((a, b) => {
    return getRiskOrder(a.properties.LABEL) - getRiskOrder(b.properties.LABEL);
  });
}

function getRiskOrder(label) {
  const key = (label || '').toUpperCase().trim();
  const risk = RISK_LEVELS[key];
  return risk ? risk.order : -1;
}

function styleFeature(feature) {
  const label = (feature.properties.LABEL || '').toUpperCase().trim();
  const risk = RISK_LEVELS[label];

  if (risk) {
    return {
      fillColor:   risk.color,
      fillOpacity: 0.35,
      color:       risk.stroke,
      weight:      2,
      opacity:     0.8,
    };
  }

  return {
    fillColor:   feature.properties.fill || '#888',
    fillOpacity: 0.3,
    color:       feature.properties.stroke || '#666',
    weight:      1.5,
    opacity:     0.7,
  };
}

// ── Popups ───────────────────────────────────────────────────

function bindPopup(feature, layer) {
  const label = (feature.properties.LABEL || '').toUpperCase().trim();
  const risk  = RISK_LEVELS[label];

  const displayName  = risk ? risk.label : feature.properties.LABEL2 || label;
  const description  = risk ? risk.description : 'Outlook area issued by the Storm Prediction Center.';
  const swatchColor  = risk ? risk.color : (feature.properties.fill || '#888');

  const html = `
    <div class="popup-content">
      <div class="popup-risk-label">
        <span class="popup-risk-swatch" style="background:${swatchColor};"></span>
        ${displayName} Risk
      </div>
      <p class="popup-risk-description">${description}</p>
    </div>
  `;

  layer.bindPopup(html, { maxWidth: 280, className: 'spc-popup' });

  layer.on('mouseover', function () {
    this.setStyle({ fillOpacity: 0.55, weight: 3 });
  });
  layer.on('mouseout', function () {
    state.outlookLayer.resetStyle(this);
  });

  // Phase 3: clicking a polygon also opens the educational panel
  layer.on('click', function (e) {
    // Stop event from bubbling to the map-level click handler (no-risk areas).
    L.DomEvent.stopPropagation(e);

    const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

    // Draw or reposition the 25-mile SPC probability radius circle
    if (state.radiusCircle) {
      state.radiusCircle.setLatLng(e.latlng);
    } else {
      state.radiusCircle = L.circle(e.latlng, {
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

    // Update weather conditions for the clicked location
    fetchWeather(coords.lat, coords.lng);

    import('./edu.js').then(({ openEduPanel }) => openEduPanel(label, coords));
  });
}

// ── Legend ────────────────────────────────────────────────────

function buildLegend(features) {
  const activeLabels = new Set();
  features.forEach((f) => {
    if (filterValidGeometry(f)) {
      activeLabels.add((f.properties.LABEL || '').toUpperCase().trim());
    }
  });

  legendList.innerHTML = '';

  const orderedKeys = Object.keys(RISK_LEVELS).sort(
    (a, b) => RISK_LEVELS[a].order - RISK_LEVELS[b].order
  );

  orderedKeys.forEach((key) => {
    if (key === 'NONE') return;

    const risk     = RISK_LEVELS[key];
    const isActive = activeLabels.has(key);

    const li = document.createElement('li');
    li.className = 'legend-item';
    if (!isActive) li.style.opacity = '0.35';

    li.innerHTML = `
      <span class="legend-swatch" style="background:${risk.color};"></span>
      <span>
        <span class="legend-label">${risk.label}</span>
        <span class="legend-sublabel"> (${risk.short})</span>
      </span>
    `;

    legendList.appendChild(li);
  });

  // Static radius entry — always shown at the bottom with a separator
  const radiusLi = document.createElement('li');
  radiusLi.className = 'legend-item legend-item-radius';
  radiusLi.innerHTML = `
    <svg class="legend-radius-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6" stroke="#334155" stroke-width="1.5" stroke-dasharray="4 3" stroke-opacity="0.65"/>
    </svg>
    <span class="legend-label">25-Mile Radius</span>
  `;
  legendList.appendChild(radiusLi);
}

// ── Info Bar ─────────────────────────────────────────────────

function updateInfoBar(features) {
  const first = features[0];
  if (!first) return;

  const props = first.properties;

  if (props.VALID_ISO && props.EXPIRE_ISO) {
    const validDate  = new Date(props.VALID_ISO);
    const expireDate = new Date(props.EXPIRE_ISO);
    const options = { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' };
    validEl.textContent = `Valid: ${validDate.toLocaleString(undefined, options)} -- ${expireDate.toLocaleString(undefined, options)}`;
    validEl.classList.add('loaded');
  } else if (props.VALID && props.EXPIRE) {
    validEl.textContent = `Valid: ${props.VALID} -- Expires: ${props.EXPIRE}`;
    validEl.classList.add('loaded');
  }

  if (props.FORECASTER) {
    forecasterEl.textContent = `Forecaster: ${props.FORECASTER}`;
    forecasterEl.classList.add('loaded');
  }
}
