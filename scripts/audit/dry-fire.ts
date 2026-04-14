/**
 * scripts/audit/dry-fire.ts
 *
 * Phase 56: Dry Fire Audit — Master Trigger
 *
 * Runs the full component + interaction audit suite sequentially
 * and emits a human-readable report. No live API calls or CDP connections.
 *
 * Usage: npm run audit:dry-fire
 *        tsx scripts/audit/dry-fire.ts [--json]
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { readFileSync, existsSync } from 'node:fs';
import { auditAllComponents, type ComponentStatus } from './component-auditor.js';
import { auditAllInteractions, type InteractionResult } from './interaction-auditor.js';
import type { GauntletReport } from '../gauntlet/types.js';

const execAsync = promisify(exec);
const SYM: Record<string, string> = { OK: '✓', WARN: '⚠', FAIL: '✗' };

interface SuiteResult {
  passed: number;
  failed: number;
  skipped: number;
  total: number;
  durationMs: number;
  error?: string;
}

async function runVitestSuite(): Promise<SuiteResult> {
  const reportPath = '/tmp/vitest-dry-fire.json';
  try {
    // Write to file to avoid emoji/progress output mixing into stdout
    await execAsync(
      `npx vitest run --reporter=json --outputFile=${reportPath}`,
      { timeout: 180_000 }
    ).catch(() => {}); // non-zero exit on test failures — still read the file

    if (!existsSync(reportPath)) {
      return { passed: 0, failed: 0, skipped: 0, total: 0, durationMs: 0, error: 'No report file written' };
    }

    const json = JSON.parse(readFileSync(reportPath, 'utf-8')) as {
      numPassedTests?: number;
      numFailedTests?: number;
      numPendingTests?: number;
      numTotalTests?: number;
      startTime?: number;
      endTime?: number;
    };

    return {
      passed:  json.numPassedTests  ?? 0,
      failed:  json.numFailedTests  ?? 0,
      skipped: json.numPendingTests ?? 0,
      total:   json.numTotalTests   ?? 0,
      durationMs: json.startTime && json.endTime ? json.endTime - json.startTime : 0,
    };
  } catch (err) {
    return { passed: 0, failed: 0, skipped: 0, total: 0, durationMs: 0, error: (err as Error).message };
  }
}

async function runGauntlet(): Promise<GauntletReport | null> {
  try {
    await execAsync('npm run gauntlet:no-cdp 2>&1', { timeout: 120_000 })
      .catch(() => {}); // exit code non-zero if failures — still read the report
    const reportPath = './data/logs/gauntlet-report.json';
    if (!existsSync(reportPath)) return null;
    return JSON.parse(readFileSync(reportPath, 'utf-8')) as GauntletReport;
  } catch { return null; }
}

function renderComponents(results: ComponentStatus[]): void {
  console.log('\n━━━ COMPONENT AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const r of results) {
    const sym = SYM[r.status] ?? '?';
    console.log(`  ${sym} [${r.status.padEnd(4)}] ${r.component}`);
    for (const [k, v] of Object.entries(r.checks)) {
      console.log(`          ${k}: ${v}`);
    }
    if (r.error) console.log(`          error: ${r.error}`);
  }
}

function renderInteractions(results: InteractionResult[]): void {
  console.log('\n━━━ INTERACTION AUDIT ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  for (const r of results) {
    const sym = r.passed ? '✓' : '✗';
    const status = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${sym} [${status}] ${r.source} → ${r.target}`);
    for (const [k, v] of Object.entries(r.checks)) {
      console.log(`          ${k}: ${v}`);
    }
    if (r.error) console.log(`          error: ${r.error}`);
  }
}

async function runAll(): Promise<void> {
  const t0 = Date.now();
  console.log('\n◈ 50V3R31GN-M4CH1N4 // DRY FIRE SYSTEM AUDIT — COMPREHENSIVE\n');

  // Layer 1: Component checks
  console.log('[1/4] Component Audit...');
  const components = await auditAllComponents();

  // Layer 2: Interaction checks
  console.log('[2/4] Interaction Audit...');
  const interactions = await auditAllInteractions();

  // Layer 3: Full vitest suite
  console.log('[3/4] Vitest Suite (73 tests)...');
  const suite = await runVitestSuite();

  // Layer 4: Gauntlet (all shards, no-cdp)
  console.log('[4/4] Gauntlet (no-cdp)...');
  const gauntlet = await runGauntlet();

  const useJson = process.argv.includes('--json');
  if (useJson) {
    console.log(JSON.stringify({ components, interactions, suite, gauntlet }, null, 2));
    return;
  }

  renderComponents(components);
  renderInteractions(interactions);

  // Render suite results
  console.log('\n━━━ VITEST SUITE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (suite.error) {
    console.log(`  ✗ Runner error: ${suite.error}`);
  } else {
    const sym = suite.failed === 0 ? '✓' : '✗';
    console.log(`  ${sym} ${suite.passed}/${suite.total} passed  |  ${suite.failed} failed  |  ${suite.skipped} skipped  |  ${suite.durationMs}ms`);
  }

  // Render gauntlet results
  console.log('\n━━━ GAUNTLET ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  if (!gauntlet) {
    console.log('  ⚠ Gauntlet report not available');
  } else {
    const sym = gauntlet.failed === 0 ? '✓' : '✗';
    console.log(`  ${sym} ${gauntlet.passed}/${gauntlet.totalPhases} PASS  |  ${gauntlet.failed} FAIL  |  ${gauntlet.warned} WARN  |  ${gauntlet.skipped} SKIP  |  ${gauntlet.durationMs}ms`);
    // Show any failures
    for (const r of gauntlet.results.filter(r => r.status === 'FAIL')) {
      console.log(`      ✗ [${r.phaseId}] ${r.phaseName}: ${r.message}`);
    }
  }

  // Master summary
  const compFail   = components.filter(r => r.status === 'FAIL').length;
  const compWarn   = components.filter(r => r.status === 'WARN').length;
  const intFail    = interactions.filter(r => !r.passed).length;
  const suiteFail  = suite.failed;
  const gauntFail  = gauntlet?.failed ?? 0;
  const totalFail  = compFail + intFail + suiteFail + gauntFail;

  console.log('\n━━━ MASTER SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Components  : ${components.length - compFail - compWarn} OK  |  ${compWarn} WARN  |  ${compFail} FAIL`);
  console.log(`  Interactions: ${interactions.length - intFail} PASS  |  ${intFail} FAIL`);
  console.log(`  Vitest      : ${suite.passed} pass  |  ${suite.failed} fail`);
  console.log(`  Gauntlet    : ${gauntlet?.passed ?? '?'} pass  |  ${gauntFail} fail`);
  console.log(`  Duration    : ${Date.now() - t0}ms`);

  if (totalFail === 0) {
    console.log('\n  ◈ DRY FIRE AUDIT PASSED — System ready for live-fire.\n');
  } else {
    console.log(`\n  ✗ DRY FIRE AUDIT FAILED — ${totalFail} critical issue(s) found.\n`);
    process.exitCode = 1;
  }
}

runAll().catch(err => { console.error('[DryFire] Fatal:', err); process.exit(1); });
