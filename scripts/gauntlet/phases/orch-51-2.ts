// scripts/gauntlet/phases/orch-51-2.ts
// Phase 51.2: Headless Heartbeat — Ability Shard
// Probes Mmap slots 4000 (atlas) and 4001 (cyberdeck) in data/heartbeat.mem.
// onDrift: 2-stage repair — SIGUSR1 signal first, then full process restart.

import type { SovereignShard, GauntletContext, AuditResult } from '../types.js';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

const PHASE_ID         = 512;
const PHASE_NAME       = 'Headless-Heartbeat';
const BLOCK            = 'ORCHESTRATION';
const HB_FILE          = 'data/heartbeat.mem';
const MAX_DELTA_MS     = 100;       // shard FAILs if delta > 100ms
const WARN_DELTA_MS    = 50;        // shard WARNs if delta > 50ms

function pass(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'PASS', message: msg, details };
}
function fail(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'FAIL', message: msg, details };
}
function warn(msg: string, details?: Record<string, unknown>): AuditResult {
  return { phaseId: PHASE_ID, phaseName: PHASE_NAME, block: BLOCK, status: 'WARN', message: msg, details };
}

/** Read u64 LE from a Buffer at the given byte offset. */
function readU64LE(buf: Buffer, offset: number): bigint {
  return buf.readBigUInt64LE(offset);
}

/** Get current time in milliseconds as bigint. */
function nowMs(): bigint {
  return BigInt(Date.now());
}

export const phase512: SovereignShard = {
  metadata: { id: PHASE_ID, name: PHASE_NAME, block: BLOCK },

  async audit(_ctx: GauntletContext): Promise<AuditResult> {
    const details: Record<string, unknown> = {};

    // 1. heartbeat.mem must exist
    if (!existsSync(HB_FILE)) {
      return fail(
        `${HB_FILE} absent — sidecars not running in --headless mode`,
        details,
      );
    }

    // 2. Read 16-byte heartbeat file
    const buf = readFileSync(HB_FILE);
    if (buf.length < 16) {
      return fail(`${HB_FILE} too small (${buf.length} bytes, need 16)`, details);
    }

    const now = nowMs();
    const atlasTs     = readU64LE(buf, 0);   // slot 4000
    const cyberdeckTs = readU64LE(buf, 8);   // slot 4001
    const atlasDelta     = Number(now - atlasTs);
    const cyberdeckDelta = Number(now - cyberdeckTs);

    details['atlasTs']       = atlasTs.toString();
    details['cyberdeckTs']   = cyberdeckTs.toString();
    details['atlasDeltaMs']  = atlasDelta;
    details['cyberdeckDeltaMs'] = cyberdeckDelta;
    details['now']           = now.toString();

    // 3. Zero timestamps = sidecars never ran
    if (atlasTs === 0n && cyberdeckTs === 0n) {
      return fail('Both heartbeat slots are zero — sidecars never wrote to heartbeat.mem', details);
    }

    // 4. Delta checks
    const atlasStale     = atlasDelta     > MAX_DELTA_MS;
    const cyberdeckStale = cyberdeckDelta > MAX_DELTA_MS;
    const atlasWarn      = atlasDelta     > WARN_DELTA_MS;
    const cyberdeckWarn  = cyberdeckDelta > WARN_DELTA_MS;

    if (atlasStale || cyberdeckStale) {
      const staleList = [
        atlasStale     ? `atlas (${atlasDelta}ms)`     : null,
        cyberdeckStale ? `cyberdeck (${cyberdeckDelta}ms)` : null,
      ].filter(Boolean).join(', ');
      return fail(`Heartbeat stale: ${staleList} — daemon(s) drifted or crashed`, details);
    }

    if (atlasWarn || cyberdeckWarn) {
      return warn(
        `Heartbeat elevated latency: atlas=${atlasDelta}ms, cyberdeck=${cyberdeckDelta}ms`,
        details,
      );
    }

    return pass(
      `Heartbeats LIVE: atlas=${atlasDelta}ms, cyberdeck=${cyberdeckDelta}ms`,
      details,
    );
  },

  async manifest(ctx: GauntletContext, _intent: unknown): Promise<void> {
    ctx.logger.info('Headless-Heartbeat manifest: spawning sidecars in --headless mode');
    // Spawn atlas
    await execAsync(
      'nix develop --impure --command bash -c "cd . && cargo run --manifest-path sidecar-atlas/Cargo.toml -- --headless >> data/logs/atlas.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Atlas spawn failed', e.message));
    // Spawn cyberdeck
    await execAsync(
      'nix develop --impure --command bash -c "cd . && cargo run --manifest-path sidecar-cyberdeck/Cargo.toml -- --headless >> data/logs/cyberdeck.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Cyberdeck spawn failed', e.message));
    // Allow daemons to start up
    await new Promise(r => setTimeout(r, 5000));
  },

  async onDrift(ctx: GauntletContext, _current: unknown, _expected: unknown): Promise<void> {
    ctx.logger.warn('Headless-Heartbeat drift — attempting 2-stage repair');

    // Stage 1: SIGUSR1 — graceful reload signal
    ctx.logger.info('Stage 1: sending SIGUSR1 to sidecar processes');
    try {
      await execAsync("pkill -USR1 -f 'sidecar-atlas.*--headless' 2>/dev/null; pkill -USR1 -f 'sidecar-cyberdeck.*--headless' 2>/dev/null");
    } catch { /* processes may not exist */ }
    await new Promise(r => setTimeout(r, 2000));

    // Check if repair was successful
    if (existsSync(HB_FILE)) {
      const buf = readFileSync(HB_FILE);
      if (buf.length >= 16) {
        const now = nowMs();
        const atlasDelta     = Number(now - readU64LE(buf, 0));
        const cyberdeckDelta = Number(now - readU64LE(buf, 8));
        if (atlasDelta <= MAX_DELTA_MS && cyberdeckDelta <= MAX_DELTA_MS) {
          ctx.logger.info('Stage 1 repair successful — heartbeats restored');
          return;
        }
      }
    }

    // Stage 2: Full restart
    ctx.logger.warn('Stage 1 failed — Stage 2: full process restart');
    try {
      await execAsync("pkill -9 -f 'sidecar-atlas.*--headless' 2>/dev/null; pkill -9 -f 'sidecar-cyberdeck.*--headless' 2>/dev/null");
    } catch { /* processes may not exist */ }
    await new Promise(r => setTimeout(r, 1000));

    // Re-spawn
    await execAsync(
      'nix develop --impure --command bash -c "cargo run --manifest-path sidecar-atlas/Cargo.toml -- --headless >> data/logs/atlas.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Atlas restart failed', e.message));
    await execAsync(
      'nix develop --impure --command bash -c "cargo run --manifest-path sidecar-cyberdeck/Cargo.toml -- --headless >> data/logs/cyberdeck.log 2>&1 &"',
    ).catch(e => ctx.logger.error('Cyberdeck restart failed', e.message));

    ctx.logger.info('Stage 2 restart issued — allow 5s for daemons to stabilize');
    await new Promise(r => setTimeout(r, 5000));
  },
};
