/**
 * scripts/audit/interaction-auditor.ts
 *
 * Phase 56: Dry Fire Audit — Cross-System Interaction Auditor
 *
 * Tests dry-run connections between component pairs without triggering
 * live API calls, CDP connections, or asset generation.
 *
 * Supported pairs:
 *   AtlasForge    → NanoBanana       (tile generation pipeline)
 *   NucleusAssembler → MotorCortex   (manifestation pipeline)
 */

import 'dotenv/config';

export interface InteractionResult {
  source: string;
  target: string;
  passed: boolean;
  checks: Record<string, string>;
  error?: string;
}

async function verifyAtlasForge_NanoBanana(): Promise<InteractionResult> {
  const checks: Record<string, string> = {};
  try {
    // AtlasForge instantiation requires NanoBanana internally
    const { AtlasForge } = await import('../../scripts/forge/atlas-forge.js');
    checks['AtlasForge_module'] = 'loaded';

    // Verify AtlasForge exposes forgeTile and auditTile methods
    const forge = new AtlasForge();
    if (typeof forge.forgeTile !== 'function') {
      return { source: 'AtlasForge', target: 'NanoBanana', passed: false, checks, error: 'forgeTile method missing' };
    }
    checks['forgeTile'] = 'method present';

    if (typeof forge.auditTile !== 'function') {
      return { source: 'AtlasForge', target: 'NanoBanana', passed: false, checks, error: 'auditTile method missing' };
    }
    checks['auditTile'] = 'method present';

    // Verify a known tile ID resolves in the topology lib
    const { getTileById } = await import('../../scripts/forge/topology-lib/index.js');
    const tile = getTileById('hub');
    if (!tile) {
      return { source: 'AtlasForge', target: 'NanoBanana', passed: false, checks, error: 'Topology tile "hub" not found' };
    }
    checks['topologyResolution'] = `hub resolved (${tile.exits.length} exits)`;

    // Verify the skeleton PNG path exists (forge input)
    const { existsSync } = await import('node:fs');
    if (!existsSync(tile.pngPath)) {
      return { source: 'AtlasForge', target: 'NanoBanana', passed: false, checks, error: `Skeleton PNG missing: ${tile.pngPath}` };
    }
    checks['skeletonPNG'] = 'exists';

    return { source: 'AtlasForge', target: 'NanoBanana', passed: true, checks };
  } catch (err) {
    return { source: 'AtlasForge', target: 'NanoBanana', passed: false, checks, error: (err as Error).message };
  }
}

async function verifyNucleusAssembler_MotorCortex(): Promise<InteractionResult> {
  const checks: Record<string, string> = {};
  try {
    const { NucleusAssembler } = await import('../../scripts/forge/assembler.js');
    checks['NucleusAssembler_module'] = 'loaded';

    const assembler = new NucleusAssembler();
    if (typeof assembler.manifestMap !== 'function') {
      return { source: 'NucleusAssembler', target: 'MotorCortex', passed: false, checks, error: 'manifestMap method missing' };
    }
    checks['manifestMap'] = 'method present';

    // Dry-run: call manifestMap with a known preset; it logs but does not open CDP
    const { LAYOUT_PRESETS } = await import('../../scripts/forge/blueprint-engine.js');
    const preset = LAYOUT_PRESETS.find(p => p.id === 'corridor-strip-1x3');
    if (!preset) {
      return { source: 'NucleusAssembler', target: 'MotorCortex', passed: false, checks, error: 'corridor-strip-1x3 preset not found' };
    }
    checks['presetResolution'] = `${preset.label} found`;

    // Simulate the manifestation (NucleusAssembler.manifestMap is already a dry-run/console logger)
    await assembler.manifestMap('corridor-strip-1x3');
    checks['manifestSimulation'] = 'completed without error';

    return { source: 'NucleusAssembler', target: 'MotorCortex', passed: true, checks };
  } catch (err) {
    return { source: 'NucleusAssembler', target: 'MotorCortex', passed: false, checks, error: (err as Error).message };
  }
}

