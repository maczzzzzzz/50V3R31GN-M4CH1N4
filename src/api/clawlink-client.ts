/**
 * src/api/clawlink-client.ts
 *
 * ClawLinkClient — Persistent SSH tunnel + JSON-RPC bridge to ZeroClaw on Node A.
 *
 * Transport layer:
 *   Node B (this class)
 *     → ssh2 Client  (Ed25519 key auth to Node A SSH daemon)
 *     → directTcpip channel  (forwards to zeroclaw TCP server on Node A localhost)
 *     → newline-delimited JSON-RPC frames
 *     → ZeroClaw (Rust TCP server, 127.0.0.1:7878 on Node A)
 *
 * Security: Ed25519 public-key authentication at the SSH layer means all
 * traffic on the channel is implicitly authenticated — no additional
 * application-layer token needed.
 *
 * Zero-Trust: All responses from Node A are validated against Zod schemas
 * before being returned to callers, per CLAUDE.md §9.
 */

import { randomUUID } from 'node:crypto';
import { Client, type Channel } from 'ssh2';
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
}

/** Factory function injected into ClawLinkClient for testability. */
export type SshClientFactory = () => InstanceType<typeof Client>;

// ── Internal types ────────────────────────────────────────────────────────────

interface PendingRequest {
  resolve: (value: unknown) => void;
  reject: (reason: Error) => void;
  timer: ReturnType<typeof setTimeout>;
}

// ── Implementation ────────────────────────────────────────────────────────────

/**
 * ClawLinkClient establishes and maintains a persistent SSH tunnel to Node A,
 * then dispatches JSON-RPC calls to the ZeroClaw TCP server through it.
 *
 * Usage:
 *   const client = new ClawLinkClient({ host: '192.168.0.50', ... });
 *   await client.connect();
 *   const results = await client.hybridSearch('ranged attack', 'core_rules', 5);
 *   await client.disconnect();
 */
export class ClawLinkClient implements IClawLinkClient {
  private readonly config: ClawLinkConfig;
  private readonly timeoutMs: number;
  private readonly createSshClient: SshClientFactory;

  private sshClient: InstanceType<typeof Client> | null = null;
  private channel: Channel | null = null;
  private buffer: string = '';
  private readonly pending = new Map<string, PendingRequest>();

  constructor(config: ClawLinkConfig, createSshClient: SshClientFactory = () => new Client()) {
    const parsed = ClawLinkConfigSchema.safeParse(config);
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`${CONTEXT} config validation failed: ${issue?.message ?? 'unknown'}`);
    }
    this.config = Object.freeze({ ...parsed.data }) as ClawLinkConfig;
    this.timeoutMs = this.config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.createSshClient = createSshClient;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Establish the SSH session and open the directTcpip channel to zeroclaw.
   * Must be called before any RPC methods.
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const client = this.createSshClient();
      this.sshClient = client;

      client.once('ready', () => {
        client.forwardOut(
          '127.0.0.1', 0,
          '127.0.0.1', this.config.zeroPort,
          (err, stream) => {
            if (err) {
              reject(new Error(`${CONTEXT} directTcpip failed: ${err.message}`));
              return;
            }

            this.channel = stream;
            this.buffer = '';

            stream.on('data', (data: Buffer) => this.handleData(data));
            stream.once('close', () => this.handleChannelClose());
            stream.on('error', (streamErr: Error) => {
              // Reject pending requests on channel error
              for (const [id, pending] of this.pending) {
                clearTimeout(pending.timer);
                pending.reject(new Error(`${CONTEXT} channel error [id=${id}]: ${streamErr.message}`));
              }
              this.pending.clear();
            });

            resolve();
          },
        );
      });

      client.once('error', (err) => {
        reject(new Error(`${CONTEXT} SSH connection error: ${err.message}`));
      });

      client.connect({
        host: this.config.host,
        port: this.config.sshPort,
        username: this.config.username,
        privateKey: this.config.privateKey,
        algorithms: { serverHostKey: ['ssh-ed25519'] },
      });
    });
  }

  /** Close the SSH channel and underlying SSH session. */
  async disconnect(): Promise<void> {
    // Reject all pending requests
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`${CONTEXT} disconnected with pending request [id=${id}]`));
    }
    this.pending.clear();

    this.channel?.close();
    this.channel = null;
    this.sshClient?.end();
    this.sshClient = null;
    this.buffer = '';
  }

  /** Send a ping and return true if zeroclaw responds within timeoutMs. */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.sendRpc<{ pong: boolean }>('ping', {});
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
    const raw = await this.sendRpc<unknown>('hybrid_search', { query, namespace, top_k: topK });
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
    const raw = await this.sendRpc<unknown>('resolve_attack', { dice, stat, skill, dv });
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
    const raw = await this.sendRpc<unknown>('resolve_damage', {
      dice,
      bonus,
      armour_sp: armourSp,
    });
    return this.validate(raw, ClawLinkDamageResultSchema, 'resolveDamage');
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Write a JSON-RPC request frame to the SSH channel and await the response.
   * The correlation ID ensures responses are matched to the correct caller
   * even if multiple requests are in-flight.
   */
  private async sendRpc<T>(method: string, params: Record<string, unknown>): Promise<T> {
    if (!this.channel) {
      throw new Error(`${CONTEXT} not connected — call connect() first`);
    }

    const id = randomUUID();
    const frame = JSON.stringify({ id, method, params }) + '\n';

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

      this.channel!.write(Buffer.from(frame), (writeErr) => {
        if (writeErr) {
          clearTimeout(timer);
          this.pending.delete(id);
          reject(new Error(`${CONTEXT} write error [method=${method}, id=${id}]: ${writeErr.message}`));
        }
      });
    });
  }

  /**
   * Handle incoming data from the SSH channel.
   * Data may arrive in partial chunks — buffered until a complete '\n'-terminated
   * line is received, then parsed as an RpcResponse and dispatched.
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
    let parsed: unknown;
    try {
      parsed = JSON.parse(line);
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

    const envelope = ClawLinkRpcResponseSchema.safeParse(parsed);
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

    if (error !== undefined) {
      pending.reject(new Error(`${CONTEXT} Node A error [id=${id}]: ${error}`));
    } else {
      pending.resolve(result);
    }
  }

  /**
   * Zero-Trust schema validation on a Node A result.
   * Throws a descriptive error if the payload doesn't match the expected shape.
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

  /** Handle unexpected SSH channel closure — reject all pending requests. */
  private handleChannelClose(): void {
    for (const [id, pending] of this.pending) {
      clearTimeout(pending.timer);
      pending.reject(new Error(`${CONTEXT} channel closed with pending request [id=${id}]`));
    }
    this.pending.clear();
    this.channel = null;
  }
}
