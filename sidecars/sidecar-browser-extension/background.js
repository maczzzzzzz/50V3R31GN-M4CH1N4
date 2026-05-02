/**
 * sidecar-browser-extension/background.js — Phase 87 Vivaldi Ingress
 *
 * Service worker that maintains a persistent WebSocket relay to the
 * Sovereign Host Bridge (port 3012) and forwards context pushes from
 * the content script and popup.
 *
 * Protocol:
 *   { type: "CONTEXT_PUSH", payload: ContextFrame }
 *   { type: "PING" }
 *   Server replies: { type: "ACK", trace_id: string }
 */

'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────
const BRIDGE_URL      = 'ws://localhost:3012';
const RECONNECT_DELAY = 3000;     // ms between reconnect attempts
const HEARTBEAT_MS    = 25000;    // keep-alive ping interval

// ── State ─────────────────────────────────────────────────────────────────────
let ws          = null;
let wsReady     = false;
let pingTimer   = null;
let reconnTimer = null;

// ── WebSocket lifecycle ───────────────────────────────────────────────────────

function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) return;

  console.log('[VividalIngress] Connecting to Sovereign Bridge at', BRIDGE_URL);
  ws = new WebSocket(BRIDGE_URL);

  ws.addEventListener('open', () => {
    wsReady = true;
    clearTimeout(reconnTimer);
    console.log('[VivaldiIngress] Bridge connection established.');

    // broadcast status to popup if open
    chrome.runtime.sendMessage({ type: 'STATUS', connected: true }).catch(() => {});

    // start heartbeat
    pingTimer = setInterval(() => {
      if (wsReady) ws.send(JSON.stringify({ type: 'PING' }));
    }, HEARTBEAT_MS);
  });

  ws.addEventListener('message', (ev) => {
    try {
      const msg = JSON.parse(ev.data);
      if (msg.type === 'ACK') {
        console.log('[VivaldiIngress] ACK received for trace', msg.trace_id);
      }
    } catch (_) { /* non-JSON keep-alives ignored */ }
  });

  ws.addEventListener('close', () => {
    wsReady = false;
    clearInterval(pingTimer);
    console.log('[VivaldiIngress] Bridge disconnected. Reconnecting in', RECONNECT_DELAY, 'ms…');
    chrome.runtime.sendMessage({ type: 'STATUS', connected: false }).catch(() => {});
    reconnTimer = setTimeout(connect, RECONNECT_DELAY);
  });

  ws.addEventListener('error', (err) => {
    console.warn('[VivaldiIngress] WebSocket error:', err.message ?? err);
    ws.close();
  });
}

// ── Context push ─────────────────────────────────────────────────────────────

function pushContext(frame) {
  const packet = JSON.stringify({ type: 'CONTEXT_PUSH', payload: frame });
  if (wsReady && ws.readyState === WebSocket.OPEN) {
    ws.send(packet);
    return true;
  } else {
    console.warn('[VivaldiIngress] Bridge not ready — context push queued for next connection.');
    return false;
  }
}

// ── Message bus (content.js / popup.js → background) ──────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'CONTEXT_PUSH':
      sendResponse({ ok: pushContext(msg.payload) });
      break;
    case 'GET_STATUS':
      sendResponse({ connected: wsReady });
      break;
    default:
      sendResponse({ ok: false, error: 'unknown_type' });
  }
  return true; // keep channel open for async response
});

// ── Context-menu: "Push to Synapse" ──────────────────────────────────────────
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id:       'push-to-synapse',
    title:    '◈ Push selection to Synapse Palace',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== 'push-to-synapse') return;
  pushContext({
    source:     'context_menu',
    url:        tab.url,
    title:      tab.title,
    selection:  info.selectionText,
    timestamp:  new Date().toISOString(),
  });
});

// ── Boot ─────────────────────────────────────────────────────────────────────
connect();
