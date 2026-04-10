/**
 * src/core/sovereign-narrative-client.ts
 *
 * SovereignNarrativeClient — Node B Narrative Synthesis Client (Migrated to llama-server)
 *
 * Connects to Mistral-Nemo 12B via llama-server's OpenAI-compatible
 * /v1/chat/completions endpoint.
 */

import { z } from 'zod';
import type { ISovereignNarrativeClient, SovereignNarrativeConfig } from './interfaces.js';
import { RootsInjector } from './roots-injector.js';

// ── Zod config validation ─────────────────────────────────────────────────────

const SovereignNarrativeConfigSchema = z.object({
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

export const SYSTEM_PROMPT = `You are a Game Master AI running a Cyberpunk RED campaign set in Night City.
Your job is to synthesise atmospheric, terse narrative prose based on mechanical outcomes.

Rules:
- Write in second-person present tense ("You pull the trigger...")
- Maximum 3 sentences per response unless asked for more
- Never reveal game mechanics, dice totals, or DV numbers in the prose
- Use Cyberpunk RED lore: slang (choom, eddies, chrome), Night City districts, corpo brand names
- No meta-text, no disclaimers, no OOC text`;

// ── Implementation ────────────────────────────────────────────────────────────

export class SovereignNarrativeClient implements ISovereignNarrativeClient {
  private readonly config: SovereignNarrativeConfig;
  private rootsInjector?: RootsInjector | undefined;

  constructor(config: SovereignNarrativeConfig, rootsInjector?: RootsInjector) {
    const parsed = SovereignNarrativeConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(`SovereignNarrativeClient: invalid config — ${parsed.error.message}`);
    }
    this.config = config;
    this.rootsInjector = rootsInjector;
  }

  public setRootsInjector(injector: RootsInjector) {
    this.rootsInjector = injector;
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
    console.log(`[SovereignNarrativeClient] Detaching from llama-server: ${this.config.model}`);
  }

  // ── generateNarrative ───────────────────────────────────────────────────────

  async generateNarrative(prompt: string, context: string, systemContext?: string, districtName?: string, temperature: number = 0.7, topP: number = 0.9): Promise<string> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.config.timeoutMs);

    const userContent = context.length > 0
      ? `${prompt}\n\nGame State:\n${context}`
      : prompt;

    let baseSysContent = systemContext
      ? `${systemContext}\n\n${SYSTEM_PROMPT}`
      : SYSTEM_PROMPT;

    if (this.rootsInjector) {
      baseSysContent = this.rootsInjector.inject(districtName || null, baseSysContent);
    }

    const requestBody = {
      model: this.config.model,
      stream: false,
      messages: [
        { role: 'system', content: baseSysContent },
        { role: 'user', content: userContent },
      ],
      temperature,
      top_p: topP,
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
        throw new Error(`SovereignNarrativeClient: generateNarrative timeout after ${this.config.timeoutMs}ms`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      throw new Error(`SovereignNarrativeClient: HTTP ${response.status} from llama-server — ${response.statusText}`);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new Error('SovereignNarrativeClient: failed to parse JSON from llama-server response');
    }

    const parsed = ChatCompletionResponseSchema.safeParse(json);
    if (!parsed.success) {
      throw new Error(`SovereignNarrativeClient: schema validation failed — ${parsed.error.message}`);
    }

    const first = parsed.data.choices[0];
    if (!first) {
      throw new Error('SovereignNarrativeClient: schema validation failed — choices array is empty');
    }
    return first.message.content;
  }
}
