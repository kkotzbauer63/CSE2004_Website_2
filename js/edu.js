/* ============================================================
   edu.js — Phase 3: Educational sidebar panel
   ============================================================ */

import { RISK_LEVELS } from './config.js';
import { state } from './state.js';
import {
  eduPanel, eduPanelClose,
  eduRiskSwatch, eduRiskTitle, eduExplanation, eduAction,
  probTornadoBar, probTornadoVal,
  probHailBar, probHailVal,
  probWindBar, probWindVal,
  eduProbNote,
} from './dom.js';

/**
 * Opens the educational sidebar for a given risk category.
 * Populates the explanation, action items, and probability bars.
 * @param {string} riskKey - e.g. 'SLGT'
 * @param {{lat: number, lng: number}} [coords] - the click point to sample probabilities from.
 *   Falls back to state.userCoords if omitted.
 */
export function openEduPanel(riskKey, coords) {
  const key = (riskKey || '').toUpperCase().trim();
  const risk = RISK_LEVELS[key];

  if (!risk) return;

  // Update header — NONE uses a plain label without the redundant "Risk (NONE)" suffix
  eduRiskSwatch.style.background = risk.color;
  eduRiskTitle.textContent = key === 'NONE'
    ? risk.label
    : `${risk.label} Risk (${risk.short})`;

  // Populate placeholder sections
  eduExplanation.textContent = risk.explanation;
  eduAction.textContent = risk.action;

  // Update probability bars — use the provided click coords, or fall back to user's location
  updateProbabilityBars(coords || state.userCoords);

  // Show panel
  eduPanel.classList.remove('hidden');
}

/**
 * Closes the educational sidebar.
 */
export function closeEduPanel() {
  eduPanel.classList.add('hidden');
}

eduPanelClose.addEventListener('click', closeEduPanel);

// ── Probability Bars ─────────────────────────────────────────

/**
 * Reads the probability data from the SPC tornado/hail/wind layers
 * and updates the visual bar chart in the edu panel.
 * @param {{lat: number, lng: number}|null} coords
 */
function updateProbabilityBars(coords) {
  const tornProb = extractProbability(state.probData.tornado, coords);
  const hailProb = extractProbability(state.probData.hail, coords);
  const windProb = extractProbability(state.probData.wind, coords);

  setProbBar(probTornadoBar, probTornadoVal, tornProb);
  setProbBar(probHailBar,    probHailVal,    hailProb);
  setProbBar(probWindBar,    probWindVal,    windProb);

  // Update note if all are zero / unavailable
  if (tornProb === null && hailProb === null && windProb === null) {
    eduProbNote.textContent = 'No individual probability data issued for today.';
  } else {
    eduProbNote.textContent = 'Probability of severe weather within 25 miles of any point in the risk area.';
  }
}

/**
 * Extracts the highest probability percentage from a SPC probability
 * GeoJSON layer that the given coords fall inside.
 * Returns a number (e.g. 5 for 5%) or null if not applicable.
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
 * Sets a probability bar's width and label text.
 */
function setProbBar(barEl, valEl, pct) {
  if (pct === null || pct === 0) {
    barEl.style.width = '0%';
    valEl.textContent = '< 2%';
    return;
  }

  // Cap display at 60% for the bar visual (so 60% = full bar)
  const visualWidth = Math.min((pct / 60) * 100, 100);
  barEl.style.width = `${visualWidth}%`;
  valEl.textContent = `${pct}%`;
}

// ── Geometry helper (duplicated from map.js to avoid circular import) ──
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
