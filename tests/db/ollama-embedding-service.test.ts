import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import type { ILogger, EmbeddingServiceConfig } from '../../src/db/interfaces.js';
import { OllamaEmbeddingService } from '../../src/db/ollama-embedding-service.js';

function createMockLogger(): ILogger & { calls: Array<{ severity: string; traceId: string; message: string }> } {
  const calls: Array<{ severity: string; traceId: string; message: string }> = [];
  return {
    calls,
    debug(_ctx: string, traceId: string, msg: string) { calls.push({ severity: 'DEBUG', traceId, message: msg }); },
    info(_ctx: string, traceId: string, msg: string) { calls.push({ severity: 'INFO', traceId, message: msg }); },
    warn(_ctx: string, traceId: string, msg: string) { calls.push({ severity: 'WARN', traceId, message: msg }); },
    error(_ctx: string, traceId: string, msg: string) { calls.push({ severity: 'ERROR', traceId, message: msg }); },
  };
}

const TEST_CONFIG: EmbeddingServiceConfig = {
  baseUrl: 'http://localhost:8080/v1',
  model: 'nomic-embed-text',
  timeoutMs: 10000,
};

function mockFetchResponse(body: unknown, ok = true, status = 200): Response {
  return {
    ok,
    status,
    statusText: ok ? 'OK' : 'Internal Server Error',
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(JSON.stringify(body)),
    headers: new Headers(),
    redirected: false,
    type: 'basic' as ResponseType,
    url: '',
    clone: () => mockFetchResponse(body, ok, status),
    body: null,
    bodyUsed: false,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    blob: () => Promise.resolve(new Blob()),
    formData: () => Promise.resolve(new FormData()),
    bytes: () => Promise.resolve(new Uint8Array()),
  } as Response;
}

describe('OllamaEmbeddingService', () => {
  let logger: ReturnType<typeof createMockLogger>;
  let service: OllamaEmbeddingService;
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    logger = createMockLogger();
    service = new OllamaEmbeddingService(TEST_CONFIG, logger);
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  describe('construction', () => {
    it('should create an instance with valid config', () => {
      expect(service).toBeInstanceOf(OllamaEmbeddingService);
    });
  });

  describe('embed', () => {
    it('should return a vector array on valid response', async () => {
      const mockVector = [0.01, -0.02, 0.03, 0.04];
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({
          object: 'list',
          model: 'nomic-embed-text',
          data: [{ object: 'embedding', index: 0, embedding: mockVector }],
        })
      );

      const result = await service.embed('test query');
      expect(result).toEqual(mockVector);
    });

    it('should call the correct llama-server endpoint', async () => {
      const mockFn = vi.fn().mockResolvedValue(
        mockFetchResponse({
          object: 'list',
          model: 'nomic-embed-text',
          data: [{ object: 'embedding', index: 0, embedding: [0.1] }],
        })
      );
      globalThis.fetch = mockFn;

      await service.embed('test');

      expect(mockFn).toHaveBeenCalledTimes(1);
      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:8080/v1/embeddings');
      expect(options.method).toBe('POST');
    });
  });

  describe('embedBatch', () => {
    it('should return multiple vectors for multiple inputs', async () => {
      const vecs = [[0.1, 0.2], [0.3, 0.4]];
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({
          object: 'list',
          model: 'nomic-embed-text',
          data: [
            { object: 'embedding', index: 0, embedding: vecs[0] },
            { object: 'embedding', index: 1, embedding: vecs[1] },
          ],
        })
      );

      const result = await service.embedBatch(['query1', 'query2']);
      expect(result).toEqual(vecs);
    });

    it('should ensure results are sorted by index', async () => {
      const vecs = [[0.1, 0.2], [0.3, 0.4]];
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({
          object: 'list',
          model: 'nomic-embed-text',
          data: [
            { object: 'embedding', index: 1, embedding: vecs[1] },
            { object: 'embedding', index: 0, embedding: vecs[0] },
          ],
        })
      );

      const result = await service.embedBatch(['query1', 'query2']);
      expect(result).toEqual(vecs);
    });
  });
});
