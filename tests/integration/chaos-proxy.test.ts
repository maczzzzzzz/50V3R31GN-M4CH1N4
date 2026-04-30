import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { createConnection } from 'net';
import { join } from 'path';
import { tmpdir } from 'os';
import { rmSync, existsSync } from 'fs';

const SOCKET_PATH = join(tmpdir(), `crush-chaos-${Date.now()}.sock`);

describe('Crush Proxy Chaos & Resilience Test', () => {
  let proxyProcess: ChildProcess;

  beforeAll(async () => {
    if (existsSync(SOCKET_PATH)) rmSync(SOCKET_PATH);

    // Start the Crush Proxy with a custom socket path
    proxyProcess = spawn('go', ['run', '.', 'proxy'], {
      cwd: join(__dirname, '../../crush'),
      env: {
        ...process.env,
        CLAWLINK_SOCK: SOCKET_PATH,
        NODE_A_HOST: '127.0.0.1:9999'
      }
    });

    proxyProcess.stderr?.on('data', (data) => console.error(`[PROXY ERR] ${data.toString()}`));
    proxyProcess.stdout?.on('data', (data) => console.log(`[PROXY OUT] ${data.toString()}`));

    // Wait for the socket to be created
    await new Promise<void>((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(() => {
        if (existsSync(SOCKET_PATH)) {
          clearInterval(interval);
          resolve();
        }
        attempts++;
        if (attempts > 150) {
          clearInterval(interval);
          reject(new Error('Proxy socket never created'));
        }
      }, 100);
      
      proxyProcess.on('exit', (code) => {
        clearInterval(interval);
        reject(new Error(`Proxy exited prematurely with code ${code}`));
      });
    });
  }, 30000);

  afterAll(() => {
    if (proxyProcess) proxyProcess.kill('SIGKILL');
    if (existsSync(SOCKET_PATH)) rmSync(SOCKET_PATH);
  });

  const sendPayload = (payload: string | Buffer): Promise<void> => {
    return new Promise((resolve, reject) => {
      const client = createConnection(SOCKET_PATH, () => {
        client.write(payload);
        client.end();
      });
      client.on('error', reject);
      client.on('close', resolve);
    });
  };

  it('should survive being sent completely malformed non-JSON data', async () => {
    await expect(sendPayload('THIS IS NOT JSON!! JUST GARBAGE BYTES!!!')).resolves.not.toThrow();
    // Verify it's still alive
    expect(proxyProcess.exitCode).toBeNull();
  });

  it('should survive being sent partial JSON', async () => {
    await expect(sendPayload('{"type": "proposal", "payload": "')).resolves.not.toThrow();
    expect(proxyProcess.exitCode).toBeNull();
  });

  it('should survive a massive 10MB payload', async () => {
    const hugePayload = '{"type": "chat", "payload": "' + 'A'.repeat(10 * 1024 * 1024) + '"}';
    try {
      await sendPayload(hugePayload);
    } catch (e: any) {
      // It's fine if the proxy drops the connection (ECONNRESET/EPIPE) for exceeding the 4MB buffer.
      expect(['ECONNRESET', 'EPIPE']).toContain(e.code);
    }
    expect(proxyProcess.exitCode).toBeNull();
  });

  it('should survive immediate disconnects (0 bytes sent)', async () => {
    await expect(sendPayload(Buffer.from([]))).resolves.not.toThrow();
    expect(proxyProcess.exitCode).toBeNull();
  });

  it('should survive null bytes and weird encodings', async () => {
    const weirdPayload = Buffer.from([0x00, 0xFF, 0xFE, 0x00, 0x1A, 0x2B, 0x3C]);
    await expect(sendPayload(weirdPayload)).resolves.not.toThrow();
    expect(proxyProcess.exitCode).toBeNull();
  });
});
