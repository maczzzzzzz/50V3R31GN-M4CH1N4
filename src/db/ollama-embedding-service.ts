import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type { EmbeddingServiceConfig, IEmbeddingService, ILogger } from './interfaces.js';

/** Zod schema for validating EmbeddingServiceConfig at construction time. */
const EmbeddingServiceConfigSchema = z.object({
  baseUrl: z.string().min(1, 'baseUrl must not be empty'),
  model: z.string().min(1, 'model must not be empty'),
  timeoutMs: z.number().int().min(1, 'timeoutMs must be >= 1'),
});

/** Zod schema for validating Ollama /api/embed responses (Zero-Trust). */
const OllamaEmbedResponseSchema = z.object({
  model: z.string().optional(),
  embeddings: z.array(z.array(z.number())).min(1, 'embeddings array must not be empty'),
  total_duration: z.number().optional(),
  load_duration: z.number().optional(),
  prompt_eval_count: z.number().optional(),
});

/**
 * OllamaEmbeddingService — Converts text to vectors via Node B's local Ollama instance.
 *
 * Targets the nomic-embed-text model at http://localhost:11434/api/embed.
 * Produces 768-dimension L2-normalized vectors for pgvector cosine similarity search.
 *
 * All Ollama responses are validated through Zod before returning to the caller.
 */
export class OllamaEmbeddingService implements IEmbeddingService {
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
    this.logger.info('OllamaEmbeddingService', initTraceId, `Initialized for ${this.config.baseUrl} with model ${this.config.model}`, {
      baseUrl: this.config.baseUrl,
      model: this.config.model,
    });
  }

  /**
   * Convert a single text string into a float vector via Ollama /api/embed.
   *
   * @param text - The text to embed. Must not be empty.
   * @returns A number array representing the embedding vector.
   * @throws On empty input, network failure, or malformed Ollama response.
   */
  async embed(text: string): Promise<number[]> {
    if (!text || text.trim().length === 0) {
      throw new Error('embed() failed: text must not be empty');
    }

    const traceId = randomUUID();
    const result = await this.callOllamaEmbed(text, traceId);
    const vector = result.embeddings[0]!;

    if (this.detectedDimensions === null) {
      this.detectedDimensions = vector.length;
      this.logger.info('OllamaEmbeddingService', traceId, `Detected embedding dimensions: ${vector.length}`, {
        dimensions: vector.length,
      });
    }

    return vector;
  }

  /**
   * Convert multiple text strings into float vectors in a single Ollama call.
   *
   * @param texts - Array of texts to embed. Must not be empty; no element may be empty.
   * @returns Array of number arrays, one vector per input text.
   * @throws On empty input, count mismatch, network failure, or malformed response.
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
    const result = await this.callOllamaEmbed(texts, traceId);

    if (result.embeddings.length !== texts.length) {
      throw new Error(
        `embedBatch() count mismatch: sent ${texts.length} inputs but received ${result.embeddings.length} embeddings`
      );
    }

    if (this.detectedDimensions === null && result.embeddings.length > 0) {
      this.detectedDimensions = result.embeddings[0]!.length;
      this.logger.info('OllamaEmbeddingService', traceId, `Detected embedding dimensions: ${this.detectedDimensions}`, {
        dimensions: this.detectedDimensions,
      });
    }

    return result.embeddings;
  }

  /**
   * Returns the dimensionality detected from the first successful embedding call.
   * Returns null if no embedding has been generated yet.
   */
  getDimensions(): number | null {
    return this.detectedDimensions;
  }

  /**
   * Internal: calls Ollama POST /api/embed and Zod-validates the response.
   */
  private async callOllamaEmbed(
    input: string | string[],
    traceId: string,
  ): Promise<z.infer<typeof OllamaEmbedResponseSchema>> {
    const url = `${this.config.baseUrl}/api/embed`;
    const payload = {
      model: this.config.model,
      input,
    };

    this.logger.debug('OllamaEmbeddingService', traceId, `POST ${url}`, {
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
      this.logger.error('OllamaEmbeddingService', traceId, `Network error calling Ollama: ${message}`, {
        url,
        stack: err instanceof Error ? err.stack : undefined,
      });
      throw new Error(`OllamaEmbeddingService network error: ${message}`);
    }

    if (!response.ok) {
      const errorBody = await response.text().catch(() => 'unable to read response body');
      this.logger.error('OllamaEmbeddingService', traceId, `Ollama returned HTTP ${response.status}`, {
        status: response.status,
        body: errorBody,
      });
      throw new Error(`Ollama embed failed with HTTP ${response.status}: ${errorBody}`);
    }

    const rawJson: unknown = await response.json();

    // Zero-Trust: validate Ollama response through Zod
    const parsed = OllamaEmbedResponseSchema.safeParse(rawJson);
    if (!parsed.success) {
      this.logger.error('OllamaEmbeddingService', traceId, 'Ollama response failed Zod validation', {
        errors: parsed.error.issues.map(i => i.message),
        rawKeys: typeof rawJson === 'object' && rawJson !== null ? Object.keys(rawJson) : [],
      });
      throw new Error(`Ollama embed response failed schema validation: ${parsed.error.issues[0]?.message ?? 'unknown'}`);
    }

    this.logger.debug('OllamaEmbeddingService', traceId, 'Embedding generated successfully', {
      embeddingCount: parsed.data.embeddings.length,
      dimensions: parsed.data.embeddings[0]?.length,
      totalDurationNs: parsed.data.total_duration,
    });

    return parsed.data;
  }
}
