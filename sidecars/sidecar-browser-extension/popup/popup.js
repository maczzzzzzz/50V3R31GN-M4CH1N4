'use strict';

/**
 * ◈ POPUP.JS : GLOW_TERMINAL_CONTROLLER — v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Manages the Ingress UI and live telemetry stream from the Browser Artery.
 */

const dot        = document.getElementById('dot');
const statusText = document.getElementById('status-text');
const logEl      = document.getElementById('log');
const btnPush    = document.getElementById('btn-push');
const btnReconn  = document.getElementById('btn-reconnect');

function log(msg, isError = false) {
  const line = document.createElement('div');
  line.className = 'log-line' + (isError ? ' error' : '');
  line.textContent = `[${new Date().toLocaleTimeString()}] ${msg}`;
  logEl.prepend(line);
  
  // Truncate stream to maintain "lite" footprint
  if (logEl.children.length > 20) {
    logEl.removeChild(logEl.lastChild);
  }
}

// Initial status request
chrome.runtime.sendMessage({ type: 'GET_STATUS' }, (response) => {
  if (response) updateUI(response.connected);
});

// Listen for mesh events
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATUS_UPDATE') {
    updateUI(msg.connected);
    log(msg.connected ? '::/ARTERY_LINK_ESTABLISHED' : '::/ARTERY_LINK_SEVERED', !msg.connected);
  } else if (msg.type === 'TELEMETRY_PULSE') {
    log(`::/RX : ${msg.payload.action || msg.payload.type || 'RAW_PULSE'}`);
  }
});

function updateUI(connected) {
  if (connected) {
    dot.classList.add('active');
    statusText.textContent = 'CONNECTED_MESH';
    statusText.style.color = '#00FF88';
  } else {
    dot.classList.remove('active');
    statusText.textContent = 'DISCONNECTED';
    statusText.style.color = '#404040';
  }
}

// Action: Push Active Shard
btnPush.addEventListener('click', () => {
  log('::/TX : SHARD_PUSH_INITIATED...');
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs[0]) return;
    chrome.runtime.sendMessage({
      type: 'PUSH_TAB',
      url: tabs[0].url,
      title: tabs[0].title
    }, (response) => {
      if (response?.success) {
        log('::/ACK : SHARD_MATERIALIZED');
      } else {
        log('::/ERR : PUSH_FAILED', true);
      }
    });
  });
});

// Action: Sync Artery
btnReconn.addEventListener('click', () => {
  log('::/TX : ARTERY_SYNC_SIGNAL...');
  chrome.runtime.sendMessage({ type: 'RECONNECT' });
});
