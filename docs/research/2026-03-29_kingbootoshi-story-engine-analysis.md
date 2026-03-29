# Deep Research Analysis: kingbootoshi/story-engine Integration
**Date:** Sunday, March 29, 2026
**Subject:** Narrative Orchestration for Cyberpunk RED & Ticket To The Afterlife (TttA)

## 1. Conceptual Alignment: "Arc -> Beat -> Event"
The `story-engine` framework by kingbootoshi (Bootoshi) provides a hierarchical state machine that prevents "narrative drift" in AI agents. This structure aligns perfectly with the pre-existing organization of the **Ticket To The Afterlife** campaign data.

### 1.1 The Macro Layer: Arc (Campaign Phase)
- **TttA Mapping:** Major story chapters like "Part 1 - Welcome To The Afterlife" or "Part 3 - Back Alley Boogey."
- **Orchestrator Role:** Maintains the high-level objective (e.g., "Establish Afterlife services") in the long-term context (Node B memory).

### 1.2 The Meso Layer: Beat (Mission Segment)
- **TttA Mapping:** The literal "Beat Charts" found in TttA mission summaries (e.g., "Beat 1: Dustwalker, Texas Ranger").
- **Orchestrator Role:** Serves as the current active milestone. The engine evaluates "Transition Guards" (e.g., skill checks or combat resolution) to move from one Beat to the next.

### 1.3 The Micro Layer: Event (Immediate Action)
- **TttA Mapping:** Atomic occurrences within a scene: a specific D10 roll, a dialogue choice, or a Fixer call payload.
- **Orchestrator Role:** Triggers specific MCP calls to `nitro-logic` (Node A) for math or pushes prose to Foundry VTT (Phase 3 Bridge).

---

## 2. Technical Integration Strategy

### 2.1 Schema Definition (`src/shared/schemas/story.schema.ts`)
We will utilize Zod to define the state of the story engine, ensuring Zero-Trust validation between session loads.

```typescript
import { z } from 'zod';

export const StoryStateSchema = z.object({
  currentArc: z.string(),
  currentBeat: z.string(),
  completedBeats: z.array(z.string()),
  worldState: z.record(z.any()), // e.g., { sprinters_gaff_searched: true }
  eagleBalance: z.number().nonnegative(),
});
```

### 2.2 Controller Architecture (`src/core/story-engine.ts`)
The `StoryController` will be the central brain of Node B, acting as the bridge between the RAG data (`nitro-db`) and the Rules engine (`nitro-logic`).

- **Logic Flow:**
  1.  **Ingest:** Pull the current Beat text from Node A's `pgvector` store.
  2.  **Analyze:** Determine if an Event (e.g., a roll result from Node A) satisfies the transition criteria for the next Beat.
  3.  **Update:** Commit the new `StoryState` to the local session memory (Crush-compatible SQLite).

---

## 3. The "Hybrid Routing" Loop
The Story Engine coordinates the split-node hardware:

| Node | Responsibility | Story Engine Interaction |
| :--- | :--- | :--- |
| **Node A** | Rules Authority | Validates the "Math Event" (e.g., Did the player pass the DV15 Athletics check in Beat 3?). |
| **Node B** | Story Engine | Consumes the result from Node A and generates the "Narrative Event" (e.g., Sprinter escapes or is caught). |

---

## 4. Integration with TttA "Eagle Economy"
The `story-engine` must act as the accountant for the Eagle points conversion.
- **Beat Payouts:** Upon completing a mission's final Beat, the engine triggers a `nitro-logic` call to calculate the finalized payout (e.g., `600eb + 3 Eagles`).
- **State Persistence:** The Eagle balance is stored within the `StoryState` to ensure economic continuity across sessions.

---

## 5. Conclusion
Integrating `kingbootoshi/story-engine` is not just a suggestion but a requirement for maintaining the **Immersion Mandate**. By physicalizing the story into manageable Arcs and Beats, we ensure the AI never hallucinations its own progress or "breaks character" by forgetting the current mission context.

**Next Action:** Scaffold the `StoryStateSchema` in `src/shared/` during Phase 2.
