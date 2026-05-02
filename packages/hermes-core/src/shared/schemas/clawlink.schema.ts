/**
 * src/shared/schemas/clawlink.schema.ts
 *
 * ◈ CLAWLINK_SCHEMA : Clean BASE
 *
 * Zero-Trust Zod schemas for all data structures crossing the ClawLink
 * SSH transport (Node B → Node A → Node B).
 */

import { z } from 'zod';

// ── Inbound request envelope ──────────────────────────────────────────────────

export const ClawLinkRpcRequestSchema = z.object({
  id: z.string().min(1),
  method: z.string().min(1),
  params: z.record(z.unknown()),
});

// ── Outbound response envelope ────────────────────────────────────────────────

export const ClawLinkRpcResponseSchema = z.object({
  id: z.string().min(1),
  result: z.unknown().nullish(),
  error: z.string().nullish(),
});

export type ClawLinkRpcResponse = z.infer<typeof ClawLinkRpcResponseSchema>;

// ── hybrid_search result ──────────────────────────────────────────────────────

export const ClawLinkSearchResultSchema = z.object({
  id: z.string().min(1),
  source_ref: z.string(),
  namespace: z.string(),
  context_type: z.string(),
  section_heading: z.string(),
  page_start: z.number().int(),
  page_end: z.number().int(),
  content: z.string().min(1),
  chunk_index: z.number().int().nonnegative(),
  score: z.number(),
});

export const ClawLinkSearchResultsSchema = z.array(ClawLinkSearchResultSchema);

export type ClawLinkSearchResult = z.infer<typeof ClawLinkSearchResultSchema>;

// ── ClawLinkClient config schema ──────────────────────────────────────────────

export const ClawLinkConfigSchema = z.object({
  socketPath: z.string().min(1).default('/run/crush/clawlink.sock'),
  host: z.string().optional(),
  port: z.number().int().optional(),
  timeoutMs: z.number().int().min(1).optional(),
});

export type ClawLinkConfig = z.infer<typeof ClawLinkConfigSchema>;
