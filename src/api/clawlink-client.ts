/**
 * src/api/clawlink-client.ts
 *
 * ClawLinkClient — Persistent binary socket bridge to ZeroClaw on Node A.
 *
 * Transport layer:
 *   Node B (this class)
 *     → node:net Socket (direct TCP to Node A)
 *     → newline-delimited JSON ClawLinkPackets
 *     → ZeroClaw (Rust TCP server, port 7878 on Node A)
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

const CONTEXT = 'ClawLinkClient';
const DEFAULT_TIMEOUT_MS = 5000;

// ── Public interface ──────────────────────────────────────────────────────────

export interface IClawLinkClient {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isHealthy(): Promise<boolean>;
  hybridSearch(query: string, namespace: string, topK: number): Promise<ClawLinkSearchResult[]>;
  resolveAttack(dice: number[], stat: number, skill: number, dv: number): Promise<ClawLinkAttackResult>;
  resolveDamage(dice: number[], bonus: number, armourSp: number): Promise<ClawLinkDamageResult>;
  executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T>;
  /** ST3GG: Encode a string payload into a PNG's LSBs. Returns the modified PNG as base64. */
  st3ggEncode(imageB64: string, payload: string): Promise<string>;
  /** ST3GG: Decode a payload previously embedded by st3ggEncode. Returns the raw payload string. */
  st3ggDecode(imageB64: string): Promise<string>;
  /**
   * Parseltongue: scan `text` for an embedded WorldCommand payload (U+E0000 tag block).
   * If a valid payload is found, calls `execute` with the decoded command.
   * Returns true if a mutation was dispatched, false if the text was clean.
   */
  processParseltongueNarrative(
    text: string,
    execute: (cmd: WorldCommand) => Promise<void>,
  ): Promise<boolean>;
}

// ── Internal types ────────────────────────────────────────────────────────────

interface ClawLinkPacket {
  trace_id: string;
  payload: string;
  checksum: number;
}

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * ClawLinkClient establishes and maintains a persistent TCP connection to Node A,
 * then dispatches JSON-RPC calls wrapped in ClawLinkPackets to the ZeroClaw server.
 */
export class ClawLinkClient implements IClawLinkClient {
  private readonly config: ClawLinkConfig;
  private readonly timeoutMs: number;

  private socket: net.Socket | null = null;
  private buffer: string = '';
  private readonly pending = new Map<string, PendingRequest>();
  private requestQueue: Promise<void> = Promise.resolve();

