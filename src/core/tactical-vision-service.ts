/**
 * src/core/tactical-vision-service.ts
 *
 * Phase 6: Project Eyes-On — Tactical Region Intelligence (Node B)
 *
 * Pipeline:
 *   base64 PNG → Ollama LLava /api/chat (structured output) →
 *   TacticalRegion[] → FoundryRegionData[] + world.db persistence
 *
 * Distinct from SpatialVisionService (which uses /api/generate for free-text
 * scene description). This service returns machine-readable bounding boxes
 * for cover, hazards and security zones, suitable for Foundry v12 RegionDocuments.
 *
 * Coordinate system: LLava returns [ymin, xmin, ymax, xmax] normalized to 0–1000.
 * Scene pixel conversion uses provided scene dimensions (default 1000×1000).
 *
 * Spec §2.2: categories = cover_high | cover_partial | hazard | security.
 */

import { randomUUID } from 'node:crypto';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

// ── Types ─────────────────────────────────────────────────────────────────────

export type TacticalCategory = 'cover_high' | 'cover_partial' | 'hazard' | 'security';

/** Bounding box as returned by LLava: [ymin, xmin, ymax, xmax] normalized 0–1000. */
export type NormalizedBounds = [number, number, number, number];

/** A single rectangle shape in the Foundry v12 RegionDocument format. */
export interface FoundryRectShape {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

/** Minimal Foundry v12 RegionDocument data for scene region materialisation. */
export interface FoundryRegionData {
  name: string;
  color: string;
  shapes: FoundryRectShape[];
}

/** A single tactical region identified by LLava on a battle map. */
export interface TacticalRegion {
  id: string;
  sceneId: string;
  category: TacticalCategory;
  label: string;
  /** Raw [ymin, xmin, ymax, xmax] normalized to 0–1000. */
  bounds: NormalizedBounds;
  /** Foundry v12 RegionDocument materialisation data. */
  foundryRegion: FoundryRegionData;
}

export interface TacticalVisionConfig {
  /** Base URL of the Ollama server (default: http://localhost:11434). */
  ollamaBaseUrl?: string;
  /** LLava model tag (default: llava:latest). */
  visionModel?: string;
  /** Scene width in pixels — used for coordinate conversion (default: 1000). */
  sceneWidth?: number;
  /** Scene height in pixels — used for coordinate conversion (default: 1000). */
  sceneHeight?: number;
}

// ── Colour coding by category (Foundry region palette) ────────────────────────

const CATEGORY_COLORS: Record<TacticalCategory, string> = {
  cover_high:    '#1a6b1a',   // dark green  — solid cover
  cover_partial: '#5a9e5a',   // light green — partial cover
  hazard:        '#c43030',   // red         — environmental danger
  security:      '#c49430',   // amber       — guarded / detection zone
};

// ── Ollama structured-output schema ───────────────────────────────────────────

/** JSON Schema passed to Ollama `format` parameter to enforce structured output. */
const REGION_FORMAT_SCHEMA = {
  type: 'object',
  properties: {
    regions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['cover_high', 'cover_partial', 'hazard', 'security'],
          },
          label: { type: 'string' },
          bounds: {
            type: 'array',
            items: { type: 'number' },
            minItems: 4,
            maxItems: 4,
          },
        },
        required: ['category', 'label', 'bounds'],
      },
    },
  },
  required: ['regions'],
} as const;

const ANALYSIS_PROMPT =
  'You are a tactical analyst examining a Foundry VTT battle map for a Cyberpunk RED TTRPG session. ' +
  'Identify zones of: cover_high (solid barriers — cars, concrete, dumpsters), ' +
  'cover_partial (low obstacles — crates, counters, planters), ' +
  'hazard (dangerous areas — fire, electricity, exposed machinery, drops), ' +
  'security (guarded zones — camera arcs, laser tripwires, guard patrol paths). ' +
  'For each zone return its category, a short label (≤5 words), and a bounding box as ' +
  '[ymin, xmin, ymax, xmax] coordinates normalized to a 0-1000 scale.';

// ── Internal Ollama response shape ─────────────────────────────────────────────

interface OllamaChatResponse {
  message: { role: string; content: string };
}

interface RawRegion {
  category: unknown;
  label: unknown;
  bounds: unknown;
}

// ── Service ───────────────────────────────────────────────────────────────────

export class TacticalVisionService {
  private readonly ollamaBaseUrl: string;
  private readonly visionModel: string;
  private readonly sceneWidth: number;
  private readonly sceneHeight: number;

