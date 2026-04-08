/* ============================================================
   state.js — Leaflet map initialization & shared mutable state
   ============================================================ */

// ── Initialize Leaflet Map ───────────────────────────────────
// L is loaded as a global from the Leaflet CDN script in index.html.
export const map = L.map('map', {
  center: [39.0, -97.0],
  zoom: 4,
  zoomControl: false,   // we add it to the right manually below
  minZoom: 3,
  maxZoom: 10,
  attributionControl: true,
});

// Place zoom control on the top-right so the left sidebar never covers it
L.control.zoom({ position: 'topright' }).addTo(map);

L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
  subdomains: 'abcd',
  maxZoom: 19,
}).addTo(map);

// ── Shared Mutable State ─────────────────────────────────────
// All modules read from and write to this single object to avoid
// tightly coupling modules through function arguments.
export const state = {
  outlookLayer: null,
  outlookData: null,
  userMarker: null,
  userCoords: null,
  currentRisk: null,    // The matched risk key (e.g. 'TSTM')
  radiusCircle: null,   // The 25-mile SPC probability radius circle

  // Probability data fetched from SPC layers
  probData: {
    tornado: null,
    hail: null,
    wind: null,
  },
};
