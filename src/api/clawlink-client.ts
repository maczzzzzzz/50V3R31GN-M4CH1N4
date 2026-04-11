/**
 * src/api/clawlink-client.ts
 *
 * ClawLinkClient — Persistent binary socket bridge to ZeroClaw on Node A.
 *
 * Transport layer:
 *   Node B (this class)
 *     → node:net Socket (Unix socket to crush proxy daemon)
 *     → newline-delimited JSON ClawLinkPackets
 *     → crush proxy → ZeroClaw (Rust TCP server on Node A)
 *
 * Zero-Trust: All responses from Node A are validated against Zod schemas
 * before being returned to callers, per CLAUDE.md §9.
 */

import { randomUUID } from 'node:crypto';
import net from 'node:net';
import { z } from 'zod';
import {
  ClawLinkConfigSchema,
  ClawLinkRpcResponseSchema,
  ClawLinkSearchResultsSchema,
  ClawLinkAttackResultSchema,
  ClawLinkDamageResultSchema,
  type ClawLinkConfig,
  type ClawLinkSearchResult,
  type ClawLinkAttackResult,
  type ClawLinkDamageResult,
} from '../shared/schemas/clawlink.schema.js';
import { ParseltongueCodec } from '../shared/parseltongue-codec.js';
import type { WorldCommand } from '../shared/schemas/world-commands.schema.js';
import type { ILogger } from '../db/interfaces.js';

const CONTEXT = 'ClawLinkClient';
const DEFAULT_TIMEOUT_MS = 5000;

// ── Public interface ──────────────────────────────────────────────────────────

export interface IClawLinkClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isHealthy(): Promise<boolean>;
  onIntent(handler: (intent: any) => Promise<void>): void;
  hybridSearch(query: string, namespace: string, topK: number): Promise<ClawLinkSearchResult[]>;
  resolveAttack(dice: number[], stat: number, skill: number, dv: number): Promise<ClawLinkAttackResult>;
  resolveDamage(dice: number[], bonus: number, armourSp: number): Promise<ClawLinkDamageResult>;
  executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T>;
  publish(payload: string): Promise<void>;
  st3ggEncode(imageB64: string, payload: string): Promise<string>;
  st3ggDecode(imageB64: string): Promise<string>;
  processParseltongueNarrative(
    text: string,
    execute: (cmd: WorldCommand) => Promise<void>,
  ): Promise<boolean>;
  wsaAudit(
    action: string,
    targetId: string,
    context: string,
  ): Promise<{ verdict: 'GRANTED' | 'REJECTED'; rationale: string }>;
}

// ── Internal types ────────────────────────────────────────────────────────────

interface ClawLinkPacket {
  trace_id: string;
  payload: string;
  checksum: number;
  type?: string; // "broadcast" for real-time streams
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ── Implementation ────────────────────────────────────────────────────────────

export class ClawLinkClient implements IClawLinkClient {
  private readonly config: ClawLinkConfig;
  private readonly timeoutMs: number;
  private readonly logger?: ILogger | undefined;

  private socket: net.Socket | null = null;
  private buffer: string = '';
  private readonly pending = new Map<string, PendingRequest>();
  private requestQueue: Promise<void> = Promise.resolve();
  private intentHandler: ((intent: any) => Promise<void>) | null = null;

  constructor(config: ClawLinkConfig, logger?: ILogger) {
    const parsed = ClawLinkConfigSchema.safeParse(config);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`${CONTEXT} config validation failed: ${issue?.message ?? 'unknown'}`);
    }
    this.config = Object.freeze({ ...parsed.data }) as ClawLinkConfig;
    this.timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.logger = logger;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async connect(): Promise<void> {
    const traceId = randomUUID();
    return new Promise((resolve, reject) => {
      let socket: net.Socket;
      if (this.config.host && this.config.port) {
        socket = net.connect(this.config.port, this.config.host);
      } else {
        socket = net.connect(this.config.socketPath!);
      }
      this.socket = socket;

      socket.on('connect', () => {
        this.buffer = '';
        this.requestQueue = Promise.resolve(); // Reset queue on connect
        this.logger?.info(CONTEXT, traceId, 'Connected to ZeroClaw bridge');
        resolve();
      });

      socket.on('data', (data: Buffer) => this.handleData(data));

      socket.on('error', (err: Error) => {
        if (this.socket === socket) {
          this.logger?.error(CONTEXT, traceId, `TCP connection error: ${err.message}`);
          reject(new Error(`${CONTEXT} TCP connection error: ${err.message}`));
          
          for (const [id, pending] of this.pending) {
            clearTimeout(pending.timer);
            pending.reject(new Error(`${CONTEXT} socket error [id=${id}]: ${err.message}`));
          }
          this.pending.clear();
        }
      });

      socket.on('close', () => this.handleSocketClose());
    });
  }

