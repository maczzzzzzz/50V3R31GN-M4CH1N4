# Design Specification: Immersive Terminal Extension (v3.2.21)
**Date:** March 31, 2026
**Subject:** Discord Chronicler, Playwright Optical Mesh, and Multimodal Terminal
**Status:** FINALIZED

## 1. Executive Summary
This extension turns the Crush CLI into a "High-Fidelity Deck" for solo play. It introduces the **Chronicler** (Discord-based screamsheet logging) and the **Optical Mesh** (Real-time spatial awareness via Playwright/Llava). These systems bridge the gap between the terminal, the browser (Foundry), and external narrative logs.

## 2. The Chronicler (Screamsheet Engine)

### 2.1 Architecture
- **Transport:** Official Discord MCP Server or Direct Webhook.
- **Trigger:** Any "State Mutation Event" from the `UnifiedStrategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle` (Faction shifts, Rent payments, Gig completion).
- **Tool:** `screamsheet_post(content: string, persona: string)`.

### 2.2 Persona Logic
The AI selects a narrative voice based on the context:
- **Netwatch Alerts:** For Netrunning/Data-theft events.
- **NCPD Scanner:** For combat/illegal trade events.
- **Street Rumor:** For faction standings and NPC movement.

## 3. The Optical Mesh (Spatial Vision)

### 3.1 Architecture
- **Capture:** Playwright MCP `screenshot` tool targeting the Foundry VTT `#canvas` element.
- **Analysis:** Node B loads **LLava 7B** to parse the screenshot buffer.
- **Context Fusion:** Coordinates from visual analysis are reconciled with **Foundry Scene Regions** stored in the RKG.

### 3.2 Visual Grounding Loop
1. **Request:** Player triggers visual scan (NL or `/scan`).
2. **Action:** Playwright captures frame → Pipes to Llava.
3. **Response:** Llava identifies token clusters and environmental features.
4. **Synthesis:** Mistral-Nemo uses this "Visual Truth" to narrate the next tactical beat.

## 4. Multimodal Command Deck (Crush)
Implemented as **Z-Commands** for precise solo control:
- `/scan`: Trigger Optical Mesh.
- `/news <text>`: Manually post a Screamsheet bark.
- `/vitals`: Join `npcs` (stats) and `crush.db` (history) for a quick status check.

## 5. Verification Plan
- **Latency:** Screenshot-to-Analysis loop must complete in **<10s**.
- **Parity:** Screamsheet log entries must match the `world.db` state history with 100% factual accuracy.