async function verifyUnifiedOracle_AkashikDB(): Promise<InteractionResult> {
  const checks: Record<string, string> = {};
  const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
  try {
    const { UnifiedOracleClient } = await import('../stubs.js');
    checks['module'] = 'loaded';
    const client = new UnifiedOracleClient({ worldDbPath: AKASHIK_DB, crushDbPath: './data/crush.db' });
    await client.connect();
    checks['connect'] = 'OK';
    const health = await client.healthCheck();
    checks['healthCheck'] = health.connected ? 'connected' : 'disconnected';
    if (!health.connected) {
      await client.disconnect();
      return { source: 'UnifiedOracle', target: 'AkashikDB', passed: false, checks, error: 'healthCheck reports disconnected' };
    }
    const friction = await client.getFactionFriction('NODESTADT').catch(() => -1);
    checks['queryExecution'] = friction >= 0 ? `friction=${friction.toFixed(2)}` : 'no faction row (OK)';
    await client.disconnect();
    return { source: 'UnifiedOracle', target: 'AkashikDB', passed: true, checks };
  } catch (err) {
    return { source: 'UnifiedOracle', target: 'AkashikDB', passed: false, checks, error: (err as Error).message };
  }
}

async function verifyST3GG_PNGCodec(): Promise<InteractionResult> {
  const checks: Record<string, string> = {};
  try {
    const { SteganographyService } = await import('../stubs.js');
    checks['module'] = 'loaded';

    // Use an existing known-good anchor PNG as a round-trip test target
    const { readdirSync, existsSync } = await import('node:fs');
    const anchorsDir = './data/assets/anchors';
    if (!existsSync(anchorsDir)) {
      return { source: 'ST3GG', target: 'PNGCodec', passed: false, checks, error: 'anchors dir missing — run forge:ingest first' };
    }
    const pngs = readdirSync(anchorsDir).filter(f => f.endsWith('.png'));
    if (pngs.length === 0) {
      return { source: 'ST3GG', target: 'PNGCodec', passed: false, checks, error: 'No PNG anchors found — run forge:ingest first' };
    }
    checks['anchorPNGs'] = `${pngs.length} available`;

    const { tmpdir } = await import('node:os');
    const { join } = await import('node:path');
    const src = join(anchorsDir, pngs[0]!);
    const out = join(tmpdir(), `st3gg-dryfire-${Date.now()}.png`);
    const secret = JSON.stringify({ test: 'dry-fire', ts: Date.now() });

    const svc = new SteganographyService();
    await svc.encodeSecret(src, out, secret);
    checks['encode'] = 'OK';

    const decoded = await svc.decodeSecret(out);
    checks['decode'] = decoded.includes('dry-fire') ? 'round-trip OK' : 'data mismatch';
    if (!decoded.includes('dry-fire')) {
      return { source: 'ST3GG', target: 'PNGCodec', passed: false, checks, error: 'Decoded payload does not match encoded secret' };
    }

    // Cleanup
    const { unlink } = await import('node:fs/promises');
    await unlink(out).catch(() => {});

    return { source: 'ST3GG', target: 'PNGCodec', passed: true, checks };
  } catch (err) {
    return { source: 'ST3GG', target: 'PNGCodec', passed: false, checks, error: (err as Error).message };
  }
}

const INTERACTION_MAP: Record<string, () => Promise<InteractionResult>> = {
  'AtlasForge→NanoBanana':          verifyAtlasForge_NanoBanana,
  'NucleusAssembler→MotorCortex':   verifyNucleusAssembler_MotorCortex,
  'UnifiedOracle→AkashikDB':        verifyUnifiedOracle_AkashikDB,
  'ST3GG→PNGCodec':                 verifyST3GG_PNGCodec,
};

export async function verifyInteraction(source: string, target: string): Promise<boolean> {
  const key = `${source}→${target}`;
  const verifier = INTERACTION_MAP[key];
  if (!verifier) return false;
  const result = await verifier();
  return result.passed;
}

export async function verifyInteractionDetail(source: string, target: string): Promise<InteractionResult> {
  const key = `${source}→${target}`;
  const verifier = INTERACTION_MAP[key];
  if (!verifier) {
    return { source, target, passed: false, checks: {}, error: `Unknown interaction pair: ${key}` };
  }
  return verifier();
}

export async function auditAllInteractions(): Promise<InteractionResult[]> {
  const results: InteractionResult[] = [];
  for (const verifier of Object.values(INTERACTION_MAP)) {
    results.push(await verifier());
  }
  return results;
}
