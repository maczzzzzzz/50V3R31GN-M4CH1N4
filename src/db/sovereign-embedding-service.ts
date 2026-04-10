import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { EmbeddingServiceConfig, IEmbeddingService, ILogger } from './interfaces.js';

/** Zod schema for validating EmbeddingServiceConfig at construction time. */
const EmbeddingServiceConfigSchema = z.object({
  baseUrl: z.string().min(1, 'baseUrl must not be empty'),
  model: z.string().min(1, 'model must not be empty'),
  timeoutMs: z.number().int().min(1, 'timeoutMs must be >= 1'),
});

/** Zod schema for validating OpenAI-compatible embedding responses (Zero-Trust). */
const OpenAIEmbeddingResponseSchema = z.object({
  object: z.literal('list'),
  data: z.array(z.object({
    object: z.literal('embedding'),
    embedding: z.array(z.number()),
    index: z.number(),
  })).min(1, 'data array must not be empty'),
  model: z.string(),
  usage: z.object({
    prompt_tokens: z.number().optional(),
    total_tokens: z.number().optional(),
  }).optional(),
});

/**
 * SovereignEmbeddingService — Converts text to vectors via llama-server's OpenAI-compatible endpoint.
 *
 * Targets the /v1/embeddings endpoint.
 * Produces L2-normalized vectors for cosine similarity search.
 */
export class SovereignEmbeddingService implements IEmbeddingService {
  private readonly config: EmbeddingServiceConfig;
  private readonly logger: ILogger;
  private detectedDimensions: number | null = null;

  constructor(config: EmbeddingServiceConfig, logger: ILogger) {
    const parsed = EmbeddingServiceConfigSchema.safeParse(config);
    if (!parsed.success) {
      const firstIssue = parsed.error.issues[0];
      throw new Error(`EmbeddingService config validation failed: ${firstIssue?.message ?? 'unknown error'}`);
    }

    this.config = Object.freeze({ ...parsed.data });
    this.logger = logger;

    const initTraceId = randomUUID();
    this.logger.info('SovereignEmbeddingService', initTraceId, `Initialized for ${this.config.baseUrl} with model ${this.config.model}`, {
      baseUrl: this.config.baseUrl,
      model: this.config.model,
    });
  }

  /**
   * Convert a single text string into a float vector via llama-server /v1/embeddings.
   */
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('embed() failed: text must not be empty');
    }

    const traceId = randomUUID();
    const result = await this.callLlamaEmbed(text, traceId);
    const vector = result.data[0]!.embedding;

    if (this.detectedDimensions === null) {
      this.detectedDimensions = vector.length;
      this.logger.info('SovereignEmbeddingService', traceId, `Detected embedding dimensions: ${vector.length}`, {
        dimensions: vector.length,
      });
    }

    return vector;
  }

  /**
   * Convert multiple text strings into float vectors in a single call.
   */
  async embedBatch(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) {
      throw new Error('embedBatch() failed: texts array must not be empty');
    }

    for (let i = 0; i < texts.length; i++) {
      if (!texts[i] || texts[i]!.trim().length === 0) {
        throw new Error(`embedBatch() failed: text at index ${i} must not be empty`);
      }
    }

    const traceId = randomUUID();
    const result = await this.callLlamaEmbed(texts, traceId);

    if (result.data.length !== texts.length) {
      throw new Error(
        `embedBatch() count mismatch: sent ${texts.length} inputs but received ${result.data.length} embeddings`
      );
    }

    // Sort by index to ensure order matches input
    const sortedEmbeddings = [...result.data]
      .sort((a, b) => a.index - b.index)
      .map(d => d.embedding);

    if (this.detectedDimensions === null && sortedEmbeddings.length > 0) {
      this.detectedDimensions = sortedEmbeddings[0]!.length;
      this.logger.info('SovereignEmbeddingService', traceId, `Detected embedding dimensions: ${this.detectedDimensions}`, {
        dimensions: this.detectedDimensions,
      });
    }

    return sortedEmbeddings;
  }

  getDimensions(): number | null {
    return this.detectedDimensions;
  }

  /**
   * Internal: calls llama-server POST /v1/embeddings and Zod-validates the response.
   */
  private async callLlamaEmbed(
    input: string | string[],
    traceId: string,
  ): Promise<z.infer<typeof OpenAIEmbeddingResponseSchema>> {
    const url = `${this.config.baseUrl}/embeddings`;
    const payload = {
      model: this.config.model,
      input,
    };

    this.logger.debug('SovereignEmbeddingService', traceId, `POST ${url}`, {
      model: this.config.model,
      inputCount: Array.isArray(input) ? input.length : 1,
    });

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error('SovereignEmbeddingService', traceId, `Network error calling llama-server: ${message}`, {
        url,
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error(`SovereignEmbeddingService network error: ${message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unable to read response body');
      this.logger.error('SovereignEmbeddingService', traceId, `llama-server returned HTTP ${response.status}`, {
        status: response.status,
        body: errorBody,
      });
      throw new Error(`llama-server embed failed with HTTP ${response.status}: ${errorBody}`);
    }

    const rawJson: unknown = await response.json();

    const parsed = OpenAIEmbeddingResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      this.logger.error('SovereignEmbeddingService', traceId, 'llama-server response failed Zod validation', {
        errors: parsed.error.issues.map(i => i.message),
        rawKeys: typeof rawJson === 'object' && rawJson !== null ? Object.keys(rawJson) : [],
      });
      throw new Error(`llama-server embed response failed schema validation: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
    }

    return parsed.data;
  }
}
