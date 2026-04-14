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

import { auditAllComponents, type ComponentStatus } from './component-auditor.js';
import { auditAllInteractions, type InteractionResult } from './interaction-auditor.js';

const SYM: Record<string, string> = { OK: '✓', WARN: '⚠', FAIL: '✗' };

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
  console.log('\n◈ 50V3R31GN-M4CH1N4 // DRY FIRE SYSTEM AUDIT\n');

  const components  = await auditAllComponents();
  const interactions = await auditAllInteractions();

  const useJson = process.argv.includes('--json');
  if (useJson) {
    console.log(JSON.stringify({ components, interactions }, null, 2));
    return;
  }

  renderComponents(components);
  renderInteractions(interactions);

  const compFail  = components.filter(r => r.status === 'FAIL').length;
  const compWarn  = components.filter(r => r.status === 'WARN').length;
  const intFail   = interactions.filter(r => !r.passed).length;
  const totalFail = compFail + intFail;

  console.log('\n━━━ SUMMARY ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Components : ${components.length - compFail - compWarn} OK  |  ${compWarn} WARN  |  ${compFail} FAIL`);
  console.log(`  Interactions: ${interactions.length - intFail} PASS  |  ${intFail} FAIL`);
  console.log(`  Duration   : ${Date.now() - t0}ms`);

  if (totalFail === 0) {
    console.log('\n  ◈ DRY FIRE AUDIT PASSED — System ready for live-fire.\n');
  } else {
    console.log(`\n  ✗ DRY FIRE AUDIT FAILED — ${totalFail} critical issue(s) found.\n`);
    process.exitCode = 1;
  }
}

runAll().catch(err => { console.error('[DryFire] Fatal:', err); process.exit(1); });
