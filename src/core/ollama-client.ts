/**
 * src/core/ollama-client.ts
 *
 * OllamaClient — Node B Narrative Synthesis Client (Migrated to llama-server)
 *
 * Connects to Mistral-Nemo 12B via llama-server's OpenAI-compatible
 * /v1/chat/completions endpoint.
 */

import { z } from 'zod';
import type { IOllamaClient, OllamaConfig } from './interfaces.js';

// ── Zod config validation ─────────────────────────────────────────────────────

const OllamaConfigSchema = z.object({
  baseUrl: z.string().min(1, 'baseUrl must not be empty'),
  model: z.string().min(1, 'model must not be empty'),
  timeoutMs: z.number().int().positive('timeoutMs must be a positive integer'),
});

// ── Zod response schema ───────────────────────────────────────────────────────

const ChatMessageSchema = z.object({
  role: z.string(),
  content: z.string(),
});

const ChatChoiceSchema = z.object({
  index: z.number(),
  message: ChatMessageSchema,
  finish_reason: z.string().nullable().optional(),
});

const ChatCompletionResponseSchema = z.object({
  id: z.string().optional(),
  choices: z.array(ChatChoiceSchema).min(1),
});

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are a Game Master AI running a Cyberpunk RED campaign set in Night City.
Your job is to synthesise atmospheric, terse narrative prose based on mechanical outcomes.

Rules:
- Write in second-person present tense ("You pull the trigger...")
- Maximum 3 sentences per response unless asked for more
- Never reveal game mechanics, dice totals, or DV numbers in the prose
- Use Cyberpunk RED lore: slang (choom, eddies, chrome), Night City districts, corpo brand names
- No meta-text, no disclaimers, no OOC text`;

// ── Implementation ────────────────────────────────────────────────────────────

export class OllamaClient implements IOllamaClient {
  private readonly config: OllamaConfig;

  constructor(config: OllamaConfig) {
    const parsed = OllamaConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(`OllamaClient: invalid config — ${parsed.error.message}`);
    }
    this.config = config;
  }

  // ── isHealthy ───────────────────────────────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      // llama-server health endpoint is usually at /health
      // baseUrl is e.g. http://localhost:8080/v1
      const healthUrl = this.config.baseUrl.replace(/\/v1$/, '/health');
      const response = await fetch(healthUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  // ── stop ───────────────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    // llama-server is a persistent process managed externally (e.g. systemd/bash)
    // No explicit unload needed per-session.
    console.log(`[OllamaClient] Detaching from llama-server: ${this.config.model}`);
  }

  // ── generateNarrative ───────────────────────────────────────────────────────

  async generateNarrative(prompt: string, context: string, systemContext?: string): Promise<string> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.config.timeoutMs);

    const userContent = context.length > 0
      ? `${prompt}\n\nGame State:\n${context}`
      : prompt;

    const systemContent = systemContext
      ? `${systemContext}\n\n${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;

    const requestBody = {
      model: this.config.model,
      stream: false,
      messages: [
        { role: 'system', content: systemContent },
        { role: 'user', content: userContent },
      ],
      temperature: 0.7,
    };

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        throw new Error(`OllamaClient: generateNarrative timeout after ${this.config.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      throw new Error(`OllamaClient: HTTP ${response.status} from llama-server — ${response.statusText}`);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new Error('OllamaClient: failed to parse JSON from llama-server response');
    }

    const parsed = ChatCompletionResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`OllamaClient: schema validation failed — ${parsed.error.message}`);
    }

    const first = parsed.data.choices[0];
    if (!first) {
      throw new Error('OllamaClient: schema validation failed — choices array is empty');
    }
    return first.message.content;
  }
}
