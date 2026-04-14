/**
 * src/core/sovereign-narrative-client.ts
 *
 * SovereignNarrativeClient — Node B Narrative Synthesis Client (Migrated to llama-server)
 *
 * Connects to Mistral-Nemo 12B via llama-server's OpenAI-compatible
 * /v1/chat/completions endpoint.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { ISovereignNarrativeClient, SovereignNarrativeConfig } from './interfaces.js';
import { RootsInjector } from './roots-injector.js';
import type { ILogger } from '../db/interfaces.js';

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
  private readonly logger?: ILogger | undefined;
  private rootsInjector?: RootsInjector | undefined;
  /** Pre-loaded AAAK context from Sentinel Distiller (0x0A push). Empty = not yet primed. */
  private activeContext: string = '';

  /** Update the pre-loaded context slot (called by VsbClient 0x0A handler). */
  public updateContext(payload: string): void {
    this.activeContext = payload;
  }

  constructor(config: SovereignNarrativeConfig, rootsInjector?: RootsInjector, logger?: ILogger) {
    const parsed = SovereignNarrativeConfigSchema.safeParse(config);
    if (!parsed.success) {
      throw new Error(`SovereignNarrativeClient: invalid config — ${parsed.error.message}`);
    }
    this.config = config;
    this.rootsInjector = rootsInjector;
    this.logger = logger;
  }

  public setRootsInjector(injector: RootsInjector) {
    this.rootsInjector = injector;
  }

  // ── isHealthy ───────────────────────────────────────────────────────────────

  async isHealthy(): Promise<boolean> {
    try {
      const healthUrl = this.config.baseUrl.replace(/\/v1$/, '/health');
      const response = await fetch(healthUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  // ── stop ───────────────────────────────────────────────────────────────────

  async stop(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info('SovereignNarrativeClient', traceId, `Detaching from llama-server: ${this.config.model}`);
  }

  // ── generateNarrative ───────────────────────────────────────────────────────

  async generateNarrative(prompt: string, context: string, systemContext?: string, districtName?: string, temperature: number = 0.7, topP: number = 0.9): Promise<string> {
    const traceId = randomUUID();
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.config.timeoutMs);

    // Prepend pre-loaded Sentinel context if available (near-zero latency slot)
    const effectiveContext = this.activeContext.length > 0
      ? `${this.activeContext}\n${context}`
      : context;

    const userContent = effectiveContext.length > 0
      ? `${prompt}\n\nGame State:\n${effectiveContext}`
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

    this.logger?.debug('SovereignNarrativeClient', traceId, 'Generating narrative via Node B', { prompt, district: districtName });

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
        const message = `SovereignNarrativeClient: generateNarrative timeout after ${this.config.timeoutMs}ms`;
        this.logger?.error('SovereignNarrativeClient', traceId, message);
        throw new Error(message);
      }
      this.logger?.error('SovereignNarrativeClient', traceId, `Network error calling Node B: ${(err as Error).message}`);
      throw err;
    } finally {
      clearTimeout(timeoutHandle);
    }

    if (!response.ok) {
      const message = `SovereignNarrativeClient: HTTP ${response.status} from llama-server — ${response.statusText}`;
      this.logger?.error('SovereignNarrativeClient', traceId, message);
      throw new Error(message);
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      const message = 'SovereignNarrativeClient: failed to parse JSON from llama-server response';
      this.logger?.error('SovereignNarrativeClient', traceId, message);
      throw new Error(message);
    }

    const parsed = ChatCompletionResponseSchema.safeParse(json);
    if (!parsed.success) {
      const message = `SovereignNarrativeClient: schema validation failed — ${parsed.error.message}`;
      this.logger?.error('SovereignNarrativeClient', traceId, message);
      throw new Error(message);
    }

    const first = parsed.data.choices[0];
    if (!first) {
      const message = 'SovereignNarrativeClient: schema validation failed — choices array is empty';
      this.logger?.error('SovereignNarrativeClient', traceId, message);
      throw new Error(message);
    }
    
    this.logger?.info('SovereignNarrativeClient', traceId, 'Narrative generation successful');
    return first.message.content;
  }
}
