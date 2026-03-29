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
  baseUrl: 'http://localhost:11434',
  model: 'nomic-embed-text',
  timeoutMs: 10000,
};

/** Helper to create a mock fetch response. */
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
  };
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

    it('should throw on empty baseUrl', () => {
      expect(() => new OllamaEmbeddingService({ ...TEST_CONFIG, baseUrl: '' }, logger)).toThrow('baseUrl');
    });

    it('should throw on empty model name', () => {
      expect(() => new OllamaEmbeddingService({ ...TEST_CONFIG, model: '' }, logger)).toThrow('model');
    });

    it('should throw on negative timeout', () => {
      expect(() => new OllamaEmbeddingService({ ...TEST_CONFIG, timeoutMs: -1 }, logger)).toThrow('timeoutMs');
    });

    it('should log initialization with a traceId', () => {
      const freshLogger = createMockLogger();
      new OllamaEmbeddingService(TEST_CONFIG, freshLogger);
      expect(freshLogger.calls.length).toBeGreaterThan(0);
      expect(freshLogger.calls[0]!.severity).toBe('INFO');
      expect(freshLogger.calls[0]!.traceId).toBeDefined();
      expect(freshLogger.calls[0]!.traceId.length).toBeGreaterThan(0);
    });

    it('should throw on zero timeout', () => {
      expect(() => new OllamaEmbeddingService({ ...TEST_CONFIG, timeoutMs: 0 }, logger)).toThrow('timeoutMs');
    });
  });

  describe('embed', () => {
    it('should return a vector array on valid response', async () => {
      const mockVector = [0.01, -0.02, 0.03, 0.04];
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({
          model: 'nomic-embed-text',
          embeddings: [mockVector],
          total_duration: 5000000,
          load_duration: 1000000,
          prompt_eval_count: 5,
        })
      );

      const result = await service.embed('test query');
      expect(result).toEqual(mockVector);
      expect(result.length).toBe(4);
    });

    it('should call the correct Ollama endpoint', async () => {
      const mockFn = vi.fn().mockResolvedValue(
        mockFetchResponse({
          model: 'nomic-embed-text',
          embeddings: [[0.1]],
        })
      );
      globalThis.fetch = mockFn;

      await service.embed('test');

      expect(mockFn).toHaveBeenCalledTimes(1);
      const [url, options] = mockFn.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:11434/api/embed');
      expect(options.method).toBe('POST');

      const body = JSON.parse(options.body as string) as { model: string; input: string };
      expect(body.model).toBe('nomic-embed-text');
      expect(body.input).toBe('test');
    });

    it('should reject empty input text', async () => {
      await expect(service.embed('')).rejects.toThrow('text');
    });

    it('should throw on non-ok HTTP response', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({ error: 'model not found' }, false, 404)
      );

      await expect(service.embed('test')).rejects.toThrow();
    });

    it('should throw on malformed response (missing embeddings)', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({ model: 'nomic-embed-text' })
      );

      await expect(service.embed('test')).rejects.toThrow();
    });

    it('should throw on network failure', async () => {
      globalThis.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));

      await expect(service.embed('test')).rejects.toThrow('ECONNREFUSED');
    });

    it('should cache detected dimensions after first call', async () => {
      const vec768 = Array.from({ length: 768 }, (_, i) => i * 0.001);
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({ model: 'nomic-embed-text', embeddings: [vec768] })
      );

      expect(service.getDimensions()).toBeNull();
      await service.embed('test');
      expect(service.getDimensions()).toBe(768);
    });
  });

  describe('embedBatch', () => {
    it('should return multiple vectors for multiple inputs', async () => {
      const vecs = [[0.1, 0.2], [0.3, 0.4]];
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({ model: 'nomic-embed-text', embeddings: vecs })
      );

      const result = await service.embedBatch(['query1', 'query2']);
      expect(result).toEqual(vecs);
      expect(result.length).toBe(2);
    });

    it('should reject empty input array', async () => {
      await expect(service.embedBatch([])).rejects.toThrow();
    });

    it('should reject if any input string is empty', async () => {
      await expect(service.embedBatch(['valid', ''])).rejects.toThrow();
    });

    it('should throw if response embedding count mismatches input count', async () => {
      globalThis.fetch = vi.fn().mockResolvedValue(
        mockFetchResponse({ model: 'nomic-embed-text', embeddings: [[0.1]] })
      );

      await expect(service.embedBatch(['a', 'b'])).rejects.toThrow('mismatch');
    });
  });
});
