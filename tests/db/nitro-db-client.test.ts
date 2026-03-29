import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { NitroDbConfig, ILogger, IEmbeddingService, RagSearchParams } from '../../src/db/interfaces.js';
import { NitroDbClient } from '../../src/db/nitro-db-client.js';
import { RagQueryResultSchema } from '../../src/shared/schemas/index.js';

/**
 * Mock logger that captures structured log output for assertion.
 * Matches the updated ILogger interface (context, traceId, message, data).
 */
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

/**
 * Mock embedding service that returns deterministic 768-dim vectors.
 */
function createMockEmbeddingService(): IEmbeddingService {
  const mockVector = Array.from({ length: 768 }, (_, i) => i * 0.001);
  return {
    embed: vi.fn().mockResolvedValue(mockVector),
    embedBatch: vi.fn().mockResolvedValue([mockVector]),
    getDimensions: vi.fn().mockReturnValue(768),
  };
}

/** Default test config targeting Node A. */
const TEST_CONFIG: NitroDbConfig = {
  host: '192.168.0.50',
  port: 5432,
  database: 'asp_gm_agent',
  user: 'asp_agent',
  password: 'test_password',
  connectionTimeoutMs: 5000,
  queryTimeoutMs: 10000,
  maxPoolSize: 5,
};

describe('NitroDbClient', () => {
  let logger: ReturnType<typeof createMockLogger>;
  let embeddingService: IEmbeddingService;
  let client: NitroDbClient;

  beforeEach(() => {
    logger = createMockLogger();
    embeddingService = createMockEmbeddingService();
    client = new NitroDbClient(TEST_CONFIG, logger, embeddingService);
  });

  afterEach(async () => {
    if (client.isConnected()) {
      await client.disconnect();
    }
  });

  describe('construction', () => {
    it('should create an instance with valid config', () => {
      expect(client).toBeInstanceOf(NitroDbClient);
    });

    it('should not be connected after construction', () => {
      expect(client.isConnected()).toBe(false);
    });

    it('should throw on invalid config (missing host)', () => {
      const badConfig = { ...TEST_CONFIG, host: '' };
      expect(() => new NitroDbClient(badConfig, logger, embeddingService)).toThrow();
    });

    it('should throw on invalid config (port out of range)', () => {
      const badConfig = { ...TEST_CONFIG, port: 99999 };
      expect(() => new NitroDbClient(badConfig, logger, embeddingService)).toThrow();
    });

    it('should throw on invalid config (negative timeout)', () => {
      const badConfig = { ...TEST_CONFIG, connectionTimeoutMs: -1 };
      expect(() => new NitroDbClient(badConfig, logger, embeddingService)).toThrow();
    });

    it('should throw on zero timeout (AbortSignal.timeout(0) fires immediately)', () => {
      const badConfig = { ...TEST_CONFIG, connectionTimeoutMs: 0 };
      expect(() => new NitroDbClient(badConfig, logger, embeddingService)).toThrow();
    });
  });

  describe('ragSearch parameter validation', () => {
    it('should reject empty query string', async () => {
      const params: RagSearchParams = {
        query: '',
        namespace: 'core_rules',
        topK: 5,
        similarityThreshold: 0.7,
      };
      await expect(client.ragSearch(params)).rejects.toThrow('query');
    });

    it('should reject invalid namespace', async () => {
      const params = {
        query: 'combat damage calculation',
        namespace: 'invalid_namespace' as 'core_rules',
        topK: 5,
        similarityThreshold: 0.7,
      };
      await expect(client.ragSearch(params)).rejects.toThrow('namespace');
    });

    it('should reject topK less than 1', async () => {
      const params: RagSearchParams = {
        query: 'combat damage',
        namespace: 'core_rules',
        topK: 0,
        similarityThreshold: 0.7,
      };
      await expect(client.ragSearch(params)).rejects.toThrow('topK');
    });

    it('should reject similarityThreshold outside 0-1 range', async () => {
      const params: RagSearchParams = {
        query: 'combat damage',
        namespace: 'core_rules',
        topK: 5,
        similarityThreshold: 1.5,
      };
      await expect(client.ragSearch(params)).rejects.toThrow('similarityThreshold');
    });
  });

  describe('ragSearch response validation (zero-trust)', () => {
    it('should validate Node A responses through Zod schema', () => {
      const validResponse = {
        query: 'test query',
        matches: [
          {
            content: 'Some rule text',
            namespace: 'core_rules',
            contextType: 'mechanic',
            capabilityReq: 'none',
            sourceFile: 'core_rulebook.pdf',
            sourceRef: 'CRB-p10',
            sectionHeading: 'Combat',
            score: 0.92,
            pageStart: 10,
            pageEnd: 11,
          },
        ],
      };
      const result = RagQueryResultSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
    });

    it('should reject malformed Node A responses', () => {
      const malformedResponse = {
        query: 'test',
        matches: [
          {
            content: 'text',
            namespace: 'INVALID',
            sourceFile: 'file.pdf',
            sectionHeading: 'heading',
            score: 'not a number',
            pageStart: -1,
            pageEnd: 5,
          },
        ],
      };
      const result = RagQueryResultSchema.safeParse(malformedResponse);
      expect(result.success).toBe(false);
    });

    it('should reject score outside 0-1 range', () => {
      const outOfBoundsScore = {
        query: 'test',
        matches: [
          {
            content: 'text',
            namespace: 'core_rules',
            sourceFile: 'file.pdf',
            sectionHeading: 'heading',
            score: 1.5,
            pageStart: 1,
            pageEnd: 2,
          },
        ],
      };
      const result = RagQueryResultSchema.safeParse(outOfBoundsScore);
      expect(result.success).toBe(false);
    });
  });

  describe('connection lifecycle', () => {
    it('should throw on ragSearch when not connected', async () => {
      const params: RagSearchParams = {
        query: 'test query',
        namespace: 'core_rules',
        topK: 5,
        similarityThreshold: 0.7,
      };
      await expect(client.ragSearch(params)).rejects.toThrow('not connected');
    });

    it('should throw on disconnect when not connected', async () => {
      await expect(client.disconnect()).rejects.toThrow();
    });
  });

  describe('healthCheck', () => {
    it('should return connected:false when not connected', async () => {
      const result = await client.healthCheck();
      expect(result.connected).toBe(false);
      expect(result.latencyMs).toBe(0);
      expect(result.pgvectorInstalled).toBe(false);
      expect(result.timestamp).toBeDefined();
    });

    it('should return an ISO timestamp string', async () => {
      const result = await client.healthCheck();
      expect(() => new Date(result.timestamp)).not.toThrow();
      expect(new Date(result.timestamp).getTime()).not.toBeNaN();
    });
  });

  describe('structured logging', () => {
    it('should log on construction with a traceId', () => {
      const freshLogger = createMockLogger();
      new NitroDbClient(TEST_CONFIG, freshLogger, embeddingService);
      expect(freshLogger.calls.length).toBeGreaterThan(0);
      expect(freshLogger.calls[0]!.severity).toBe('INFO');
      expect(freshLogger.calls[0]!.traceId).toBeDefined();
      expect(freshLogger.calls[0]!.traceId.length).toBeGreaterThan(0);
    });
  });
});
