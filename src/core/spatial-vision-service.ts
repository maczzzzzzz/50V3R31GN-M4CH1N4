/**
 * src/core/spatial-vision-service.ts
 *
 * Optical Bridge — Playwright CDP capture + Llava tactical analysis.
 * (Migrated to llama-server native inference)
 */

import { chromium, type Browser } from 'playwright-core';

export interface VisualTacticalContext {
  /** Token clusters identified on the map (e.g. ["3 hostiles near door", "PC at center"]). */
  tokenClusters: string[];
  /** Environmental features (walls, cover, hazards, etc.). */
  environmentalFeatures: string[];
  /** Raw natural-language description from Llava. */
  rawDescription: string;
}

export interface SpatialVisionConfig {
  /** CDP endpoint of the running Chrome session, e.g. http://localhost:9222 */
  chromeCdpUrl: string;
  /** Base URL of the llama-server, e.g. http://localhost:8080/v1 */
  ollamaBaseUrl?: string;
  /** Vision model tag, e.g. "llava-v1.5-7b" */
  visionModel?: string;
}

interface OpenAICompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

const ANALYSIS_PROMPT =
  'You are analyzing a Foundry VTT tactical battle map for a tabletop RPG. ' +
  'Identify: 1) Token clusters (groups of characters or enemies), ' +
  '2) Environmental features (walls, doors, obstacles, cover, hazards). ' +
  'Respond ONLY with valid JSON matching this schema: ' +
  '{"tokenClusters": string[], "environmentalFeatures": string[], "rawDescription": string}';

export class SpatialVisionService {
  private readonly llamaBaseUrl: string;
  private readonly visionModel: string;

  constructor(private readonly config: SpatialVisionConfig) {
    this.llamaBaseUrl = config.ollamaBaseUrl ?? 'http://localhost:8080/v1';
    this.visionModel = config.visionModel ?? 'llava-v1.5-7b';
  }

  async captureAndAnalyze(): Promise<VisualTacticalContext> {
    const base64Image = await this.captureFoundryCanvas();
    return this.analyzeWithLlava(base64Image);
  }

  private async captureFoundryCanvas(): Promise<string> {
    let browser: Browser | null = null;
    try {
      browser = await chromium.connectOverCDP(this.config.chromeCdpUrl);
      const contexts = browser.contexts();
      const page = contexts[0]?.pages()[0];
      if (!page) throw new Error('No active page found in the Chrome CDP session.');

      const canvas = page.locator('#canvas').first();
      const screenshotBuffer = await canvas.screenshot({ timeout: 8000 });
      return screenshotBuffer.toString('base64');
    } finally {
      await browser?.close();
    }
  }

  async analyzeWithLlava(base64Image: string): Promise<VisualTacticalContext> {
    // llama-server OpenAI-compatible chat endpoint with vision support
    // uses the same format as GPT-4V
    const response = await fetch(`${this.llamaBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.visionModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: ANALYSIS_PROMPT },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/png;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        stream: false,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      throw new Error(`llama-server vision request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OpenAICompletionResponse;
    const content = data.choices[0]?.message.content ?? '';

    try {
      return JSON.parse(content) as VisualTacticalContext;
    } catch {
      return {
        tokenClusters: [],
        environmentalFeatures: [],
        rawDescription: content,
      };
    }
  }
}
