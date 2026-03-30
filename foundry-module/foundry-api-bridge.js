/**
 * foundry-api-bridge.js
 *
 * ASP.GM-Agent: Foundry VTT v12 WebSocket Bridge Module
 *
 * Architecture (Palantiri-style Reverse Proxy):
 *   - This module runs INSIDE Foundry VTT's server-side Node.js process.
 *   - On init it connects OUTBOUND to the Node B FoundryAdapter WebSocket server.
 *   - This bypasses Foundry's session cookie / authentication barriers.
 *   - Node B PUSHES BridgeCommand frames down this established channel.
 *   - This module executes each command and sends back a BridgeResponse frame.
 *
 * Supported Commands (Phase 3 MVP):
 *   - chat_message    → ChatMessage.create()
 *   - read_actor      → game.actors.get(id).toObject()
 *   - simple_phone    → ChatMessage with smartphone-widget flags
 *   - dice_roll       → Roll.evaluate()
 *   - scene_activate  → game.scenes.get(id).activate()
 *
 * Config: module settings → Node B WS URL (default ws://localhost:3010)
 */

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
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  init() {
    const wsUrl = game.settings.get(MODULE_ID, 'nodeBWsUrl') ?? DEFAULT_WS_URL;
    this._connect(wsUrl);
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

    // Foundry v12 server-side context has access to native ws via the global
    // WebSocket provided by the Node.js runtime (Node 22+ has native WebSocket).
    const ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
      console.log(`[${MODULE_ID}] Connected to Node B FoundryAdapter.`);
      this.ws = ws;
      this.reconnectAttempts = 0;
    });

    ws.addEventListener('message', (event) => {
      this._handleMessage(event.data);
    });

    ws.addEventListener('close', () => {
      console.warn(`[${MODULE_ID}] Connection to Node B closed.`);
      this.ws = null;
      this._scheduleReconnect(wsUrl);
    });

    ws.addEventListener('error', (event) => {
      console.error(`[${MODULE_ID}] WebSocket error:`, event);
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

  // ── Message handling ────────────────────────────────────────────────────────

  _handleMessage(raw) {
    let command;
    try {
      command = JSON.parse(raw);
    } catch (err) {
      console.error(`[${MODULE_ID}] Failed to parse command JSON:`, err);
      return;
    }

    if (!command || typeof command.type !== 'string' || typeof command.requestId !== 'string') {
      console.warn(`[${MODULE_ID}] Received malformed command (missing type or requestId):`, command);
      return;
    }

    // Dispatch to the appropriate handler
    this._dispatch(command).catch((err) => {
      console.error(`[${MODULE_ID}] Command '${command.type}' threw uncaught error:`, err);
      // Ensure we always send a response even on unhandled errors
      this._sendError(command.requestId, err.message ?? String(err));
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
      default:
        this._sendError(command.requestId, `Unknown command type: ${command.type}`);
    }
  }

  // ── Command handlers ────────────────────────────────────────────────────────

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
      // simple-phone / smartphone-widget flag contract (TttA integration)
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

  // ── Response helpers ────────────────────────────────────────────────────────

  _sendSuccess(requestId, data) {
    this._send({ type: 'success', requestId, data: data ?? null });
  }

  _sendError(requestId, message) {
    this._send({ type: 'error', requestId, message });
  }

  _send(payload) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn(`[${MODULE_ID}] Cannot send — WebSocket not open. Dropping:`, payload);
      return;
    }
    this.ws.send(JSON.stringify(payload));
  }
}

// ── Foundry v12 Module Hooks ──────────────────────────────────────────────────

let bridge = null;

Hooks.once('init', () => {
  // Register the Node B URL as a world setting (changeable without code edits)
  game.settings.register(MODULE_ID, 'nodeBWsUrl', {
    name: 'Node B WebSocket URL',
    hint: 'WebSocket address of the ASP.GM-Agent Node B FoundryAdapter server.',
    scope: 'world',
    config: true,
    type: String,
    default: DEFAULT_WS_URL,
  });
});

Hooks.once('ready', () => {
  // Only the GM client needs to run the bridge
  if (!game.user?.isGM) {
    console.log(`[${MODULE_ID}] Non-GM client — bridge not started.`);
    return;
  }

  bridge = new FoundryApiBridge();
  bridge.init();

  console.log(`[${MODULE_ID}] GM bridge initialised.`);
});

// Clean up on Foundry teardown
Hooks.once('closeApplication', () => {
  if (bridge) {
    bridge.destroy();
    bridge = null;
  }
});
