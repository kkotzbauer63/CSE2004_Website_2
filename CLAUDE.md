# Storm Outlook Explorer

## Project Context
Single-page weather app for CSE 2004 (Web Development) — Website #2 assignment.
Visualizes NOAA/SPC Day 1 Convective Outlook on an interactive map with geolocation.

## Commands
- `npm run dev` — start Vite dev server
- `npm run build` — production build

## File Structure
- `index.html`, `style.css`, `main.js`, `package.json`, `vite.config.js`

## APIs Used
1. Geolocation API (browser) — user positioning
2. SPC GeoJSON (NOAA) — severe weather outlook polygons
3. Nominatim (OpenStreetMap) — city/zip geocoding fallback
4. Open-Meteo — current weather conditions

## External Libraries
- Leaflet.js (mapping, CDN)
- Turf.js (point-in-polygon, CDN)

## Design Conventions
- Light Theme: Simple lighter color scheme, avoid gradients, use colors such as orange, white, blue, and yellow for elements outside the outlook colors
- Google Fonts: Inter (400–800)
- Flexbox layout, responsive to 640px
- Inline SVG icons only — no emojis
- Keep text professional, educational, but user friendly

## Remaining TODO
- Implement hail, tornado, wind data into edu panel probability breakdown
- Collect cigtorn, cigwind, cighail data
- Add feature for switching between categorical, hail, tornado, and wind risk for today
- Collapsible "Understanding SPC Probabilities" section