  constructor(private readonly config: TacticalVisionConfig = {}) {
    this.ollamaBaseUrl = config.ollamaBaseUrl ?? 'http://localhost:11434';
    this.visionModel   = config.visionModel   ?? 'llava:latest';
    this.sceneWidth    = config.sceneWidth     ?? 1000;
    this.sceneHeight   = config.sceneHeight    ?? 1000;
  }

  /**
   * Identify tactical regions in a base64-encoded battle map screenshot.
   *
   * @param base64Image  PNG or JPEG encoded as base64.
   * @param sceneId      Foundry scene document id (used for RKG persistence).
   * @returns            Array of identified `TacticalRegion` objects (empty on failure).
   */
  async identifyRegions(base64Image: string, sceneId: string): Promise<TacticalRegion[]> {
    let rawRegions: RawRegion[];

    try {
      rawRegions = await this.callLlavaStructured(base64Image);
    } catch {
      return [];
    }

    return rawRegions
      .filter(r => this.isValidRawRegion(r))
      .map(r => this.buildTacticalRegion(r, sceneId));
  }

  /**
   * Persist identified regions to `world.db` (scene_regions table).
   * Silently no-ops if oracle is not connected.
   */
  persistRegions(regions: TacticalRegion[], oracle: UnifiedOracleClient): void {
    if (!oracle.isConnected()) return;

    for (const region of regions) {
      oracle.execute(
        `INSERT OR REPLACE INTO scene_regions
           (id, scene_id, category, label, bounds_json, foundry_region_json)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          region.id,
          region.sceneId,
          region.category,
          region.label,
          JSON.stringify(region.bounds),
          JSON.stringify(region.foundryRegion),
        ],
      );
    }
  }

  /**
   * Query all persisted regions for a given scene.
   */
  getRegionsForScene(sceneId: string, oracle: UnifiedOracleClient): TacticalRegion[] {
    if (!oracle.isConnected()) return [];

    const rows = oracle.query(
      `SELECT id, scene_id, category, label, bounds_json, foundry_region_json
         FROM scene_regions WHERE scene_id = ?`,
      [sceneId],
    ) as Array<{
      id: string;
      scene_id: string;
      category: TacticalCategory;
      label: string;
      bounds_json: string;
      foundry_region_json: string;
    }>;

    return rows.map(row => ({
      id:            row.id,
      sceneId:       row.scene_id,
      category:      row.category,
      label:         row.label,
      bounds:        JSON.parse(row.bounds_json) as NormalizedBounds,
      foundryRegion: JSON.parse(row.foundry_region_json) as FoundryRegionData,
    }));
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private async callLlavaStructured(base64Image: string): Promise<RawRegion[]> {
    const response = await fetch(`${this.ollamaBaseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model:    this.visionModel,
        messages: [
          {
            role:    'user',
            content: ANALYSIS_PROMPT,
            images:  [base64Image],
          },
        ],
        stream: false,
        format: REGION_FORMAT_SCHEMA,
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama LLava /api/chat failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as OllamaChatResponse;
    const content = data.message?.content ?? '';

    const parsed = JSON.parse(content) as { regions?: unknown };
    if (!Array.isArray(parsed.regions)) return [];
    return parsed.regions as RawRegion[];
  }

  private isValidRawRegion(r: RawRegion): boolean {
    const validCategories: TacticalCategory[] = ['cover_high', 'cover_partial', 'hazard', 'security'];
    if (!validCategories.includes(r.category as TacticalCategory)) return false;
    if (typeof r.label !== 'string' || r.label.length === 0) return false;
    if (!Array.isArray(r.bounds) || r.bounds.length !== 4) return false;
    return (r.bounds as unknown[]).every(v => typeof v === 'number');
  }

  private buildTacticalRegion(r: RawRegion, sceneId: string): TacticalRegion {
    const category = r.category as TacticalCategory;
    const label    = r.label    as string;
    const bounds   = r.bounds   as NormalizedBounds;

    const [ymin, xmin, ymax, xmax] = bounds;
    const pixelX      = (xmin / 1000) * this.sceneWidth;
    const pixelY      = (ymin / 1000) * this.sceneHeight;
    const pixelWidth  = ((xmax - xmin) / 1000) * this.sceneWidth;
    const pixelHeight = ((ymax - ymin) / 1000) * this.sceneHeight;

    const foundryRegion: FoundryRegionData = {
      name:   `[${category.replace('_', ' ')}] ${label}`,
      color:  CATEGORY_COLORS[category],
      shapes: [
        {
          type:     'rectangle',
          x:        pixelX,
          y:        pixelY,
          width:    pixelWidth,
          height:   pixelHeight,
          rotation: 0,
        },
      ],
    };

    return {
      id:    randomUUID(),
      sceneId,
      category,
      label,
      bounds,
      foundryRegion,
    };
  }
}