  constructor(config: ClawLinkConfig) {
    const parsed = ClawLinkConfigSchema.safeParse(config);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`${CONTEXT} config validation failed: ${issue?.message ?? 'unknown'}`);
    }
    this.config = Object.freeze({ ...parsed.data }) as ClawLinkConfig;
    this.timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Establish the TCP connection to zeroclaw.
   * Must be called before any RPC methods.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const socket = net.connect(this.config.port, this.config.host);
      this.socket = socket;

      socket.on('connect', () => {
        this.buffer = '';
        this.requestQueue = Promise.resolve(); // Reset queue on connect
        resolve();
      });

      socket.on('data', (data: Buffer) => this.handleData(data));

      socket.on('error', (err: Error) => {
        if (this.socket === socket) {
          // Only reject connection if we're not already connected
          reject(new Error(`${CONTEXT} TCP connection error: ${err.message}`));
          
          // Also reject pending requests on error
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

  /** Close the TCP connection. */
  async disconnect(): Promise<void> {
    // Reject all pending requests
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
  }

  /** Send a ping and return true if zeroclaw responds within timeoutMs. */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.send<{ pong: boolean }>('ping', {});
      return result.pong === true;
    } catch {
      return false;
    }
  }

  /**
   * Run a hybrid FTS5 + vec0 search on Node A.
   * Results are Zero-Trust validated before return.
   */
  async hybridSearch(
    query: string,
    namespace: string,
    topK: number,
  ): Promise<ClawLinkSearchResult[]> {
    const raw = await this.send<unknown>('hybrid_search', { query, namespace, top_k: topK });
    return this.validate(raw, ClawLinkSearchResultsSchema, 'hybridSearch');
  }

  /**
   * Resolve an attack roll using the ZeroClaw Interlock math engine.
   * Callers supply pre-rolled dice; ZeroClaw performs the arithmetic.
   */
  async resolveAttack(
    dice: number[],
    stat: number,
    skill: number,
    dv: number,
  ): Promise<ClawLinkAttackResult> {
    const raw = await this.send<unknown>('resolve_attack', { dice, stat, skill, dv });
    return this.validate(raw, ClawLinkAttackResultSchema, 'resolveAttack');
  }

  /**
   * Resolve damage against armour SP using the ZeroClaw Interlock math engine.
   * Callers supply pre-rolled damage dice; ZeroClaw performs the arithmetic.
   */
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

  /**
   * Execute a generic RPC call to Node A.
   * Useful for the Swarm Oracle and specialized rules checks.
   */
  async executeRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    return this.send<T>(method, params);
  }

  /**
   * ST3GG encode: embed `payload` into `imageB64` PNG's LSBs via Node A.
   * Returns the modified image as base64.
   */
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

  /**
   * ST3GG decode: extract the payload embedded in `imageB64` PNG's LSBs via Node A.
   * Returns the raw payload string.
   */
  async st3ggDecode(imageB64: string): Promise<string> {
    const raw = await this.send<{ payload: string }>('st3gg_decode', {
      image_b64: imageB64,
    });
    if (typeof raw.payload !== 'string') {
      throw new Error(`${CONTEXT} st3ggDecode: unexpected response shape`);
    }
    return raw.payload;
  }

  /**
   * Parseltongue bridge: scan an incoming narrative string for invisible WorldCommand
   * payloads encoded in the Unicode Tags block (U+E0000).
   *
   * If a valid, Zod-validated WorldCommand is found, `execute` is awaited with it.
   * The method returns true when a mutation is dispatched, false when the text is clean
   * or contains a payload that fails schema validation (invalid payloads are silently
   * dropped — they may originate from untrusted Foundry clients).
   *
   * This implements the "Command Recovery" leg of the Parseltongue data flow:
   *   Foundry Client → ClawLink → Unicode Tag Decoder → World State Mutation
   */
  async processParseltongueNarrative(
    text: string,
    execute: (cmd: WorldCommand) => Promise<void>,
  ): Promise<boolean> {
    const command = ParseltongueCodec.scanForCommand(text);
    if (command === null) return false;
    try {
      await execute(command);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context: CONTEXT,
        message: 'Parseltongue execute callback threw',
        data: { action: command.action, error: message },
      }));
      throw err;
    }
    return true;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Write a ClawLinkPacket containing a JSON-RPC request to the socket and await the response.
   * The correlation ID ensures responses are matched to the correct caller.
   * "The Throttling Queue": Serializes requests to prevent Node A VRAM bandwidth exhaustion.
   */
  private async send<T>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.socket || this.socket.destroyed) {
      throw new Error(`${CONTEXT} not connected — call connect() first`);
    }

    // Add this request to the queue
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

  /** Dispatches a single request frame and waits for the specific ID response. */
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
        reject(new Error(`${CONTEXT} timeout after ${this.timeoutMs}ms [method=${method}, id=${id}]`));
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
          reject(new Error(`${CONTEXT} write error [method=${method}, id=${id}]: ${writeErr.message}`));
        }
      });
    });
  }

  /**
   * Handle incoming data from the socket.
   */
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

  /** Parse a response line and resolve/reject the matching pending request. */
  private dispatchResponse(line: string): void {
    let packet: unknown;
    try {
      packet = JSON.parse(line);
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context: CONTEXT,
        message: 'Received non-JSON frame from Node A',
        data: { raw: line.slice(0, 200), error: message },
      }));
      return;
    }

    // Node A also returns ClawLinkPacket
    const packetData = packet as ClawLinkPacket;
    if (!packetData.trace_id || packetData.payload === undefined) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context: CONTEXT,
        message: 'Received malformed ClawLinkPacket from Node A',
        data: { packet: packetData },
      }));
      return;
    }

    let parsedRpc: unknown;
    try {
      parsedRpc = JSON.parse(packetData.payload);
    } catch (e) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context: CONTEXT,
        message: 'ClawLinkPacket payload is not valid JSON',
        data: { trace_id: packetData.trace_id },
      }));
      return;
    }

    const envelope = ClawLinkRpcResponseSchema.safeParse(parsedRpc);
    if (!envelope.success) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        severity: 'ERROR',
        context: CONTEXT,
        message: 'RpcResponse envelope failed Zero-Trust validation',
        data: { issue: envelope.error.issues[0]?.message },
      }));
      return;
    }

    const { id, result, error } = envelope.data;
    const pending = this.pending.get(id);
    if (!pending) return; // Stale/duplicate response — discard

    clearTimeout(pending.timer);
    this.pending.delete(id);

    // Only reject if there is a non-null, non-undefined error
    if (error !== null && error !== undefined) {
      pending.reject(new Error(`${CONTEXT} Node A error [id=${id}]: ${error}`));
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Zero-Trust schema validation on a Node A result.
   */
  private validate<T>(raw: unknown, schema: z.ZodType<T>, methodName: string): T {
    const result = schema.safeParse(raw);
    if (!result.success) {
      const issue = result.error.issues[0];
      throw new Error(
        `${CONTEXT} ${methodName} response failed Zero-Trust validation: ` +
        `${issue?.message ?? 'unknown'} (path: ${issue?.path.join('.') ?? 'root'})`,
      );
    }
    return result.data;
  }

  /** Handle unexpected socket closure — reject all pending requests. */
  private handleSocketClose(): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`${CONTEXT} socket closed with pending request [id=${id}]`));
    }
    this.pending.clear();
    this.socket = null;
  }
}
