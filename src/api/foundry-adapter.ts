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

import { randomBytes } from 'node:crypto';
import { z } from 'zod';
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import type { NpcStatBlock } from '../core/interfaces.js';
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

// ── Logger (stderr-only, JSON structured) ────────────────────────────────────

const logger = {
  info(context: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'INFO', context, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  warn(context: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'WARN', context, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  error(context: string, message: string, data?: Record<string, unknown>): void {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'ERROR', context, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface FoundryAdapterOptions {
  /** Timeout in milliseconds for a command to receive a response. Default: 10000. */
  commandTimeoutMs?: number;
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
  /**
   * Stream <think> tokens from the VLM endpoint, calling onToken for each
   * content token received in the SSE stream.
   */
  streamThoughtTokens(content: string, onToken: (token: string) => void): Promise<void>;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class FoundryAdapter implements IFoundryAdapter {
  private readonly commandTimeoutMs: number;
  private wss: WebSocketServer | null = null;
  private clientSocket: WebSocket | null = null;
  private readonly pending = new Map<string, PendingRequest>();
  private eventCallback: ((event: any) => Promise<void>) | null = null;
  private handshakeToken: string = '';

  constructor(options: FoundryAdapterOptions = {}) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 10_000;
  }

  getHandshakeToken(): string {
    return this.handshakeToken;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async start(port: number): Promise<void> {
    this.handshakeToken = randomBytes(32).toString('hex');

    await new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port, host: '127.0.0.1' });

      server.once('error', (err) => {
        reject(err);
      });

      server.once('listening', () => {
        this.wss = server;
        logger.info('FoundryAdapter', `WebSocket server listening on 127.0.0.1:${port}`);
        resolve();
      });

      server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const remoteAddr = req.socket.remoteAddress ?? 'unknown';

        // Validate ephemeral handshake token from query param
        const rawUrl = req.url ?? '';
        const queryStart = rawUrl.indexOf('?');
        const query = queryStart !== -1 ? new URLSearchParams(rawUrl.slice(queryStart + 1)) : new URLSearchParams();
        const providedToken = query.get('token') ?? '';

        if (providedToken !== this.handshakeToken) {
          logger.warn('FoundryAdapter', 'Rejected connection: invalid or missing token', { remoteAddr });
          ws.close(4401);
          return;
        }

        logger.info('FoundryAdapter', 'Foundry bridge module connected', { remoteAddr });

        // Replace any existing client (single-slot)
        if (this.clientSocket && this.clientSocket.readyState === WebSocket.OPEN) {
          logger.warn('FoundryAdapter', 'Replacing existing Foundry connection');
          this.clientSocket.close();
        }

        this.clientSocket = ws;

        // Notify Foundry UI that the bridge is connected
        this.sendChatMessage('🟢 **Link Established** — ASP.GM-Agent Orchestrator (v0.8.3) is now online.', { alias: 'System' }).catch(() => {});

        ws.on('message', (raw) => {
          this.handleIncomingMessage(raw.toString());
        });

        ws.on('close', () => {
          logger.info('FoundryAdapter', 'Foundry bridge module disconnected');
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
          logger.error('FoundryAdapter', 'WebSocket client error', { error: err.message });
        });
      });
    });
  }

  async stop(): Promise<void> {
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

  async advancePhase(sceneId: string | null, phaseIndex: number): Promise<void> {
    const requestId = this.generateRequestId();
    await this.sendCommand({
      type: 'advance_phase',
      requestId,
      payload: { sceneId, phaseIndex },
    } as BridgeCommand);
  }

  async streamThoughtTokens(content: string, onToken: (token: string) => void): Promise<void> {
    const endpoint = process.env['VLM_ENDPOINT'] ?? 'http://localhost:8080/v1/chat/completions';
    const model = process.env['VLM_MODEL'] ?? 'mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf';
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
      throw new Error(`[FoundryAdapter] streamThoughtTokens: ${res.status} ${res.statusText}`);
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
        reject(new Error(`FoundryAdapter: command '${command.type}' timeout after ${this.commandTimeoutMs}ms`));
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
      logger.warn('FoundryAdapter', 'Received non-JSON message from Foundry module', { raw: raw.slice(0, 200) });
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
          logger.error('FoundryAdapter', 'Event callback failed', { error: err.message });
        });
      } else {
        logger.warn('FoundryAdapter', 'Received event but no callback registered', { type: eventResult.data.type });
      }
      return;
    }

    // 3. Handle audit_intent RPC FROM Bridge
    const auditParsed = parsed as any;
    if (auditParsed.type === 'audit_intent' && auditParsed.requestId) {
      logger.info('FoundryAdapter', `Intercepted Intent for Audit: ${auditParsed.payload?.event}`);
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
          logger.error('FoundryAdapter', 'Audit event callback failed', { error: err.message });
        });
      }
      return;
    }

    // 4. Handle validate_move RPC FROM Bridge
    const moveParsed = parsed as any;
    if (moveParsed.type === 'validate_move' && moveParsed.requestId) {
      logger.info('FoundryAdapter', `Intercepted Move for Validation: ${moveParsed.payload?.tokenId}`);
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
          logger.error('FoundryAdapter', 'Move validation event callback failed', { error: err.message });
        });
      }
      return;
    }

    // 5. Fallback for unknown messages
    logger.warn('FoundryAdapter', 'Received unknown or invalid message from Foundry module', {
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
