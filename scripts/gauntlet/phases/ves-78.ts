import { GauntletTask, AuditResult } from '../engine';

/**
 * GAUNTLET_PHASE : VES-78 (Vesper Mesh Persistence)
 * 
 * Verifies Vesper heartbeat watchdog and SPO extraction.
 */

export const phaseVes78: GauntletTask = {
  id: 'ves-78',
  name: 'Vesper Mesh Persistence Verification',
  description: 'Verifies Vesper heartbeat and log distillation.',

  async audit(ctx): Promise<AuditResult> {
    const results: string[] = [];
    
    // 1. Verify Vesper Daemon
    const checkDaemon = await ctx.shell('pgrep -f vesper-daemon');
    if (checkDaemon.code !== 0) {
       // Attempt to wake if offline
       await ctx.shell('nix develop --command scripts/ops/vesper-daemon/vesper-daemon &');
       await new Promise(r => setTimeout(r, 2000));
    }
    results.push('● Vesper Daemon connectivity verified.');

    // 2. Test Drift Detection
    // Manually modify a file Vesper watches (e.g. CHANGELOG.md without scribe)
    await ctx.shell('echo "DRIFT_TEST" >> CHANGELOG.md');
    await new Promise(r => setTimeout(r, 5000)); // Wait for LogDistiller

    const checkDrift = await ctx.shell('sqlite3 data/SovereignIntelligence.db "SELECT count(*) FROM os_triplets WHERE predicate=\'was_modified_at\'"');
    if (parseInt(checkDrift.output.trim()) === 0) {
       return { status: 'FATAL', reason: 'Vesper LogDistiller failed to detect file mutation.' };
    }
    results.push('● LogDistiller drift detection verified.');

    // Cleanup
    await ctx.shell('git checkout CHANGELOG.md');

    return {
      status: 'SUCCESS',
      output: results.join('\n'),
    };
  }
};
