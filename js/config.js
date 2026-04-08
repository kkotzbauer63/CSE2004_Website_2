/* ============================================================
   config.js — Risk level definitions & API endpoints
   ============================================================ */

// ── SPC Risk Categories ──────────────────────────────────────
// Ordered from lowest to highest severity so higher risks
// render on top of lower ones on the map.
export const RISK_LEVELS = {
  NONE: {
    label: 'No Risk',
    short: 'NONE',
    color: '#e2e8f0',
    stroke: 'rgba(0,0,0,0.1)',
    description: 'No severe weather is expected in this area today.',
    order: -1,
    explanation: 'Thunderstorms are not expected today.',
    action: 'No danger from thunderstorms or severe weather',
  },
  TSTM: {
    label: 'Thunderstorm',
    short: 'TSTM',
    color: 'var(--spc-tstm)',
    stroke: 'rgba(0,0,0,0.2)',
    description: 'General thunderstorms are possible but not expected to be severe.',
    order: 0,
    /* TODO: Replace these placeholder strings with your own explanations */
    explanation: 'General thunderstorm outlines denote areas where thunderstorm activity is possible, but severe storms are not expected',
    action: 'No danger from severe weather, with the largest danger being from lightning. ',
  },
  MRGL: {
    label: 'Marginal',
    short: 'MRGL',
    color: 'var(--spc-mrgl)',
    stroke: 'rgba(0,0,0,0.3)',
    description: 'Isolated severe storms are possible, but limited in duration, coverage, or intensity',
    order: 1,
    explanation: 'Risk level of 1/5. General thunderstorms may be possible, and there is a small (<5%) risk for severe weather.',
    action: 'Danger to life is very low. Be aware of any severe thunderstorm or tornado warnings, and take shelter during any issued warnings.',
  },
  SLGT: {
    label: 'Slight',
    short: 'SLGT',
    color: 'var(--spc-slgt)',
    stroke: 'rgba(0,0,0,0.3)',
    description: 'Risk level of 2/5. Scattered severe storms are possible, which could include risks of isolated tornadoes (some strong), hail of 1 inch or greater, or damaging winds',
    order: 2,
    explanation: 'Thunderstorms have a chance of being severe. Usually associated with a 15% risk of severe wind or hail, or 5% tornado risk within a 25 mile radius.',
    action: 'Danger to life is low. Be aware of any severe thunderstorm or tornado warnings, and take shelter during any issued warnings',
  },
  ENH: {
    label: 'Enhanced',
    short: 'ENH',
    color: 'var(--spc-enh)',
    stroke: 'rgba(0,0,0,0.4)',
    description: 'Risk level of 3/5. Severe storms are possible, which could include risks of isolated to a few tornadoes (some strong), large hail of 3 inch or greater, or significant damaging winds',
    order: 3,
    explanation: 'Thunderstorms that form have a good chance of being severe. Usually associated with a 30% risk of severe wind or hail with significant severe conditional intensity category >=1, or 10% tornado risk with significant severe conditional intensity category >=1. Percentages are based on chance of severe event occuring within a 25 mile radius.',
    action: 'Danger to life is elevated. Be aware of any severe thunderstorm or tornado warnings, and take shelter during any issued warnings. ',
  },
  MDT: {
    label: 'Moderate',
    short: 'MDT',
    color: 'var(--spc-mdt)',
    stroke: 'rgba(0,0,0,0.4)',
    description: 'Risk level of 4/5. Widespread severe storms are possible, which could include risks of up to numerous tornadoes (some strong or intense), large hail of 4.5 inch or greater, or widespread significant damaging winds',
    order: 4,
    explanation: 'Numerous thunderstorms can form and have a good chance of being severe. Conditions for tornadoes will allow for the possibility of multiple strong or intense tornadoes. Usually associated with up to a 45% risk of severe wind or hail with significant severe conditional intensity category >=1, or 15% tornado risk with significant severe conditional intensity category >=2. Percentages are based on chance of severe event occuring within a 25 mile radius.',
    action: 'Danger to life is moderate. Be prepared for severe thunderstorm or tornado warnings, and even particularly dangerous situation (PDS) tornado warnings. Take shelter during any issued warnings. Have a plan for places to take shelter during the day',
  },
  HIGH: {
    label: 'High',
    short: 'HIGH',
    color: 'var(--spc-high)',
    stroke: 'rgba(0,0,0,0.5)',
    description: 'Risk level of 5/5. A severe weather outbreak is expected with intense, widespread storms. Major threat of violent tornadoes, very large hail of 4.5 inch or greater, and/or destructive damaging winds.',
    order: 5,
    explanation: 'An outbreak of severe thunderstorms is likely. Conditions for tornadoes will allow for the possibility of numerous strong to possibly violent tornadoes. Usually associated with signicant risk of large hail (4.5 inch or greater). High risk either is forecasted for possibility of 45-60% chance of significant winds with significant severe conditional intensity category >=2, or 30% tornado risk with significant severe conditional intensity category >=2. Percentages are based on chance of severe event occuring within a 25 mile radius.',
    action: 'Danger to life is high. Be prepared for destructive severe thunderstorm or particularly dangerous situation tornado warnings. Take shelter during any issued warnings. Have a plan for places to take shelter during the day',
  },
};

// ── API Endpoints ────────────────────────────────────────────
export const SPC_CAT_URL  = 'https://www.spc.noaa.gov/products/outlook/day1otlk_cat.lyr.geojson';
export const SPC_TORN_URL = 'https://www.spc.noaa.gov/products/outlook/day1otlk_torn.lyr.geojson';
export const SPC_HAIL_URL = 'https://www.spc.noaa.gov/products/outlook/day1otlk_hail.lyr.geojson';
export const SPC_WIND_URL = 'https://www.spc.noaa.gov/products/outlook/day1otlk_wind.lyr.geojson';
// ── Example Day Endpoints (March 15, 2025) ──────────────────
export const EXAMPLE_CAT_URL     = 'ExampleDay/cat_day1_1630.lyr.geojson';
export const EXAMPLE_TORN_URL    = 'ExampleDay/torn_day1_1630.lyr.geojson';
export const EXAMPLE_HAIL_URL    = 'ExampleDay/hail_day1_1630.lyr.geojson';
export const EXAMPLE_WIND_URL    = 'ExampleDay/wind_day1_1630.lyr.geojson';
export const EXAMPLE_CIGTORN_URL = 'ExampleDay/cigtorn_day1_1630.lyr.geojson';
export const EXAMPLE_CIGHAIL_URL = 'ExampleDay/cighail_day1_1630.lyr.geojson';
export const EXAMPLE_CIGWIND_URL = 'ExampleDay/cigwind_day1_1630.lyr.geojson';

// 25 miles expressed in meters — matches the SPC "within 25 miles" probability definition
export const RADIUS_METERS = 40233.6;

export const NOMINATIM_URL  = 'https://nominatim.openstreetmap.org/search';
export const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
