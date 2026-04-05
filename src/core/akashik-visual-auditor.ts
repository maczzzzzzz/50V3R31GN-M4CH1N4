/**
 * src/core/akashik-visual-auditor.ts
 *
 * AkashikVisualAuditor — Phase 27 Hyper-Reasoning Orchestrator
 *
 * Feeds Forge-generated Smart PNGs to the Pixtral VLM and extracts
 * lore-dense metadata (aesthetic, mood, faction markers) for storage
 * in the Akashik Library's library_entries table.
 */

import { readdir, readFile } from 'node:fs/promises';
import { join, extname, basename } from 'node:path';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface AkashikVisualAuditorConfig {
  /** Path to the data/assets directory containing Forge Smart PNGs. */
  assetsDir: string;
  /** Oracle client for persisting audit results to Akashik.db. */
  oracle: UnifiedOracleClient;
  /** VLM endpoint (default: VLM_ENDPOINT env var). */
  vlmEndpoint?: string;
  /** VLM model name (default: VLM_MODEL env var). */
  vlmModel?: string;
}

export interface VisualAuditResult {
  stem: string;
  aesthetic: string;
  factionMarkers: string[];
  moodTags: string[];
  rawDescription: string;
}

const LORE_EXTRACTION_PROMPT =
  'You are auditing Cyberpunk RED campaign artwork. ' +
  'Extract lore metadata from this image. ' +
  'Respond ONLY with valid JSON matching: ' +
  '{"aesthetic": string, "factionMarkers": string[], "moodTags": string[], "rawDescription": string}';

interface VlmResponse {
  choices: Array<{ message: { content: string } }>;
}

export class AkashikVisualAuditor {
  private readonly vlmEndpoint: string;
  private readonly vlmModel: string;

  constructor(private readonly config: AkashikVisualAuditorConfig) {
    this.vlmEndpoint =
      config.vlmEndpoint ?? process.env['VLM_ENDPOINT'] ?? 'http://localhost:8080/v1/chat/completions';
    this.vlmModel =
      config.vlmModel ?? process.env['VLM_MODEL'] ?? 'pixtral';
  }

  /**
   * Audit all Smart PNGs in assetsDir and upsert results into library_entries.
   * Returns the count of successfully audited assets.
   */
  async auditAll(): Promise<number> {
    const entries = await readdir(this.config.assetsDir);
    const pngs = entries.filter(e => extname(e).toLowerCase() === '.png');

    let count = 0;
    for (const filename of pngs) {
      const stem = basename(filename, '.png');
      try {
        const result = await this.auditOne(join(this.config.assetsDir, filename), stem);
        this.persist(result);
        count++;
      } catch (err) {
        process.stderr.write(`[AkashikVisualAuditor] Failed to audit ${filename}: ${err}\n`);
      }
    }
    return count;
  }

  async auditOne(pngPath: string, stem: string): Promise<VisualAuditResult> {
    const pngBytes = await readFile(pngPath);
    const base64 = pngBytes.toString('base64');

    const res = await fetch(this.vlmEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.vlmModel,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: LORE_EXTRACTION_PROMPT },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } },
            ],
          },
        ],
        stream: false,
      }),
    });

    if (!res.ok) {
      throw new Error(`VLM request failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as VlmResponse;
    const content = data.choices[0]?.message.content ?? '';

    try {
      const parsed = JSON.parse(content) as {
        aesthetic: string;
        factionMarkers: string[];
        moodTags: string[];
        rawDescription: string;
      };
      return { stem, ...parsed };
    } catch {
      return {
        stem,
        aesthetic: '',
        factionMarkers: [],
        moodTags: [],
        rawDescription: content,
      };
    }
  }

  private persist(result: VisualAuditResult): void {
    this.config.oracle.execute(
      `INSERT OR REPLACE INTO library_entries
         (stem, aesthetic, faction_markers_json, mood_tags_json, raw_description, audited_at)
       VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
      [
        result.stem,
        result.aesthetic,
        JSON.stringify(result.factionMarkers),
        JSON.stringify(result.moodTags),
        result.rawDescription,
      ],
    );
  }
}
