import { test, expect, describe, beforeAll, afterAll } from 'vitest';
import net from 'node:net';
import { ClawLinkClient } from '../../src/api/clawlink-client';

/**
 * Task 5: End-to-End Integration Test
 * Verifies the handshake between Node B (TypeScript) and a mock Node A (Rust-like behavior).
 */
describe('ZeroClaw Handshake E2E', () => {
  let server: net.Server;
  let port: number;
  const host = '127.0.0.1';
  let receivedPackets: any[] = [];

  beforeAll(async () => {
    return new Promise((resolve) => {
      server = net.createServer((socket) => {
        let buffer = '';
        socket.on('data', (data) => {
          buffer += data.toString('utf8');
          if (buffer.includes('\n')) {
            const lines = buffer.split('\n');
            for (let i = 0; i < lines.length - 1; i++) {
              const line = lines[i].trim();
              if (!line) continue;

              try {
                const packet = JSON.parse(line);
                receivedPackets.push(packet);

                const rpcRequest = JSON.parse(packet.payload);

                if (rpcRequest.method === 'ping') {
                  const rpcResponse = {
                    id: rpcRequest.id,
                    result: { pong: true }
                  };
                  const payload = JSON.stringify(rpcResponse);
                  
                  // Calculate simple checksum (sum of char codes)
                  let checksum = 0;
                  for (let j = 0; j < payload.length; j++) {
                    checksum = (checksum + payload.charCodeAt(j)) >>> 0;
                  }

                  const responsePacket = {
                    trace_id: packet.trace_id,
                    payload: payload,
                    checksum: checksum
                  };

                  socket.write(JSON.stringify(responsePacket) + '\n');
                }
              } catch (e) {
                console.error('Mock server parse error:', e);
              }
            }
            buffer = lines[lines.length - 1];
          }
        });
      });

      server.listen(0, host, () => {
        const addr = server.address() as net.AddressInfo;
        port = addr.port;
        resolve();
      });
    });
  });

  afterAll(async () => {
    return new Promise((resolve) => {
      server.close(() => resolve());
    });
  });

  test('should perform zero-latency handshake with Node A', async () => {
    const client = new ClawLinkClient({ host, port });
    await client.connect();
    
    const healthy = await client.isHealthy();
    expect(healthy).toBe(true);

    // Verify packet structure from the server's perspective
    expect(receivedPackets.length).toBeGreaterThan(0);
    const lastPacket = receivedPackets[receivedPackets.length - 1];
    
    expect(lastPacket).toHaveProperty('trace_id');
    expect(lastPacket).toHaveProperty('payload');
    expect(lastPacket).toHaveProperty('checksum');
    
    // Verify checksum of the received packet
    let expectedChecksum = 0;
    for (let i = 0; i < lastPacket.payload.length; i++) {
      expectedChecksum = (expectedChecksum + lastPacket.payload.charCodeAt(i)) >>> 0;
    }
    expect(lastPacket.checksum).toBe(expectedChecksum);

    const rpcRequest = JSON.parse(lastPacket.payload);
    expect(rpcRequest.method).toBe('ping');
    expect(rpcRequest.id).toBe(lastPacket.trace_id);

    await client.disconnect();
  });
});
