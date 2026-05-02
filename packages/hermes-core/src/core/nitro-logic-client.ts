import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import type {
  INitroLogicClient,
  ILogger,
} from './interfaces.js';

export interface NitroLogicConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
  seed: number;
  aaakPrefix?: string;
}

const ChatCompletionResponseSchema = z.object({
  choices: z.array(
    z.object({
      message: z.object({
        role: z.string(),
        content: z.string(),
      }),
    }),
  ).min(1),
});

const CONTEXT = 'NitroLogicClient';

/**
 * ◈ NITRO_LOGIC_CLIENT : Clean BASE
 *
 * Generic reasoning bridge to Node A (Open-Reasoner).
 */
export class NitroLogicClient implements INitroLogicClient {
  private readonly config: NitroLogicConfig;
  private readonly logger?: ILogger | undefined;

  constructor(config: NitroLogicConfig, logger?: ILogger) {
    this.config = config;
    this.logger = logger;
  }

  async isHealthy(): Promise<boolean> {
    const url = `${this.config.baseUrl}/models`;
    try {
      const response = await fetch(url, {
        method: 'GET',
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info(CONTEXT, traceId, `Graceful shutdown complete for ${this.config.model}`);
  }

  /**
   * Performs a generic reasoning task.
   */
  async reason(prompt: string, context: string): Promise<{ answer: string; reasoning: string }> {
    const traceId = randomUUID();
    const url = `${this.config.baseUrl}/chat/completions`;

    const effectiveSystem = this.config.aaakPrefix
      ? `${this.config.aaakPrefix}\n${prompt}`
      : prompt;

    const payload = {
      model: this.config.model,
      messages: [
        { role: 'system', content: effectiveSystem },
        { role: 'user', content: context },
      ],
      temperature: 0.0,
      response_format: { type: 'json_object' },
      seed: this.config.seed,
      ...(this.config.aaakPrefix ? { cache_prompt: true } : {}),
    };

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Node A error: ${response.status}`);
      }

      const rawJson = await response.json();
      const envelope = ChatCompletionResponseSchema.parse(rawJson);
      const content = envelope.choices[0]!.message.content;
      
      const parsed = JSON.parse(content);
      return {
        answer: parsed.answer || content,
        reasoning: parsed.reasoning || "No reasoning extracted.",
      };
    } catch (err) {
      this.logger?.error(CONTEXT, traceId, `Reasoning failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
