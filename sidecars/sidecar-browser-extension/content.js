/**
 * sidecar-browser-extension/content.js — Phase 87 Vivaldi Ingress
 *
 * Content script: extracts page context and forwards to background worker.
 *
 * Emits on:
 *   - window load (full page context)
 *   - mouseup with non-empty selection (selected text)
 */

'use strict';

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMeta(name) {
  const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
  return el ? (el.getAttribute('content') ?? '') : '';
}

function buildPageFrame(selection = '') {
  return {
    source:      'page_load',
    url:         location.href,
    title:       document.title,
    description: getMeta('description') || getMeta('og:description'),
    selection,
    timestamp:   new Date().toISOString(),
  };
}

function send(frame) {
  chrome.runtime.sendMessage({ type: 'CONTEXT_PUSH', payload: frame }, (resp) => {
    if (chrome.runtime.lastError) return; // popup not open — silently ignore
    if (resp && resp.ok) console.debug('[VivaldiIngress] Context pushed:', frame.url);
  });
}

// ── Push on page load ─────────────────────────────────────────────────────────
// Only push if the page is a real document (skip about:blank, chrome-extension://…)
if (location.protocol === 'http:' || location.protocol === 'https:') {
  if (document.readyState === 'complete') {
    send(buildPageFrame());
  } else {
    window.addEventListener('load', () => send(buildPageFrame()), { once: true });
  }
}

// ── Push on text selection ────────────────────────────────────────────────────
document.addEventListener('mouseup', () => {
  const sel = window.getSelection()?.toString().trim() ?? '';
  if (sel.length > 4) {  // ignore accidental single-word clicks
    send({ ...buildPageFrame(sel), source: 'selection' });
  }
});
