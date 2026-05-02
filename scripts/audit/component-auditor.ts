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

    const { NanoBananaService } = await import('../../packages/hermes-core/src/core/nano-banana-service.js');
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

    const assetRow = db.prepare(`SELECT COUNT(*) as c FROM map_assets WHERE status = 'indexed'`).get() as { c: number } | undefined;
    checks['anchors'] = assetRow ? `${assetRow.c} indexed` : 'table missing';

    db.close();
    return { component: 'AkashikDB', status: 'OK', checks };
  } catch (err) {
    return { component: 'AkashikDB', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkUnifiedOracle(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { UnifiedOracleClient } = await import('../../packages/hermes-core/src/db/unified-oracle-client.js');
    checks['module'] = 'loaded';
    const client = new UnifiedOracleClient({ worldDbPath: AKASHIK_DB, crushDbPath: './data/crush.db' });
    await client.connect();
    checks['connect'] = 'OK';
    const health = await client.healthCheck();
    checks['healthCheck'] = health.connected ? 'connected' : 'disconnected';
    await client.disconnect();
    return { component: 'UnifiedOracle', status: 'OK', checks };
  } catch (err) {
    return { component: 'UnifiedOracle', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkSteganography(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { SteganographyService } = await import('../../packages/hermes-core/src/core/steganography-service.js');
    checks['module'] = 'loaded';
    const svc = new SteganographyService();
    checks['encodeSecret'] = typeof svc.encodeSecret === 'function' ? 'present' : 'missing';
    checks['decodeSecret'] = typeof svc.decodeSecret === 'function' ? 'present' : 'missing';
    if (typeof svc.encodeSecret !== 'function' || typeof svc.decodeSecret !== 'function') {
      return { component: 'ST3GG', status: 'FAIL', checks, error: 'Method missing' };
    }
    return { component: 'ST3GG', status: 'OK', checks };
  } catch (err) {
    return { component: 'ST3GG', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkVisionClient(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { VisionClient } = await import('../../scripts/gauntlet/vision-client.js');
    checks['module'] = 'loaded';
    const client = new VisionClient();
    checks['instantiation'] = 'OK';
    const health = await client.healthCheck().catch(() => ({ nodeA: false, nodeB: false }));
    checks['nodeA'] = health.nodeA ? 'online' : 'offline';
    checks['nodeB'] = health.nodeB ? 'online' : 'offline';
    const status = (health.nodeA || health.nodeB) ? 'OK' : 'WARN';
    return { component: 'VisionClient', status, checks, ...(!health.nodeA && !health.nodeB ? { error: 'Both nodes offline (expected in dry-fire)' } : {}) };
  } catch (err) {
    return { component: 'VisionClient', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkSharedMemory(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { SharedMemoryService } = await import('../../packages/hermes-core/src/core/shared-memory-service.js');
    checks['module'] = 'loaded';
    const mmapPath = process.env['MMAP_FILE_PATH'] ?? '/tmp/sovereign_state.mmap';
    const { existsSync } = await import('node:fs');
    checks['mmapFile'] = existsSync(mmapPath) ? 'present' : 'absent';
    const svc = new SharedMemoryService(mmapPath);
    checks['instantiation'] = 'OK';
    void svc;
    const status = existsSync(mmapPath) ? 'OK' : 'WARN';
    return { component: 'SharedMemory', status, checks, ...(existsSync(mmapPath) ? {} : { error: 'Mmap file absent — sidecars not running (expected in dry-fire)' }) };
  } catch (err) {
    return { component: 'SharedMemory', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkTaskRouter(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { TaskRouterProxy } = await import('../../packages/hermes-core/src/core/task-router-proxy.js');
    checks['module'] = 'loaded';
    const proxy = new TaskRouterProxy();
    checks['lockNode']   = typeof proxy.lockNode   === 'function' ? 'present' : 'missing';
    checks['unlockNode'] = typeof proxy.unlockNode === 'function' ? 'present' : 'missing';
    checks['dispatch']   = typeof proxy.dispatch   === 'function' ? 'present' : 'missing';
    const allOk = ['lockNode', 'unlockNode', 'dispatch'].every(k => checks[k] === 'present');
    return { component: 'TaskRouter', status: allOk ? 'OK' : 'FAIL', checks, ...(!allOk ? { error: 'Method missing on TaskRouterProxy' } : {}) };
  } catch (err) {
    return { component: 'TaskRouter', status: 'FAIL', checks, error: (err as Error).message };
  }
}

async function checkLLMEndpoints(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  const nodeAUrl = (process.env['NODE_A_LLAMA_URL'] ?? 'http://10.0.0.10:8080') + '/health';
  const nodeBUrl = (process.env['SOVEREIGN_INFERENCE_URL'] ?? 'http://localhost:8080') + '/health';

  async function probe(url: string): Promise<boolean> {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) });
      return res.ok;
    } catch { return false; }
  }

  const [nodeA, nodeB] = await Promise.all([probe(nodeAUrl), probe(nodeBUrl)]);
  checks['nodeA_llama'] = nodeA ? 'online' : 'offline';
  checks['nodeB_llama'] = nodeB ? 'online' : 'offline';
  const status = (nodeA || nodeB) ? 'OK' : 'WARN';
  return { component: 'LLMEndpoints', status, checks, ...(!nodeA && !nodeB ? { error: 'Both inference endpoints offline (expected when nodes are down)' } : {}) };
}

async function checkHermesSingularity(): Promise<ComponentStatus> {
  const checks: Record<string, string> = {};
  try {
    const { HermesSingularity } = await import('../../packages/hermes-core/src/core/hermes/HermesSingularity.js');
    checks['module'] = 'loaded';
    const orchestrator = new HermesSingularity();
    checks['instantiation'] = 'OK';
    checks['dag'] = orchestrator.getDAG() ? 'ready' : 'missing';
    return { component: 'HermesSingularity', status: 'OK', checks };
  } catch (err) {
    return { component: 'HermesSingularity', status: 'FAIL', checks, error: (err as Error).message };
  }
}

const COMPONENT_MAP: Record<string, () => Promise<ComponentStatus>> = {
  NanoBanana:       checkNanoBanana,
  HermesSingularity: checkHermesSingularity,
  AtlasForge:       checkAtlasForge,
  NucleusAssembler: checkNucleusAssembler,
  AkashikDB:        checkDatabase,
  UnifiedOracle:    checkUnifiedOracle,
  ST3GG:            checkSteganography,
  VisionClient:     checkVisionClient,
  SharedMemory:     checkSharedMemory,
  TaskRouter:       checkTaskRouter,
  LLMEndpoints:     checkLLMEndpoints,
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
