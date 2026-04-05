/**
 * src/core/akashik-visual-auditor.ts
 *
 * AkashikVisualAuditor — Phase 27 Visual Lore Extraction
 *
 * This service uses the Pixtral-12B VLM to "audit" campaign assets (PNGs)
 * and extract narrative barks and street scenes grounded in PDF artwork.
 */

import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface AuditResult {
  category: 'combat' | 'netrun' | 'economy' | 'lore' | 'tutorial';
  district?: string;
  seedText: string;
  metadata: Record<string, unknown>;
}

export class AkashikVisualAuditor {
  private readonly vlmEndpoint: string;

  constructor(
    private readonly oracle: UnifiedOracleClient,
    endpoint?: string
  ) {
    this.vlmEndpoint = endpoint ?? process.env.VLM_ENDPOINT ?? 'http://localhost:8080/v1/chat/completions';
  }

  /**
   * Performs a visual audit on all Smart Assets in the assets directory.
   * Extracts district-specific lore and atmospheric seeds.
   */
  async runGlobalAudit(assetsDir: string = './data/assets'): Promise<number> {
    if (!fs.existsSync(assetsDir)) return 0;

    const files = fs.readdirSync(assetsDir).filter(f => f.endsWith('.png'));
    let count = 0;

    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      const b64 = fs.readFileSync(filePath, { encoding: 'base64' });
      
      const district = this.inferDistrictFromFilename(file);
      
      try {
        const results = await this.auditImage(b64, district);
        for (const res of results) {
          this.saveToLibrary(res);
          count++;
        }
      } catch (err) {
        console.error(`[AkashikAuditor] Failed to audit ${file}:`, err);
      }
    }

    return count;
  }

  private async auditImage(imageB64: string, district?: string): Promise<AuditResult[]> {
    const prompt = `Analyze this Cyberpunk RED campaign asset. 
    1. Extract 2-3 atmospheric "Street Barks" (one-liners overheard nearby).
    2. Describe the visual "Vibe" in 1 sentence for lore grounding.
    
    Output ONLY valid JSON in this format:
    {"seeds": [{"category": "lore", "seedText": "...", "metadata": {"vibe": "..."}}, {"category": "lore", "seedText": "...", "metadata": {"type": "bark"}}]}
    `;

    const res = await fetch(this.vlmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "pixtral",
        messages: [{
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/png;base64,${imageB64}` } }
          ]
        }],
        response_format: { type: "json_object" }
      })
    });

    if (!res.ok) throw new Error(`VLM responded with ${res.status}`);
    const data = await res.json();
    const content = data.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return (parsed.seeds || []).map((s: any) => ({
      ...s,
      district,
      id: randomUUID()
    }));
  }

  private saveToLibrary(result: AuditResult): void {
    this.oracle.execute(
      'INSERT INTO library_entries (id, category, district, seed_text, metadata) VALUES (?, ?, ?, ?, ?)',
      [
        randomUUID(),
        result.category,
        result.district || null,
        result.seedText,
        JSON.stringify(result.metadata)
      ]
    );
  }

  private inferDistrictFromFilename(filename: string): string | undefined {
    const lower = filename.toLowerCase();
    if (lower.includes('glen')) return 'The Glen';
    if (lower.includes('japantown')) return 'Japantown';
    if (lower.includes('watson')) return 'Watson';
    if (lower.includes('wellsprings')) return 'Wellsprings';
    return undefined;
  }
}
