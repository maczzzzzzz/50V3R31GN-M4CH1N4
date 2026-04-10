/**
 * src/core/tactical-vision-service.ts
 *
 * TacticalVisionService — Semantic Map Analysis (Migrated to llama-server)
 */

import fs from 'node:fs/promises';
import { z } from 'zod';
import type { TacticalRegion, SovereignNarrativeConfig } from './interfaces.js';

const TacticalRegionSchema = z.object({
  category: z.enum(['cover_high', 'cover_partial', 'hazard', 'security']),
  box2d: z.tuple([z.number(), z.number(), z.number(), z.number()]),
  label: z.string(),
});

const TacticalVisionResponseSchema = z.object({
  regions: z.array(TacticalRegionSchema),
});

export class TacticalVisionService {
  private readonly config: SovereignNarrativeConfig;

  constructor(config: SovereignNarrativeConfig) {
    this.config = config;
  }

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

    const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'llava-v1.5-7b',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
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
      throw new Error(`TacticalVisionService: llama-server HTTP ${response.status} — ${response.statusText}`);
    }

    let json: any;
    try {
      json = await response.json();
    } catch {
      throw new Error('TacticalVisionService: failed to parse root response JSON');
    }

    const responseText = json.choices[0]?.message.content ?? '';
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
