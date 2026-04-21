/**
 * src/core/outline-scene-builder.ts
 *
 * Phase 63 — OpenMAIC Outline-to-Scene Pipeline (Node B Campaign Builder)
 *
 * Ports the OpenMAIC multi-act scene generation workflow to the Sovereign
 * Trinity. Accepts a structured campaign outline and materialises a Foundry
 * VTT-compatible scene configuration via the Director (Node B, port 7339).
 *
 * Pipeline:
 *   Outline → Prompt Engineering → Director Inference → Scene Schema
 *
 * Node B endpoint: NODE_B_DIRECTOR_URL (default: http://10.0.0.20:7339/v1)
 * The Director runs the OBLITERATED Q8_0 mind with Total Sight.
 */

import { z } from 'zod';
import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// Input schemas
// ---------------------------------------------------------------------------

export const ActBeatSchema = z.object({
  /** Narrative label for this beat, e.g. "The Ambush at Afterlife" */
  id: z.string().min(1),
  /** Short description of what occurs at this beat */
  description: z.string().min(1),
  /** CPR district / location tag for tile/asset lookup */
  location: z.string().default('Night City'),
  /** Estimated number of NPCs present */
  npcCount: z.number().int().min(0).default(0),
  /** Narrative tension level — affects lighting and cover density */
  tension: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
});
export type ActBeat = z.infer<typeof ActBeatSchema>;

export const CampaignOutlineSchema = z.object({
  /** Campaign arc title */
  title: z.string().min(1),
  /** Act number for this outline slice */
  actNumber: z.number().int().min(1),
  /** Ordered sequence of narrative beats */
  beats: z.array(ActBeatSchema).min(1),
  /** Optional GM notes injected into the Director prompt */
  gmNotes: z.string().optional(),
});
export type CampaignOutline = z.infer<typeof CampaignOutlineSchema>;

// ---------------------------------------------------------------------------
// Output schemas
// ---------------------------------------------------------------------------

export const SceneConfigSchema = z.object({
  name: z.string(),
  backgroundColor: z.string().default('#1a0a2e'),
  width: z.number().int().default(4000),
  height: z.number().int().default(3000),
  /** Darkness level 0-1 (0 = bright, 1 = pitch black) */
  darkness: z.number().min(0).max(1),
  /** Recommended token starting positions per beat */
  tokenStartPositions: z.array(z.object({
    beatId: z.string(),
    x: z.number(),
    y: z.number(),
  })),
  /** Ambient light sources */
  lights: z.array(z.object({
    x: z.number(),
    y: z.number(),
    bright: z.number(),
    dim: z.number(),
    color: z.string(),
  })),
  /** Director's narrative notes for the GM */
  narrativeNotes: z.string(),
  /** Source beat IDs included in this scene */
  sourceBeatIds: z.array(z.string()),
});
export type SceneConfig = z.infer<typeof SceneConfigSchema>;

export const OutlineSceneBuildResultSchema = z.object({
  outlineTitle: z.string(),
  actNumber: z.number(),
  scenes: z.array(SceneConfigSchema),
  reasoning: z.string(),
});
export type OutlineSceneBuildResult = z.infer<typeof OutlineSceneBuildResultSchema>;

// ---------------------------------------------------------------------------
// Director inference types
// ---------------------------------------------------------------------------

interface DirectorResponse {
  choices: Array<{ message: { content: string } }>;
}

// ---------------------------------------------------------------------------
// Outline-to-Scene Builder
// ---------------------------------------------------------------------------

export class OutlineSceneBuilder {
  private readonly directorUrl: string;
  private readonly model: string;
  private readonly timeoutMs: number;

