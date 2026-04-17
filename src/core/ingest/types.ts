/**
 * src/core/ingest/types.ts
 * Phase 57: Sovereign Mind Rebuild — Shared ingest types & Zod schemas.
 */

import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared result type emitted by every handler
// ---------------------------------------------------------------------------

export const IngestResultSchema = z.object({
  inserted: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),   // dedup hits
  errors: z.number().int().nonnegative(),
  source: z.string(),
});
export type IngestResult = z.infer<typeof IngestResultSchema>;

// ---------------------------------------------------------------------------
// chronicle_seeds row (canonical insert shape for Phase 57)
// ---------------------------------------------------------------------------

export const ChronicleSeedSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  content: z.string().min(1),
  source: z.string().min(1),
  category: z.string().min(1),
  era_grounding: z.string().default('2045'),
  district_id: z.string().nullable().default(null),
  semantic_hash: z.string().length(64), // SHA-256 hex
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
});
export type ChronicleSeed = z.infer<typeof ChronicleSeedSchema>;

// ---------------------------------------------------------------------------
// Foundry item row
// ---------------------------------------------------------------------------

export const FoundryItemSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: z.string().min(1),
  category: z.string().nullable().default(null),
  cost: z.number().int().default(0),
  weight: z.number().default(0),
  data_json: z.string().default('{}'),
  district_id: z.string().nullable().default(null),
  source: z.string().default('FOUNDRY'),
});
export type FoundryItem = z.infer<typeof FoundryItemSchema>;

// ---------------------------------------------------------------------------
// Foundry NPC row (maps to existing `npcs` table)
// ---------------------------------------------------------------------------

export const FoundryNpcSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  hp: z.number().int().default(0),
  sp: z.number().int().default(0),
  emp: z.number().int().default(0),
  humanity: z.number().int().default(0),
  faction: z.string().nullable().default(null),
  district_id: z.string().nullable().default(null),
  disposition: z.enum(['friendly', 'neutral', 'hostile']).default('neutral'),
  is_alive: z.boolean().default(true),
});
export type FoundryNpc = z.infer<typeof FoundryNpcSchema>;

// ---------------------------------------------------------------------------
// Semantic chunk (output of MarkdownChunker)
// ---------------------------------------------------------------------------

export interface SemanticChunk {
  breadcrumb: string;   // e.g. "Night City > Watson > Little China"
  heading: string;      // immediate heading text
  content: string;      // chunk body
  wordCount: number;
}

// ---------------------------------------------------------------------------
// Handler contract
// ---------------------------------------------------------------------------

export interface IIngestHandler {
  readonly name: string;
  canHandle(source: string): boolean;
  run(source: string): Promise<IngestResult>;
}
