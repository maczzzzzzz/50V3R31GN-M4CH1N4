/**
 * src/core/sovereign-narrative-client.ts
 *
 * ◈ SOVEREIGN_NARRATIVE_CLIENT : Clean BASE
 *
 * Node B Narrative Synthesis Client.
 * Connects to local models via llama-server OpenAI-compatible API.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import type { ISovereignNarrativeClient, SovereignProfile } from './interfaces.js';
import { RootsInjector } from './roots-injector.js';
import type { ILogger } from '../db/interfaces.js';

export interface SovereignNarrativeConfig {
  baseUrl: string;
  model: string;
  timeoutMs: number;
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

const DEFAULT_SYSTEM_PROMPT = `You are the Sovereign OS Director. 
Your job is to synthesise clinical, terse narrative responses based on system telemetry and physical truth.
Rules:
- Write in clinical, objective tone.
- Maximum 3 sentences per response.
- No meta-text or OOC commentary.`;

export class SovereignNarrativeClient implements ISovereignNarrativeClient {
  private readonly config: SovereignNarrativeConfig;
  private readonly logger?: ILogger | undefined;
  private rootsInjector?: RootsInjector | undefined;
  private activeProfile: SovereignProfile = 'SOVEREIGN_OS';

  constructor(config: SovereignNarrativeConfig, rootsInjector?: RootsInjector, logger?: ILogger) {
    this.config = config;
    this.rootsInjector = rootsInjector;
    this.logger = logger;
  }

  public setProfile(profile: SovereignProfile): void {
    this.activeProfile = profile;
    if (this.rootsInjector) {
      this.rootsInjector.setProfile(profile);
    }
  }

  async isHealthy(): Promise<boolean> {
    try {
      const healthUrl = this.config.baseUrl.replace(/\/v1$/, '/health');
      const response = await fetch(healthUrl);
      return response.ok;
    } catch {
      return false;
    }
  }

  async stop(): Promise<void> {
    const traceId = randomUUID();
    this.logger?.info('SovereignNarrativeClient', traceId, `Detaching from llama-server: ${this.config.model}`);
  }

  async generateNarrative(prompt: string, context: string, systemContext?: string, temperature: number = 0.7, topP: number = 0.9): Promise<string> {
    const traceId = randomUUID();
    const userContent = context.length > 0 ? `${prompt}\n\nContext:\n${context}` : prompt;

    let baseSysContent = systemContext
      ? `${systemContext}\n\n${DEFAULT_SYSTEM_PROMPT}`
      : DEFAULT_SYSTEM_PROMPT;

    if (this.rootsInjector) {
      baseSysContent = this.rootsInjector.inject(null, baseSysContent);
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

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.timeoutMs),
      });

      if (!response.ok) {
        throw new Error(`Node B error: ${response.status}`);
      }

      const json = await response.json();
      const parsed = ChatCompletionResponseSchema.parse(json);
      return parsed.choices[0]!.message.content;
    } catch (err) {
      this.logger?.error('SovereignNarrativeClient', traceId, `Narrative generation failed: ${(err as Error).message}`);
      throw err;
    }
  }
}
