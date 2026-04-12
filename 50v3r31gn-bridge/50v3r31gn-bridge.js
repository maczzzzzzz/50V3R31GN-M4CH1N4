/**
 * foundry-api-bridge.js
 *
 * 50V3R31GN-M4CH1N4: Foundry VTT v12 WebSocket Bridge Module
 *
 * Architecture (Palantiri-style Reverse Proxy):
 *   - This module runs INSIDE Foundry VTT's server-side Node.js process.
 *   - On init it connects OUTBOUND to the Node B FoundryAdapter WebSocket server.
 *   - Config: module settings → Node B WS URL (default ws://localhost:3010)
 */

import { PretextOverlayManager } from './scripts/pretext-overlay-manager.js';
import './scripts/sovereign-dashboard.js';

/** PIXI v7 Compatibility Patch for legacy modules (CombatBooster) */
if (typeof PIXI !== 'undefined' && PIXI.filters && !PIXI.filters.ColorMatrixFilter) {
  console.log('[50v3r31gn-bridge] Patching PIXI.filters.ColorMatrixFilter for legacy compatibility...');
  PIXI.filters.ColorMatrixFilter = PIXI.filters.ColorMatrixFilterDeprecated;
}

const MODULE_ID = '50v3r31gn-bridge';
const DEFAULT_WS_URL = 'ws://localhost:3010';
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

/**
 * Phase 31: Capability Harvesting
 * Scans controlled tokens for available actions (items) and reports them to Node B.
 */
class ActionHarvester {
  static harvest(token) {
    if (!token?.actor) return [];
    return token.actor.items.map(item => ({
      id: item.id,
      name: item.name,
      type: item.type,
      img: item.img
    }));
  }
}

// Phase 42: Synthetic Gauntlet Hook
console.log(`[${MODULE_ID}] Top-level: Registering sub rosa.resolveAttack hook listener...`);
Hooks.on('sub rosa.resolveAttack', (payload) => {
  console.log(`[${MODULE_ID}] Synthetic Attack Hook Intercepted:`, payload);
  if (window.SOVEREIGN_BRIDGE && window.SOVEREIGN_BRIDGE.ws?.readyState === WebSocket.OPEN) {
    window.SOVEREIGN_BRIDGE._sendEvent('resolve_attack', payload);
  } else {
    console.warn(`[${MODULE_ID}] Bridge not ready or disconnected for attack hook!`);
  }
});

