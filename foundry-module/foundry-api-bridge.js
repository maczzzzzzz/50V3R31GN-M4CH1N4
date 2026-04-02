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
 * Supported Commands (Phase 3 MVP + Phase 5.3):
 *   - chat_message    → ChatMessage.create()
 *   - read_actor      → game.actors.get(id).toObject()
 *   - simple_phone    → ChatMessage with smartphone-widget flags
 *   - dice_roll       → Roll.evaluate()
 *   - scene_activate  → game.scenes.get(id).activate()
 *   - create_actor    → Actor.create() with stat seeding, bio journal, and item attachment
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
      default:
        this._sendError(command.requestId, `Unknown command type: ${command.type}`);
    }
  }

  // ── Command handlers ────────────────────────────────────────────────────────

  async _handleShow3dDice({ requestId, payload }) {
    try {
      // 1. Create a Roll object but don't evaluate it (we have the result)
      const roll = new Roll(payload.formula);
      
      // 2. Set the fixed result from Node A
      // Note: In Foundry v12, we can inject the total into the roll object
      // so DsN displays the correct faces.
      roll._total = payload.result;
      roll._evaluated = true;

      // 3. Trigger Dice So Nice (DsN)
      if (game.dice3d) {
        // showForRoll(roll, user, synchronize, whisper, blind)
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
      // Create a Foundry Dialog for GM Approval
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

      // Build item grid HTML — close over `items` array to avoid data-attribute encoding
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
          <p style="margin-top:10px; margin-bottom:0; font-size:0.7em; color:#555; text-align:right;">
            Eagles = Afterlife currency. See Rogue for exchange rates.
          </p>
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

            // Optimistic UI feedback — disable the button after click
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

      // ── Step 1: Create the Actor with Cyberpunk RED system stats ─────────────
      const actor = await Actor.create({
        name,
        type: 'character',
        system: {
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

      // ── Step 2: Write AI-generated bio to an embedded Journal Entry Page ─────
      if (bio && bio.trim().length > 0) {
        await actor.createEmbeddedDocuments('JournalEntryPage', [
          {
            name: 'Backstory',
            text: { content: bio },
          },
        ]);
      }

      // ── Step 3: Seed items from world items by name ───────────────────────────
      if (seedItems && seedItems.length > 0) {
        const matchedItems = (game.items ?? []).filter((i) => seedItems.includes(i.name));
        if (matchedItems.length > 0) {
          await actor.createEmbeddedDocuments('Item', matchedItems.map((i) => i.toObject()));
        }
        const missing = seedItems.filter((n) => !matchedItems.some((i) => i.name === n));
        if (missing.length > 0) {
          console.warn(`[${MODULE_ID}] create_actor: could not find items in world: ${missing.join(', ')}`);
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
