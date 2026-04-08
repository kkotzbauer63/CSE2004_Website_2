/* ============================================================
   example.js — Example Day (March 15, 2025) map & edu panel
   ============================================================ */

import { RISK_LEVELS, EXAMPLE_CAT_URL, EXAMPLE_TORN_URL, EXAMPLE_HAIL_URL, EXAMPLE_WIND_URL, EXAMPLE_CIGTORN_URL, EXAMPLE_CIGHAIL_URL, EXAMPLE_CIGWIND_URL, RADIUS_METERS } from './config.js';
import { filterValidGeometry } from './map.js';

// ── State (scoped to this module) ───────────────────────────
let exampleMap = null;
let outlookLayer = null;
let initialized = false;

// Probability GeoJSON data for the example day
const probData = { tornado: null, hail: null, wind: null };
const cigData  = { tornado: null, hail: null, wind: null };

let radiusCircle = null;  // 25-mile SPC probability radius circle

// ── DOM refs ────────────────────────────────────────────────
const mapEl          = document.getElementById('example-map');
const loadingEl      = document.getElementById('example-map-loading');
const legendList     = document.getElementById('example-legend-list');
const eduPanel       = document.getElementById('example-edu-panel');
const eduClose       = document.getElementById('example-edu-close');
const eduSwatch      = document.getElementById('example-edu-risk-swatch');
const eduTitle       = document.getElementById('example-edu-risk-title');
const eduExplanation = document.getElementById('example-edu-explanation');
const eduAction      = document.getElementById('example-edu-action');
const eduProbNote    = document.getElementById('example-edu-prob-note');
const probTornadoBar = document.getElementById('example-prob-tornado-bar');
const probTornadoVal = document.getElementById('example-prob-tornado-val');
const probHailBar    = document.getElementById('example-prob-hail-bar');
const probHailVal    = document.getElementById('example-prob-hail-val');
const probWindBar    = document.getElementById('example-prob-wind-bar');
const probWindVal    = document.getElementById('example-prob-wind-val');
const cigTornadoEl   = document.getElementById('example-prob-tornado-cig');
const cigHailEl      = document.getElementById('example-prob-hail-cig');
const cigWindEl      = document.getElementById('example-prob-wind-cig');

// ── Public: init on first visibility ────────────────────────

export function initExampleMap() {
  if (initialized) return;
  initialized = true;

  exampleMap = L.map(mapEl, {
    center: [37.5, -95.0],
    zoom: 4,
    zoomControl: false,
    minZoom: 3,
    maxZoom: 10,
  });

  L.control.zoom({ position: 'topright' }).addTo(exampleMap);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    subdomains: 'abcd',
    maxZoom: 19,
  }).addTo(exampleMap);

  loadExampleOutlook();
}

// ── Fetch & render ──────────────────────────────────────────

async function loadExampleOutlook() {
  try {
    // Fetch categorical + all probability + CIG layers in parallel
    const [catResp, tornResp, hailResp, windResp, cigTornResp, cigHailResp, cigWindResp] = await Promise.all([
      fetch(EXAMPLE_CAT_URL),
      fetch(EXAMPLE_TORN_URL).catch(() => null),
      fetch(EXAMPLE_HAIL_URL).catch(() => null),
      fetch(EXAMPLE_WIND_URL).catch(() => null),
      fetch(EXAMPLE_CIGTORN_URL).catch(() => null),
      fetch(EXAMPLE_CIGHAIL_URL).catch(() => null),
      fetch(EXAMPLE_CIGWIND_URL).catch(() => null),
    ]);

    if (!catResp.ok) throw new Error(`Server responded with ${catResp.status}`);

    const data = await catResp.json();
    if (!data || !data.features) throw new Error('Invalid GeoJSON');

    // Store probability data (non-critical)
    if (tornResp    && tornResp.ok)    probData.tornado = await tornResp.json();
    if (hailResp    && hailResp.ok)    probData.hail    = await hailResp.json();
    if (windResp    && windResp.ok)    probData.wind    = await windResp.json();
    if (cigTornResp && cigTornResp.ok) cigData.tornado  = await cigTornResp.json();
    if (cigHailResp && cigHailResp.ok) cigData.hail     = await cigHailResp.json();
    if (cigWindResp && cigWindResp.ok) cigData.wind     = await cigWindResp.json();

    const sorted = [...data.features].sort((a, b) => {
      return getRiskOrder(a.properties.LABEL) - getRiskOrder(b.properties.LABEL);
    });

    outlookLayer = L.geoJSON(
      { type: 'FeatureCollection', features: sorted },
      {
        style: styleFeature,
        onEachFeature: bindPopup,
        filter: filterValidGeometry,
      }
    ).addTo(exampleMap);

    buildLegend(data.features);
    hideLoading();

    // Invalidate size after map becomes visible (Leaflet needs this)
    setTimeout(() => exampleMap.invalidateSize(), 200);

  } catch (err) {
    console.error('Failed to load example outlook:', err);
    hideLoading();
  }
}

