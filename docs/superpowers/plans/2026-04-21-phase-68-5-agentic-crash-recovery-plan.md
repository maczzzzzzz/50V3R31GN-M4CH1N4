# IMPLEMENTATION PLAN: Phase 68.5 - Agentic Crash Recovery

## 🎯 Objective
Make the system's brain a "Virtual Stronghold" by implementing real-time SQLite auto-saving and crash recovery for all agentic workflows.

## 📋 Step-by-Step Execution

### Task 1: Checkpoint Infrastructure
1.  Install `@langchain/langgraph-checkpoint-sqlite` and `better-sqlite3` in the Node B environment (`package.json`).
2.  Initialize the SQLite connection string to target `data/Akashik_Checkpoints.db`.

### Task 2: Orchestrator Integration
1.  Modify `src/core/hermes/LangGraphOrchestrator.ts` to accept the `SqliteSaver` during graph compilation.
2.  Update the invocation logic to generate and pass a `thread_id` in the `configurable` execution context.

### Task 3: Auto-Resume Boot Daemon
1.  Create an initialization script that runs when Node B boots.
2.  The script queries the SQLite DB for "dangling threads" (executions that were interrupted by power loss).
3.  If found, the script automatically resumes the `LangGraphOrchestrator` using the dangling `thread_id`.

## 🛡️ Verification
- Start a multi-step agent task (e.g., writing a 5-part file).
- Physically `kill -9` the Node B process during step 3.
- Restart the Node B process and verify that the agent resumes and completes steps 4 and 5 without restarting from step 1.