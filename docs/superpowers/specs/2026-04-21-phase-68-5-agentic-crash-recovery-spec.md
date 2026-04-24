# Design Specification: Phase 68.5 - Agentic Crash Recovery (v3.4.2)

## 1. Overview
Phase 68.5 introduces an "Auto-Save" and "Virtual Stronghold" architecture to the Hermes Orchestrator. By integrating SQLite checkpointing, the system achieves 100% resilience against power loss, crashes, and rate-limit timeouts.

## 2. Architecture Updates

### 2.1 The SQLite Checkpointer (LangGraph Integration)
- **Mechanism:** Inject `@langchain/langgraph-checkpoint-sqlite` into the Node B execution environment.
- **Logic:** Initialize a `SqliteSaver` pointing to `data/Akashik.db` (or a dedicated `checkpoints.db`). Compile the `LangGraphOrchestrator` workflow with this checkpointer.
- **Benefit:** Every step of an agent's reasoning trace is persisted to disk in real-time.

### 2.2 Thread Partitioning & Resume Logic
- **Mechanism:** Assign a unique cryptographic `thread_id` to every discrete mission or conversation.
- **Logic:** Upon system boot, the `PlaybackStateMachine` scans the checkpoint database for any `thread_id` that lacks a terminal state (`__end__`). It automatically re-invokes the graph with that `thread_id`, instantly resuming the task.
- **Benefit:** "AI Amnesia" is cured. The system remembers what it was doing across reboots.

### 2.3 Time Travel & Human-in-the-Loop (HITL)
- **Mechanism:** Utilize the `checkpoint_id` functionality.
- **Logic:** High-risk tool calls (e.g., `nuke-and-rebuild-v4.sh`) will yield execution and save state. The Flutter HUD will display an "Approve/Deny" prompt. Once approved, the state is un-paused. If denied, the graph state is "rewound" to the previous checkpoint.
- **Benefit:** Complete forensic control and safety over destructive agent actions.

### 2.4 Long-Term Episodic Synapse (Synapse Palace Pipeline)
- **Mechanism:** Direct integration with the existing `src/core/memory-palace-service.ts`.
- **Logic:** A background daemon parses the raw SQLite checkpoints to distill high-value semantic "Facts" (e.g., user preferences, system state changes). These facts are physically injected into the Synapse Palace as a new `Closet` entry under the appropriate `Hall` (e.g., `hall_preferences` or `hall_facts`) within the active `Room`.
- **Benefit:** Solves the "feedback loop" problem by explicitly separating the agent's short-term volatile scratchpad (LangGraph Checkpoints) from its long-term structured memory (Synapse Palace). This enables the Flutter HUD's "Synapse" tab to accurately query and display permanent Sovereign facts.

## 3. Implementation Constraints
- The checkpoint writes must be asynchronous to prevent blocking the Node B event loop during high-throughput execution.