/**
 * src/api/browser-bridge.ts — Phase 87: Vivaldi Ingress WebSocket Bridge
 *
 * Listens on port 3012. Receives ContextFrame packets from the Vivaldi
 * browser extension (sidecar-browser-extension) and routes them to the
 * Synapse Palace via the LangGraphOrchestrator ingest channel.
 *
 * Protocol (JSON over WebSocket):
 *   Browser → Bridge: { type: "CONTEXT_PUSH",  payload: ContextFrame }
 *   Browser → Bridge: { type: "PING" }
 *   Bridge → Browser: { type: "ACK",  trace_id: string }
 *   Bridge → Browser: { type: "PONG" }
 */

import { WebSocketServer, WebSocket } from 'ws';
import type { ILogger } from '../core/interfaces.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface ContextFrame {
  source:      string;   // "page_load" | "selection" | "popup_push" | "context_menu"
  url:         string;
  title:       string;
  description?: string;
  selection?:  string;
  timestamp:   string;
}

export type ContextHandler = (frame: ContextFrame, traceId: string) => void | Promise<void>;

// ── BrowserBridge ─────────────────────────────────────────────────────────────

const BRIDGE_PORT = 3012;

export class BrowserBridge {
  private wss: WebSocketServer | null = null;
  private handlers: ContextHandler[] = [];
  private clientCount = 0;

  constructor(private readonly logger: ILogger) {}

  /** Register a handler that receives incoming ContextFrame events. */
  onContext(handler: ContextHandler): void {
    this.handlers.push(handler);
  }

  start(port = BRIDGE_PORT): void {
    this.wss = new WebSocketServer({ port, host: '0.0.0.0' });

    this.wss.on('listening', () => {
      this.logger.info('BrowserBridge', 'boot', `Vivaldi Ingress bridge live on ws://0.0.0.0:${port}`);
    });

    this.wss.on('connection', (ws: WebSocket) => {
      this.clientCount++;
      this.logger.info('BrowserBridge', 'connect', `Extension connected (active: ${this.clientCount})`);

      ws.on('message', async (raw: Buffer) => {
        let msg: { type: string; payload?: ContextFrame };
        try {
          msg = JSON.parse(raw.toString());
        } catch {
          this.logger.warn('BrowserBridge', 'parse', 'Malformed message — ignored');
          return;
        }

        if (msg.type === 'PING') {
          ws.send(JSON.stringify({ type: 'PONG' }));
          return;
        }

        if (msg.type === 'CONTEXT_PUSH' && msg.payload) {
          const traceId = crypto.randomUUID();
          this.logger.info('BrowserBridge', traceId, `Context push — ${msg.payload.source} → ${msg.payload.url}`);

          for (const h of this.handlers) {
            try { await h(msg.payload, traceId); } catch (e) {
              this.logger.warn('BrowserBridge', traceId, `Handler error: ${(e as Error).message}`);
            }
          }

          ws.send(JSON.stringify({ type: 'ACK', trace_id: traceId }));
        }
      });

      ws.on('close', () => {
        this.clientCount--;
        this.logger.info('BrowserBridge', 'disconnect', `Extension disconnected (active: ${this.clientCount})`);
      });

      ws.on('error', (e: Error) => {
        this.logger.warn('BrowserBridge', 'error', e.message);
      });
    });
  }

  stop(): void {
    this.wss?.close();
  }
}
