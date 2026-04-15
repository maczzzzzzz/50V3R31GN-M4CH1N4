# Design Spec: Phase 34 — 7H3-M3M0RY-P4L4C3

**Date:** 2026-04-07
**Status:** Approved
**Topic:** Hierarchical memory architecture and background consolidation (The Infinite Mind).

## 1. Executive Summary
Phase 34 replaces the flat "context window" limitation with a structured **Memory Palace** architecture. This allows the Sovereign Machina to maintain narrative consistency across thousands of turns by organizing data into spatial and temporal hierarchies (Wings, Rooms, Tunnels) and utilizing a background "Dreaming" cycle to promote short-term signals into durable world-state facts.

## 2. Architecture: Tiered Context
Intelligence is managed across three distinct latency tiers:

### 2.1 L0/L1: Persistent Identity (AAAK)
- **Mechanism:** The AAAK dialect compresses the agent's core identity and immediate mission status into ~170 tokens.
- **Residency:** Loaded as a **Prompt Prefix** in `llama-server` VRAM.
- **Latency:** 0ms (pre-processed).

### 2.2 L2: The Palace Hierarchy (MemPalace)
- **Wings:** Broad context buckets (e.g., *District: Watson*, *Player: V*, *Faction: Maelstrom*).
- **Rooms:** High-density PoIs (e.g., *The Totentanz*, *All-Foods Factory*).
- **Tunnels:** Logical links that bridge wings (e.g., "The Maelstrom gang [Faction Wing] is currently blockading Watson [District Wing]").
- **Storage:** Local **ChromaDB** for semantic search across verbatim logs.

### 2.3 L3: The Dreaming Loop (OpenClaw)
A background process on Node A that continuously consolidates raw data:
1.  **Light Phase:** Tallying recency and frequency of lore signals.
2.  **REM Phase:** Simulating associations and identifying contradictions via the 1.5B Reasoner.
3.  **Deep Phase:** Committing "True Facts" to `Akashik.db` and generating `DREAMS.md`.

## 3. Integration & Hardware
- **Node B:** Hosts the Memory Palace (ChromaDB + SDK Bindings).
- **Node A:** Executes the Dreaming Loop during idle GPU cycles.
- **Bus:** The **VSB Mmap** synchronizes high-frequency tactical facts (e.g., "Room ID", "Active Combatant") to ensure Node B always knows which wing/room context to load.

## 4. Security & Sovereignty
- **Sanitization:** The **OBLITERATUS** protocol is applied to all incoming session logs before they are "mined" into the Palace to prevent prompt injection or logic drift.
- **Air-Gap Integrity:** All memory storage is strictly local; zero cloud RAG.
