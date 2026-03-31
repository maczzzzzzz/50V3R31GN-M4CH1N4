# Design Specification: The Living City & Project "Eyes-On" (v0.9.0)
**Date:** March 31, 2026
**Subject:** Computer Vision, Pulse Engine, and Spatial Tactical Intelligence
**Status:** FINALIZED

## 1. Executive Summary
Phase 6 (The Living City) provides the final layer of immersion for the ASP.GM-Agent. It introduces **Project Eyes-On**, a dual-node Computer Vision pipeline that automates map walling and tactical region identification. It also implements the **Pulse Engine**, a background simulation that advances the world state, faction turf, and NPC agendas while the player is idle.

## 2. Project "Eyes-On" (CV Pipeline)

### 2.1 Node A: Geometric Pass (The Architect)
- **Stack:** Rust + `imageproc`.
- **Logic:**
    - Grayscale → Gaussian Blur → Canny Edge Detection.
    - Hough Line Transform to identify structural wall segments.
    - **Grid Snapping:** Detected lines are snapped to user-defined grid increments (default 100px) with tight variance.
- **Output:** Native Foundry `walls` array JSON.

### 2.2 Node B: Tactical Pass (The Tactician)
- **Stack:** LLava 7B (via Ollama).
- **Logic:** Scans image once on import to identify semantic tactical features.
- **Tactical Categories:**
    - `cover_high`: Concrete walls, heavy pillars.
    - `cover_partial`: Desks, crates, low walls.
    - `hazards`: Electric wires, gas leaks, radioactive spills.
    - `security`: Cameras, automated turrets.
- **Output:** Foundry v12 `RegionDocument` array with attached RKG metadata.

## 3. The Pulse Engine (World Heartbeat)
The Pulse Engine advances the `world.db` state based on the passage of time.

### 3.1 Faction Turf Dynamics
- **Street Strength:** Each faction has a "Street Strength" value in the RKG.
- **Turf Wars:** Every 24 in-game hours, the engine rolls a **Friction Conflict** between rival factions in shared districts. 
- **Consequence:** Winning factions increase turf ownership; losing factions lose locations or NPC presence.

### 3.2 NPC Agendas
- **Friends/Enemies:** NPCs tracked in the RKG advance their own goals. 
- **World Barks:** If an NPC the player knows moves or achieves a goal, the AI pushes a "World Bark" to chat (e.g., *"Word on the street is Vido just took over the charging station in Northside"*).

## 4. Tactical Grounding Flow
During combat, Mistral-Nemo uses the **World Pulse** to "see" the map:
1. **Extraction:** Fetch all `Scene Regions` within 20m of the active Token.
2. **Context:** Prepend region types to the prompt (e.g., *"PLAYER_POS: [100, 200], NEARBY: [Region 402: High Cover]"*).
3. **Intelligence:** AI narratively leverages these features in its tactics.

## 5. Verification Plan
- **CV Parity:** Verify automated walls match a "Pre-Walled" control map with >90% accuracy.
- **Pulse Stability:** Simulate 30 days of "Idle Time"; verify RKG consistency and lack of faction "Deadlocks."
- **Performance:** LLava load/scan/unload cycle must complete in **<30s**.
