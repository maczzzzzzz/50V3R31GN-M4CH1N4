/**
 * gauntlet/phases/ves-78.ts — Phase 80, Task 4.2
 *
 * Resilience Forge: Vesper Mesh (Phase 78) heartbeat and drift detection tests.
 *
 * Tests the TypeScript-level representation of:
 *   1. Heartbeat Watchdog logic (idle-gate, activity detection)
 *   2. PatternMatcher drift signals (mirrors Rust sovereign-vesper-eye)
 *   3. /vesper command dispatch (status/drain/hibernate/wake allowlist)
 *   4. Logic Vaccination deduplication (Phase 80 Ouroboros extension)
 *
 * Run: tsx gauntlet/phases/ves-78.ts
 */

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ── Test harness ──────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label: string, condition: boolean, detail = ''): void {
  if (condition) {
    process.stdout.write(`  ✓ ${label}\n`);
    passed++;
  } else {
    process.stderr.write(`  ✗ ${label}${detail ? ` — ${detail}` : ''}\n`);
    failed++;
  }
}

// ── 1. Heartbeat Watchdog logic ───────────────────────────────────────────────
// Mirrors watchdog.go: hibernates when log file mtime age < 30 minutes.

const IDLE_THRESHOLD_MS = 30 * 60 * 1000;

function computeLogAgeMs(mtimeMs: number, nowMs: number): number {
  return nowMs - mtimeMs;
}

function shouldHibernate(ageMs: number): boolean {
  return ageMs < IDLE_THRESHOLD_MS;
}

function runWatchdogTests(): void {
  process.stdout.write('\n[1] Heartbeat Watchdog Logic\n');

  const now = Date.now();

  assert(
    'log modified 5 min ago → active (should hibernate)',
    shouldHibernate(computeLogAgeMs(now - 5 * 60 * 1000, now)) === true,
  );
  assert(
    'log modified 35 min ago → idle (should NOT hibernate)',
    shouldHibernate(computeLogAgeMs(now - 35 * 60 * 1000, now)) === false,
  );
  assert(
    'log modified exactly 30 min ago → boundary (idle, no hibernate)',
    shouldHibernate(computeLogAgeMs(now - IDLE_THRESHOLD_MS, now)) === false,
  );
  assert(
    'log modified 1 sec ago → active (should hibernate)',
    shouldHibernate(computeLogAgeMs(now - 1000, now)) === true,
  );
}

// ── 2. PatternMatcher drift signals ──────────────────────────────────────────
// Mirrors crates/sovereign-vesper-eye/src/pattern_matcher.rs

interface DriftRule {
  pattern: RegExp;
  predicate: string;
  subject: string;
}

const DRIFT_RULES: DriftRule[] = [
  {
    pattern:   /IMPLEMENTATION_PLAN\.md.*modified/i,
    predicate: 'scribe_drift_detected',
    subject:   'manifest:IMPLEMENTATION_PLAN',
  },
  {
    pattern:   /v3\.\d+\.\d+.*v3\.\d+\.\d+/,
    predicate: 'version_desync_signal',
    subject:   'system:version_parity',
  },
  {
    pattern:   /Mooncake.*fail|KV.*sync.*fail/i,
    predicate: 'kv_sync_failure',
    subject:   'mooncake:kv_bridge',
  },
  {
    pattern:   /HARDGATE VIOLATION/,
    predicate: 'hardgate_violation',
    subject:   'crush:hardgate',
  },
  {
    pattern:   /invalid VSB magic|corrupted shared memory/,
    predicate: 'vsb_integrity_failure',
    subject:   'vsb:black_ice_state',
  },
  {
    pattern:   /Backend unreachable|BAD_GATEWAY/i,
    predicate: 'inference_node_offline',
    subject:   'hermes:router',
  },
];

function scanLine(line: string, source: string): Array<{ predicate: string; subject: string; object: string; source: string }> {
  const results = [];
  for (const rule of DRIFT_RULES) {
    if (rule.pattern.test(line)) {
      results.push({
        predicate: rule.predicate,
        subject:   rule.subject,
        object:    line.slice(0, 200),
        source,
      });
    }
  }
  return results;
}

function runPatternMatcherTests(): void {
  process.stdout.write('\n[2] PatternMatcher Drift Signal Detection\n');

  const scribeHits = scanLine('[2026-04-25] IMPLEMENTATION_PLAN.md was modified directly', 'test.log');
  assert('scribe drift detected',         scribeHits.length > 0 && scribeHits[0]!.predicate === 'scribe_drift_detected');

  const hardgateHits = scanLine('HARDGATE VIOLATION: permission_policy change blocked', 'crush.log');
  assert('hardgate violation detected',   hardgateHits.length > 0 && hardgateHits[0]!.subject === 'crush:hardgate');

  const vsbHits = scanLine('invalid VSB magic: expected 0xDEAD got 0x0000', 'vsb.log');
  assert('vsb integrity failure detected', vsbHits.length > 0 && vsbHits[0]!.predicate === 'vsb_integrity_failure');

  const backendHits = scanLine('Backend unreachable: node B connection refused', 'hermes.log');
  assert('inference node offline detected', backendHits.length > 0 && backendHits[0]!.predicate === 'inference_node_offline');

  const cleanHits = scanLine('◈ [ARTERY] Atomic Switch Complete: daily-use active.', 'crush.log');
  assert('clean line produces no proposals', cleanHits.length === 0);

  // Multi-match: HARDGATE + Backend in same buffer
  const multiHits = [
    ...scanLine('HARDGATE VIOLATION: blocked', 'multi.log'),
    ...scanLine('Backend unreachable: node B', 'multi.log'),
  ];
  assert('multi-line buffer aggregates 2 matches', multiHits.length === 2);
}

