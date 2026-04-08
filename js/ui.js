/* ============================================================
   ui.js — UI state helpers (loading, error, status indicator)
   ============================================================ */

import { mapLoadingEl, mapErrorEl, errorMsgEl, statusDot, statusText } from './dom.js';

export function showLoading() {
  mapLoadingEl.classList.remove('fade-out', 'hidden');
}

export function hideLoading() {
  mapLoadingEl.classList.add('fade-out');
  setTimeout(() => mapLoadingEl.classList.add('hidden'), 400);
}

export function showError(msg) {
  errorMsgEl.textContent = msg;
  mapErrorEl.classList.remove('hidden');
}

export function hideError() {
  mapErrorEl.classList.add('hidden');
}

export function setStatus(state, text) {
  statusDot.className = '';
  if (state === 'live')  statusDot.classList.add('live');
  if (state === 'error') statusDot.classList.add('error');
  statusText.textContent = text;
}
