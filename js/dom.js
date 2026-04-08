/* ============================================================
   dom.js — Cached DOM element references
   ============================================================ */

// ── Phase 1 — Map & Info Bar ─────────────────────────────────
export const mapLoadingEl  = document.getElementById('map-loading');
export const mapErrorEl    = document.getElementById('map-error');
export const errorMsgEl    = document.getElementById('error-message');
export const retryBtn      = document.getElementById('retry-btn');
export const validEl       = document.getElementById('outlook-valid');
export const forecasterEl  = document.getElementById('outlook-forecaster');
export const statusDot     = document.getElementById('status-indicator');
export const statusText    = document.getElementById('status-text');
export const legendList    = document.getElementById('legend-list');

// ── Phase 2 — Location Banner & Search ──────────────────────
export const locationBanner  = document.getElementById('location-banner');
export const locationResult  = document.getElementById('location-result');
export const locationTextEl  = document.getElementById('location-text');
export const locationSearch  = document.getElementById('location-search');
export const searchForm      = document.getElementById('search-form');
export const searchInput     = document.getElementById('search-input');
export const searchBtn       = document.getElementById('search-btn');
export const searchError     = document.getElementById('search-error');

// ── Phase 3 — Educational Panel ──────────────────────────────
export const eduPanel       = document.getElementById('edu-panel');
export const eduPanelClose  = document.getElementById('edu-panel-close');
export const eduRiskSwatch  = document.getElementById('edu-risk-swatch');
export const eduRiskTitle   = document.getElementById('edu-risk-title');
export const eduExplanation = document.getElementById('edu-explanation');
export const eduAction      = document.getElementById('edu-action');
export const probTornadoBar = document.getElementById('prob-tornado-bar');
export const probTornadoVal = document.getElementById('prob-tornado-val');
export const probHailBar    = document.getElementById('prob-hail-bar');
export const probHailVal    = document.getElementById('prob-hail-val');
export const probWindBar    = document.getElementById('prob-wind-bar');
export const probWindVal    = document.getElementById('prob-wind-val');
export const eduProbNote    = document.getElementById('edu-prob-note');

// ── Phase 4 — Weather Card ───────────────────────────────────
export const weatherCard    = document.getElementById('weather-card');
export const weatherLoading = document.getElementById('weather-loading');
export const weatherError   = document.getElementById('weather-error');
export const wxTemp         = document.getElementById('wx-temp');
export const wxHumidity     = document.getElementById('wx-humidity');
export const wxWind         = document.getElementById('wx-wind');
export const wxDewpoint     = document.getElementById('wx-dewpoint');
export const wxContext      = document.getElementById('wx-context');
