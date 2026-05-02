import { describe, it, expect, vi, beforeEach } from 'vitest';
import net from 'node:net';
import { ClawLinkClient } from '../../packages/hermes-core/src/api/clawlink-client.js';

vi.mock('node:net', async () => {
  const actual = await vi.importActual<typeof net>('node:net');
  return {
    ...actual,
    default: {
      ...actual,
      connect: vi.fn(),
    },
  };
});

const mockSocket = {
  on: vi.fn().mockReturnThis(),
  write: vi.fn(),
  destroy: vi.fn(),
  destroyed: false,
};

describe('ClawLinkClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (net.connect as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);
  });

  it('connects via Unix socket path, not TCP host/port', async () => {
    const client = new ClawLinkClient({ socketPath: '/tmp/test.sock' });

    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });

    await client.connect();

    expect(net.connect).toHaveBeenCalledWith('/tmp/test.sock');
    expect(net.connect).not.toHaveBeenCalledWith(
      expect.any(Number),
      expect.any(String),
    );
  });

  it('uses default socket path when not specified', async () => {
    const client = new ClawLinkClient({});

    mockSocket.on.mockImplementation((event: string, cb: () => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });

    await client.connect();

    expect(net.connect).toHaveBeenCalledWith('/run/crush/clawlink.sock');
  });
});

describe('ClawLinkClient.wsaAudit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (net.connect as ReturnType<typeof vi.fn>).mockReturnValue(mockSocket);
  });

  it('sends reason_audit RPC and returns GRANTED verdict', async () => {
    const client = new ClawLinkClient({ socketPath: '/tmp/test.sock' });

    mockSocket.on.mockImplementation((event: string, cb: (...args: unknown[]) => void) => {
      if (event === 'connect') cb();
      return mockSocket;
    });

    mockSocket.write.mockImplementation((frame: string, _enc: string, callback?: () => void) => {
      const pkt = JSON.parse(frame.trim());
      const inner = JSON.parse(pkt.payload);

      const responseInner = JSON.stringify({
        id: inner.id,
        result: { verdict: 'GRANTED', rationale: 'All clear.' },
        error: null,
      });
      const response =
        JSON.stringify({ trace_id: inner.id, payload: responseInner, checksum: 0 }) + '\n';

      const dataHandler = (mockSocket.on.mock.calls as Array<[string, (...a: unknown[]) => void]>)
        .find(([event]) => event === 'data')?.[1];
      if (dataHandler) dataHandler(Buffer.from(response));
      if (callback) callback();
      return true;
    });

    await client.connect();

    const result = await client.wsaAudit('unlock', 'door_001', 'Unlock door_001.');
    expect(result.verdict).toBe('GRANTED');
    expect(result.rationale).toBe('All clear.');
  });
});
