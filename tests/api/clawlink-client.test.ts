/**
 * tests/api/clawlink-client.test.ts
 *
 * Unit tests for ClawLinkClient.
 *
 * Strategy: mock the ssh2 Client factory with an EventEmitter-based stub that
 * exposes a forwardOut() spy. The stub allows tests to simulate:
 *   - Successful SSH + channel establishment
 *   - SSH connection errors
 *   - directTcpip channel errors
 *   - Incoming RPC response frames (full and chunked)
 *   - Request timeouts
 *   - RPC error responses from Node A
 *   - Zero-Trust Zod validation rejection
 */

import { describe, it, expect, vi, beforeEach, afterEach, type MockInstance } from 'vitest';
import { EventEmitter } from 'node:events';
import { ClawLinkClient } from '../../src/api/clawlink-client.js';
import type { ClawLinkConfig } from '../../src/shared/schemas/clawlink.schema.js';

// ── Mock SSH Client & Channel ─────────────────────────────────────────────────

/** Minimal mock of an ssh2 Channel (duplex stream). */
class MockChannel extends EventEmitter {
  write = vi.fn((data: Buffer | string, cb?: (err?: Error) => void) => {
    cb?.();
    return true;
  });
  close = vi.fn();
}

/** Minimal mock of an ssh2 Client. */
class MockSshClient extends EventEmitter {
  connect = vi.fn();
  end = vi.fn();
  forwardOut = vi.fn();
}

function makeMockFactory(): { client: MockSshClient; channel: MockChannel; factory: () => MockSshClient } {
  const channel = new MockChannel();
  const client = new MockSshClient();

  // Default forwardOut: immediately yield the mock channel
  client.forwardOut.mockImplementation(
    (_srcHost: string, _srcPort: number, _dstHost: string, _dstPort: number,
     cb: (err: Error | null, stream: MockChannel) => void) => {
      cb(null, channel);
    },
  );

  const factory = () => client as unknown as InstanceType<typeof import('ssh2').Client>;
  return { client, channel, factory };
}

// ── Fixture config ────────────────────────────────────────────────────────────

const VALID_CONFIG: ClawLinkConfig = {
  host: '192.168.0.50',
  sshPort: 22,
  username: 'nitro',
  privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nFAKE\n-----END OPENSSH PRIVATE KEY-----',
  zeroPort: 7878,
  timeoutMs: 200, // short timeout for test speed
};

// ── Helper: connect client and emit 'ready' ───────────────────────────────────

async function connectClient(
  clawlink: ClawLinkClient,
  mock: { client: MockSshClient },
): Promise<void> {
  const connectPromise = clawlink.connect();
  // ssh2 Client emits 'ready' once the SSH handshake completes
  mock.client.emit('ready');
  await connectPromise;
}

// ── Helper: simulate a response frame arriving on the channel ─────────────────

