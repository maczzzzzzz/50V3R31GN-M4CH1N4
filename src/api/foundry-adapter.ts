/**
 * src/api/foundry-adapter.ts
 *
 * FoundryAdapter — Node B WebSocket Server for the Foundry VTT Bridge
 *
 * Architecture (Palantiri-style Reverse Proxy):
 *   - This class runs a WebSocket SERVER on Node B (default port 3010)
 *   - The Foundry bridge module connects OUTBOUND to this server, bypassing
 *     Foundry's internal session cookie and authentication barriers.
 *   - Once connected, Node B PUSHES commands down that channel.
 *   - Foundry executes each command and replies with a response.
 *
 * Only one Foundry client is expected at a time (single-slot, like Node A).
 * A second connection replaces the first.
 *
 * All frames are Zod-validated before dispatch or acceptance.
 */

import { randomBytes, randomUUID } from 'node:crypto';
import { z } from 'zod';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { NpcStatBlock, ILogger } from '../core/interfaces.js';
import {
  BridgeCommandSchema,
  BridgeResponseSchema,
  FoundryEventSchema,
  type BridgeCommand,
  type BridgeResponse,
  type ChatMessagePayload,
  type MarketItemPayload,
  type CreateActorPayload,
  type SequenceAction,
  type PretextOverlayPayload,
} from '../shared/schemas/foundry-bridge.schema.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FoundryAdapterOptions {
  /** Timeout in milliseconds for a command to receive a response. Default: 10000. */
  commandTimeoutMs?: number;
  /** Centralized logger for production observability. */
  logger?: ILogger;
}

/** Pending request awaiting a response from Foundry. */
interface PendingRequest {
  resolve: (data: unknown) => void;
  reject: (err: Error) => void;
  timeoutHandle: ReturnType<typeof setTimeout>;
}

// ── IFoundryAdapter interface ─────────────────────────────────────────────────

export interface IFoundryAdapter {
  start(port: number): Promise<void>;
  getHandshakeToken(): string;
  stop(): Promise<void>;
  isConnected(): boolean;
  onEvent(callback: (event: any) => Promise<void>): void;
  sendChatMessage(content: string, speaker?: { alias: string }): Promise<void>;
  readActor(actorId: string): Promise<unknown>;
  triggerSimplePhone(senderNumber: string, body: string): Promise<void>;
  rollDice(formula: string): Promise<{ result: number }>;
  activateScene(sceneId: string): Promise<void>;
  updateActor(actorId: string, updates: Record<string, unknown>): Promise<void>;
  queueApproval(proposalId: string, type: string, data: unknown, schema?: string): Promise<void>;
  openNightMarket(actorId: string, vendorName: string, items: MarketItemPayload[]): Promise<void>;
  createActor(payload: CreateActorPayload): Promise<{ actorId: string }>;
  show3dDice(formula: string, result: number, speaker?: { alias: string }): Promise<void>;
  queryScenes(filter?: string): Promise<{ id: string, name: string, active: boolean }[]>;
  pushDashboardUpdate(payload: z.infer<typeof import('../shared/schemas/foundry-bridge.schema.js').DashboardSyncPayloadSchema>): Promise<void>;
  triggerFxGlitch(intensity?: number): Promise<void>;
  runSequence(actions: SequenceAction[]): Promise<void>;
  triggerPretextOverlay(payload: PretextOverlayPayload): Promise<void>;
  /**
   * Execute an item/action on a Foundry actor.
   */
  executeAction(actorId: string, itemId: string): Promise<void>;
  /**
   * Trigger a Monks Active Tile in the current scene.
   */
  triggerTile(tileId: string): Promise<void>;
  /**
   * Play a high-fidelity animation sequence via the Sequencer module.
   */
  playSequence(sequenceData: any): Promise<void>;
  /**
   * Execute raw JavaScript on the Foundry client (script injection).
   */
  runScript(code: string, broadcast?: boolean): Promise<void>;
  /**
   * Phase 60: Spawn a native CPR container vendor token on the canvas.
   * Accepts pre-fetched inventory from SovereignEconomyService.
   */
  spawnVendorToken(params: {
    marketId: string;
    vendorName: string;
    sceneId: string;
    x: number;
    y: number;
    inventory: Array<{ item_id: string; item_name: string; quantity: number; is_contraband: boolean; price: number }>;
  }): Promise<void>;
  /**
   * Spawn a Solo-Safe balanced NPC actor into the specified scene with
   * the generated stat block pre-applied as token overrides.
   */
  spawnSoloSafeNpc(params: {
    sceneId: string | null;
    x: number;
    y: number;
    statBlock: NpcStatBlock;
  }): Promise<{ tokenId: string }>;
  /**
   * Advance the active scene's easy-phasey phase to the given index.
   * Triggers a visual/ambient phase transition in Foundry via the bridge module.
   */
  advancePhase(sceneId: string | null, phaseIndex: number): Promise<void>;
  updateTheme(theme: string): Promise<void>;
  /**
   * Stream <think> tokens from the VLM endpoint, calling onToken for each
   * content token received in the SSE stream.
   */
  streamThoughtTokens(content: string, onToken: (token: string) => void): Promise<void>;
  sendRpc(method: string, payload: unknown): Promise<unknown>;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class FoundryAdapter implements IFoundryAdapter {
  private readonly commandTimeoutMs: number;
  private readonly logger?: ILogger;
  private wss: WebSocketServer | null = null;
  private clientSocket: WebSocket | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private eventCallback: ((event: any) => Promise<void>) | null = null;
  private handshakeToken: string = '';

  constructor(options: FoundryAdapterOptions = {}) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 10_000;
    if (options.logger !== undefined) { this.logger = options.logger; }
  }

