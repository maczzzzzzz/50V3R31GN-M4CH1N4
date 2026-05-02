# Design Spec: Vesper Shadow Mode (Background Persistence)

**Date:** 2026-04-05
**Status:** Approved
**Vision:** Establish a persistent, low-profile presence that monitors the environment during "quiet" moments.

## 1. VESPER LIFECYCLE

### 1.1 The Heartbeat Watchdog
- **Domain:** Sovereign-Go-Proxy.
- **Logic:** If no VSB traffic or user commands are detected for **30 minutes**, the proxy sends a `SIGTERM` to the Vesper background process.
- **Safety:** Prevents resource leakage from long-running background reasoning loops.

### 1.2 Shadow Ignition
- **Mechanism:** Integrated into `deck-igniter`.
- **Mode:** Vesper starts in `--shadow` mode (headless, no overlays).

## 2. THE RISK ENGINE

### 2.1 Classification
- **LOW:** `captureScreenshot`, `corruptUI` (local), lore extraction. (AUTONOMOUS).
- **MED:** `activateScene`, `triggerPretextOverlay` (global), `sendChatMessage`. (REQUIRES VESPER-ACK).
- **HIGH:** `runScript` (deprecated), `executeAction` (damage), `spawnSoloSafeNpc`. (REQUIRES USER-FLUSH-GATE).

## 3. USER OVERRIDE (THE KILL SWITCH)

### 3.1 Global Kill
- **HUD:** A prominent `::/V35P3R-K1LL //` button in the `DECK` tab of the Rust sidecar.
- **Action:** Immediately sends `pkill -9` to all background reasoning processes and clears the VSB proposal queue.

---
*Verified by Gemini CLI v3.8.27-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Orchestrator.*


---
**LINKS:** [[SPEC_TREE]] | [[OS_CORE]]