function emitResponse(channel: MockChannel, data: Record<string, unknown>): void {
  channel.emit('data', Buffer.from(JSON.stringify(data) + '\n'));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClawLinkClient', () => {
  let mock: ReturnType<typeof makeMockFactory>;
  let client: ClawLinkClient;

  beforeEach(() => {
    mock = makeMockFactory();
    client = new ClawLinkClient(VALID_CONFIG, mock.factory);
  });

  afterEach(async () => {
    await client.disconnect().catch(() => { /* ignore disconnect errors in teardown */ });
  });

  // ── Constructor ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws if config validation fails (missing required field)', () => {
      expect(
        () => new ClawLinkClient({ ...VALID_CONFIG, host: '' }, mock.factory),
      ).toThrow('config validation failed');
    });

    it('throws if sshPort is out of range', () => {
      expect(
        () => new ClawLinkClient({ ...VALID_CONFIG, sshPort: 99999 }, mock.factory),
      ).toThrow('config validation failed');
    });
  });

  // ── connect() ───────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('calls ssh2 connect() with Ed25519 algorithm preference', async () => {
      const connectPromise = client.connect();
      mock.client.emit('ready');
      await connectPromise;

      expect(mock.client.connect).toHaveBeenCalledWith(
        expect.objectContaining({
          host: '192.168.0.50',
          port: 22,
          username: 'nitro',
          algorithms: { serverHostKey: ['ssh-ed25519'] },
        }),
      );
    });

    it('calls forwardOut to zeroclaw port', async () => {
      const connectPromise = client.connect();
      mock.client.emit('ready');
      await connectPromise;

      expect(mock.client.forwardOut).toHaveBeenCalledWith(
        '127.0.0.1', 0,
        '127.0.0.1', 7878,
        expect.any(Function),
      );
    });

    it('rejects if SSH connection emits error', async () => {
      const connectPromise = client.connect();
      mock.client.emit('error', new Error('ECONNREFUSED'));
      await expect(connectPromise).rejects.toThrow('ECONNREFUSED');
    });

    it('rejects if forwardOut returns an error', async () => {
      mock.client.forwardOut.mockImplementation(
        (_: string, __: number, ___: string, ____: number,
         cb: (err: Error | null) => void) => {
          cb(new Error('Port forwarding denied'));
        },
      );

      const connectPromise = client.connect();
      mock.client.emit('ready');
      await expect(connectPromise).rejects.toThrow('directTcpip failed');
    });
  });

  // ── disconnect() ────────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('calls channel.close() and sshClient.end()', async () => {
      await connectClient(client, mock);
      await client.disconnect();

      expect(mock.channel.close).toHaveBeenCalled();
      expect(mock.client.end).toHaveBeenCalled();
    });

    it('rejects pending requests on disconnect', async () => {
      await connectClient(client, mock);

      // Start a request but don't respond to it
      const searchPromise = client.hybridSearch('test', 'core_rules', 5);
      await client.disconnect();

      await expect(searchPromise).rejects.toThrow('disconnected with pending request');
    });
  });

  // ── isHealthy() ─────────────────────────────────────────────────────────────

  describe('isHealthy()', () => {
    it('returns true when Node A responds with pong', async () => {
      await connectClient(client, mock);

      // Intercept the write call and emit a pong response
      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        setTimeout(() => emitResponse(mock.channel, { id: req.id, result: { pong: true } }), 0);
        return true;
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });

    it('returns false when not connected', async () => {
      // No connect() called
      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });

    it('returns false on timeout', async () => {
      await connectClient(client, mock);
      // Don't emit any response — let it timeout
      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  // ── hybridSearch() ──────────────────────────────────────────────────────────

  describe('hybridSearch()', () => {
    it('sends correct JSON-RPC frame with snake_case top_k', async () => {
      await connectClient(client, mock);

      let capturedFrame = '';
      mock.channel.write.mockImplementation((data: Buffer | string) => {
        capturedFrame = data.toString().trim();
        const req = JSON.parse(capturedFrame) as { id: string };
        emitResponse(mock.channel, { id: req.id, result: [] });
        return true;
      });

      await client.hybridSearch('ranged attack DV', 'core_rules', 5);

      const frame = JSON.parse(capturedFrame) as { method: string; params: { query: string; namespace: string; top_k: number } };
      expect(frame.method).toBe('hybrid_search');
      expect(frame.params.query).toBe('ranged attack DV');
      expect(frame.params.namespace).toBe('core_rules');
      expect(frame.params.top_k).toBe(5);
    });

    it('validates and returns results matching schema', async () => {
      await connectClient(client, mock);

      const validResult = {
        id: 'a0000000-0000-0000-0000-000000000001',
        source_ref: 'CPRED-CORE',
        namespace: 'core_rules',
        context_type: 'mechanic',
        section_heading: 'Ranged Attack',
        page_start: 10,
        page_end: 11,
        content: 'To make a ranged attack roll d10 plus REF.',
        chunk_index: 0,
        score: 0.87,
      };

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, { id: req.id, result: [validResult] });
        return true;
      });

      const results = await client.hybridSearch('ranged attack', 'core_rules', 5);
      expect(results).toHaveLength(1);
      expect(results[0]?.section_heading).toBe('Ranged Attack');
    });

    it('rejects if Node A returns a malformed result (Zero-Trust)', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        // Missing required 'content' field
        emitResponse(mock.channel, { id: req.id, result: [{ id: 'x', namespace: 'invalid' }] });
        return true;
      });

      await expect(client.hybridSearch('test', 'core_rules', 5)).rejects.toThrow(
        'Zero-Trust validation',
      );
    });
  });

  // ── resolveAttack() ─────────────────────────────────────────────────────────

  describe('resolveAttack()', () => {
    it('sends correct JSON-RPC frame', async () => {
      await connectClient(client, mock);

      let capturedFrame = '';
      mock.channel.write.mockImplementation((data: Buffer | string) => {
        capturedFrame = data.toString().trim();
        const req = JSON.parse(capturedFrame) as { id: string };
        const result = {
          roll: { dice: [8], total: 8, is_critical_success: false, is_critical_failure: false },
          stat: 6, skill: 4, dv: 15, attack_total: 18, hit: true,
        };
        emitResponse(mock.channel, { id: req.id, result });
        return true;
      });

      await client.resolveAttack([8], 6, 4, 15);

      const frame = JSON.parse(capturedFrame) as { method: string; params: { dice: number[]; stat: number; skill: number; dv: number } };
      expect(frame.method).toBe('resolve_attack');
      expect(frame.params.dice).toEqual([8]);
      expect(frame.params.stat).toBe(6);
      expect(frame.params.skill).toBe(4);
      expect(frame.params.dv).toBe(15);
    });

    it('returns validated AttackResult with hit=true', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, {
          id: req.id,
          result: {
            roll: { dice: [8], total: 8, is_critical_success: false, is_critical_failure: false },
            stat: 6, skill: 4, dv: 15, attack_total: 18, hit: true,
          },
        });
        return true;
      });

      const result = await client.resolveAttack([8], 6, 4, 15);
      expect(result.hit).toBe(true);
      expect(result.attack_total).toBe(18);
    });

    it('returns validated AttackResult with critical success', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, {
          id: req.id,
          result: {
            roll: { dice: [10, 8], total: 18, is_critical_success: true, is_critical_failure: false },
            stat: 6, skill: 4, dv: 25, attack_total: 28, hit: true,
          },
        });
        return true;
      });

      const result = await client.resolveAttack([10, 8], 6, 4, 25);
      expect(result.roll.is_critical_success).toBe(true);
      expect(result.roll.total).toBe(18);
    });

    it('throws on timeout', async () => {
      await connectClient(client, mock);
      // channel.write does nothing — no response emitted
      await expect(client.resolveAttack([7], 5, 4, 13)).rejects.toThrow('timeout');
    });

    it('throws on RPC error response from Node A', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, { id: req.id, error: 'dice must not be empty' });
        return true;
      });

      await expect(client.resolveAttack([], 5, 4, 13)).rejects.toThrow('dice must not be empty');
    });
  });

  // ── resolveDamage() ─────────────────────────────────────────────────────────

  describe('resolveDamage()', () => {
    it('sends correct JSON-RPC frame with snake_case armour_sp', async () => {
      await connectClient(client, mock);

      let capturedFrame = '';
      mock.channel.write.mockImplementation((data: Buffer | string) => {
        capturedFrame = data.toString().trim();
        const req = JSON.parse(capturedFrame) as { id: string };
        emitResponse(mock.channel, {
          id: req.id,
          result: { dice: [4, 3, 5], bonus: 2, raw: 14, armour_sp: 7, final_damage: 7 },
        });
        return true;
      });

      await client.resolveDamage([4, 3, 5], 2, 7);

      const frame = JSON.parse(capturedFrame) as { method: string; params: { dice: number[]; bonus: number; armour_sp: number } };
      expect(frame.method).toBe('resolve_damage');
      expect(frame.params.armour_sp).toBe(7); // snake_case on the wire
    });

    it('returns validated DamageResult', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, {
          id: req.id,
          result: { dice: [4, 3, 5], bonus: 2, raw: 14, armour_sp: 7, final_damage: 7 },
        });
        return true;
      });

      const result = await client.resolveDamage([4, 3, 5], 2, 7);
      expect(result.final_damage).toBe(7);
      expect(result.raw).toBe(14);
    });

    it('returns final_damage=0 when damage is fully absorbed by armour', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        emitResponse(mock.channel, {
          id: req.id,
          result: { dice: [1, 1], bonus: 0, raw: 2, armour_sp: 20, final_damage: 0 },
        });
        return true;
      });

      const result = await client.resolveDamage([1, 1], 0, 20);
      expect(result.final_damage).toBe(0);
    });
  });

  // ── Chunked data ─────────────────────────────────────────────────────────────

  describe('chunked data handling', () => {
    it('reassembles a response split across multiple data events', async () => {
      await connectClient(client, mock);

      mock.channel.write.mockImplementation((data: Buffer | string) => {
        const req = JSON.parse(data.toString().trim()) as { id: string };
        const full = JSON.stringify({
          id: req.id,
          result: { pong: true },
        }) + '\n';

        // Split the response into two chunks
        setTimeout(() => {
          mock.channel.emit('data', Buffer.from(full.slice(0, 15)));
          mock.channel.emit('data', Buffer.from(full.slice(15)));
        }, 0);
        return true;
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  // ── not connected guard ──────────────────────────────────────────────────────

  describe('not-connected guard', () => {
    it('throws immediately if sendRpc called before connect()', async () => {
      await expect(client.hybridSearch('test', 'core_rules', 5)).rejects.toThrow(
        'not connected',
      );
    });
  });
});
