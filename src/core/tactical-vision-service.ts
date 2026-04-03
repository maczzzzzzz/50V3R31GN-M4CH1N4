/**
 * src/core/tactical-vision-service.ts
 *
 * TacticalVisionService — Semantic Map Analysis (LLava 1.6)
 *
 * Provides "Eyes" to the AI by identifying tactical regions on a map.
 * Normalized coordinates (0-1000) allow scaling to any Foundry VTT grid.
 */

import fs from 'node:fs/promises';
import { z } from 'zod';
import type { TacticalRegion, OllamaConfig } from './interfaces.js';

// ── Zod response schema ───────────────────────────────────────────────────────

const TacticalRegionSchema = z.object({
  category: z.enum(['cover_high', 'cover_partial', 'hazard', 'security']),
  box2d: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  label: z.string(),
});

const TacticalVisionResponseSchema = z.object({
  regions: z.array(TacticalRegionSchema),
});

// ── Implementation ────────────────────────────────────────────────────────────

export class TacticalVisionService {
  private readonly config: OllamaConfig;

  constructor(config: OllamaConfig) {
    this.config = config;
  }

  /**
   * Scan a map image and extract tactical metadata.
   * @param imagePath Local path to the map image (PNG/JPG).
   * @returns Array of identified TacticalRegions.
   */
  async scanMap(imagePath: string): Promise<TacticalRegion[]> {
    let imageData: Buffer;
    try {
      imageData = await fs.readFile(imagePath);
    } catch (err) {
      throw new Error(`TacticalVisionService: failed to read image at ${imagePath} — ${err}`);
    }

    const base64Image = imageData.toString('base64');

    const prompt = `Analyze this top-down TRPG battle map.
Identify all tactical regions:
- cover_high (thick walls, massive concrete pillars, large vehicles)
- cover_partial (crates, low barriers, furniture, debris)
- hazard (industrial fans, open fire pits, electrical leaks, toxic pools)
- security (cameras, automated turrets, biometric keypad doors)

CRITICAL: Return ONLY a JSON object with a 'regions' array.
Each region MUST have:
- 'category': one of [cover_high, cover_partial, hazard, security]
- 'box2d': [ymin, xmin, ymax, xmax] normalized to 0-1000 coordinates
- 'label': short descriptive name (e.g., "Steel Crate Cluster")

Example: {"regions": [{"category": "hazard", "box2d": [100, 200, 150, 250], "label": "Industrial Fan"}]}`;

    const response = await fetch(`${this.config.baseUrl}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava:7b', // Hardcoded vision model to differentiate from Mistral-Nemo
        prompt,
        images: [base64Image],
        stream: false,
        format: 'json',
      }),
    });

    if (!response.ok) {
      throw new Error(`TacticalVisionService: Ollama HTTP ${response.status} — ${response.statusText}`);
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error('TacticalVisionService: failed to parse root response JSON');
    }

    // Ollama's /api/generate returns the model output in the 'response' field
    const responseText = json.response;
    let parsedData: unknown;
    try {
      parsedData = JSON.parse(responseText);
    } catch {
      throw new Error('TacticalVisionService: model response is not valid JSON');
    }

    const validated = TacticalVisionResponseSchema.safeParse(parsedData);
    if (!validated.success) {
      throw new Error(`TacticalVisionService: schema validation failed — ${validated.error.message}`);
    }

    return validated.data.regions;
  }
}
