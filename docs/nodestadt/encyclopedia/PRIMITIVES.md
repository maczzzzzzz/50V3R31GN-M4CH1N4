# ◈ THE ENCYCLOPEDIA : MINISCULE FEATURES & HIDDEN PRIMITIVES
**Date:** Friday, May 1, 2026
**Status:** BACKTRACED

This document contains technical details of specific, granular features mapped during the **System Soul Dive**. These primitives often provide the "soul" of the Machina.

## 1. NARRATIVE & COGNITION
*   **autoDream (Phase 9):** A recursive self-cleaning mechanism for the context window. It tiers memory into L1 (Working), L2 (Dream), and L3 (Akashik).
    *   *Logic:* Extracts triplets (Subject -> Verb -> Object) from conversation logs.
    *   *Storage:* `triplets_fts` table in `Akashik.db`.
*   **Conversational Onboarding (Phase 5.3):** A stateful interview controller that builds Actors through dialogue.
    *   *States:* `VIBE_CHECK`, `LIFEPATH`, `STATS`.
    *   *Files:* `src/core/onboarding-controller.ts`.
*   **Conlang Mutation (Phase 12):** Linguistic steganography system that corrupts journal entries into `L337-5P34K` or unique machine dialects.
    *   *Control:* `journal_corruption_active` flag in `system_state`.
    *   *Hook:* `sovereign.conlang.mutate`.

## 2. INFRASTRUCTURE & SOVEREIGNTY
*   **ColPali Server (Python Archive):** A high-performance visual embedding server (`vidore/colpali-v1.2`) used for PDF ingestion and MaxSim visual retrieval.
*   **Fast Reconstruct (Phase 57):** A Python-based vault reconstruction utility that enforces the **District-First Hierarchy** and the **Metadata Mandate** (mandatory YAML frontmatter).
*   **ClawLink Socket (Phase 4):** A physical Unix socket bridge (`/tmp/clawlink.sock`) used for zero-latency cross-node communication.
*   **Flush Gate (Phase 9):** A verification protocol ensuring zero data loss during memory consolidation.
*   **VSB Intent 0x05 (Phase 26):** The "Radar Heat" pulse, used to visualize cognitive friction within the mesh.
*   **VSB Intent 0x0B (Phase 103):** The "Scribe" trigger, binding voice-to-manifest synchronization.

## 3. LORE-BLEED & SOCIOTOMY
*   **Soulkiller Engrams (Phase 9):** NPC "personality" engrams stored in `npc_logs` for high-fidelity roleplay persistence.
*   **L337 Dialect (Phase 12):** A native primitive for machine-only internal communication (ParselTongue's aesthetic predecessor).

---
**::/5Y573M-N071C3 : HIDDEN_PRIMITIVES_SHORED. // 50V3R31GN-M4CH1N4**
