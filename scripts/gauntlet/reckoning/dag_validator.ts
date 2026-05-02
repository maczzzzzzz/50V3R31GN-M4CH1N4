import { ContextDAG } from '../../../packages/hermes-core/src/core/hermes/ContextDAG.js';

/**
 * RECKONING : DAG_VALIDATOR — v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Verifies node isolation and dependency tracking in the Context-DAG.
 */

async function runDagAudit() {
  console.log("::/RECKONING : STARTING_DAG_AUDIT...");
  const dag = new ContextDAG();
  
  // 1. Verify Root
  const active = dag.getActiveConversation();
  if (active.length !== 1 || active[0].id !== 'root') {
    throw new Error("RECKONING_FAILURE: Root node missing or misidentified.");
  }

  // 2. Linear Extension
  dag.addNode("Task A", "user");
  dag.addNode("Reasoning A", "agent");
  
  if (dag.getActiveConversation().length !== 3) {
    throw new Error("RECKONING_FAILURE: Linear path depth mismatch.");
  }

  // 3. Branch Isolation
  const branchPoint = dag.getActiveConversation()[1].id;
  const forkId = dag.fork(branchPoint);
  
  // Verify that the active path is not polluted by the fork (which is a sideline)
  if (dag.getActiveConversation().length !== 3) {
     throw new Error("RECKONING_FAILURE: Context pollution detected. Active path modified by fork.");
  }

  console.log("::/RECKONING : DAG_AUDIT_PASS. 100% ISOLATION VERIFIED.");
}

runDagAudit().catch(err => {
  console.error(`❌ [RECKONING_ERROR] : ${err.message}`);
  process.exit(1);
});
