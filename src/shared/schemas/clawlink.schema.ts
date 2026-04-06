/**
 * src/shared/schemas/clawlink.schema.ts
 *
 * Zero-Trust Zod schemas for all data structures crossing the ClawLink
 * SSH transport (Node B → Node A → Node B).
 *
 * Per CLAUDE.md §9: "Treat all JSON payloads returning from the Nitro 5
 * MCP tools as untrusted user input. You MUST validate all Node A outputs
 * using strict schema validation (e.g., Zod) before injecting them into
 * the Node B state."
 *
 * These schemas mirror the Rust structs in:
 *   zeroclaw/src/db/search.rs   (SearchResult)
 *   zeroclaw/src/math/interlock.rs  (InterlockRoll, AttackResult, DamageResult)
 *   zeroclaw/src/server/rpc.rs  (RpcResponse)
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

/**
 * Mirrors `SearchResult` in zeroclaw/src/db/search.rs.
 */
export const ClawLinkSearchResultSchema = z.object({
  id: z.string().min(1),
  source_ref: z.string(),
  namespace: z.enum(['core_rules', 'campaign_ttta', 'entities_mooks']),
  context_type: z.enum(['mechanic', 'lore']),
  section_heading: z.string(),
  page_start: z.number().int(),
  page_end: z.number().int(),
  content: z.string().min(1),
  chunk_index: z.number().int().nonnegative(),
  score: z.number(),
});

export const ClawLinkSearchResultsSchema = z.array(ClawLinkSearchResultSchema);

export type ClawLinkSearchResult = z.infer<typeof ClawLinkSearchResultSchema>;

// ── resolve_attack result ─────────────────────────────────────────────────────

/**
 * Mirrors `InterlockRoll` in zeroclaw/src/math/interlock.rs.
 */
export const ClawLinkInterlockRollSchema = z.object({
  dice: z.array(z.number().int()).min(1),
  total: z.number().int(),
  is_critical_success: z.boolean(),
  is_critical_failure: z.boolean(),
});

/**
 * Mirrors `AttackResult` in zeroclaw/src/math/interlock.rs.
 */
export const ClawLinkAttackResultSchema = z.object({
  roll: ClawLinkInterlockRollSchema,
  stat: z.number().int(),
  skill: z.number().int(),
  dv: z.number().int(),
  attack_total: z.number().int(),
  hit: z.boolean(),
});

export type ClawLinkAttackResult = z.infer<typeof ClawLinkAttackResultSchema>;

// ── resolve_damage result ─────────────────────────────────────────────────────

/**
 * Mirrors `DamageResult` in zeroclaw/src/math/interlock.rs.
 */
export const ClawLinkDamageResultSchema = z.object({
  dice: z.array(z.number().int()).min(1),
  bonus: z.number().int(),
  raw: z.number().int(),
  armour_sp: z.number().int().nonnegative(),
  final_damage: z.number().int().nonnegative(),
});

export type ClawLinkDamageResult = z.infer<typeof ClawLinkDamageResultSchema>;

// ── ClawLinkClient config schema ──────────────────────────────────────────────

export const ClawLinkConfigSchema = z.object({
  /**
   * Unix socket path for the crush proxy daemon.
   * Default: /run/crush/clawlink.sock
   * Proxy must be started with `crush proxy` before connecting.
   */
  socketPath: z.string().min(1).default('/run/crush/clawlink.sock'),
  /** Host for TCP connection (testing/remote) */
  host: z.string().optional(),
  /** Port for TCP connection (testing/remote) */
  port: z.number().int().optional(),
  /** Per-request RPC timeout in milliseconds (default: 5000). */
  timeoutMs: z.number().int().min(1).optional(),
});

export type ClawLinkConfig = z.infer<typeof ClawLinkConfigSchema>;
