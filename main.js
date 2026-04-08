/* ============================================================
   main.js — Entry point: wires up top-level events & boots app
   ============================================================ */

import { loadOutlook } from './js/map.js';
import { initExampleMap } from './js/example.js';
import { retryBtn } from './js/dom.js';

retryBtn.addEventListener('click', () => {
  loadOutlook();
});

loadOutlook();

// ── Example Day: lazy-init on CTA click or scroll ──────────
const exampleCta = document.getElementById('example-cta-btn');
const exampleSection = document.getElementById('example-day-section');

exampleCta.addEventListener('click', (e) => {
  e.preventDefault();
  exampleSection.scrollIntoView({ behavior: 'smooth' });
  initExampleMap();
});

// Also init if user scrolls to the section naturally
const exampleObserver = new IntersectionObserver(
  (entries) => {
    if (entries[0].isIntersecting) {
      initExampleMap();
      exampleObserver.disconnect();
    }
  },
  { rootMargin: '200px' }
);
exampleObserver.observe(exampleSection);
