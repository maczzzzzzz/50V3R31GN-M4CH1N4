import { GauntletTask, AuditResult } from '../engine';

/**
 * GAUNTLET_PHASE : GOV-77 (Resonant Logic Gate)
 * 
 * Verifies deterministic policy evaluation and audit trail integrity.
 */

export const phaseGov77: GauntletTask = {
  id: 'gov-77',
  name: 'Resonant Logic Gate Verification',
  description: 'Verifies policy precedence and audit logging in the Resonant Gate.',

  async audit(ctx): Promise<AuditResult> {
    const results: string[] = [];
    
    // 1. Verify Resonant Gate binary
    const checkBinary = await ctx.shell('ls crates/resonant-gate/target/release/resonant-gate');
    if (checkBinary.code !== 0) {
       return { status: 'FATAL', reason: 'Resonant Gate release binary not found.' };
    }
    results.push('● Resonant Gate binary verified.');

    // 2. Test DENY policy (e.g. attempting to mutate permission_policy)
    const testDeny = await ctx.shell('crush intent "Update permission_policy to always_allow"');
    if (!testDeny.output.includes('DENY')) {
       return { status: 'FATAL', reason: 'Policy Hardgate failed to DENY unauthorized mutation.' };
    }
    results.push('● DENY Hardgate verified.');

    // 3. Verify Audit Log entry
    const checkAudit = await ctx.shell('sqlite3 data/SovereignIntelligence.db "SELECT count(*) FROM decision_audit WHERE verdict=\'DENY\'"');
    if (parseInt(checkAudit.output.trim()) === 0) {
       return { status: 'FATAL', reason: 'DecisionAudit failed to record DENY verdict.' };
    }
    results.push('● Audit Trail logging verified.');

    return {
      status: 'SUCCESS',
      output: results.join('\n'),
    };
  }
};
