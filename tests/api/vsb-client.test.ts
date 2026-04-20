import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { VsbClient } from '../../src/api/vsb-client.js';
import * as dgram from 'node:dgram';
import { ResultPacketCodec, ResultStatus } from '../../src/shared/vsb_protocol.js';

vi.mock('node:dgram');

describe('VsbClient', () => {
  const config = {
    host: '10.0.0.10',
    port: 7878,
    timeoutMs: 1000,
  };

  let client: VsbClient;
  let mockSocket: any;
  let messageCallback: ((msg: Buffer, rinfo: any) => void) | null = null;

  beforeEach(() => {
    messageCallback = null;
    mockSocket = {
      send: vi.fn((_buf, _port, _host, cb) => {
        // Simulate async response after send
        if (messageCallback) {
          const resultBuf = ResultPacketCodec.encode(
            ResultStatus.Ok,
            123,
            new Uint8Array(16),
            0,
            new Uint8Array(256)
          );
          // Wait a tick to ensure the listener is registered
          process.nextTick(() => {
            messageCallback!(Buffer.from(resultBuf), { address: config.host, port: config.port });
          });
        }
        cb?.();
      }),
      on: vi.fn((event, cb) => {
        if (event === 'message') messageCallback = cb;
      }),
      off: vi.fn(),
      close: vi.fn(),
    };
    (dgram.createSocket as any).mockReturnValue(mockSocket);
    client = new VsbClient(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should send a SkillCheck intent and resolve on valid ResultPacket', async () => {
    const sessionId = new Uint8Array(16).fill(0xAA);
    const actorId = new Uint8Array(16).fill(0xBB);
    const payload = new Uint8Array(256).fill(0xCC);

    const result = await client.sendSkillCheck(123, sessionId, actorId, payload);
    expect(result.header.sequenceId).toBe(123);
    expect(mockSocket.send).toHaveBeenCalled();
  });
});