  async disconnect(): Promise<void> {
    const traceId = randomUUID();
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`${CONTEXT} disconnected with pending request [id=${id}]`));
    }
    this.pending.clear();

    if (this.socket) {
      this.socket.destroy();
      this.socket = null;
    }
    this.buffer = '';
    this.requestQueue = Promise.resolve();
    this.logger?.info(CONTEXT, traceId, 'Disconnected from ZeroClaw bridge');
  }

  isHealthy(): Promise<boolean> {
    try {
      return this.send<{ pong: boolean }>('ping', {}).then(res => res.pong === true);
    } catch {
      return Promise.resolve(false);
    }
  }

  onIntent(handler: (intent: any) => Promise<void>): void {
    this.intentHandler = handler;
  }

  async hybridSearch(
    query: string,
    namespace: string,
    topK: number,
  ): Promise<ClawLinkSearchResult[]> {
    const raw = await this.send<unknown>('hybrid_search', { query, namespace, top_k: topK });
    return this.validate(raw, ClawLinkSearchResultsSchema, 'hybridSearch');
  }

  async resolveAttack(
    dice: number[],
    stat: number,
    skill: number,
    dv: number,
  ): Promise<ClawLinkAttackResult> {
    const raw = await this.send<unknown>('resolve_attack', { dice, stat, skill, dv });
    return this.validate(raw, ClawLinkAttackResultSchema, 'resolveAttack');
  }

  async resolveDamage(
    dice: number[],
    bonus: number,
    armourSp: number,
  ): Promise<ClawLinkDamageResult> {
    const raw = await this.send<unknown>('resolve_damage', {
      dice,
      bonus,
      armour_sp: armourSp,
    });
    return this.validate(raw, ClawLinkDamageResultSchema, 'resolveDamage');
  }

  async executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    return this.send<T>(method, params);
  }

  async publish(payload: string): Promise<void> {
    const traceId = randomUUID();
    if (!this.socket || this.socket.destroyed) {
      throw new Error(`${CONTEXT} not connected — call connect() first`);
    }

    const packet: ClawLinkPacket = {
      trace_id: traceId,
      payload,
      checksum: 0,
      type: 'broadcast',
    };

    return new Promise((resolve, reject) => {
      this.socket!.write(JSON.stringify(packet) + '\n', 'utf8', (err) => {
        if (err) {
          this.logger?.error(CONTEXT, traceId, `Failed to publish broadcast: ${err.message}`);
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  async st3ggEncode(imageB64: string, payload: string): Promise<string> {
    const raw = await this.send<{ image_b64: string }>('st3gg_encode', {
      image_b64: imageB64,
      payload,
    });
    if (typeof raw.image_b64 !== 'string') {
      throw new Error(`${CONTEXT} st3ggEncode: unexpected response shape`);
    }
    return raw.image_b64;
  }

  async st3ggDecode(imageB64: string): Promise<string> {
    const raw = await this.send<{ payload: string }>('st3gg_decode', {
      image_b64: imageB64,
    });
    if (typeof raw.payload !== 'string') {
      throw new Error(`${CONTEXT} st3ggDecode: unexpected response shape`);
    }
    return raw.payload;
  }

  async processParseltongueNarrative(
    text: string,
    execute: (cmd: WorldCommand) => Promise<void>,
  ): Promise<boolean> {
    const traceId = randomUUID();
    const command = ParseltongueCodec.scanForCommand(text);
    if (command === null) return false;
    try {
      this.logger?.info(CONTEXT, traceId, 'Parseltongue command detected', { action: command.action });
      await execute(command);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger?.error(CONTEXT, traceId, 'Parseltongue execute callback threw', { action: command.action, error: message });
      throw err;
    }
    return true;
  }

  async wsaAudit(
    action: string,
    targetId: string,
    context: string,
  ): Promise<{ verdict: 'GRANTED' | 'REJECTED'; rationale: string }> {
    const raw = await this.send<{ verdict: string; rationale: string }>(
      'reason_audit',
      { action, target_id: targetId, context },
    );
    if (raw.verdict !== 'GRANTED' && raw.verdict !== 'REJECTED') {
      throw new Error(
        `${CONTEXT} wsaAudit: unexpected verdict ${JSON.stringify(raw.verdict)}`,
      );
    }
    return { verdict: raw.verdict, rationale: raw.rationale ?? '' };
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  private async send<T>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.socket || this.socket.destroyed) {
      throw new Error(`${CONTEXT} not connected — call connect() first`);
    }

    return new Promise((resolve, reject) => {
      this.requestQueue = this.requestQueue.then(async () => {
        if (!this.socket || this.socket.destroyed) {
          reject(new Error(`${CONTEXT} disconnected with pending request`));
          return;
        }
        try {
          const result = await this.dispatchSingleRequest<T>(method, params);
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
    });
  }

  private async dispatchSingleRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
    const id = randomUUID();
    const rpcPayload = JSON.stringify({ id, method, params });
    
    let checksum = 0;
    for (let i = 0; i < rpcPayload.length; i++) {
      checksum = (checksum + rpcPayload.charCodeAt(i)) >>> 0;
    }

    const packet: ClawLinkPacket = {
      trace_id: id,
      payload: rpcPayload,
      checksum,
    };

    const frame = JSON.stringify(packet) + '\n';

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(id);
        const error = new Error(`${CONTEXT} timeout after ${this.timeoutMs}ms [method=${method}, id=${id}]`);
        this.logger?.error(CONTEXT, id, error.message);
        reject(error);
      }, this.timeoutMs);

      this.pending.set(id, {
        resolve: resolve as (value: unknown) => void,
        reject,
        timer,
      });

      this.socket!.write(frame, 'utf8', (writeErr) => {
        if (writeErr) {
          clearTimeout(timer);
          this.pending.delete(id);
          this.logger?.error(CONTEXT, id, `Write error [method=${method}]: ${writeErr.message}`);
          reject(new Error(`${CONTEXT} write error [method=${method}, id=${id}]: ${writeErr.message}`));
        }
      });
    });
  }

  private handleData(data: Buffer): void {
    this.buffer += data.toString('utf8');

    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex).trim();
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (!line) continue;

      this.dispatchResponse(line);
    }
  }

  private dispatchResponse(line: string): void {
    let packet: unknown;
    try {
      packet = JSON.parse(line);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.logger?.error(CONTEXT, 'no-trace', 'Received non-JSON frame from Node A', { raw: line.slice(0, 200), error: message });
      return;
    }

    const packetData = packet as ClawLinkPacket;
    if (!packetData.trace_id || packetData.payload === undefined) {
      this.logger?.error(CONTEXT, 'no-trace', 'Received malformed ClawLinkPacket from Node A', { packet: packetData });
      return;
    }

    let parsedRpc: unknown;
    try {
      parsedRpc = JSON.parse(packetData.payload);
    } catch (e) {
      this.logger?.error(CONTEXT, packetData.trace_id, 'ClawLinkPacket payload is not valid JSON');
      return;
    }

    const envelope = ClawLinkRpcResponseSchema.safeParse(parsedRpc);
    if (!envelope.success) {
      // If not a standard RPC response, it might be an inbound intent/broadcast
      if (this.intentHandler) {
        this.intentHandler(parsedRpc).catch(err => {
          this.logger?.error(CONTEXT, packetData.trace_id, 'Intent handler failed', { error: err.message });
        });
      }
      return;
    }

    const { id, result, error } = envelope.data;
    const pending = this.pending.get(id);
    
    if (!pending) {
      if (this.intentHandler) {
        this.intentHandler(parsedRpc).catch(err => {
          this.logger?.error(CONTEXT, packetData.trace_id, 'Intent handler failed', { error: err.message });
        });
      }
      return;
    }

    clearTimeout(pending.timer);
    this.pending.delete(id);

    if (error !== null && error !== undefined) {
      this.logger?.error(CONTEXT, id, `Node A error: ${error}`);
      pending.reject(new Error(`${CONTEXT} Node A error [id=${id}]: ${error}`));
    } else {
      pending.resolve(result);
    }
  }

  private validate<T>(raw: unknown, schema: z.ZodType<T>, methodName: string): T {
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      const message = `${CONTEXT} ${methodName} response failed Zero-Trust validation: ${issue?.message ?? 'unknown'}`;
      this.logger?.error(CONTEXT, 'validate', message, { path: issue?.path });
      throw new Error(message + ` (path: ${issue?.path.join('.') ?? 'root'})`);
    }
    return result.data;
  }

  private handleSocketClose(): void {
    const traceId = randomUUID();
    this.logger?.warn(CONTEXT, traceId, 'ZeroClaw socket closed unexpectedly');
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`${CONTEXT} socket closed with pending request [id=${id}]`));
    }
    this.pending.clear();
    this.socket = null;
  }
}
