/**
 * win-proxy.cjs — WSL2→Windows CDP bridge
 *
 * Foundry VTT's Electron build validates the HTTP Host header and silently
 * drops connections where Host !== 'localhost' or '127.0.0.1'. Because WSL2
 * reaches Windows via a virtual NIC (172.x.x.x), the raw TCP pipe approach
 * causes Electron to close the connection immediately after handshake.
 *
 * Fix: this proxy buffers the first HTTP request, rewrites the Host header
 * to 'localhost:9222', then streams the rest bidirectionally. WebSocket
 * upgrade frames are handled the same way (Host is in the Upgrade request).
 */
const net = require('net');
const fs = require('fs');

const LOCAL_PORT = 9222;
const PROXY_PORT = 9223;

async function getWindowsHost() {
  if (process.env.WINDOWS_HOST_IP) return process.env.WINDOWS_HOST_IP;
  
  const candidates = new Set();
  try {
    const rc = fs.readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of rc.split('\n')) {
      if (line.trim().startsWith('nameserver ')) candidates.add(line.trim().split(' ')[1]);
    }
  } catch {}
  
  try {
    const ip = require('child_process').execSync("ip route | grep default | awk '{print $3}'").toString().trim();
    if (ip) candidates.add(ip);
  } catch {}

  // Manual list of likely IPs in WSL subnet
  const baseIp = '172.26.208';
  for (let i = 1; i < 5; i++) candidates.add(`${baseIp}.${i}`);
  candidates.add('172.26.211.1');
  candidates.add('172.26.211.129');

  console.log(`[win-proxy] Testing candidates: ${Array.from(candidates).join(', ')}`);
  for (const host of candidates) {
    for (const port of [30000, 9222]) {
      try {
        await new Promise((resolve, reject) => {
          const s = net.connect(port, host);
          s.setTimeout(200);
          s.on('connect', () => { s.destroy(); resolve(); });
          s.on('error', reject);
          s.on('timeout', () => { s.destroy(); reject(new Error('timeout')); });
        });
        console.log(`[win-proxy] FOUND WINDOWS HOST at ${host} (via port ${port})`);
        return host;
      } catch (e) {
        // continue
      }
    }
  }
  return '172.26.208.1';
}

async function main() {
  console.log('[win-proxy] Booting main (on Windows host)...');
  const WINDOWS_HOST = '127.0.0.1';
  console.log(`[win-proxy] Targeted Windows Host: ${WINDOWS_HOST}`);
  const server = net.createServer((clientSocket) => {
    let headerRewritten = false;
    let buffer = Buffer.alloc(0);

    const targetSocket = net.connect(LOCAL_PORT, WINDOWS_HOST, () => {
      console.log(`[win-proxy] Connected to target ${WINDOWS_HOST}:${LOCAL_PORT}`);
      targetSocket.setTimeout(0); // clear idle timeout — only applies during connect phase
    });

    targetSocket.setTimeout(2000); // connection establishment timeout only

    targetSocket.on('error', (err) => {
      console.error('[win-proxy] Target error:', err.message);
      clientSocket.destroy();
    });

    targetSocket.on('timeout', () => {
      console.error('[win-proxy] Target timeout');
      targetSocket.destroy();
      clientSocket.destroy();
    });

  clientSocket.on('error', (err) => {
    console.error('[win-proxy] Client error:', err.message);
    targetSocket.destroy();
  });

  targetSocket.on('data', (data) => clientSocket.write(data));
  targetSocket.on('end', () => clientSocket.end());
  clientSocket.on('end', () => targetSocket.end());

  clientSocket.on('data', (chunk) => {
    if (headerRewritten) {
      targetSocket.write(chunk);
      return;
    }

    buffer = Buffer.concat([buffer, chunk]);
    const headerEnd = buffer.indexOf('\r\n\r\n');
    if (headerEnd === -1) return;

    headerRewritten = true;
    let headers = buffer.slice(0, headerEnd).toString('utf8');
    const body = buffer.slice(headerEnd);

    // Replace Host header
    headers = headers.replace(/^Host: .+/im, `Host: localhost:${LOCAL_PORT}`);

    targetSocket.write(Buffer.from(headers, 'utf8'));
    targetSocket.write(body);
  });

  });

  server.listen(PROXY_PORT, '0.0.0.0', () => {
  console.log(`[win-proxy] Listening on 0.0.0.0:${PROXY_PORT} → ${WINDOWS_HOST}:${LOCAL_PORT} (Host-rewrite enabled)`);
  });
  }

  main().catch(err => {
  console.error('[win-proxy] Fatal:', err.message);
  process.exit(1);
  });

