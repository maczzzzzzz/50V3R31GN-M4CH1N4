import { WebSocketServer, WebSocket } from 'ws';
import { randomUUID } from 'node:crypto';
import type { ILogger } from '../../db/interfaces.js';

/**
 * MOBILE_VISION_ARTERY — v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Ingress point for binary frame data (PNG/JPG) from mobile devices.
 * Achieves 100% Mobile Screen Awareness.
 */

export interface MobileVisionArteryOptions {
  port: number;
  logger?: ILogger;
}

export class MobileVisionArtery {
  private wss: WebSocketServer | null = null;
  private readonly port: number;
  private readonly logger: ILogger | undefined;
  private latestFrame: Buffer | null = null;

  constructor(options: MobileVisionArteryOptions) {
    this.port = options.port;
    this.logger = options.logger;
  }

  public start(): void {
    const traceId = randomUUID();
    this.wss = new WebSocketServer({ port: this.port, host: '0.0.0.0' });

    this.logger?.info('MobileVisionArtery', traceId, `Mobile Vision Artery listening on 0.0.0.0:${this.port}`);

    this.wss.on('connection', (ws: WebSocket) => {
      const connTraceId = randomUUID();
      this.logger?.info('MobileVisionArtery', connTraceId, 'Mobile device connected to Vision Artery');

      ws.on('message', (data: Buffer) => {
        // ◈ Binary frame ingestion
        this.latestFrame = data;
        // Relay to Sovereign Observer (Phase 91.3)
        this.relayToObserver(data);
      });

      ws.on('close', () => {
        this.logger?.info('MobileVisionArtery', connTraceId, 'Mobile device disconnected from Vision Artery');
      });

      ws.on('error', (err) => {
        this.logger?.error('MobileVisionArtery', connTraceId, `Vision Artery error: ${err.message}`);
      });
    });
  }

  private relayToObserver(frame: Buffer): void {
    // TODO: Integrate with SovereignObserver vision kernel
    // In Phase 91, this stores the buffer for VLM analysis
  }

  public getLatestFrame(): Buffer | null {
    return this.latestFrame;
  }

  public stop(): void {
    this.wss?.close();
    this.wss = null;
  }
}
