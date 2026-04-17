/**
 * src/core/sovereign-inference-client.ts
 *
 * SovereignInferenceClient — Generalized Inference Client for Node A/B.
 * Replaces the legacy SovereignInferenceClient.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

const ConfigSchema = z.object({
  baseUrl: z.string().min(1),
  model: z.string().min(1),
  timeoutMs: z.number().int().positive(),
});

export type SovereignInferenceConfig = z.infer<typeof ConfigSchema>;

export class SovereignInferenceClient {
  private readonly config: SovereignInferenceConfig;

  constructor(config: SovereignInferenceConfig) {
    this.config = ConfigSchema.parse(config);
  }

  async isHealthy(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl.replace(/\/v1$/, '')}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }

  async generateCompletion(prompt: string, systemPrompt?: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.config.model,
          messages: [
            ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
            { role: 'user', content: prompt },
          ],
          stream: false,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Inference error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json() as any;
      return json.choices[0].message.content;
    } finally {
      clearTimeout(timeout);
    }
  }
}
