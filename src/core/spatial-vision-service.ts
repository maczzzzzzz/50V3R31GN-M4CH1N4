/**
 * src/core/spatial-vision-service.ts
 *
 * Optical Bridge — Playwright CDP capture + Llava tactical analysis.
 *
 * Pipeline:
 *   1. Connect to an existing Chrome session via CDP (--remote-debugging-port).
 *   2. Find the active page and capture the Foundry VTT #canvas element.
 *   3. POST the screenshot buffer to Ollama Llava for spatial analysis.
 *   4. Return a structured VisualTacticalContext for narrative synthesis.
 *
 * Performance target: <10s end-to-end (spec §5).
 *
 * ENV used by callers (not consumed here):
 *   CHROME_CDP_URL  — e.g. http://localhost:9222
 *   OLLAMA_BASE_URL — e.g. http://localhost:11434 (default)
 *   LLAVA_MODEL     — e.g. llava:latest (default)
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
  /** Base URL of the Ollama server, e.g. http://localhost:11434 */
  ollamaBaseUrl?: string;
  /** Llava model tag, e.g. "llava:latest" */
  visionModel?: string;
}

interface OllamaGenerateResponse {
  response: string;
}

const ANALYSIS_PROMPT =
  'You are analyzing a Foundry VTT tactical battle map for a tabletop RPG. ' +
  'Identify: 1) Token clusters (groups of characters or enemies), ' +
  '2) Environmental features (walls, doors, obstacles, cover, hazards). ' +
  'Respond ONLY with valid JSON matching this schema: ' +
  '{"tokenClusters": string[], "environmentalFeatures": string[], "rawDescription": string}';

export class SpatialVisionService {
  private readonly ollamaBaseUrl: string;
  private readonly visionModel: string;

  constructor(private readonly config: SpatialVisionConfig) {
    this.ollamaBaseUrl = config.ollamaBaseUrl ?? 'http://localhost:11434';
    this.visionModel = config.visionModel ?? 'llava:latest';
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
    const response = await fetch(`${this.ollamaBaseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.visionModel,
        prompt: ANALYSIS_PROMPT,
        images: [base64Image],
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama Llava request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaGenerateResponse;

    try {
      return JSON.parse(data.response) as VisualTacticalContext;
    } catch {
      // Llava returned free text instead of JSON — wrap it gracefully
      return {
        tokenClusters: [],
        environmentalFeatures: [],
        rawDescription: data.response,
      };
    }
  }
}