// ── Styling ─────────────────────────────────────────────────

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

function bindPopup(feature, layer) {
  const label = (feature.properties.LABEL || '').toUpperCase().trim();
  const risk  = RISK_LEVELS[label];

  const displayName = risk ? risk.label : feature.properties.LABEL2 || label;
  const description = risk ? risk.description : 'Outlook area issued by the Storm Prediction Center.';
  const swatchColor = risk ? risk.color : (feature.properties.fill || '#888');

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
    outlookLayer.resetStyle(this);
  });

  // Pass the click latlng so probability bars reflect the clicked point
  layer.on('click', function (e) {
    const coords = { lat: e.latlng.lat, lng: e.latlng.lng };

    // Draw or reposition the 25-mile SPC probability radius circle
    if (radiusCircle) {
      radiusCircle.setLatLng(e.latlng);
    } else {
      radiusCircle = L.circle(e.latlng, {
        radius:      RADIUS_METERS,
        color:       '#334155',
        weight:      1.5,
        opacity:     0.65,
        dashArray:   '6 5',
        fillColor:   '#0ea5e9',
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(exampleMap);
    }

    openExampleEdu(label, coords);
  });
}

// ── Legend ──────────────────────────────────────────────────

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

// ── Educational panel ────────────────────────────────────────

function openExampleEdu(riskKey, coords) {
  const key = (riskKey || '').toUpperCase().trim();
  const risk = RISK_LEVELS[key];
  if (!risk) return;

  eduSwatch.style.background = risk.color;
  eduTitle.textContent = `${risk.label} Risk (${risk.short})`;
  eduExplanation.textContent = risk.explanation;
  eduAction.textContent = risk.action;

  updateProbabilityBars(coords);

  eduPanel.classList.remove('hidden');
}

eduClose.addEventListener('click', () => {
  eduPanel.classList.add('hidden');
});

// ── Probability bars ────────────────────────────────────────

/**
 * Samples each probability GeoJSON layer at the given click coords
 * and updates the bar UI.
 * @param {{lat: number, lng: number}|null} coords
 */
function updateProbabilityBars(coords) {
  const tornProb = extractProbability(probData.tornado, coords);
  const hailProb = extractProbability(probData.hail,    coords);
  const windProb = extractProbability(probData.wind,    coords);

  setProbBar(probTornadoBar, probTornadoVal, tornProb);
  setProbBar(probHailBar,    probHailVal,    hailProb);
  setProbBar(probWindBar,    probWindVal,    windProb);

  setCigBadge(cigTornadoEl, extractCIG(cigData.tornado, coords));
  setCigBadge(cigHailEl,    extractCIG(cigData.hail,    coords));
  setCigBadge(cigWindEl,    extractCIG(cigData.wind,    coords));

  if (tornProb === null && hailProb === null && windProb === null) {
    eduProbNote.textContent = 'No individual probability data for this area.';
  } else {
    eduProbNote.textContent = 'Probability of severe weather within 25 miles of any point in the risk area.';
  }
}

/**
 * Extracts the highest probability percentage from a SPC probability
 * GeoJSON layer at the given coords.
 * Returns a number (e.g. 5) or null.
 * @param {object|null} geoJsonData
 * @param {{lat: number, lng: number}|null} coords
 */
function extractProbability(geoJsonData, coords) {
  if (!geoJsonData || !geoJsonData.features || !coords) return null;

  const point = turf.point([coords.lng, coords.lat]);
  let highest = null;

  for (const feature of geoJsonData.features) {
    if (!filterValidGeometry(feature)) continue;

    const label = feature.properties.LABEL || '';
    // SPC labels probabilities as either decimals ("0.30" = 30%) or integers ("30")
    const raw = parseFloat(label);
    if (isNaN(raw)) continue;
    const pct = raw <= 1 ? Math.round(raw * 100) : Math.round(raw);

    try {
      const geom = feature.geometry;
      let inside = false;

      if (geom.type === 'Polygon') {
        inside = turf.booleanPointInPolygon(point, turf.polygon(geom.coordinates));
      } else if (geom.type === 'MultiPolygon') {
        for (const coords of geom.coordinates) {
          if (turf.booleanPointInPolygon(point, turf.polygon(coords))) {
            inside = true;
            break;
          }
        }
      }

      if (inside && (highest === null || pct > highest)) {
        highest = pct;
      }
    } catch (e) {
      // skip malformed polygons
    }
  }

  return highest;
}

/**
 * Sets a probability bar's visual width and label text.
 * @param {HTMLElement} barEl
 * @param {HTMLElement} valEl
 * @param {number|null} pct
 */
function setProbBar(barEl, valEl, pct) {
  if (pct === null || pct === 0) {
    barEl.style.width = '0%';
    valEl.textContent = '< 2%';
    return;
  }
  // Cap visual bar at 60% (so 60% = full bar width)
  const visualWidth = Math.min((pct / 60) * 100, 100);
  barEl.style.width = `${visualWidth}%`;
  valEl.textContent = `${pct}%`;
}

/**
 * Finds the highest CIG level (1, 2, or 3) at the given coords
 * by checking which CIG polygon the point falls inside.
 * Returns an integer (1–3) or null.
 * @param {object|null} geoJsonData
 * @param {{lat: number, lng: number}|null} coords
 */
function extractCIG(geoJsonData, coords) {
  if (!geoJsonData || !geoJsonData.features || !coords) return null;

  const point = turf.point([coords.lng, coords.lat]);
  let highest = null;

  for (const feature of geoJsonData.features) {
    if (!filterValidGeometry(feature)) continue;

    const label = feature.properties.LABEL || '';
    // Match "CIG1", "CIG2", "CIG3"
    const match = label.match(/^CIG(\d+)$/i);
    if (!match) continue;
    const level = parseInt(match[1], 10);

    try {
      const geom = feature.geometry;
      let inside = false;

      if (geom.type === 'Polygon') {
        inside = turf.booleanPointInPolygon(point, turf.polygon(geom.coordinates));
      } else if (geom.type === 'MultiPolygon') {
        for (const coords of geom.coordinates) {
          if (turf.booleanPointInPolygon(point, turf.polygon(coords))) {
            inside = true;
            break;
          }
        }
      }

      if (inside && (highest === null || level > highest)) {
        highest = level;
      }
    } catch (e) {
      // skip malformed polygons
    }
  }

  return highest;
}

/**
 * Shows or hides a CIG badge element with the given level.
 * @param {HTMLElement} el
 * @param {number|null} level  — 1, 2, 3, or null
 */
function setCigBadge(el, level) {
  if (level === null) {
    el.classList.add('hidden');
    el.textContent = '';
    return;
  }
  el.textContent = `CIG ${level}`;
  el.classList.remove('hidden');
}

// ── Helpers ─────────────────────────────────────────────────

function getRiskOrder(label) {
  const key = (label || '').toUpperCase().trim();
  const risk = RISK_LEVELS[key];
  return risk ? risk.order : -1;
}

function hideLoading() {
  loadingEl.classList.add('fade-out');
  setTimeout(() => loadingEl.classList.add('hidden'), 400);
}