class FoundryApiBridge {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.destroyed = false;
    this.dashboard = null;
    this.socket = null; // Socketlib handle
    this.pendingRequests = new Map();
    this.journalCorruptionActive = true;
    this.corruptionType = 'leet';
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init() {
    const wsUrl = game.settings.get(MODULE_ID, 'nodeBWsUrl') ?? DEFAULT_WS_URL;

    // Initialize Pretext Engine
    PretextOverlayManager.init();

    // Register Socketlib if available
    if (game.modules.get('socketlib')?.active) {
      console.log(`[${MODULE_ID}] Socketlib detected. Initializing administrative socket.`);
      // @ts-ignore
      this.socket = socketlib.registerModule(MODULE_ID);
      this.socket.register('executeRawJs', (code) => {
        return new Function('return ' + code)();
      });
    }

    Hooks.on('renderJournalSheet', (app, html, data) => {
      if (this.journalCorruptionActive && window.HACK_ACTIVE) {
        this._hijackJournal(html);
      }
      const sceneType = app.document?.getFlag(MODULE_ID, 'sceneType');
      if (sceneType) {
        this._sendEvent('scene_dispatch', { sceneType, journalId: app.document.id });
      }
    });

    // Phase 31: Capability Harvesting
    Hooks.on('controlToken', (token, controlled) => {
      if (controlled && token.actor) {
        const items = ActionHarvester.harvest(token);
        this._sendEvent('capabilities_update', {
          actorId: token.actor.id,
          items: items
        });
      }
    });

    // Phase 39: Biometric Hover Protocol
    Hooks.on('hoverToken', (token, hovered) => {
      if (hovered && token) {
        this._sendEvent('perception_hover', {
          id: token.id,
          type: 'Token',
          imgPath: token.document?.texture?.src ?? '',
          x: token.x,
          y: token.y,
        });
        
        const isVendor = token.actor?.items?.some(i => i.type === "market") || token.document?.flags?.isVendor;
        if (isVendor) {
          this._sendEvent('hoverVendor', {
            actorId: token.actor.id,
            vendorName: token.name
          });
        }
      } else {
        this._sendEvent('perception_hover_out', { id: token?.id ?? null });
      }
    });

    Hooks.on('renderMainMenu', (app, html) => {
      const jqHtml = $(html);
      if (jqHtml.find('#sovereign-menu-btn').length) return;

      // Apply leet speak to all existing menu button text nodes
      const leetMap = { a:'4', e:'3', i:'1', o:'0', s:'5', t:'7', g:'6', b:'8', l:'1' };
      jqHtml.find('button, .menu-item').addBack('button, .menu-item').contents().filter(function() {
        return this.nodeType === 3 && this.nodeValue.trim().length > 0;
      }).each(function() {
        let out = '';
        for (const char of this.nodeValue) {
          const lo = char.toLowerCase();
          out += (leetMap[lo] && Math.random() < 0.65) ? leetMap[lo] : char;
        }
        this.nodeValue = out;
      });

      $('body').addClass('neural-glitch-active');
      setTimeout(() => $('body').removeClass('neural-glitch-active'), 400);

      const indicator = $(`
        <li id="sovereign-menu-btn" class="sovereign-menu-item">
          <button class="sovereign-btn" title="0p3N 5H4D0W_D45HB04RD">
            ◈ 50V3R31GN BR1DG3
          </button>
        </li>
      `);

      indicator.find('button').on('click', (ev) => {
        ev.preventDefault();
        // @ts-ignore
        if (game.sovereignDashboard) {
          game.sovereignDashboard.render({ force: true });
          // Ensure it doesn't block the menu's ability to close via Escape
          // by making sure the menu remains the top-most focused thing if it was already.
          if (ui.menu.rendered) ui.menu.element.focus();
        }
      });

      const menu = jqHtml.find('ol#menu-items, ol').first();
      if (menu.length) {
        menu.prepend(indicator);
      } else {
        const nav = jqHtml.find('nav').first();
        if (nav.length) nav.append(indicator);
      }
    });

    this._connect(wsUrl);
    this._setupInterception();
    this._setupCounterHacks();
    this._setupErrorCapture();
    window.SOVEREIGN_BRIDGE = this;
  }

  _setupErrorCapture() {
    // Capture unhandled JS errors and report them back to Node B
    window.addEventListener('error', (event) => {
      this._sendEvent('js_error', {
        message: event.message,
        source: event.filename,
        line: event.lineno,
        col: event.colno,
        stack: event.error?.stack ?? null,
        type: 'uncaughtError',
      });
    });
    window.addEventListener('unhandledrejection', (event) => {
      this._sendEvent('js_error', {
        message: String(event.reason),
        stack: event.reason?.stack ?? null,
        type: 'unhandledRejection',
      });
    });
  }

  _setupCounterHacks() {
    const bridge = this;
    const wrapper = async function(wrapped, ...args) {
      const [data] = args;
      if (data.x !== undefined || data.y !== undefined) {
        try {
          const isLegal = await bridge.sendRequest('validate_move', { 
            actorId: this.actor?.id, 
            tokenId: this.id,
            x: data.x !== undefined ? data.x : this.x, 
            y: data.y !== undefined ? data.y : this.y 
          });

          if (isLegal && isLegal.verdict === 'INVALID') {
            ui.notifications.warn(`Movement Blocked: ${isLegal.reason}`);
            return null; 
          }
        } catch (err) {
          console.error(`[${MODULE_ID}] Move validation failed:`, err);
        }
      }
      return wrapped(...args);
    };

    if (game.modules.get('lib-wrapper')?.active) {
      // @ts-ignore
      libWrapper.register(MODULE_ID, 'TokenDocument.prototype.update', wrapper, 'MIXED');
    }
  }

