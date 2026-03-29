# Architectural Autopsy: Deprecated Repo (openclaw-cpr)
**Date:** Sunday, March 29, 2026
**Subject:** Lessons Learned from Monolithic Bottlenecks & Abandoned Intent

## 1. Executive Summary
The `openclaw-cpr` repository served as a foundational "Monolithic" attempt to bridge AI and Foundry VTT. While creatively ambitious, it suffered from "God Object" syndrome and high coupling. Our current **Split-Node v4.0** architecture is specifically designed to solve the stability and latency issues discovered during this build.

## 2. Architectural Bottlenecks (The "Why it Failed" analysis)
- **The "God Object" Loop:** A single Node.js process handled raw socket traffic, Supabase state-mirroring, and LLM orchestration. A delay in any one (especially AI generation) would hang the entire game engine.
- **Dual-State Mirroring:** Attempting to keep Supabase in sync with Foundry created a "Dual Source of Truth" conflict. Race conditions were inevitable.
- **Version Lock:** The direct dependency on specific Foundry v12 socket structures meant any minor update to the VTT or the CPR system broke the entire bridge.

## 3. High-Value "Abandoned" Intent
The following features were conceptually powerful but mechanically incomplete in the old repo. We should "rescue" these concepts for the Phase 4 MVP:

### 3.1 Automated Lead Tracking
- **Concept:** A system that tracks "Narrative Leads" discovered by players, physicalizing them as Foundry documents or state flags.
- **Why it matters:** It prevents the GM (and the AI) from losing plot threads in long campaigns.

### 3.2 Dynamic Morale & NPC Reactivity
- **Concept:** Logic that forces NPCs to retreat, surrender, or call for backup based on mechanical triggers (e.g., HP < 50%, leader killed, or SP ablated).
- **Why it matters:** It shifts NPCs from "stat blocks that stand and die" to believable actors in the world.

### 3.3 The "Screamsheet" Feedback Loop
- **Concept:** Generating in-game news reports or Fixer "HUD" updates based on the outcome of PC missions.
- **Why it matters:** It reinforces the **Immersion Mandate** by showing players their actions have immediate world-consequences.

## 4. Character Creation Wizard Analysis (Rescue Candidate)
The deprecated build featured a 7-step guided wizard with deep Foundry integration.

### 4.1 The "Prologue" Concept
- **Concept:** Treating character creation as the "Prologue" Arc of the story.
- **Rescue Value:** In Phase 5, we will implement **"Conversational Creation"** where Node B (Mistral-Nemo) acts as a "Fixer" interviewing the player, mapping narrative answers to Node A's mechanical Lifepath rolls.

### 4.2 AI Intent Classification
- **Concept:** Classifying a player's narrative desire (e.g., "I want to be a washed-up Rockerboy") into mechanical templates.
- **Rescue Value:** Using Zero-Trust Zod schemas to ensure AI interpretations result in valid Cyberpunk RED stat blocks.

### 4.3 Faction Voice Profiles
- **Concept:** guiding creation using 10 distinct faction voice profiles.
- **Rescue Value:** Leveraging the 12B model to provide immersive, narrator-specific Lifepath generation.

## 5. Strategic Lessons for Phase 2 & 3
1. **Physical Decoupling:** Keep the **Rules Authority (Node A)** purely stateless. It calculates; it does not "remember" the story.
2. **Asynchronous Narrative:** Node B (Orchestrator) must handle prose generation *outside* the critical path of mechanical roll resolution.
3. **Zod Validation:** All data crossing the node boundary must be strictly typed to prevent the "Narrative Drift" seen in the previous build.
4. **Local-First Verification:** Avoid all cloud dependencies (Supabase/OpenRouter) to maintain 100% local runtime stability.
