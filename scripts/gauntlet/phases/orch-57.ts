import { SovereignShard, GauntletContext, AuditResult } from '../types.js';

/**
 * orch-57: Sovereign Mind Rebuild Verification
 * 
 * Block: ORCH
 * ID: 57
 * 
 * Verifies that the Akashik Mind has been correctly rebuilt with:
 * 1. High-density relational triplets (>3000).
 * 2. Normalized district names (no case duplicates).
 * 3. Narrative prose quarantine (Neuromancer in Global/Narrative_Prose).
 */
export const shard: SovereignShard = {
  metadata: { 
    id: 57, 
    name: 'Sovereign-Mind-Rebuild', 
    block: 'ORCH' 
  },

  audit: async (ctx: GauntletContext): Promise<AuditResult> => {
    const results: string[] = [];
    const errors: string[] = [];

    if (!ctx.db) {
        return {
            phaseId: 57,
            phaseName: 'Sovereign-Mind-Rebuild',
            block: 'ORCH',
            status: 'FAIL',
            message: 'Database connection unavailable'
        };
    }

    // 1. Relational Density
    const tripletCount = (ctx.db.prepare('SELECT count(*) as c FROM triplets').get() as { c: number }).c;
    if (tripletCount < 3000) {
      errors.push(`Low triplet density: ${tripletCount} (Target: >3000)`);
    } else {
      results.push(`Relational density nominal: ${tripletCount} triplets.`);
    }

    // 2. District Normalization
    const duplicates = ctx.db.prepare(`
      SELECT district_id, count(*) FROM chronicle_seeds 
      GROUP BY lower(district_id) 
      HAVING count(DISTINCT district_id) > 1
    `).all();
    
    if (duplicates.length > 0) {
      errors.push(`District naming collisions detected: ${JSON.stringify(duplicates)}`);
    } else {
      results.push('District normalization verified. Zero case-collisions.');
    }

    // 3. Narrative Quarantine
    const narrativeCount = (ctx.db.prepare("SELECT count(*) as c FROM chronicle_seeds WHERE district_id = 'NARRATIVE-PROSE'").get() as { c: number }).c;
    if (narrativeCount < 200) {
      errors.push(`Narrative prose quarantine failure: ${narrativeCount} chunks (Target: >200)`);
    } else {
      results.push(`Narrative prose successfully quarantined: ${narrativeCount} chunks.`);
    }

    // 4. Physical Vault Check
    const districtsDir = 'data/vault/RKG/Districts';
    const globalDir = 'data/vault/RKG/Global/Narrative_Prose';
    
    const fs = await import('node:fs');
    if (!fs.existsSync(districtsDir)) errors.push('Vault Districts wing missing.');
    if (!fs.existsSync(globalDir)) errors.push('Vault Narrative Prose wing missing.');

    return {
      phaseId: 57,
      phaseName: 'Sovereign-Mind-Rebuild',
      block: 'ORCH',
      status: errors.length === 0 ? 'PASS' : 'FAIL',
      message: errors.length === 0 ? 'MIND REBUILD VERIFIED' : `Audit failed: ${errors.join(', ')}`,
      durationMs: 0 // Will be set by engine
    };
  },

  manifest: async (_ctx, _intent) => {
    // Phase 57 materialization is handled by fast-reconstruct.py
    return { success: true };
  }
};