  _setupInterception() {
    const bridge = this;
    const INTERCEPT_EVENTS = ['applyDamage', 'updateActor', 'createItem', 'deleteItem'];

    const wrapper = async function(wrapped, ...args) {
      const [eventName, data] = args;
      if (INTERCEPT_EVENTS.includes(eventName)) {
        try {
          const result = await bridge.sendRequest('audit_intent', {
            event: eventName,
            data: data
          });
          if (result.verdict === 'INVALID') {
            ui.notifications.warn(`Rules Violation: ${result.reason}`);
            return false;
          }
        } catch (err) {
          console.error(`[${MODULE_ID}] Audit failed:`, err);
        }
      }
      return wrapped(...args);
    };

    if (game.modules.get('lib-wrapper')?.active) {
      // @ts-ignore
      libWrapper.register(MODULE_ID, 'game.socket.emit', wrapper, 'MIXED');
    }
  }

  _hijackJournal(html) {
    const leetMap = { 'a': '4', 'e': '3', 'i': '1', 'o': '0', 's': '5', 't': '7', 'g': '6', 'b': '8' };
    const parselChars = "0123456789!@#$%^&*()_+-=[]{}|;:,.<>?/\\░▒▓█";
    
    const transform = (text) => {
      let out = "";
      for (let char of text) {
        const lower = char.toLowerCase();
        if (this.corruptionType === 'leet' && leetMap[lower] && Math.random() < 0.4) {
          out += leetMap[lower];
        } else if (this.corruptionType === 'parsel' && Math.random() < 0.3) {
          out += parselChars[Math.floor(Math.random() * parselChars.length)];
        } else {
          out += char;
        }
      }
      return out;
    };

    const targets = html.find('h1, h2, h3, h4, h5, h6, .window-title, .header-label, .tab-label');
    const textNodes = targets.contents().filter(function() {
      return this.nodeType === 3;
    });

    textNodes.each(function() {
      this.nodeValue = transform(this.nodeValue);
    });

    html.closest('.app').find('.window-header').addClass('neural-glitch-active');
  }

  /**
   * Render a critical error as an in-game overlay and report it upstream to Node B.
   * Called by the Gauntlet Engine's manifestError() hook.
   * @param {{code: string, message: string, severity: string}} error
   */
  showErrorOverlay({ code = 'ERROR', message = 'Unknown error', severity = 'WARN' } = {}) {
    // Render in-game notification for immediate GM visibility
    if (ui?.notifications) {
      const label = `[${code}] ${message}`;
      if (severity === 'CRITICAL') {
        ui.notifications.error(label);
      } else {
        ui.notifications.warn(label);
      }
    }

    // Dispatch to PretextOverlayManager if available
    PretextOverlayManager.drawOverlay({
      label: `${code}: ${message}`,
      type: 'error',
      duration: severity === 'CRITICAL' ? 8000 : 4000,
    }).catch(() => { /* non-fatal if overlay engine not ready */ });

    // Stream the error event upstream to Node B for observability
    this._sendEvent('gauntlet_error', {
      code,
      message,
      severity,
      timestamp: Date.now(),
    });
  }

  destroy() {
    this.destroyed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  _connect(wsUrl) {
    if (this.destroyed) return;
    console.log(`[${MODULE_ID}] Connecting to Node B at ${wsUrl}`);
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
      console.log(`[${MODULE_ID}] Connected to Node B.`);
      this.ws = ws;
      this.reconnectAttempts = 0;
      this._sendHeartbeat();
    });

    ws.addEventListener('message', (event) => {
      this._handleMessage(event.data);
    });

