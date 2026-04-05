# User Guide: Neural Uplink & The Neural Painter

**Version:** 1.9.0
**Role:** Hardware-Level Perception and Physical Materialization

---

## 👁️ The Neural Uplink (CDP)
The **Neural Uplink** provides the AI with "Physical Eyes" by establishing a native connection to the Foundry VTT GPU buffer via the **Chrome DevTools Protocol (CDP)** on Port 9222.

### 👁️ Capabilities:
- **Visual Grounding**: The AI captures raw rendering buffers to see exactly what you see on the canvas.
- **Ghost-Refresh**: Programmatically reloads the Foundry window to apply module or CSS updates without human intervention.
- **Inversion Engine**: Injects real-time CSS "glitch" or narrative FX directly into the Foundry renderer.

---

## 🎨 The Neural Painter (Batch Materialization)
The **Neural Painter** allows the AI to "draw" the game world with sub-microsecond latency. It bypasses standard WebSocket overhead by injecting batch creation commands directly into the renderer context.

### 🎨 What it does:
- **Batch Token Creation**: Spawns multiple NPCs and tokens in a single atomic execution.
- **Geometric Ingestion**: Draws walls, windows, and doors based on CV data extracted from raw maps.
- **Atmosphere Pulse**: Adjusts darkness levels and global illumination in real-time.

---

## 🛠️ Operational Requirements
1.  **Foundry Launch**: Ensure Foundry VTT is launched with the `--remote-debugging-port=9222` flag.
2.  **Scene ID**: The system must have an active `sceneId` registered in **`Akashik.db`** to target materializations.

---
*Neural Uplink: Native CDP Engine Active.*
