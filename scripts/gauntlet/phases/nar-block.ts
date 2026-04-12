// scripts/gauntlet/phases/nar-block.ts
// NARRATIVE Block shards — Phases 6, 9, 12, 19, 20, 21, 22N
// Verifies: Story Engine state, NPC engrams, conlang, prompt anchors, narrative buffer
// Note: phase 5 narrative aspect (rules+lore overlap) covered by mech-block phase5

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';

function pass(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'NARRATIVE', status: 'PASS', message: msg, details };
}
function fail(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'NARRATIVE', status: 'FAIL', message: msg, details };
}
function warn(id: number, name: string, msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: id, phaseName: name, block: 'NARRATIVE', status: 'WARN', message: msg, details };
}
function skip(id: number, name: string, msg: string): AuditResult {
  return { phaseId: id, phaseName: name, block: 'NARRATIVE', status: 'SKIP', message: msg };
}

// ── Phase 6: Story Engine State ───────────────────────────────────────────────
export const phase6: SovereignShard = {
  metadata: { id: 6, name: 'Story-Engine', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(6, 'Story-Engine', 'world.db not available');
    try {
      // Check if system_state has story engine keys
      const storyKeys = ctx.db
        .prepare("SELECT key, value FROM system_state WHERE key LIKE 'story%' OR key LIKE 'arc%' OR key LIKE 'beat%'")
        .all() as { key: string; value: string }[];

      // Check for NPCs (narrative subjects)
      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasNpcs = tables.includes('npcs');
      const npcCount = hasNpcs
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM npcs').get() as { c: number }).c
        : 0;

      if (storyKeys.length === 0 && npcCount === 0) {
        return warn(6, 'Story-Engine', 'No story state or NPC records — narrative engine not yet seeded');
      }

      const currentArc = storyKeys.find(r => r.key === 'story_current_arc')?.value ?? null;
      return pass(6, 'Story-Engine', `${npcCount} NPCs | ${storyKeys.length} story keys | arc=${currentArc ?? 'unset'}`, {
        storyKeys: storyKeys.map(r => r.key),
        npcCount,
        currentArc,
      });
    } catch (e) {
      return fail(6, 'Story-Engine', `Story state query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 9: NPC Engrams (Soulkiller / Memory Palace) ────────────────────────
export const phase9: SovereignShard = {
  metadata: { id: 9, name: 'NPC-Engrams', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(9, 'NPC-Engrams', 'world.db not available');
    try {
      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasNpcLogs = tables.includes('npc_logs');
      const hasPalaceRooms = tables.includes('palace_rooms');

      if (!hasNpcLogs && !hasPalaceRooms) {
        return warn(9, 'NPC-Engrams', 'npc_logs and palace_rooms missing — engram system not initialized');
      }

      const npcLogCount = hasNpcLogs
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM npc_logs').get() as { c: number }).c
        : 0;

      // Check vision_history for stored engram snapshots
      const hasVisionHistory = tables.includes('vision_history');
      const visionCount = hasVisionHistory
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM vision_history').get() as { c: number }).c
        : 0;

      if (npcLogCount === 0 && visionCount === 0) {
        return warn(9, 'NPC-Engrams', 'Engram tables present but empty — no engrams captured yet', {
          npcLogCount,
          visionCount,
        });
      }
      return pass(9, 'NPC-Engrams', `${npcLogCount} NPC log entries | ${visionCount} vision engrams`, {
        npcLogCount,
        visionCount,
      });
    } catch (e) {
      return fail(9, 'NPC-Engrams', `Engram query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 12: Conlang Mutation ────────────────────────────────────────────────
export const phase12: SovereignShard = {
  metadata: { id: 12, name: 'Conlang-Mutation', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(12, 'Conlang-Mutation', 'world.db not available');
    try {
      // Conlang/leet mutation is in the library_entries or triplets
      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasLibrary = tables.includes('library_entries');
      const hasTriplets = tables.includes('triplets');

      if (!hasLibrary && !hasTriplets) {
        return warn(12, 'Conlang-Mutation', 'library_entries and triplets tables missing');
      }

      const tripletCount = hasTriplets
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM triplets').get() as { c: number }).c
        : 0;
      const libraryCount = hasLibrary
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM library_entries').get() as { c: number }).c
        : 0;

      // Check if the journal corruption state is stored (leet-speak mutation flag)
      const leetState = ctx.db
        .prepare("SELECT value FROM system_state WHERE key = 'journal_corruption_active'")
        .get() as { value: string } | undefined;

      const details: Record<string, unknown> = {
        tripletCount,
        libraryCount,
        leetActive: leetState?.value ?? 'unset',
      };

      if (tripletCount === 0 && libraryCount === 0) {
        return warn(12, 'Conlang-Mutation', 'Lore triplets and library empty — conlang corpus not seeded', details);
      }
      return pass(12, 'Conlang-Mutation', `${tripletCount} triplets | ${libraryCount} library entries | leet=${leetState?.value ?? 'unset'}`, details);
    } catch (e) {
      return fail(12, 'Conlang-Mutation', `Conlang query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 19: Narrative Seeding (Chronicle Seeds) ────────────────────────────
export const phase19: SovereignShard = {
  metadata: { id: 19, name: 'Narrative-Seeding', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(19, 'Narrative-Seeding', 'world.db not available');
    try {
      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasChronicle = tables.includes('chronicle_seeds');
      const hasMissions = tables.includes('missions');
      const hasDistrict = tables.includes('district_dna') || tables.includes('district_grid');

      if (!hasChronicle) {
        return fail(19, 'Narrative-Seeding', 'chronicle_seeds table missing');
      }

      const chronicleCount = (ctx.db.prepare('SELECT COUNT(*) as c FROM chronicle_seeds').get() as { c: number }).c;
      const missionCount = hasMissions
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM missions').get() as { c: number }).c
        : -1;

      if (chronicleCount === 0) {
        return warn(19, 'Narrative-Seeding', `chronicle_seeds empty | ${missionCount} missions`, {
          chronicleCount, missionCount, hasDistrict,
        });
      }
      return pass(19, 'Narrative-Seeding', `${chronicleCount} chronicles | ${missionCount} missions | district=${hasDistrict}`, {
        chronicleCount, missionCount, hasDistrict,
      });
    } catch (e) {
      return fail(19, 'Narrative-Seeding', `Seeding query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 20: Prompt Anchors (AAAK / Lore RAG) ───────────────────────────────
export const phase20: SovereignShard = {
  metadata: { id: 20, name: 'Prompt-Anchors', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    if (!ctx.db) return skip(20, 'Prompt-Anchors', 'world.db not available');
    try {
      // AAAK compression uses palace_context.json + triplets FTS
      const { existsSync } = await import('node:fs');
      const palaceContextPath = process.env['PALACE_CONTEXT_PATH'] ?? './data/palace_context.json';
      const palaceContextExists = existsSync(palaceContextPath);

      const tables = (ctx.db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all() as { name: string }[]).map(r => r.name);
      const hasFts = tables.includes('triplets_fts');
      const tripletCount = tables.includes('triplets')
        ? (ctx.db.prepare('SELECT COUNT(*) as c FROM triplets').get() as { c: number }).c
        : 0;

      const details: Record<string, unknown> = {
        palaceContextExists,
        hasFts,
        tripletCount,
      };

      if (!palaceContextExists && tripletCount === 0) {
        return warn(20, 'Prompt-Anchors', 'palace_context.json missing and triplets empty — AAAK anchors not seeded', details);
      }
      return pass(20, 'Prompt-Anchors', `palace_context=${palaceContextExists} | ${tripletCount} FTS triplets | fts=${hasFts}`, details);
    } catch (e) {
      return fail(20, 'Prompt-Anchors', `Prompt anchor query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};

// ── Phase 21: Narrative Buffer Depth ─────────────────────────────────────────
export const phase21: SovereignShard = {
  metadata: { id: 21, name: 'Narrative-Buffer', block: 'NARRATIVE' },

  async audit(ctx: GauntletContext): Promise<AuditResult> {
    // Verify Node B narrative client is reachable and has model context capacity
    const nodeBUrl = process.env['OLLAMA_BASE_URL'] ?? 'http://localhost:8080/v1';
    const health = await ctx.vision.healthCheck().catch(() => ({ nodeA: false, nodeB: false }));

    if (!health.nodeB) {
      return warn(21, 'Narrative-Buffer', 'Node B (narrative engine) offline — buffer unavailable');
    }

    try {
      // Check model context size advertised by Node B
      const res = await fetch(`${nodeBUrl}/models`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json() as { data?: Array<{ id: string; context_length?: number }> };
      const models = data.data ?? [];
      const ctxLength = models[0]?.context_length ?? parseInt(process.env['OLLAMA_NUM_CTX'] ?? '0', 10);
      const targetCtx = 32768;

      if (ctxLength > 0 && ctxLength < targetCtx) {
        return warn(21, 'Narrative-Buffer', `Node B context ${ctxLength} < target ${targetCtx}`, {
          models: models.map(m => m.id),
          ctxLength,
          targetCtx,
        });
      }
      return pass(21, 'Narrative-Buffer', `Node B online | ctx=${ctxLength || process.env['OLLAMA_NUM_CTX'] || 'default'}`, {
        modelCount: models.length,
        ctxLength: ctxLength || process.env['OLLAMA_NUM_CTX'],
      });
    } catch (e) {
      return warn(21, 'Narrative-Buffer', `Node B model query failed: ${(e as Error).message}`);
    }
  },

  async manifest(_ctx: GauntletContext, _intent: unknown): Promise<void> { /* noop */ },
  async onDrift(_ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> { /* noop */ },
};
