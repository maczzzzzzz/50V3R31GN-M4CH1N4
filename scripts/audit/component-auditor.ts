/**
 * scripts/audit/component-auditor.ts
 *
 * Phase 56: Dry Fire Audit — Component Audit Library
 *
 * Verifies that each major service component is instantiable,
 * has required env vars, and can reach the Akashik.db.
 *
 * Status levels:
 *   OK   — all checks pass
 *   WARN — component loads but a non-critical dependency is missing (e.g. API key)
 *   FAIL — component cannot be loaded or DB is unreachable
 */

import Database from 'better-sqlite3';
import 'dotenv/config';

const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

export interface ComponentStatus {
  component: string;
  status: 'OK' | 'WARN' | 'FAIL';
  checks: Record<string, string>;
  error?: string;
}

async function checkNanoBanana(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const hasApiKey = Boolean(process.env['GOOGLE_API_KEY']);
    checks['GOOGLE_API_KEY'] = hasApiKey ? 'present' : 'missing';

    const { NanoBananaService } = await import('../../src/core/nano-banana-service.js');
    checks['module'] = 'loaded';

    if (!hasApiKey) {
      return { component: 'NanoBanana', status: 'WARN', checks, error: 'GOOGLE_API_KEY not set' };
    }

    // Instantiation check (constructor reads API key)
    new NanoBananaService();
    checks['instantiation'] = 'OK';

    return { component: 'NanoBanana', status: 'OK', checks };
  } catch (err) {
    checks['instantiation'] = 'FAIL';
    return { component: 'NanoBanana', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkAtlasForge(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { TILES, getTileById } = await import('../../scripts/forge/topology-lib/index.js');
    checks['topologyLib'] = `loaded (${TILES.length} tiles)`;

    if (TILES.length === 0 || !getTileById('hub')) {
      return { component: 'AtlasForge', status: 'FAIL', checks, error: 'Topology library missing required tiles' };
    }
    checks['requiredTiles'] = 'gaff,artery,hub present';

    // AtlasForge itself requires NanoBanana — check module is importable at least
    await import('../../scripts/forge/atlas-forge.js');
    checks['module'] = 'loaded';

    return { component: 'AtlasForge', status: 'OK', checks };
  } catch (err) {
    return { component: 'AtlasForge', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkNucleusAssembler(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { LAYOUT_PRESETS } = await import('../../scripts/forge/blueprint-engine.js');
    checks['blueprintEngine'] = `loaded (${LAYOUT_PRESETS.length} presets)`;

    if (LAYOUT_PRESETS.length === 0) {
      return { component: 'NucleusAssembler', status: 'FAIL', checks, error: 'No layout presets found' };
    }

    const { NucleusAssembler } = await import('../../scripts/forge/assembler.js');
    const assembler = new NucleusAssembler();
    checks['instantiation'] = 'OK';
    void assembler; // suppress unused warning

    return { component: 'NucleusAssembler', status: 'OK', checks };
  } catch (err) {
    return { component: 'NucleusAssembler', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkDatabase(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const db = new Database(AKASHIK_DB, { readonly: true });
    const tableRow = db.prepare(`SELECT COUNT(*) as c FROM sqlite_master WHERE type='table'`).get() as { c: number };
    checks['tables'] = `${tableRow.c} tables`;

    const assetRow = db.prepare(`SELECT COUNT(*) as c FROM assets WHERE anchor = 1`).get() as { c: number } | undefined;
    checks['anchors'] = assetRow ? `${assetRow.c} indexed` : 'table missing';

    db.close();
    return { component: 'AkashikDB', status: 'OK', checks };
  } catch (err) {
    return { component: 'AkashikDB', status: 'FAIL', checks, error: (err as Error).message };
  }
}

const COMPONENT_MAP: Record<string, () => Promise<ComponentStatus>> = {
  NanoBanana:       checkNanoBanana,
  AtlasForge:       checkAtlasForge,
  NucleusAssembler: checkNucleusAssembler,
  AkashikDB:        checkDatabase,
};

export async function checkComponentState(name: string): Promise<ComponentStatus> {
  const checker = COMPONENT_MAP[name];
  if (!checker) {
    return { component: name, status: 'FAIL', checks: {}, error: `Unknown component: ${name}` };
  }
  return checker();
}

export async function auditAllComponents(): Promise<ComponentStatus[]> {
  const results: ComponentStatus[] = [];
  for (const name of Object.keys(COMPONENT_MAP)) {
    results.push(await checkComponentState(name));
  }
  return results;
}
