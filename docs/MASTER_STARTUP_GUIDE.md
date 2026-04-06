# ５０Ｖ３Ｒ３１ＧＮ－Ｍ４ＣＨ１Ｎ４: Master Ignition Protocol
**Version:** 1.14.0
**Status:** SOVEREIGN HIGHWAY ACTIVE

This guide details the end-to-end boot sequence for the distributed GM machine.

---

## 1. :/PR3-FL16H7-CH3CK //

1.  **Hardware Status:** Ensure Node A (Kernel) and Node B (Director) are powered on.
2.  **Environment:** Verify `.env` contains `SOVEREIGN_KEY` and hardware IPs.
3.  **Vault Status:** If blueprints are sealed (`.png`), ensure you have your key ready.

---

## 2. :/5Y573M-16N1710N //

### 2.1 The Purge
Before starting any session, it is MANDATORY to clear any zombie processes from previous crashes to prevent resource leakage.
1.  Run `crush igniter`.
2.  Press **`ctrl+p`** to execute the System-Wide Purge.
3.  Wait for the "PURGE C0MPL373" confirmation in the logs.

### 2.2 Ignition
1.  Press **`ctrl+i`** in the `deck-igniter` TUI.
2.  Monitor the sequence:
    *   **Layer 3 (Remote):** llama-server + zeroclaw start on Node A via SSH.
    *   **Layer 2 (WSL):** sidecar-cyberdeck + Node B Orchestrator start.
    *   **Layer 1 (Windows):** Foundry VTT launches via CDP bridge.
3.  All components should show **● RUNNING**.

---

## 3. :/463N7-UPL1NK //

1.  Start your AI agent (Gemini or Claude).
2.  **MANDATORY:** If the vault is locked, command the agent: **"Open the Vault."**
3.  The agent will use your `SOVEREIGN_KEY` to restore the plans and specs to cleartext.
4.  Proceed with development or session dominance.

---

## 4. :/54F3-5HU7D0WN //

1.  Close Foundry VTT.
2.  The Node B watchdog will detect the disconnect and trigger a graceful shutdown of distributed services within 5 minutes.
3.  Alternatively, use **Shift+Q** in the `deck-igniter` to force an immediate shutdown.

---
**::/5Y573M-N071C3 : UNAUTHORIZED LOGIC DRIFT WILL RESULT IN IMMEDIATE MMU PURGE // 50V3R31GN-M4CH1N4**
