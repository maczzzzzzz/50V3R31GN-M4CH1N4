# Design Specification: Conversational Onboarding (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Date:** March 31, 2026
**Subject:** Fixer Interview, Lifepath Mapping, and Foundry Actor Materialization
**Status:** FINALIZED

## 1. Executive Summary
The Conversational Onboarding system replaces static character creation with an immersive "Fixer Interview" conducted within the Crush CLI. By leveraging Mistral-Nemo for dialogue and ZeroClaw for mechanical validation, the system generates 100% core-rulebook-compliant characters that are automatically built in Foundry VTT.

## 2. The Interview Pipeline

### 2.1 Dynamic Persona Selection
The interviewing NPC is selected based on the player's initial background choice:
- **Street/Nomad:** Conducted by a district-level Fixer from the TTTA dataset.
- **Corporate/Executive:** Conducted by high-tier contacts (e.g., Rogue).

### 2.2 Lifepath Integration
As the player answers narrative questions, the orchestrator triggers `nitro-logic` to roll on the official Cyberpunk RED Lifepath tables.
- **Narrative Grounding:** AI weaves roll results (e.g., "Family Tragedy") into the interview dialogue.
- **RKG Update:** NPCs or gangs mentioned in the Lifepath are automatically added to the `player_friends_enemies` table in `world.db`.

## 3. Actor Materialization

### 3.1 The "Contract" Tool
Once the interview concludes, the AI generates a "Contract Summary" (Stats, Role, Gear). Upon player confirmation, the backend triggers the `foundry:create_actor` tool.

### 3.2 Foundry Mesh Payload
The payload includes:
- **Base Stats/Skills:** Validated by ZeroClaw traits.
- **Role-Based Items:** Seeded from the `entities_mooks` items directory.
- **Bio Injection:** The AI-summarized backstory is written to the Actor's journal.

## 4. Multimodal Integration (Crush)
- `/onboard`: Manually triggers the interview loop.
- `/onboard --fast`: Skips dialogue and generates a randomized character of a specific Role.

## 5. Verification Plan
- **Rule Compliance:** Verify that all generated characters follow the 62-point (Standard) or 80-point (Major League) stat distribution.
- **Mesh Reliability:** Ensure `create_actor` successfully populates all fields in Foundry v12 without manual GM intervention.


---
**LINKS:** [[OS_CORE]]
