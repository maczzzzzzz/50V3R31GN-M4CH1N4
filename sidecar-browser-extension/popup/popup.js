'use strict';

const dot        = document.getElementById('dot');
const statusText = document.getElementById('status-text');
const logEl      = document.getElementById('log');
const btnPush    = document.getElementById('btn-push');
const btnReconn  = document.getElementById('btn-reconnect');

function setConnected(on) {
  dot.classList.toggle('connected', on);
  statusText.textContent = on ? 'Bridge: CONNECTED' : 'Bridge: OFFLINE';
  statusText.className   = on ? 'ok' : '';
}

function log(msg) {
  const ts = new Date().toLocaleTimeString('en', { hour12: false });
  logEl.textContent = `[${ts}] ${msg}`;
}

// Query background for current status
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (resp) => {
  if (chrome.runtime.lastError) { setConnected(false); return; }
  setConnected(resp?.connected ?? false);
});

// Listen for live status updates while popup is open
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATUS') setConnected(msg.connected);
});

// Manual context push: query active tab then ask background to forward
btnPush.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) { log('No active tab found.'); return; }

  const frame = {
    source:    'popup_push',
    url:       tab.url,
    title:     tab.title,
    timestamp: new Date().toISOString(),
  };

  chrome.runtime.sendMessage({ type: 'CONTEXT_PUSH', payload: frame }, (resp) => {
    if (chrome.runtime.lastError) { log('Background unreachable.'); return; }
    log(resp?.ok ? `Pushed: ${tab.title}` : 'Push failed — bridge offline.');
  });
});

// Reconnect hint (background handles actual reconnect loop)
btnReconn.addEventListener('click', () => {
  log('Reconnect signal sent…');
  chrome.runtime.sendMessage({ type: 'RECONNECT' }).catch(() => {});
});
