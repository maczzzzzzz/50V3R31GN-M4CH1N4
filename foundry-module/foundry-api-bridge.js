/**
 * foundry-api-bridge.js
 *
 * ASP.GM-Agent: Foundry VTT v12 WebSocket Bridge Module
 *
 * Co-Authored-By: ASP.GM-Agent <gm-agent@black-ice.net>
 *
 * Architecture (Palantiri-style Reverse Proxy):
 *   - This module runs INSIDE Foundry VTT's server-side Node.js process.
 *   - On init it connects OUTBOUND to the Node B FoundryAdapter WebSocket server.
 *   - This bypasses Foundry's session cookie / authentication barriers.
 *   - Node B PUSHES BridgeCommand frames down this established channel.
 *   - This module executes each command and sends back a BridgeResponse frame.
 *
 * Supported Commands (Phase 3 MVP + Phase 5.3 + Phase 6):
 *   - chat_message    → ChatMessage.create()
 *   - read_actor      → game.actors.get(id).toObject()
 *   - simple_phone    → ChatMessage with smartphone-widget flags
 *   - dice_roll       → Roll.evaluate()
 *   - scene_activate  → game.scenes.get(id).activate()
 *   - create_actor    → Actor.create() with stat seeding and bio notes
 *   - show_3d_dice    → Visual-only 3D dice trigger (Dice So Nice)
 *   - query_scenes    → game.scenes.contents discovery
 *
 * Config: module settings → Node B WS URL (default ws://localhost:3010)
 */

import { PretextOverlayManager } from './scripts/pretext-overlay-manager.js';

const MODULE_ID = 'foundry-api-bridge';
const DEFAULT_WS_URL = 'ws://localhost:3010';
const RECONNECT_DELAY_MS = 5000;
const MAX_RECONNECT_ATTEMPTS = 10;

class FoundryApiBridge {
  constructor() {
    this.ws = null;
    this.reconnectAttempts = 0;
    this.reconnectTimeout = null;
    this.destroyed = false;
    this.dashboard = null;
    this.socket = null; // Socketlib handle
    this.pendingRequests = new Map();
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  init() {
    const wsUrl = game.settings.get(MODULE_ID, 'nodeBWsUrl') ?? DEFAULT_WS_URL;
    
    // Register Socketlib if available
    if (game.modules.get('socketlib')?.active) {
      console.log(`[${MODULE_ID}] Socketlib detected. Initializing administrative socket.`);
      this.socket = socketlib.registerModule(MODULE_ID);
      this.socket.register('executeRawJs', (code) => {
        return new Function('return ' + code)();
      });
    }

    this._connect(wsUrl);
    window.ASP_BRIDGE = this;
  }

  destroy() {
    this.destroyed = true;
    if (this.reconnectTimeout) clearTimeout(this.reconnectTimeout);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    console.log(`[${MODULE_ID}] Bridge destroyed.`);
  }

  // ── Connection management ───────────────────────────────────────────────────

  _connect(wsUrl) {
    if (this.destroyed) return;

    console.log(`[${MODULE_ID}] Connecting to Node B at ${wsUrl} (attempt ${this.reconnectAttempts + 1})`);

    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
      console.log(`[${MODULE_ID}] Connected to Node B FoundryAdapter.`);
      this.ws = ws;
      this.reconnectAttempts = 0;
      this._sendHeartbeat();
    });

    ws.addEventListener('message', (event) => {
      this._handleMessage(event.data);
    });

    ws.addEventListener('close', () => {
      console.warn(`[${MODULE_ID}] Connection to Node B closed.`);
      this.ws = ws; // Maintain for reconnect check
      this.ws = null;
      this._scheduleReconnect(wsUrl);
    });

