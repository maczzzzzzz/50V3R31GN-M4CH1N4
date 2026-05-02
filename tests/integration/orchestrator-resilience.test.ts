import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { VisualMonitorService } from '../../packages/hermes-core/src/core/visual-monitor-service.js';
import { createServer } from 'http';
import WebSocket, { WebSocketServer } from 'ws';
import { Server } from 'http';

describe('Orchestrator Resilience (CDP & WS)', () => {
  let mockCdpServer: Server;
  let mockWss: WebSocketServer;
  let cdpConnected = false;
  let wsConnections = 0;

  beforeAll(async () => {
    // 1. Setup a Mock CDP Server that drops connections after 100ms
    mockCdpServer = createServer((req, res) => {
      if (req.url === '/json' || req.url === '/json/list') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify([{
          id: 'mock-id',
          title: 'Foundry Virtual Tabletop',
          type: 'page',
          url: 'http://localhost:30000',
          webSocketDebuggerUrl: 'ws://127.0.0.1:9999/devtools/page/mock-id'
        }]));
      } else {
        res.writeHead(404);
        res.end();
      }
    });

    mockWss = new WebSocketServer({ server: mockCdpServer });

    mockWss.on('connection', (ws) => {
      wsConnections++;
      cdpConnected = true;
      
      // Send a single fake Runtime.evaluate response just in case
      ws.on('message', (msg) => {
        const req = JSON.parse(msg.toString());
        if (req.method === 'Runtime.evaluate') {
          // Simulate severe lag then drop
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.terminate(); // Ungraceful disconnect
              cdpConnected = false;
            }
          }, 150);
        }
      });
    });

    await new Promise<void>((resolve) => mockCdpServer.listen(9999, '0.0.0.0', resolve));
  });

  afterAll((done) => {
    mockWss.close(() => {
      mockCdpServer.close(done);
    });
  });

  it.skip('VisualMonitorService should survive an ungraceful CDP disconnect mid-evaluation', async () => {
    // We mock the oracle dependency
    const mockOracle = {
      appendVisionHistory: vi.fn(),
      getDb: vi.fn(),
    } as any;

    const service = new VisualMonitorService({
      debugPort: 9999,
      oracle: mockOracle
    });

    // Connect to our chaotic mock CDP
    await expect(service.connect()).resolves.not.toThrow();
    
    // Request a screenshot, which triggers Runtime.evaluate and then our mock drops the WS
    // The service should catch the error and not crash the process.
    try {
      await service.captureSceneContext();
    } catch (e: any) {
      expect(e.message).toMatch(/websocket|closed|disconnected/i);
    }
    
    // We verify the process did not crash by reaching here
    expect(cdpConnected).toBe(false);
    expect(wsConnections).toBe(1);
  });
});
