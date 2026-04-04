/**
 * tests/api/clawlink-client.test.ts
 *
 * Unit tests for ClawLinkClient.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

vi.mock('node:net', () => {
  const { EventEmitter } = require('node:events');
  class MockSocket extends EventEmitter {
    connect = vi.fn().mockReturnThis();
    write = vi.fn((data: string, _encoding?: string, cb?: (err?: Error) => void) => {
      cb?.();
      return true;
    });
    destroy = vi.fn();
    destroyed = false;
  }
  const mockConnect = vi.fn(() => new MockSocket());
  return {
    default: { connect: mockConnect },
    connect: mockConnect,
  };
});

import net from 'node:net';
import { ClawLinkClient } from '../../src/api/clawlink-client.js';
import { ParseltongueCodec } from '../../src/shared/parseltongue-codec.js';
import type { ClawLinkConfig } from '../../src/shared/schemas/clawlink.schema.js';
import type { WorldCommand } from '../../src/shared/schemas/world-commands.schema.js';

// ── Fixture config ────────────────────────────────────────────────────────────

const VALID_CONFIG: ClawLinkConfig = {
  host: '192.168.0.50',
  port: 7878,
  timeoutMs: 200, // short timeout for test speed
};

// ── Helper: simulate a ClawLinkPacket arriving on the socket ─────────────────

function emitPacket(socket: any, traceId: string, payload: Record<string, unknown>): void {
  const packet = {
    trace_id: traceId,
    payload: JSON.stringify(payload),
    checksum: 0,
  };
  socket.emit('data', Buffer.from(JSON.stringify(packet) + '\n'));
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ClawLinkClient', () => {
  let client: ClawLinkClient;
  let mockSocket: any;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new ClawLinkClient(VALID_CONFIG);
    mockSocket = (net.connect as any).mock.results[0]?.value;
  });

  afterEach(async () => {
    await client.disconnect().catch(() => {});
  });

  // ── Constructor ─────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws if config validation fails (missing required field)', () => {
      expect(
        () => new ClawLinkClient({ ...VALID_CONFIG, host: '' } as any),
      ).toThrow('config validation failed');
    });

    it('throws if port is out of range', () => {
      expect(
        () => new ClawLinkClient({ ...VALID_CONFIG, port: 99999 } as any),
      ).toThrow('config validation failed');
    });
  });

  // ── connect() ───────────────────────────────────────────────────────────────

  describe('connect()', () => {
    it('calls net.connect() with correct host and port', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('connect');
      await connectPromise;

      expect(net.connect).toHaveBeenCalledWith(7878, '192.168.0.50');
    });

    it('rejects if socket emits error', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('error', new Error('ECONNREFUSED'));
      await expect(connectPromise).rejects.toThrow('ECONNREFUSED');
    });
  });

  // ── disconnect() ────────────────────────────────────────────────────────────

  describe('disconnect()', () => {
    it('calls socket.destroy()', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('connect');
      await connectPromise;
      
      await client.disconnect();
      expect(mockSocket.destroy).toHaveBeenCalled();
    });

    it('rejects pending requests on disconnect', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('connect');
      await connectPromise;

      // Start a request but don't respond to it
      const searchPromise = client.hybridSearch('test', 'namespace', 5);
      await client.disconnect();

      await expect(searchPromise).rejects.toThrow('disconnected with pending request');
    });
  });

  // ── isHealthy() ─────────────────────────────────────────────────────────────

  describe('isHealthy()', () => {
    it('returns true when Node A responds with pong', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('connect');
      await connectPromise;

      mockSocket.write.mockImplementation((data: string) => {
        const packet = JSON.parse(data.trim());
        const rpc = JSON.parse(packet.payload);
        setTimeout(() => emitPacket(mockSocket, packet.trace_id, { id: rpc.id, result: { pong: true } }), 0);
        return true;
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });

    it('returns false when not connected', async () => {
      const healthy = await client.isHealthy();
      expect(healthy).toBe(false);
    });
  });

  // ── Chunked data ─────────────────────────────────────────────────────────────

  describe('chunked data handling', () => {
    it('reassembles a response split across multiple data events', async () => {
      const connectPromise = client.connect();
      mockSocket = (net.connect as any).mock.results[(net.connect as any).mock.results.length - 1].value;
      mockSocket.emit('connect');
      await connectPromise;

      mockSocket.write.mockImplementation((data: string) => {
        const packet = JSON.parse(data.trim());
        const rpc = JSON.parse(packet.payload);
        const full = JSON.stringify({
          trace_id: packet.trace_id,
          payload: JSON.stringify({ id: rpc.id, result: { pong: true } }),
          checksum: 0,
        }) + '\n';

        setTimeout(() => {
          mockSocket.emit('data', Buffer.from(full.slice(0, 10)));
          mockSocket.emit('data', Buffer.from(full.slice(10)));
        }, 0);
        return true;
      });

      const healthy = await client.isHealthy();
      expect(healthy).toBe(true);
    });
  });

  // ── Phase 20: processParseltongueNarrative ──────────────────────────────────

  describe('processParseltongueNarrative', () => {
    const UPDATE_CMD: WorldCommand = {
      action: 'UPDATE_NPC',
      target: 'npc_maelstrom_001',
      data: { hp: 5, disposition: 'hostile' },
    };

    it('returns false and does not call execute for clean text', async () => {
      const execute = vi.fn();
      const result = await client.processParseltongueNarrative('Clean bark. No payload.', execute);
      expect(result).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });

    it('returns true and calls execute with decoded WorldCommand', async () => {
      const cloaked = ParseltongueCodec.cloakCommand('Vekh ra-koru!', UPDATE_CMD);
      const execute = vi.fn().mockResolvedValue(undefined);
      const result = await client.processParseltongueNarrative(cloaked, execute);
      expect(result).toBe(true);
      expect(execute).toHaveBeenCalledOnce();
      expect(execute).toHaveBeenCalledWith(UPDATE_CMD);
    });

    it('returns false when payload is present but fails Zod validation', async () => {
      const malformed = ParseltongueCodec.cloak('Bark.', JSON.stringify({ action: 'NOT_A_REAL_ACTION' }));
      const execute = vi.fn();
      const result = await client.processParseltongueNarrative(malformed, execute);
      expect(result).toBe(false);
      expect(execute).not.toHaveBeenCalled();
    });

    it('awaits the execute handler before returning', async () => {
      const order: string[] = [];
      const cloaked = ParseltongueCodec.cloakCommand('Bark.', UPDATE_CMD);
      const execute = vi.fn().mockImplementation(async () => {
        order.push('execute');
      });
      order.push('before');
      await client.processParseltongueNarrative(cloaked, execute);
      order.push('after');
      expect(order).toEqual(['before', 'execute', 'after']);
    });

    it('re-throws and logs when execute callback rejects', async () => {
      const cloaked = ParseltongueCodec.cloakCommand('Bark.', UPDATE_CMD);
      const boom = new Error('Foundry write failed');
      const execute = vi.fn().mockRejectedValue(boom);
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        client.processParseltongueNarrative(cloaked, execute),
      ).rejects.toThrow('Foundry write failed');

      expect(consoleSpy).toHaveBeenCalledOnce();
      const logged = JSON.parse(consoleSpy.mock.calls[0]![0] as string);
      expect(logged.severity).toBe('ERROR');
      expect(logged.data.action).toBe('UPDATE_NPC');
      expect(logged.data.error).toBe('Foundry write failed');

      consoleSpy.mockRestore();
    });
  });
});
