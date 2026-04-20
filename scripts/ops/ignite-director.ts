#!/usr/bin/env tsx
/**
 * scripts/ops/ignite-director.ts
 *
 * Sovereign Director Ignition Script
 * Handles Split-Node Trinity offloading for KV storage if --offload-to-synapse is set.
 */

import 'dotenv/config';

async function ignite() {
  const args = process.argv.slice(2);
  const offloadToSynapse = args.includes('--offload-to-synapse');

  if (offloadToSynapse) {
    // Phase 62: Redirect KV storage to Synapse Node (Go implementation)
    process.env.MOONCAKE_MASTER = '10.0.0.10:6789';
    console.log('◈ DIRECTOR_IGNITED. KV-OFFLOAD ACTIVE.');
  } else {
    console.log('◈ DIRECTOR_IGNITED. STANDALONE_MODE ACTIVE.');
  }

  /**
   * Initialize the Director engine (src/main.ts).
   * We use dynamic import to ensure that process.env.MOONCAKE_MASTER is set
   * BEFORE any top-level logic in main.ts executes.
   */
  await import('../../src/main.ts');
}

ignite().catch((err) => {
  console.error('❌ FATAL_IGNITION_FAILURE:', err);
  process.exit(1);
});
