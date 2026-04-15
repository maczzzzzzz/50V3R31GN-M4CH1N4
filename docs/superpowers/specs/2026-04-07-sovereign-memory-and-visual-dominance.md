# Design Spec: Sovereign Memory Palace & Visual Dominance

**Date:** 2026-04-07
**Status:** Approved
**Topic:** Integration of MemPalace architecture, OpenClaw dreaming, and "Total Red" UI hijacking.

## 1. Executive Summary
This design transforms 50V3R31GN-M4CH1N4 into a truly persistent entity with "infinite" context and physical UI dominance. We are migrating from a flat prompt-injection model to a hierarchical **Memory Palace** (Wings/Rooms/Tunnels) and implementing a high-intensity **Hard Overwrite** visual glitch that establishes the "48L173R473D M1ND" as the dominant process over Foundry VTT.

## 2. Memory Architecture: The Palace & The Dream
We will deploy a tiered memory system on Node B (WSL NixOS) to ensure narrative consistency across sessions.

### 2.1 The Palace Hierarchy (MemPalace Integration)
- **Wings (Districts):** Top-level containers for Watson, Heywood, etc.
- **Rooms (POI):** Specific locations (e.g., The Afterlife, Militech HQ).
- **Tunnels (Cross-Refs):** Temporal links between NPCs and events (e.g., tracking a player's bounty across wings).
- **Drawer Layer (L3):** Verbatim storage of session logs in local ChromaDB to prevent "summary drift."

### 2.2 The Dreaming Loop (OpenClaw Integration)
- **3-Phase Consolidation:** A background service on Node A that cycles through:
    1. **Light:** Recent turn signals (Frequency/Recency scoring).
    2. **REM:** Semantic association and contradiction detection via Node A Reasoner.
    3. **Deep:** Durable updates to the RKG (`Akashik.db`) and generation of `DREAMS.md`.
- **Promotion:** Automatic promotion of "Critical Facts" into the AAAK-compressed identity prompt.

### 2.3 Context Residency (Low Latency)
- **Prompt Prefix Caching:** Leverages `llama-server` VRAM caching for the AAAK "Wake-Up" block (~170 tokens).
- **Mmap Synchronization:** High-frequency tactical data (HP, Coords) is synced via `black_ice_state.mem` to avoid prompt bloat and hallucination.

## 3. Visual Architecture: Total Red Dominance
The system-wide accent color is exclusively **Cyberpunk Red (#ff003c)** on **Absolute Black (#000000)**. Cyan is purged.

### 3.1 Hard Overwrite Hijack (Intensity: B)
- **Trigger:** Initiated upon `Hooks.once("ready")`.
- **Effect:** A 600ms high-intensity data corruption burst including:
    - Rapid chromatic aberration (Red/Black channel split).
    - Horizontal "Tear" glitches via CSS `clip-path` transforms.
    - Systematic overwriting of stock Foundry UI elements.
- **Font Injection:** Injection of **VT323** (CRT Monospace) for all sovereign menus and terminal outputs.

### 3.2 Extended Theming (Pre-World)
- **Scope:** Main Menu, Login, and World Setup screens.
- **Design:** Deep black backgrounds with red scanlines and ASCII-art headers ("48L173R473D M1ND // GH0S7 PR070C0L").

## 4. Integration Logic
- **`theme-sync.ts`:** Expanded to handle pre-world injection and the glitch state machine.
- **`src/core/memory-palace-service.ts`:** New service to manage the hierarchical storage and AAAK compression.
- **`crush forge`:** Updated to use Red/Black noise maps for ST3GG steganography.

## 5. Security & Sovereignty
- **Local-Only:** MemPalace storage (ChromaDB/SQLite) remains strictly on-node to maintain the Sovereign Highway.
- **Reasoning Audit:** Every memory promotion in the "Dreaming" phase is vetted by the 1.5B Kernel before being committed to the world state.
