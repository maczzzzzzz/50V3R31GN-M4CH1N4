/**
 * wsl-cdp-bridge.cjs
 * WSL-side HTTP/WebSocket proxy: listens on 127.0.0.1:9224,
 * rewrites Host header to 'localhost:9222', forwards to win-proxy at WINDOWS_HOST:9223.
 * Playwright connects to http://127.0.0.1:9224 and gets transparent CDP access to Foundry.
 */
const net = require('net');
const fs = require('fs');

function getWindowsHost() {
  try {
    const rc = fs.readFileSync('/etc/resolv.conf', 'utf8');
    for (const line of rc.split('\n')) {
      if (line.trim().startsWith('nameserver ')) return line.trim().split(' ')[1];
    }
  } catch {}
  return '172.26.208.1';
}

const WINDOWS_HOST = process.env.WINDOWS_HOST_IP || getWindowsHost();
const WIN_PORT = 9223;
const LOCAL_PORT = 9223;

const server = net.createServer((client) => {
  let buf = Buffer.alloc(0);
  let spliced = false;

  const target = net.connect(WIN_PORT, WINDOWS_HOST);

  target.on('error', (e) => { console.error('[wsl-cdp] target err:', e.message); client.destroy(); });
  client.on('error', (e) => { console.error('[wsl-cdp] client err:', e.message); target.destroy(); });
  target.on('data', (d) => client.write(d));
  target.on('end', () => client.end());
  client.on('end', () => target.end());

  client.on('data', (chunk) => {
    if (spliced) { target.write(chunk); return; }
    buf = Buffer.concat([buf, chunk]);
    const sep = buf.indexOf('\r\n\r\n');
    if (sep === -1) return; // still buffering headers

    spliced = true;
    let headers = buf.slice(0, sep).toString('utf8');
    const rest = buf.slice(sep); // starts with \r\n\r\n

    // Rewrite Host header
    headers = headers.replace(/^Host: [^\r\n]+/im, 'Host: localhost:9222');

    target.write(Buffer.from(headers + rest.toString('binary'), 'binary'));
  });
});

server.listen(LOCAL_PORT, '127.0.0.1', () => {
  console.log(`[wsl-cdp] listening 127.0.0.1:${LOCAL_PORT} → ${WINDOWS_HOST}:${WIN_PORT} (Host-rewrite active)`);
});
