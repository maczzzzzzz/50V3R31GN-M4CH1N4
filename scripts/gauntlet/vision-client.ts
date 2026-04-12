// scripts/gauntlet/vision-client.ts
// Dual-Node Vision API: Node A (Tactical) + Node B (Aesthetic/Pixtral)

import type { Page } from 'playwright-core';
import { readFileSync } from 'node:fs';

const NODE_A_URL = process.env['NODE_A_LLAMA_URL'] ?? 'http://192.168.0.50:8080/v1';
const NODE_B_URL = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:8080/v1';
const VISION_TIMEOUT_MS = 30_000;

export interface VisionQuery {
  prompt: string;
  imageBase64?: string;
  imagePath?: string;
}

export interface VisionResponse {
  text: string;
  model: string;
  node: 'A' | 'B';
}

async function capturePageScreenshot(page: Page): Promise<string> {
  const buf = await page.screenshot({ type: 'png', fullPage: false });
  return buf.toString('base64');
}

async function queryVlm(
  baseUrl: string,
  node: 'A' | 'B',
  query: VisionQuery,
): Promise<VisionResponse> {
  const imageB64 = query.imageBase64 ??
    (query.imagePath ? readFileSync(query.imagePath).toString('base64') : undefined);

  const messages: Array<{ role: string; content: string | Array<{ type: string; text?: string; image_url?: { url: string } }> }> = [];

  if (imageB64) {
    messages.push({
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:image/png;base64,${imageB64}` } },
        { type: 'text', text: query.prompt },
      ],
    });
  } else {
    messages.push({ role: 'user', content: query.prompt });
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), VISION_TIMEOUT_MS);

  try {
    const res = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages, max_tokens: 512, temperature: 0.1 }),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    const data = await res.json() as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
    };
    return {
      text: data.choices?.[0]?.message?.content ?? '',
      model: data.model ?? 'unknown',
      node,
    };
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export class VisionClient {
  /**
   * Node A — Tactical Eye (Open-Reasoner / Falcon)
   * Audits wall placement, token coordinates, rules geometry
   */
  async tacticalQuery(query: VisionQuery): Promise<VisionResponse> {
    return queryVlm(NODE_A_URL, 'A', query);
  }

  /**
   * Node B — Aesthetic Eye (Pixtral-12B)
   * Audits "Red Shift" intensity, UI theme leaks, atmosphere
   */
  async aestheticQuery(query: VisionQuery): Promise<VisionResponse> {
    return queryVlm(NODE_B_URL, 'B', query);
  }

  /**
   * Capture page screenshot and send to Node B for aesthetic analysis
   */
  async analyzePageAesthetics(page: Page, prompt: string): Promise<VisionResponse> {
    const imageBase64 = await capturePageScreenshot(page);
    return this.aestheticQuery({ prompt, imageBase64 });
  }

  /**
   * Capture page screenshot and send to Node A for tactical analysis
   */
  async analyzePageTactical(page: Page, prompt: string): Promise<VisionResponse> {
    const imageBase64 = await capturePageScreenshot(page);
    return this.tacticalQuery({ prompt, imageBase64 });
  }

  /**
   * Health check — ping both nodes and return availability
   */
  async healthCheck(): Promise<{ nodeA: boolean; nodeB: boolean }> {
    const [a, b] = await Promise.allSettled([
      fetch(`${NODE_A_URL}/models`, { signal: AbortSignal.timeout(5000) }),
      fetch(`${NODE_B_URL}/models`, { signal: AbortSignal.timeout(5000) }),
    ]);
    return {
      nodeA: a.status === 'fulfilled' && a.value.ok,
      nodeB: b.status === 'fulfilled' && b.value.ok,
    };
  }
}
