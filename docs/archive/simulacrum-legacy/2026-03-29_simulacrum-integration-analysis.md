# Deep Research Analysis: Simulacrum (AI Campaign Copilot) Integration
**Date:** Sunday, March 29, 2026
**Subject:** Collaborative World-Building & Persistent NPC Memory

## 1. Overview of Simulacrum (Daxiongmao87)
Simulacrum is an advanced AI-powered "Campaign Copilot" for Foundry VTT. It functions as an action-oriented agent that can directly interact with the VTT's database using natural language. 

### 1.1 Core Architecture
- **Action-Oriented:** Unlike standard chatbots, Simulacrum uses a suite of "tools" to perform CRUD operations on Foundry documents (Actors, Items, Journals, Scenes).
- **Campaign Awareness:** It can retrieve context from existing campaign data, maintaining consistency across world-building sessions.
- **System Agnostic:** While it can map stats to specific system fields (like Cyberpunk RED), it operates primarily at the Foundry Document level.

---

## 2. Integration into ASP.GM-Agent

### 2.1 Role Alignment: The "GM Sidebar" vs. "Narrative Synthesizer"
In our Split-Node architecture, **Simulacrum acts as the manual/interactive override**. 
- **Node B (Orchestrator):** Handles autonomous gig delivery, Fixer calls, and story progression (Phase 4 Story Engine).
- **Simulacrum (Phase 5+):** Provides the GM with a natural language interface to modify the world Node B is generating.

### 2.2 Integration Point: Joint State Management
To prevent conflict between Node B's narrative synthesizer and Simulacrum's manual edits, they must share a synchronized state.

- **Knowledge Base Sync:** Both systems will query `nitro-db` (Node A) for Lore and Rules.
- **Document Handover:** When Node B "spawns" a mook for a combat encounter (from `entities_mooks` namespace), Simulacrum can be used by the GM to immediately adjust that NPC's stats or inventory using natural language.

---

## 3. Deep Persistent NPC Memory (Architectural Foresight)
While Simulacrum is a copilot, we are leveraging its patterns to implement **Simulacrum Deep Memory** in Phase 5+.

### 3.1 Memory Tiering
1.  **Static Memory (RAG):** NPC backstories and roles stored in `pgvector` (Node A).
2.  **Dynamic Memory (Story Engine):** Immediate interaction history stored in the `StoryState` (Node B).
3.  **Cross-Session Memory:** A persistent SQLite table mapping NPC IDs to "Memory Summaries," allowing an NPC to remember past PC actions across months of real-time play.

---

## 4. Technical Constraints
- **Foundry Version:** Simulacrum is targeted at Foundry v13+. Since we are pinned to **v12** for stability, we must maintain a custom "Immersion Bridge" that backports the tool-calling patterns used by Simulacrum to the v12 WebSocket API.
- **Local Mandate:** Simulacrum typically uses cloud APIs. Our integration must force it to route through our **Crush CLI / Ollama** stack to maintain the 100% local requirement.

---

## 5. Conclusion
Simulacrum represents the "Architectural Standard" for AI world management. By studying its tool-calling patterns, we can ensure our **Foundry Bridge (Phase 3)** is robust enough to handle complex document manipulation, even while maintaining our local-only constraints.

**Quarantine Status:** This integration remains in the Phase 5+ Quarantine Zone. Do not architect code for this until Phase 4 is verified.
