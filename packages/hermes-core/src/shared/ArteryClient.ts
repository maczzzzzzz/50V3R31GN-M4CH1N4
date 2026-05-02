import { logger } from './logger.js';

export interface ArteryRequest {
  model: string;
  messages: Array<{ role: string; content: string }>;
  max_tokens?: number;
  temperature?: number;
  response_format?: { type: 'json_object' | 'text' };
  top_k?: number;
  top_p?: number;
}

export interface ArteryResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

/**
 * ◈ ArteryClient
 *
 * Unified networking client for the Sovereign OS Quaternary Mesh.
 * Eliminates direct fetch bypasses and enforces Artery routing.
 */
export class ArteryClient {
  private static arteryUrl = process.env['HERMES_ROUTER_URL'] ?? 'http://127.0.0.1:7341';

  public static async chat(request: ArteryRequest, traceId: string): Promise<string> {
    logger.info('ArteryClient', traceId, `Dispatching request to Artery: ${request.model}`);

    try {
      const response = await fetch(`${this.arteryUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`Artery HTTP ${response.status}: ${response.statusText}`);
      }

      const data = (await response.json()) as ArteryResponse;
      return data.choices[0]?.message?.content || '';
    } catch (err) {
      logger.error('ArteryClient', traceId, `Artery communication failure: ${(err as Error).message}`);
      throw err;
    }
  }

  public static async getVisionOCR(traceId: string): Promise<string> {
    // Standardised Vision/OCR entry point
    const visionUrl = process.env['VISION_SERVICE_URL'] ?? 'http://127.0.0.1:7340';
    logger.info('ArteryClient', traceId, 'Requesting live-frame OCR...');

    try {
      const res = await fetch(`${visionUrl}/api/observer/live-frame-ocr`);
      if (!res.ok) throw new Error(`Vision HTTP ${res.status}`);
      const data = await res.json() as { text: string };
      return data.text || '';
    } catch (err) {
      logger.warn('ArteryClient', traceId, `Vision/OCR offline: ${(err as Error).message}`);
      return '';
    }
  }
}