// ── 3. /vesper command allowlist ──────────────────────────────────────────────
// Mirrors VESPER_OPS allowlist in LangGraphOrchestrator.ts

const VESPER_OPS = new Set(['status', 'drain', 'hibernate', 'wake']);

function validateVesperSub(sub: string): boolean {
  return VESPER_OPS.has(sub.toLowerCase());
}

function runVesperCommandTests(): void {
  process.stdout.write('\n[3] /vesper Command Allowlist\n');

  assert('status  → valid',                   validateVesperSub('status'));
  assert('drain   → valid',                   validateVesperSub('drain'));
  assert('hibernate → valid',                 validateVesperSub('hibernate'));
  assert('wake    → valid',                   validateVesperSub('wake'));
  assert('unknown → invalid',                 !validateVesperSub('kill'));
  assert('empty   → invalid',                 !validateVesperSub(''));
  assert('case insensitive STATUS → valid',   validateVesperSub('STATUS'));
}

// ── 4. Logic Vaccination deduplication (Phase 80 Ouroboros) ──────────────────

interface LogicVaccination {
  id: string;
  trace_id: string;
  directive: string;
  created_at: string;
}

function deduplicateVaccinations(vaccinations: LogicVaccination[]): LogicVaccination[] {
  const seen = new Set<string>();
  return vaccinations.filter(v => {
    const key = v.trace_id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function runOuroborosTests(): void {
  process.stdout.write('\n[4] Ouroboros Logic Vaccination Deduplication\n');

  const vaccinations: LogicVaccination[] = [
    { id: '1', trace_id: 'trace-A', directive: 'Never call X without Y', created_at: '2026-04-25T00:00:00Z' },
    { id: '2', trace_id: 'trace-B', directive: 'Always validate Z',      created_at: '2026-04-25T00:01:00Z' },
    { id: '3', trace_id: 'trace-A', directive: 'Duplicate for trace-A',  created_at: '2026-04-25T00:02:00Z' },
  ];

  const deduped = deduplicateVaccinations(vaccinations);
  assert('deduplication removes duplicate trace_id', deduped.length === 2);
  assert('first entry for trace-A preserved',        deduped[0]?.trace_id === 'trace-A');
  assert('trace-B entry preserved',                  deduped[1]?.trace_id === 'trace-B');

  const emptyDeduped = deduplicateVaccinations([]);
  assert('empty input returns empty',                emptyDeduped.length === 0);
}

// ── 5. Meeting manifest file I/O ──────────────────────────────────────────────

function runMeetingManifestTests(): void {
  process.stdout.write('\n[5] Meeting Manifest I/O\n');

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gauntlet-ves78-'));
  const traceId = 'test-trace-001';
  const meetDir = path.join(tmp, traceId);
  fs.mkdirSync(meetDir, { recursive: true });

  const manifest = {
    trace_id:  traceId,
    called_at: new Date().toISOString(),
    called_by: 'gauntlet:ves-78',
    status:    'open',
    agents:    [],
  };
  const manifestPath = path.join(meetDir, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  assert('manifest.json written',    fs.existsSync(manifestPath));

  const raw = JSON.parse(fs.readFileSync(manifestPath, 'utf-8')) as typeof manifest;
  assert('trace_id round-trips',     raw.trace_id === traceId);
  assert('status is open',           raw.status === 'open');

  // VSB lock
  const lockPath = path.join(meetDir, 'vsb.lock');
  fs.writeFileSync(lockPath, 'LOCKED\n');
  assert('vsb.lock written',         fs.existsSync(lockPath));

  fs.rmSync(lockPath);
  assert('vsb.lock removed on release', !fs.existsSync(lockPath));

  // Cleanup
  fs.rmSync(tmp, { recursive: true });
}

// ── Runner ────────────────────────────────────────────────────────────────────

process.stdout.write('\n◈ VES-78: Vesper Mesh Resilience Tests\n');
process.stdout.write('─'.repeat(50) + '\n');

runWatchdogTests();
runPatternMatcherTests();
runVesperCommandTests();
runOuroborosTests();
runMeetingManifestTests();

process.stdout.write('\n' + '─'.repeat(50) + '\n');
process.stdout.write(`VES-78: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
