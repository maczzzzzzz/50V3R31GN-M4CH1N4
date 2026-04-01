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
import type { ClawLinkConfig } from '../../src/shared/schemas/clawlink.schema.js';

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
});
