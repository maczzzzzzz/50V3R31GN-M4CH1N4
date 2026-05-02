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
    process.env.MOONCAKE_MASTER = '100.102.95.43:6789';
    console.log('◈ DIRECTOR_IGNITED. KV-OFFLOAD ACTIVE.');
  } else {
    console.log('◈ DIRECTOR_IGNITED. STANDALONE_MODE ACTIVE.');
  }

  /**
   * Initialize the Director engine (packages/hermes-core/src/main.ts).
   * We use dynamic import to ensure that process.env.MOONCAKE_MASTER is set
   * BEFORE any top-level logic in main.ts executes.
   */
  await import('../../packages/hermes-core/src/main.ts');
}

ignite().catch((err) => {
  console.error('❌ FATAL_IGNITION_FAILURE:', err);
  process.exit(1);
});