    ws.addEventListener('close', () => {
      this.ws = null;
      this._scheduleReconnect(wsUrl);
    });
  }

  async sendRequest(type, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Bridge not connected");
    }
    const requestId = Math.random().toString(36).substring(2, 11);
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this._send({ type, requestId, payload });
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.get(requestId).reject(new Error("Timeout"));
          this.pendingRequests.delete(requestId);
        }
      }, 10000);
    });
  }

  _scheduleReconnect(wsUrl) {
    if (this.destroyed) return;
    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 3);
    this.reconnectTimeout = setTimeout(() => this._connect(wsUrl), delay);
  }

  _sendHeartbeat() {
    this._sendEvent('system_heartbeat', {
      socketlib: !!game.modules.get('socketlib')?.active,
      fxmaster:  !!game.modules.get('fxmaster')?.active,
      sequencer: !!game.modules.get('sequencer')?.active,
      splatter:  !!game.modules.get('splatter')?.active,
    });
  }

  _handleMessage(raw) {
    let msg;
    try { msg = JSON.parse(raw); } catch (err) { return; }

    if (msg.type === 'success' || msg.type === 'error') {
      const pending = this.pendingRequests.get(msg.requestId);
      if (pending) {
        if (msg.type === 'success') pending.resolve(msg.data);
        else pending.reject(new Error(msg.message));
        this.pendingRequests.delete(msg.requestId);
        return;
      }
    }

    if (!msg || !msg.type || !msg.requestId) return;
    this._dispatch(msg).catch((err) => {
      this._sendError(msg.requestId, err.message ?? String(err));
    });
  }

  async _dispatch(command) {
    switch (command.type) {
      case 'chat_message':
        await ChatMessage.create({
          content: command.payload.content,
          speaker: command.payload.speaker ?? { alias: 'GM Assistant' },
        });
        break;
      case 'journal_hijack':
        this.journalCorruptionActive = command.payload.active ?? true;
        this.corruptionType = command.payload.type ?? 'leet';
        if (typeof window.setSovereignHack === 'function') {
          window.setSovereignHack(this.journalCorruptionActive);
        }
        break;
      case 'fx_glitch':
        $('body').addClass('neural-glitch-active');
        setTimeout(() => $('body').removeClass('neural-glitch-active'), 500);
        break;
      case 'pretext_overlay':
        await PretextOverlayManager.drawOverlay(command.payload);
        break;
      case 'scene_dispatch_result':
        await ChatMessage.create({
          content: command.payload.content,
          speaker: command.payload.speaker ?? { alias: '50V3R31GN' },
          whisper: [game.user.id],
        });
        break;
      case 'create_actor':
        await Actor.create(command.payload);
        break;
      case 'run_script':
        // @ts-ignore
        if (this.socket) {
          // @ts-ignore
          await this.socket.executeAsGM('executeRawJs', command.payload.code);
        } else {
          // Fallback to local eval if socketlib is missing or not GM
          new Function(command.payload.code)();
        }
        break;
    }
    this._sendSuccess(command.requestId, null);
  }

  _sendSuccess(requestId, data) { this._send({ type: 'success', requestId, data }); }
  _sendError(requestId, message) { this._send({ type: 'error', requestId, message }); }
  _sendEvent(type, payload) {
    const requestId = `evt-${Math.random().toString(36).substring(2, 11)}`;
    this._send({ type, requestId, payload });
  }
  _send(payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
    }
  }
}

/**
 * DashboardTab Application
 */
class DashboardTab extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "50v3r31gn-dashboard",
      template: "modules/50v3r31gn-bridge/templates/dashboard.hbs",
      title: "Night City Dashboard",
      width: 320,
      height: 600,
      resizable: true,
      closeOnEscape: false,
    });
  }
}

let bridge = null;

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'nodeBWsUrl', {
    name: 'Node B WebSocket URL',
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_WS_URL,
  });

  // @ts-ignore
  if (CONFIG.ui.sidebarTabs) {
    // @ts-ignore
    CONFIG.ui.sidebarTabs["50v3r31gn-dashboard"] = DashboardTab;
  }
});

Hooks.once('ready', () => {
  if (!game.user?.isGM) return;
  if (window.SOVEREIGN_BRIDGE) {
    console.warn(`[${MODULE_ID}] Bridge already exists. Skipping re-init.`);
    return;
  }
  window.SOVEREIGN_BRIDGE = new FoundryApiBridge();
  window.SOVEREIGN_BRIDGE.init();
});

Hooks.once('closeApplication', () => {
  if (window.SOVEREIGN_BRIDGE) {
    window.SOVEREIGN_BRIDGE.destroy();
    window.SOVEREIGN_BRIDGE = null;
  }
});