  constructor(opts?: { directorUrl?: string; model?: string; timeoutMs?: number }) {
    this.directorUrl = opts?.directorUrl
      ?? process.env.NODE_B_DIRECTOR_URL
      ?? 'http://10.0.0.20:7339/v1';
    this.model = opts?.model
      ?? process.env.NODE_B_DIRECTOR_MODEL
      ?? 'local-director';
    this.timeoutMs = opts?.timeoutMs ?? 45_000;
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  /**
   * Build Foundry VTT scene configs from a campaign outline.
   * Groups beats into scenes (one scene per 1-3 beats) and calls the Director
   * once per group to generate lighting, positioning, and narrative notes.
   */
  async build(outline: CampaignOutline): Promise<OutlineSceneBuildResult> {
    const validated = CampaignOutlineSchema.parse(outline);
    const beatGroups = this.groupBeats(validated.beats);
    const scenes: SceneConfig[] = [];
    const reasoningParts: string[] = [];

    for (const group of beatGroups) {
      const { scene, reasoning } = await this.buildScene(validated, group);
      scenes.push(scene);
      reasoningParts.push(reasoning);
    }

    return OutlineSceneBuildResultSchema.parse({
      outlineTitle: validated.title,
      actNumber: validated.actNumber,
      scenes,
      reasoning: reasoningParts.join('\n\n---\n\n'),
    });
  }

  // ── Private pipeline steps ─────────────────────────────────────────────────

  /** Group beats into scene slices of 1-3 each */
  private groupBeats(beats: ActBeat[]): ActBeat[][] {
    const groups: ActBeat[][] = [];
    for (let i = 0; i < beats.length; i += 3) {
      groups.push(beats.slice(i, i + 3));
    }
    return groups;
  }

  /** Build one scene config from a beat group via the Director */
  private async buildScene(
    outline: CampaignOutline,
    beats: ActBeat[],
  ): Promise<{ scene: SceneConfig; reasoning: string }> {
    const prompt = this.buildPrompt(outline, beats);
    const raw = await this.callDirector(prompt);
    return this.parseDirectorResponse(raw, beats);
  }

  /** Construct the Director prompt for scene generation */
  private buildPrompt(outline: CampaignOutline, beats: ActBeat[]): string {
    const beatBlock = beats
      .map(b =>
        `- ID: ${b.id}\n  Location: ${b.location}\n  Tension: ${b.tension}\n  NPCs: ${b.npcCount}\n  Description: ${b.description}`,
      )
      .join('\n');

    const gmBlock = outline.gmNotes ? `GM Notes: ${outline.gmNotes}\n` : '';

    return [
      `You are the Sovereign Director — the narrative heart of the Sovereign Trinity.`,
      `Campaign: "${outline.title}" (Act ${outline.actNumber})`,
      gmBlock,
      `Generate a Foundry VTT scene configuration for the following narrative beats:`,
      beatBlock,
      ``,
      `Respond ONLY with a valid JSON object matching this schema:`,
      `{`,
      `  "name": string,`,
      `  "backgroundColor": "#rrggbb",`,
      `  "width": number (2000-8000),`,
      `  "height": number (2000-6000),`,
      `  "darkness": number (0.0-1.0, higher = darker, reflect tension),`,
      `  "tokenStartPositions": [{ "beatId": string, "x": number, "y": number }],`,
      `  "lights": [{ "x": number, "y": number, "bright": number, "dim": number, "color": "#rrggbb" }],`,
      `  "narrativeNotes": string (GM-facing scene notes, 2-4 sentences, Cyberpunk RED tone),`,
      `  "sourceBeatIds": [string],`,
      `  "reasoning": string (chain-of-thought for your design decisions)`,
      `}`,
    ].filter(Boolean).join('\n');
  }

  /** POST to the Director's OpenAI-compatible /v1/chat/completions */
  private async callDirector(prompt: string): Promise<string> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const res = await fetch(`${this.directorUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.7,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        throw new Error(`Director responded ${res.status}: ${await res.text()}`);
      }

      const data = (await res.json()) as DirectorResponse;
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('Director returned empty content');
      return content;
    } finally {
      clearTimeout(timer);
    }
  }

  /** Parse and validate the Director's JSON response */
  private parseDirectorResponse(
    raw: string,
    beats: ActBeat[],
  ): { scene: SceneConfig; reasoning: string } {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      throw new Error(`Director response was not valid JSON: ${raw.slice(0, 200)}`);
    }

    const reasoning = typeof parsed.reasoning === 'string' ? parsed.reasoning : '';
    const sceneData = { ...parsed };
    delete sceneData.reasoning;

    // Apply tension-based darkness fallback if Director omitted it
    if (typeof sceneData.darkness !== 'number') {
      const maxTension = beats.reduce((max, b) => {
        const t = { low: 0.2, medium: 0.5, high: 0.75, critical: 0.95 }[b.tension] ?? 0.5;
        return Math.max(max, t);
      }, 0.2);
      sceneData.darkness = maxTension;
    }

    // Ensure sourceBeatIds is populated
    if (!Array.isArray(sceneData.sourceBeatIds)) {
      sceneData.sourceBeatIds = beats.map(b => b.id);
    }

    const scene = SceneConfigSchema.parse(sceneData);
    return { scene, reasoning };
  }

  /** Health check — confirms Director is reachable */
  async isHealthy(): Promise<boolean> {
    try {
      const res = await fetch(`${this.directorUrl}/models`, { signal: AbortSignal.timeout(3_000) });
      return res.ok;
    } catch {
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton factory
// ---------------------------------------------------------------------------

let _builder: OutlineSceneBuilder | null = null;

export function getOutlineSceneBuilder(): OutlineSceneBuilder {
  if (!_builder) _builder = new OutlineSceneBuilder();
  return _builder;
}
