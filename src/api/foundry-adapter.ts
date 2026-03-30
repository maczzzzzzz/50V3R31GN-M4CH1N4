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
import { WebSocketServer, WebSocket } from 'ws';
import type { IncomingMessage } from 'node:http';
import {
  BridgeCommandSchema,
  BridgeResponseSchema,
  type BridgeCommand,
  type BridgeResponse,
  type ChatMessagePayload,
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
  stop(): Promise<void>;
  isConnected(): boolean;
  sendChatMessage(content: string, speaker?: { alias: string }): Promise<void>;
  readActor(actorId: string): Promise<unknown>;
  triggerSimplePhone(senderNumber: string, body: string): Promise<void>;
  rollDice(formula: string): Promise<{ result: number }>;
  activateScene(sceneId: string): Promise<void>;
  updateActor(actorId: string, updates: Record<string, unknown>): Promise<void>;
  queueApproval(proposalId: string, type: string, data: unknown, schema?: string): Promise<void>;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class FoundryAdapter implements IFoundryAdapter {
  private readonly commandTimeoutMs: number;
  private wss: WebSocketServer | null = null;
  private clientSocket: WebSocket | null = null;
  private readonly pending = new Map<string, PendingRequest>();

  constructor(options: FoundryAdapterOptions = {}) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 10_000;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  async start(port: number): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      const server = new WebSocketServer({ port });

      server.once('error', (err) => {
        reject(err);
      });

      server.once('listening', () => {
        this.wss = server;
        logger.info('FoundryAdapter', `WebSocket server listening on port ${port}`);
        resolve();
      });

      server.on('connection', (ws: WebSocket, req: IncomingMessage) => {
        const remoteAddr = req.socket.remoteAddress ?? 'unknown';
        logger.info('FoundryAdapter', 'Foundry bridge module connected', { remoteAddr });

        // Replace any existing client (single-slot)
        if (this.clientSocket && this.clientSocket.readyState === WebSocket.OPEN) {
          logger.warn('FoundryAdapter', 'Replacing existing Foundry connection');
          this.clientSocket.close();
        }

        this.clientSocket = ws;

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
   * Parses the frame, validates with Zod, and resolves/rejects the pending request.
   */
  private handleIncomingMessage(raw: string): void {
    let parsed: unknown;

    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.warn('FoundryAdapter', 'Received non-JSON message from Foundry module', { raw: raw.slice(0, 200) });
      return;
    }

    const result = BridgeResponseSchema.safeParse(parsed);
    if (!result.success) {
      logger.warn('FoundryAdapter', 'Received invalid BridgeResponse from Foundry module', {
        error: result.error.message,
        raw: raw.slice(0, 200),
      });
      return;
    }

    const response: BridgeResponse = result.data;
    const pending = this.pending.get(response.requestId);

    if (!pending) {
      logger.warn('FoundryAdapter', 'Received response for unknown requestId', { requestId: response.requestId });
      return;
    }

    clearTimeout(pending.timeoutHandle);
    this.pending.delete(response.requestId);

    if (response.type === 'error') {
      pending.reject(new Error(response.message));
    } else {
      pending.resolve(response.data);
    }
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