  getHandshakeToken(): string {
    return this.handshakeToken;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async start(port: number): Promise<void> {
    const traceId = randomUUID();
    this.handshakeToken = process.env.FOUNDRY_BRIDGE_TOKEN || randomBytes(32).toString('hex');

    await new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port, host: '0.0.0.0' });

      server.once('error', (err) => {
        this.logger?.error('FoundryAdapter', traceId, `WebSocket server failed to start: ${err.message}`);
        reject(err);
      });

      server.once('listening', () => {
        this.wss = server;
        this.logger?.info('FoundryAdapter', traceId, `WebSocket server listening on 0.0.0.0:${port}. Token: ${this.handshakeToken}`);
        resolve();
      });

      server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const connTraceId = randomUUID();
        const remoteAddr = req.socket.remoteAddress ?? 'unknown';

        // Validate ephemeral handshake token from query param
        const rawUrl = req.url ?? '';
        const queryStart = rawUrl.indexOf('?');
        const query = queryStart !== -1 ? new URLSearchParams(rawUrl.slice(queryStart + 1)) : new URLSearchParams();
        const providedToken = query.get('token') ?? '';

        if (providedToken !== this.handshakeToken) {
          this.logger?.warn('FoundryAdapter', connTraceId, 'Rejected connection: invalid or missing token', { remoteAddr });
          ws.close(4401);
          return;
        }

        this.logger?.info('FoundryAdapter', connTraceId, 'Foundry bridge module connected', { remoteAddr });

        // Replace any existing client (single-slot)
        if (this.clientSocket && this.clientSocket.readyState === WebSocket.OPEN) {
          this.logger?.warn('FoundryAdapter', connTraceId, 'Replacing existing Foundry connection');
          this.clientSocket.close();
        }

        this.clientSocket = ws;

        // Notify Foundry UI that the bridge is connected
        this.sendChatMessage('🟢 **Link Established** — 50V3R31GN-M4CH1N4 Orchestrator (v3.8.6) is now online.', { alias: 'System' }).catch(() => {});

        ws.on('message', (raw) => {
          this.handleIncomingMessage(raw.toString());
        });

        ws.on('close', () => {
          this.logger?.info('FoundryAdapter', connTraceId, 'Foundry bridge module disconnected');
          if (this.clientSocket === ws) {
            this.clientSocket = null;
          }
          // Reject all pending requests
          for (const [requestId, pending] of this.pending) {
            clearTimeout(pending.timeoutHandle);
            pending.reject(new Error('Foundry disconnected'));
            this.pending.delete(requestId);
          }
        });