    ws.addEventListener('error', (event) => {
      console.error(`[${MODULE_ID}] WebSocket error:`, event);
    });
  }

  /**
   * Send an RPC request to Node B and wait for a success/error response.
   */
  async sendRequest(type, payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("Bridge not connected to Node B");
    }

    const requestId = Math.random().toString(36).substring(2, 11);
    return new Promise((resolve, reject) => {
      this.pendingRequests.set(requestId, { resolve, reject });
      this._send({ type, requestId, payload });
      
      // Timeout after 10s
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.get(requestId).reject(new Error("Request timed out"));
          this.pendingRequests.delete(requestId);
        }
      }, 10000);
    });
  }

  _scheduleReconnect(wsUrl) {
    if (this.destroyed) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error(`[${MODULE_ID}] Max reconnect attempts (${MAX_RECONNECT_ATTEMPTS}) reached. Giving up.`);
      return;
    }
    this.reconnectAttempts++;
    const delay = RECONNECT_DELAY_MS * Math.min(this.reconnectAttempts, 3);
    console.log(`[${MODULE_ID}] Reconnecting in ${delay}ms...`);
    this.reconnectTimeout = setTimeout(() => this._connect(wsUrl), delay);
  }

  // ── Heartbeat ───────────────────────────────────────────────────────────────

  /**
   * Emit a system_heartbeat event to Node B immediately after connection.
   * Reports which optional modules are active so Node B can select the correct
   * resiliency tier (Elite → Baseline → Degraded) per the Phase 15 spec.
   */
  _sendHeartbeat() {
    this._sendEvent('system_heartbeat', {
      socketlib: !!game.modules.get('socketlib')?.active,
      fxmaster:  !!game.modules.get('fxmaster')?.active,
      sequencer: !!game.modules.get('sequencer')?.active,
      splatter:  !!game.modules.get('splatter')?.active,
    });
    console.log(`[${MODULE_ID}] Heartbeat dispatched to Node B.`);
  }

  // ── Message handling ────────────────────────────────────────────────────────

  _handleMessage(raw) {
    let msg;
    try {
      msg = JSON.parse(raw);
    } catch (err) {
      console.error(`[${MODULE_ID}] Failed to parse message JSON:`, err);
      return;
    }

    // Handle responses to our own requests
    if (msg.type === 'success' || msg.type === 'error') {
      const pending = this.pendingRequests.get(msg.requestId);
      if (pending) {
        if (msg.type === 'success') pending.resolve(msg.data);
        else pending.reject(new Error(msg.message));
        this.pendingRequests.delete(msg.requestId);
        return;
      }
    }

    if (!msg || typeof msg.type !== 'string' || typeof msg.requestId !== 'string') {
      console.warn(`[${MODULE_ID}] Received malformed command (missing type or requestId):`, msg);
      return;
    }

    this._dispatch(msg).catch((err) => {
      console.error(`[${MODULE_ID}] Command '${msg.type}' threw uncaught error:`, err);
      this._sendError(msg.requestId, err.message ?? String(err));
    });
  }

  async _dispatch(command) {
    switch (command.type) {
      case 'chat_message':
        return this._handleChatMessage(command);
      case 'read_actor':
        return this._handleReadActor(command);
      case 'simple_phone':
        return this._handleSimplePhone(command);
      case 'dice_roll':
        return this._handleDiceRoll(command);
      case 'scene_activate':
        return this._handleSceneActivate(command);
      case 'update_actor':
        return this._handleUpdateActor(command);
      case 'queue_approval':
        return this._handleQueueApproval(command);
      case 'open_night_market':
        return this._handleOpenNightMarket(command);
      case 'create_actor':
        return this._handleCreateActor(command);
      case 'show_3d_dice':
        return this._handleShow3dDice(command);
      case 'query_scenes':
        return this._handleQueryScenes(command);
      case 'dashboard_sync':
        return this._handleDashboardSync(command);
      case 'fx_glitch':
        return this._handleFxGlitch(command);
      case 'run_sequence':
        return this._handleRunSequence(command);
      case 'pretext_overlay':
        return this._handlePretextOverlay(command);
      default:
        this._sendError(command.requestId, `Unknown command type: ${command.type}`);
    }
  }

  // â”€â”€ Command handlers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  async _handleFxGlitch({ requestId, payload }) {
    try {
      const intensity = payload.intensity ?? 1.0;
      
      // Preferred: FXMaster (GPU Accelerated)
      if (game.modules.get('fxmaster')?.active && FXMASTER.filters) {
        console.log(`[${MODULE_ID}] fx_glitch: Using FXMaster fallback.`);
        await FXMASTER.filters.addFilter("neural-glitch", "color", {
          color: { value: "#ff0000", apply: true },
          gamma: 1.0,
          contrast: 1.0 + (intensity * 0.5),
          brightness: 1.0,
          saturation: 0.2,
        });
        setTimeout(() => FXMASTER.filters.removeFilter("neural-glitch"), 500);
      } 
      // Fallback: Native CSS Glitch (Atmosphere-First Baseline)
      else {
        console.log(`[${MODULE_ID}] fx_glitch: Using Native CSS fallback.`);
        $('body').addClass('neural-glitch-active');
        setTimeout(() => $('body').removeClass('neural-glitch-active'), 500);
      }

      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleRunSequence({ requestId, payload }) {
    try {
      // Preferred: Sequencer (High-Fidelity)
      if (game.modules.get('sequencer')?.active) {
        console.log(`[${MODULE_ID}] run_sequence: Using Sequencer.`);
        const seq = new Sequence();
        payload.actions.forEach(act => {
          if (act.type === 'effect') {
            seq.effect().file(act.file).atLocation(act.location).scale(act.scale ?? 1.0);
          }
        });
        await seq.play();
      }
      // Fallback: Raw Architect Pass (Functional Baseline)
      else {
        console.log(`[${MODULE_ID}] run_sequence: Falling back to raw Architect Pass.`);
        // Implementation of basic token/light spawning via Foundry API
        for (const act of payload.actions) {
          if (act.type === 'effect' && act.actorId) {
            const scene = canvas.scene;
            await TokenDocument.createDocuments([{
              actorId: act.actorId,
              x: act.location.x,
              y: act.location.y
            }], { parent: scene });
          }
        }
      }
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handlePretextOverlay({ requestId, payload }) {
    try {
      await PretextOverlayManager.drawOverlay(payload);
      this._sendSuccess(requestId, null);
    } catch (err) {
      console.error(`[${MODULE_ID}] Pretext overlay failed:`, err);
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleDashboardSync({ requestId, payload }) {
    try {
      if (this.dashboard) {
        this.dashboard.update(payload);
      }
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleQueryScenes({ requestId, payload }) {
    try {
      const scenes = game.scenes.contents
        .filter(s => !payload.filter || s.name.toLowerCase().includes(payload.filter.toLowerCase()))
        .map(s => ({ id: s.id, name: s.name, active: s.active }));
      
      this._sendSuccess(requestId, scenes);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleShow3dDice({ requestId, payload }) {
    try {
      const roll = new Roll(payload.formula);
      roll._total = payload.result;
      roll._evaluated = true;

      if (game.dice3d) {
        await game.dice3d.showForRoll(roll, game.user, true, null, false);
      } else {
        console.warn(`[${MODULE_ID}] show_3d_dice: Dice So Nice module not found.`);
      }

      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleChatMessage({ requestId, payload }) {
    try {
      await ChatMessage.create({
        content: payload.content,
        type: payload.type ?? CONST.CHAT_MESSAGE_TYPES?.OOC ?? 1,
        speaker: payload.speaker ?? { alias: 'GM Assistant' },
        flags: {
          'foundry-api-bridge': { source: 'node-b-orchestrator' },
          ...(payload.flags ?? {}),
        },
      });
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleReadActor({ requestId, payload }) {
    try {
      const actor = game.actors?.get(payload.actorId);
      if (!actor) {
        this._sendError(requestId, `Actor not found: ${payload.actorId}`);
        return;
      }
      this._sendSuccess(requestId, actor.toObject());
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleSimplePhone({ requestId, payload }) {
    try {
      await ChatMessage.create({
        content: payload.body,
        type: CONST.CHAT_MESSAGE_TYPES?.OOC ?? 1,
        flags: {
          'smartphone-widget': {
            isPhoneMessage: true,
            senderNumber: payload.senderNumber,
            type: payload.messageType ?? 'text',
            app: payload.app ?? 'messages',
          },
        },
      });
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleDiceRoll({ requestId, payload }) {
    try {
      const roll = new Roll(payload.formula);
      await roll.evaluate();
      this._sendSuccess(requestId, { result: roll.total });
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleSceneActivate({ requestId, payload }) {
    try {
      const scene = game.scenes?.get(payload.sceneId);
      if (!scene) {
        this._sendError(requestId, `Scene not found: ${payload.sceneId}`);
        return;
      }
      await scene.activate();
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleUpdateActor({ requestId, payload }) {
    try {
      const actor = game.actors?.get(payload.actorId);
      if (!actor) {
        this._sendError(requestId, `Actor not found: ${payload.actorId}`);
        return;
      }
      await actor.update(payload.updates);
      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleQueueApproval({ requestId, payload }) {
    try {
      const content = `
        <p><strong>Type:</strong> ${payload.type}</p>
        <pre>${JSON.stringify(payload.data, null, 2)}</pre>
        ${payload.schema ? `<p><small>Schema: ${payload.schema}</small></p>` : ''}
      `;

      new Dialog({
        title: `GM Approval Required: ${payload.proposalId}`,
        content,
        buttons: {
          approve: {
            icon: '<i class="fas fa-check"></i>',
            label: 'Approve',
            callback: () => this._sendEvent('approval_response', { proposalId: payload.proposalId, status: 'approved' }),
          },
          deny: {
            icon: '<i class="fas fa-times"></i>',
            label: 'Deny',
            callback: () => this._sendEvent('approval_response', { proposalId: payload.proposalId, status: 'denied' }),
          },
        },
        default: 'approve',
      }).render(true);

      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleOpenNightMarket({ requestId, payload }) {
    try {
      const { actorId, vendorName, items } = payload;
      let itemsHtml = '';
      items.forEach((item, index) => {
        const eagleLabel = item.costEb <= 100
          ? `${item.costEagles} Eagle (2-for-1)`
          : item.costEb <= 500
            ? `${item.costEagles} Eagles`
            : `${item.costEagles} Eagles`;

        itemsHtml += `
          <div class="market-item" style="border:1px solid #3a3a3a; padding:8px; background:#222; display:flex; flex-direction:column; gap:4px;">
            <strong style="color:#e64539; font-size:0.9em;">${item.name}</strong>
            <small style="color:#999; font-size:0.75em; line-height:1.3;">${item.description.substring(0, 120)}</small>
            <div style="display:flex; justify-content:space-between; align-items:center; margin-top:6px;">
              <span style="font-size:0.8em; color:#ccc;">
                ${item.costEb}eb &nbsp;/&nbsp;
                <span style="color:#ffd700;">${eagleLabel}</span>
              </span>
              <button
                class="night-market-buy"
                data-index="${index}"
                style="background:#e64539; color:#fff; border:none; padding:3px 10px; cursor:pointer; font-size:0.8em; font-weight:bold; letter-spacing:0.05em;">
                BUY
              </button>
            </div>
          </div>`;
      });

      const content = `
        <div class="afterlife-ui" style="background:#1a1a1a; color:#e0d8cc; padding:12px; font-family:monospace;">
          <div style="display:flex; align-items:center; gap:8px; margin-bottom:10px;">
            <span style="color:#e64539; font-size:1.4em;">◈</span>
            <h3 style="margin:0; color:#e64539; font-size:1em; text-transform:uppercase; letter-spacing:0.1em;">
              ${vendorName}'s Stall
            </h3>
          </div>
          <div class="market-grid" style="display:grid; grid-template-columns:1fr 1fr; gap:8px;">
            ${itemsHtml || '<p style="color:#666; grid-column:1/-1; text-align:center; font-size:0.85em;">No items in stock, choom.</p>'}
          </div>
        </div>`;

      new Dialog({
        title: `Afterlife Night Market — ${vendorName}`,
        content,
        buttons: {
          close: {
            icon: '<i class="fas fa-door-open"></i>',
            label: 'Leave Market',
          },
        },
        default: 'close',
        render: (html) => {
          html.find('.night-market-buy').on('click', (evt) => {
            const index = parseInt($(evt.currentTarget).data('index'), 10);
            const item = items[index];
            if (!item) return;

            this._sendEvent('buy_item', {
              itemId: item.id,
              costEb: item.costEb,
              costEagles: item.costEagles,
              vendor: vendorName,
              actorId,
            });
            $(evt.currentTarget).prop('disabled', true).text('...');
          });
        },
      }).render(true);

      this._sendSuccess(requestId, null);
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  async _handleCreateActor({ requestId, payload }) {
    try {
      const { name, role, stats, bio, seedItems } = payload;

      const actor = await Actor.create({
        name,
        type: 'character',
        system: {
          notes: bio || '', 
          role: { value: role },
          stats: {
            int:  { value: stats['INT']  ?? 5 },
            ref:  { value: stats['REF']  ?? 5 },
            dex:  { value: stats['DEX']  ?? 5 },
            tech: { value: stats['TECH'] ?? 5 },
            cool: { value: stats['COOL'] ?? 5 },
            will: { value: stats['WILL'] ?? 5 },
            luck: { value: stats['LUCK'] ?? 5 },
            move: { value: stats['MOVE'] ?? 5 },
            body: { value: stats['BODY'] ?? 5 },
            emp:  { value: stats['EMP']  ?? 5 },
          },
        },
        prototypeToken: { name },
      });

      if (!actor) {
        this._sendError(requestId, 'Actor.create() returned null — Foundry rejected the document.');
        return;
      }

      if (seedItems && seedItems.length > 0) {
        const matchedItems = (game.items ?? []).filter((i) => seedItems.includes(i.name));
        if (matchedItems.length > 0) {
          await actor.createEmbeddedDocuments('Item', matchedItems.map((i) => i.toObject()));
        }
      }

      this._sendSuccess(requestId, { actorId: actor.id });
    } catch (err) {
      this._sendError(requestId, err.message ?? String(err));
    }
  }

  // ── Response helpers ────────────────────────────────────────────────────────

  _sendSuccess(requestId, data) {
    this._send({ type: 'success', requestId, data: data ?? null });
  }

  _sendError(requestId, message) {
    this._send({ type: 'error', requestId, message });
  }

  _sendEvent(type, payload) {
    this._send({ type, payload });
  }

  _send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[${MODULE_ID}] Cannot send — WebSocket not open. Dropping:`, payload);
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }
}

/**
 * DashboardTab Application
 * Custom SidebarTab implementation for the Night City Dashboard
 */
class DashboardTab extends Application {
  constructor(options = {}) {
    super(options);
    this.data = {
      hp: 40,
      maxHp: 40,
      hum: 60,
      maxHum: 60,
      hpBar: '##########',
      humBar: '##########',
      cells: Array.from({ length: 100 }, () => ({ color: 'rgba(0, 243, 255, 0.05)' })),
      actions: [
        { id: 'scan', label: 'Network Scan' },
        { id: 'ping', label: 'Bridge Ping' },
        { id: 'purge', label: 'Trace Purge' }
      ]
    };
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "asp-gm-dashboard",
      template: "modules/foundry-api-bridge/templates/dashboard.hbs",
      title: "Night City Dashboard",
      width: 320,
      height: 600,
      resizable: true,
      classes: ["asp-gm-dashboard-app"]
    });
  }

  getData() {
    return this.data;
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.terminal-btn').on('click', (evt) => {
      const action = evt.currentTarget.dataset.action;
      console.log(`[${MODULE_ID}] Dashboard action triggered: ${action}`);
      if (bridge) {
        bridge._sendEvent('dashboard_action', { action });
      }
    });
  }

  update(liveData) {
    this.data = foundry.utils.mergeObject(this.data, liveData, { inplace: false });
    
    // Auto-generate ASCII bars if hp/hum updated but bars not provided
    if (liveData.hp !== undefined || liveData.maxHp !== undefined) {
      this.data.hpBar = this._generateAsciiBar(this.data.hp, this.data.maxHp);
    }
    if (liveData.hum !== undefined || liveData.maxHum !== undefined) {
      this.data.humBar = this._generateAsciiBar(this.data.hum, this.data.maxHum);
    }

    this.render(false);
  }

  _generateAsciiBar(val, max) {
    if (!max || max <= 0) return '----------';
    const percent = Math.max(0, Math.min(1, val / max));
    const bars = Math.floor(percent * 10);
    return '#'.repeat(bars) + '-'.repeat(10 - bars);
  }
}

let bridge = null;

Hooks.once('init', () => {
  game.settings.register(MODULE_ID, 'nodeBWsUrl', {
    name: 'Node B WebSocket URL',
    hint: 'WebSocket address of the ASP.GM-Agent Node B FoundryAdapter server.',
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_WS_URL,
  });

  // Register the DashboardTab class
  if (CONFIG.ui.sidebarTabs) {
    CONFIG.ui.sidebarTabs["asp-gm-dashboard"] = DashboardTab;
  }
});

Hooks.once('ready', () => {
  if (!game.user?.isGM) return;
  bridge = new FoundryApiBridge();
  bridge.init();

  // Instantiate Dashboard for GM
  bridge.dashboard = new DashboardTab();
});

Hooks.once('closeApplication', () => {
  if (bridge) {
    bridge.destroy();
    bridge = null;
  }
});
