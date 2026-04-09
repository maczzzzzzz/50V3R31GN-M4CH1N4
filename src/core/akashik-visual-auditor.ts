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
import { execSync } from 'node:child_process';
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
    this.vlmEndpoint = endpoint ?? process.env.VLM_ENDPOINT ?? 'http://172.26.208.1:8080/v1/chat/completions';
  }

  /**
   * Performs a visual audit on all Smart Assets or PDF rulebooks.
   * Extracts district-specific lore, atmospheric seeds, and structured tables.
   */
  async runGlobalAudit(assetsDir: string = './data/assets'): Promise<number> {
    if (!fs.existsSync(assetsDir)) return 0;

    const files = fs.readdirSync(assetsDir);
    let count = 0;

    for (const file of files) {
      const filePath = path.join(assetsDir, file);
      
      if (file.endsWith('.png')) {
        const b64 = fs.readFileSync(filePath, { encoding: 'base64' });
        const district = this.inferDistrictFromFilename(file);
        
        try {
          const results = await this.auditImage(b64, district);
          for (const res of results) {
            this.saveToLibrary(res);
            count++;
          }
        } catch (err) {
          console.error(`[AkashikAuditor] Failed to audit image ${file}:`, err);
        }
      } else if (file.endsWith('.pdf')) {
        console.log(`[AkashikAuditor] Rasterizing PDF for visual audit: ${file}`);
        try {
          const resultCount = await this.runPdfAudit(filePath);
          count += resultCount;
        } catch (err) {
          console.error(`[AkashikAuditor] Failed to audit PDF ${file}:`, err);
        }
      }
    }

    return count;
  }

  /**
   * Rasterizes PDF pages to temporary PNGs and dispatches them to the VLM.
   */
  async runPdfAudit(pdfPath: string): Promise<number> {
    const tempDir = path.join('/tmp', `audit-${randomUUID()}`);
    fs.mkdirSync(tempDir, { recursive: true });
    let count = 0;

    try {
      // Use nix-shell to run pdftoppm without requiring permanent installation
      // -png: output PNG, -f 1 -l 10: first 10 pages only for efficiency
      const command = `nix-shell -p poppler-utils --run "pdftoppm -png -f 1 -l 10 '${pdfPath}' ${tempDir}/page"`;
      execSync(command, { stdio: 'inherit' });

      const pages = fs.readdirSync(tempDir).filter(f => f.endsWith('.png'));
      for (const page of pages) {
        const b64 = fs.readFileSync(path.join(tempDir, page), { encoding: 'base64' });
        const results = await this.auditImage(b64, `PDF: ${path.basename(pdfPath)}`);
        for (const res of results) {
          this.saveToLibrary(res);
          count++;
        }
      }
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }

    return count;
  }

  private async auditImage(imageB64: string, district?: string): Promise<AuditResult[]> {
    const prompt = `Analyze this Cyberpunk RED asset (Rulebook Page, Map, or Art).
    1. Extract Atmospheric "Street Barks" (overheard one-liners).
    2. Identify and reconstruct DATA TABLES (Weapon stats, Gear costs, Encounter tables).
    3. Describe the visual "Vibe" or "Historical Context" for lore grounding.
    4. If this is a MAP, identify key POIs and Tactical Features.
    
    Output ONLY valid JSON in this format:
    {
      "seeds": [
        {
          "category": "lore|combat|economy", 
          "seedText": "...", 
          "metadata": {
            "vibe": "...",
            "type": "table|bark|poi|lore",
            "source_context": "${district}"
          }
        }
      ]
    }`;

    const res = await fetch(this.vlmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf",
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
    const data = await res.json() as { choices: Array<{ message: { content: string } }> };
    const content = data.choices[0]?.message?.content;
    if (!content) return [];

    try {
      const parsed = JSON.parse(content);
      return (parsed.seeds || []).map((s: any) => ({
        ...s,
        district: s.district || district,
        id: randomUUID()
      }));
    } catch (e) {
      console.error("[AkashikAuditor] Failed to parse VLM response:", content);
      return [];
    }
  }

  private saveToLibrary(result: AuditResult): void {
    // Phase 33 Bridge: Also graft into chronicle_seeds for unified access if appropriate
    if (result.category === 'lore' || result.category === 'economy') {
      this.oracle.execute(
        `INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, status) 
         VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
        [
          randomUUID(),
          `Visual Lore: ${result.metadata.type || 'Extract'}`,
          result.seedText,
          'VISUAL_AUDIT',
          `#${result.category.charAt(0).toUpperCase() + result.category.slice(1)}`,
          '2045'
        ]
      );
    }

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