        ws.on('error', (err) => {
          this.logger?.error('FoundryAdapter', connTraceId, `WebSocket client error: ${err.message}`);
        });
      });
    });
  }

  async stop(): Promise<void> {
    const traceId = randomUUID();
    // Reject all pending requests
    for (const [requestId, pending] of this.pending) {
      clearTimeout(pending.timeoutHandle);
      pending.reject(new Error('FoundryAdapter stopped'));
      this.pending.delete(requestId);
    }

    // Force-terminate the client socket so wss.close() doesn't wait for drain
    if (this.clientSocket) {
      this.clientSocket.terminate();
      this.clientSocket = null;
    }

    await new Promise<void>((resolve) => {
      if (!this.wss) {
        resolve();
        return;
      }
      this.wss.close(() => {
        this.wss = null;
        this.logger?.info('FoundryAdapter', traceId, 'WebSocket server stopped');
        resolve();
      });
    });
  }

  isConnected(): boolean {
    return this.clientSocket !== null && this.clientSocket.readyState === WebSocket.OPEN;
  }

  onEvent(callback: (event: any) => Promise<void>): void {
    this.eventCallback = callback;
  }

  // ── Phase 64: Predictive Caching — TOKEN_MOVE hook ─────────────────────────

  /**
   * Register a handler that fires when Foundry emits TOKEN_MOVE events.
   * The handler inspects whether the token has entered a Transition Zone
   * (within 5 grid units of a scene boundary or door) and triggers
   * `narrativeClient.preemptiveGrounding()` if so.
   *
   * @param narrativeClient  Live SovereignNarrativeClient instance.
   * @param getLoreForDistrict  Callback that returns AAAK-compressed lore for a district.
   */
  registerTokenMoveHook(
    narrativeClient: { preemptiveGrounding: (district: string, lore: string) => Promise<void> },
    getLoreForDistrict: (district: string) => Promise<string>,
  ): void {
    const TRANSITION_ZONE_UNITS = 5;
    const traceId = randomUUID();

    const originalCallback = this.eventCallback;
    this.eventCallback = async (event: any) => {
      // Intercept TOKEN_MOVE events before passing through to the original handler
      if (event?.type === 'token_move' && event?.payload) {
        const { tokenId, x, y, sceneWidth, sceneHeight, gridSize, nearestDistrict } = event.payload as {
          tokenId?: string;
          x?: number;
          y?: number;
          sceneWidth?: number;
          sceneHeight?: number;
          gridSize?: number;
          nearestDistrict?: string;
        };

        const gs = gridSize ?? 100;
        const sw = sceneWidth ?? Infinity;
        const sh = sceneHeight ?? Infinity;
        const px = x ?? 0;
        const py = y ?? 0;

        // Transition Zone: within TRANSITION_ZONE_UNITS grid units of any scene edge
        const nearEdge = (
          px < TRANSITION_ZONE_UNITS * gs ||
          py < TRANSITION_ZONE_UNITS * gs ||
          (sw - px) < TRANSITION_ZONE_UNITS * gs ||
          (sh - py) < TRANSITION_ZONE_UNITS * gs
        );

        if (nearEdge && nearestDistrict) {
          this.logger?.debug(
            'FoundryAdapter',
            traceId,
            `[Phase64] TOKEN_MOVE Transition Zone: token=${tokenId} → district=${nearestDistrict}`,
          );
          // Non-blocking anticipatory seed
          getLoreForDistrict(nearestDistrict)
            .then((lore) => narrativeClient.preemptiveGrounding(nearestDistrict, lore))
            .catch(() => { /* non-critical */ });
        }
      }

      if (originalCallback) {
        return originalCallback(event);
      }
    };
  }

  // ── Command methods ─────────────────────────────────────────────────────────

  async sendChatMessage(content: string, speaker?: { alias: string }): Promise<void> {
    const payload: ChatMessagePayload = {
      content,
      type: 1,
      ...(speaker ? { speaker } : {}),
    };
    await this.sendCommand({ type: 'chat_message', requestId: this.generateRequestId(), payload });
  }

  async readActor(actorId: string): Promise<unknown> {
    return this.sendCommand({ type: 'read_actor', requestId: this.generateRequestId(), payload: { actorId } });
  }

  async triggerSimplePhone(senderNumber: string, body: string): Promise<void> {
    await this.sendCommand({
      type: 'simple_phone',
      requestId: this.generateRequestId(),
      payload: { senderNumber, body, messageType: 'text', app: 'messages' },
    });
  }

  async rollDice(formula: string): Promise<{ result: number }> {
    const data = await this.sendCommand({ type: 'dice_roll', requestId: this.generateRequestId(), payload: { formula } });
    return data as { result: number };
  }

  async activateScene(sceneId: string): Promise<void> {
    await this.sendCommand({ type: 'scene_activate', requestId: this.generateRequestId(), payload: { sceneId } });
  }

  async updateActor(actorId: string, updates: Record<string, unknown>): Promise<void> {
    await this.sendCommand({ type: 'update_actor', requestId: this.generateRequestId(), payload: { actorId, updates } });
  }

  async queueApproval(proposalId: string, type: string, data: unknown, schema?: string): Promise<void> {
    await this.sendCommand({
      type: 'queue_approval',
      requestId: this.generateRequestId(),
      payload: { proposalId, type, data, ...(schema ? { schema } : {}) },
    });
  }

  async openNightMarket(actorId: string, vendorName: string, items: MarketItemPayload[]): Promise<void> {
    await this.sendCommand({
      type: 'open_night_market',
      requestId: this.generateRequestId(),
      payload: { actorId, vendorName, items },
    });
  }

  async createActor(payload: CreateActorPayload): Promise<{ actorId: string }> {
    const data = await this.sendCommand({
      type: 'create_actor',
      requestId: this.generateRequestId(),
      payload,
    });
    return data as { actorId: string };
  }

  async spawnSoloSafeNpc(params: {
    sceneId: string | null;
    x: number;
    y: number;
    statBlock: NpcStatBlock;
  }): Promise<{ tokenId: string }> {
    const { sceneId, x, y, statBlock } = params;
    const requestId = this.generateRequestId();
    const result = await this.sendCommand({
      type: 'spawn_solo_safe_npc',
      requestId,
      payload: { sceneId, x, y, statBlock },
    });
    // Validate response shape
    const parsed = z.object({ tokenId: z.string().min(1) }).safeParse(result);
    if (!parsed.success) {
      throw new Error(`FoundryAdapter spawnSoloSafeNpc: invalid response — ${parsed.error.message}`);
    }
    return parsed.data;
  }

  async show3dDice(formula: string, result: number, speaker?: { alias: string }): Promise<void> {
    await this.sendCommand({
      type: 'show_3d_dice',
      requestId: this.generateRequestId(),
      payload: { formula, result, ...(speaker ? { speaker } : {}) },
    });
  }

  async queryScenes(filter?: string): Promise<{ id: string, name: string, active: boolean }[]> {
    const data = await this.sendCommand({
      type: 'query_scenes',
      requestId: this.generateRequestId(),
      payload: { filter },
    });
    return data as { id: string, name: string, active: boolean }[];
  }

  async pushDashboardUpdate(payload: z.infer<typeof import('../shared/schemas/foundry-bridge.schema.js').DashboardSyncPayloadSchema>): Promise<void> {
    await this.sendCommand({
      type: 'dashboard_sync',
      requestId: this.generateRequestId(),
      payload,
    });
  }

  async triggerFxGlitch(intensity: number = 1.0): Promise<void> {
    await this.sendCommand({
      type: 'fx_glitch',
      requestId: this.generateRequestId(),
      payload: { intensity },
    });
  }

  async runSequence(actions: SequenceAction[]): Promise<void> {
    await this.sendCommand({
      type: 'run_sequence',
      requestId: this.generateRequestId(),
      payload: { actions },
    });
  }

  async triggerPretextOverlay(payload: PretextOverlayPayload): Promise<void> {
    await this.sendCommand({
      type: 'pretext_overlay',
      requestId: this.generateRequestId(),
      payload,
    });
  }

  async executeAction(actorId: string, itemId: string): Promise<void> {
    await this.sendCommand({
      type: 'execute_action',
      requestId: this.generateRequestId(),
      payload: { actorId, itemId },
    });
  }

  async triggerTile(tileId: string): Promise<void> {
    await this.sendCommand({
      type: 'trigger_tile',
      requestId: this.generateRequestId(),
      payload: { tileId },
    });
  }

  async playSequence(sequenceData: any): Promise<void> {
    await this.sendCommand({
      type: 'play_sequence',
      requestId: this.generateRequestId(),
      payload: { sequenceData },
    });
  }

  async runScript(code: string, broadcast: boolean = false): Promise<void> {
    // Phase 28: Visual Sovereignty — Show "LOGIC INTRUSION" during AI script injection
    try {
      // Don't await this so it's parallel with the script execution
      this.triggerPretextOverlay({
        targetId: 'all', // We assume 'all' or active token
        overlayType: 'script_injection',
        text: 'L061C-1N7RU510N :://',
        color: '#39ff14', // Cyber-neon green
        duration: 1500,
        glitch: true,
        fxParams: { shader: 'glitch-v3', intensity: 1.5 }
      }).catch(() => {});
    } catch { /* skip visual on error */ }

    await this.sendCommand({
      type: 'run_script',
      requestId: this.generateRequestId(),
      payload: { code, broadcast },
    });
  }

  async spawnVendorToken(params: {
    marketId: string;
    vendorName: string;
    sceneId: string;
    x: number;
    y: number;
    inventory: Array<{ item_id: string; item_name: string; quantity: number; is_contraband: boolean; price: number }>;
  }): Promise<void> {
    const { vendorName, sceneId, x, y, inventory } = params;
    const itemsJson = JSON.stringify(inventory);

    const script = `
(async () => {
  // 1. Create container actor (cpr-container type)
  const containerData = {
    name: ${JSON.stringify(vendorName)},
    type: 'container',
    system: {
      vendor: {
        isVendor: true,
        itemTypes: { weapon: { purchasePercentage: 100 }, gear: { purchasePercentage: 100 } }
      }
    }
  };
  const actor = await Actor.create(containerData);
  if (!actor) return;

  // 2. Populate container with inventory items
  const inventory = ${itemsJson};
  for (const entry of inventory) {
    const found = game.items.find(i => i.id === entry.item_id || i.name === entry.item_name);
    if (found) {
      await actor.createEmbeddedDocuments('Item', [found.toObject()]);
    }
  }

  // 3. Spawn token on canvas
  const scene = game.scenes.get(${JSON.stringify(sceneId)}) || game.scenes.active;
  if (scene) {
    await scene.createEmbeddedDocuments('Token', [{
      name: ${JSON.stringify(vendorName)},
      actorId: actor.id,
      x: ${x},
      y: ${y},
      disposition: CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    }]);
  }
})();
`;
    await this.runScript(script);
  }

  async sendRpc(method: string, payload: unknown): Promise<unknown> {
    return this.sendCommand({
      type: 'rpc',
      requestId: this.generateRequestId(),
      payload: { method, payload },
    } as any);
  }

  async advancePhase(sceneId: string | null, phaseIndex: number): Promise<void> {
    const requestId = this.generateRequestId();
    await this.sendCommand({
      type: 'advance_phase',
      requestId,
      payload: { sceneId, phaseIndex },
    } as BridgeCommand);
  }

  async updateTheme(theme: string): Promise<void> {
    const requestId = this.generateRequestId();
    await this.sendCommand({
      type: 'theme_update',
      requestId,
      payload: { theme },
    } as BridgeCommand);
  }

  async streamThoughtTokens(content: string, onToken: (token: string) => void): Promise<void> {
    const traceId = randomUUID();
    const endpoint = process.env['VLM_ENDPOINT'] ?? 'http://172.26.208.1:8080/v1/chat/completions';
    const model = process.env['VLM_MODEL'] ?? 'mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf';
    
    this.logger?.debug('FoundryAdapter', traceId, 'Streaming thought tokens from VLM', { endpoint, model });

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content }],
        stream: true,
      }),
    });
    if (!res.ok || !res.body) {
      const message = `FoundryAdapter streamThoughtTokens: ${res.status} ${res.statusText}`;
      this.logger?.error('FoundryAdapter', traceId, message);
      throw new Error(message);
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (!line.startsWith('data:')) continue;
        const raw = line.slice(5).trim();
        if (raw === '[DONE]') return;
        try {
          const chunk = JSON.parse(raw) as { choices: Array<{ delta: { content?: string } }> };
          const token = chunk.choices[0]?.delta?.content ?? '';
          if (token) onToken(token);
        } catch { /* skip malformed */ }
      }
    }
  }

  // ── Internal helpers ────────────────────────────────────────────────────────

  /**
   * Send a validated BridgeCommand to the Foundry client and wait for the
   * correlated BridgeResponse. Rejects on timeout or Foundry error.
   */
  private sendCommand(command: BridgeCommand): Promise<unknown> {
    if (!this.isConnected()) {
      return Promise.reject(new Error('FoundryAdapter: Foundry module not connected'));
    }

    // Validate before sending
    const parseResult = BridgeCommandSchema.safeParse(command);
    if (!parseResult.success) {
      return Promise.reject(new Error(`Invalid bridge command: ${parseResult.error.message}`));
    }

    return new Promise<unknown>((resolve, reject) => {
      const { requestId } = command;

      const timeoutHandle = setTimeout(() => {
        this.pending.delete(requestId);
        const message = `FoundryAdapter: command '${command.type}' timeout after ${this.commandTimeoutMs}ms`;
        this.logger?.error('FoundryAdapter', requestId, message);
        reject(new Error(message));
      }, this.commandTimeoutMs);

      this.pending.set(requestId, { resolve, reject, timeoutHandle });

      this.clientSocket!.send(JSON.stringify(command));
    });
  }

  /**
   * Handle an incoming raw WebSocket message from the Foundry bridge module.
   * Parses the frame, validates with Zod, and resolves/rejects the pending request
   * OR dispatches to the event callback.
   */
  private handleIncomingMessage(raw: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      this.logger?.warn('FoundryAdapter', 'no-trace', 'Received non-JSON message from Foundry module', { raw: raw.slice(0, 200) });
      return;
    }

    // 1. Try correlation with pending request (BridgeResponse)
    const responseResult = BridgeResponseSchema.safeParse(parsed);
    if (responseResult.success) {
      const response = responseResult.data;
      const pending = this.pending.get(response.requestId);

      if (pending) {
        clearTimeout(pending.timeoutHandle);
        this.pending.delete(response.requestId);

        if (response.type === 'error') {
          this.logger?.error('FoundryAdapter', response.requestId, `Foundry returned error: ${response.message}`);
          pending.reject(new Error(response.message));
        } else {
          pending.resolve(response.data);
        }
        return;
      }
    }

    // 2. Try unsolicited event (FoundryEvent)
    const eventResult = FoundryEventSchema.safeParse(parsed);
    if (eventResult.success) {
      if (this.eventCallback) {
        this.eventCallback(eventResult.data).catch((err) => {
          this.logger?.error('FoundryAdapter', 'event', 'Event callback failed', { error: err.message, eventType: eventResult.data.type });
        });
      } else {
        this.logger?.warn('FoundryAdapter', 'event', 'Received event but no callback registered', { type: eventResult.data.type });
      }
      return;
    }

    // 3. Handle audit_intent RPC FROM Bridge
    const auditParsed = parsed as any;
    if (auditParsed.type === 'audit_intent' && auditParsed.requestId) {
      this.logger?.info('FoundryAdapter', auditParsed.requestId, `Intercepted Intent for Audit: ${auditParsed.payload?.event}`);
      if (this.eventCallback) {
        const auditEvent = {
          type: 'audit_request',
          requestId: auditParsed.requestId,
          payload: auditParsed.payload,
          respond: (result: any) => {
            if (this.clientSocket && this.clientSocket.readyState === WebSocket.OPEN) {
              this.clientSocket.send(JSON.stringify({
                type: 'success',
                requestId: auditParsed.requestId,
                data: result
              }));
            }
          }
        };
        this.eventCallback(auditEvent).catch(err => {
          this.logger?.error('FoundryAdapter', auditParsed.requestId, `Audit event callback failed: ${err.message}`);
        });
      }
      return;
    }

    // 4. Handle validate_move RPC FROM Bridge
    const moveParsed = parsed as any;
    if (moveParsed.type === 'validate_move' && moveParsed.requestId) {
      this.logger?.info('FoundryAdapter', moveParsed.requestId, `Intercepted Move for Validation: ${moveParsed.payload?.tokenId}`);
      if (this.eventCallback) {
        const moveEvent = {
          type: 'validate_move',
          requestId: moveParsed.requestId,
          payload: moveParsed.payload,
          respond: (result: any) => {
            if (this.clientSocket && this.clientSocket.readyState === WebSocket.OPEN) {
              this.clientSocket.send(JSON.stringify({
                type: 'success',
                requestId: moveParsed.requestId,
                data: result
              }));
            }
          }
        };
        this.eventCallback(moveEvent).catch(err => {
          this.logger?.error('FoundryAdapter', moveParsed.requestId, `Move validation event callback failed: ${err.message}`);
        });
      }
      return;
    }

    // 5. Fallback for unknown messages
    this.logger?.warn('FoundryAdapter', 'unknown', 'Received unknown or invalid message from Foundry module', {
      raw: raw.slice(0, 200),
    });
  }

  /**
   * Generate a 9-character lowercase alphanumeric requestId.
   * Matches the Mistral-Nemo tool handshake spec (KNOWLEDGE_BASE.md §5).
   */
  private generateRequestId(): string {
    const CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = randomBytes(9);
    let id = '';
    for (const byte of bytes) {
      id += CHARS[byte % CHARS.length];
    }
    return id;
  }
}
