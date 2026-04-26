# ５０Ｖ３Ｒ３１ＧＮ－Ｍ４ＣＨ１Ｎ４: Master Ignition Protocol
**Version:** 3.8.6
**Status:** GEOMETRIC MEMORY ACTIVE (TOTAL RED OBSERVABILITY)

This guide details the end-to-end boot sequence for the distributed GM machine.

---

## 1. :/PR3-FL16H7-CH3CK //

1.  **Hardware Status:** 
    *   **Node A (Kernel):** NVIDIA 1050 Ti (4GB). Ensure CUDA is initialized.
    *   **Node B (Director):** AMD RX 9060 XT (16GB). Ensure Vulkan/RADV is active.
2.  **Environment:** Verify `.env` contains `SOVEREIGN_KEY` and hardware IPs.
3.  **Vault Status:** If blueprints are sealed (`.md.png`), ensure you have your key ready in `.env`.

---

## 2. :/5Y573M-16N1710N //

### 2.1 The Nucleus Artery
The primary command surface for the Machina is the **WebGL Nucleus Deck**. It handles all orchestration, hardware gating, and state observability.

1.  **Ignite the Artery:** Run **`npm run crush nucleus`** (or use the pre-built `crush-cli nucleus`).
2.  **Access the Deck:** Navigate to **`http://localhost:3030`** in your browser.
3.  **Boot the Machina:**
    *   Click the **◈ NUCLEUS** dropdown.
    *   Select **[FULL_ENGAGE]** for a standard session.
    *   Select **[GHOST_BOOT]** for a headless audit.

### 2.2 Ignition Sequence
Once engaged via the Deck, the Machina executes a multi-tier boot in the background:
*   **Layer 3 (Remote):** llama-server + zeroclaw start on Node A (Open-Reasoner-1.5B active).
*   **Layer 2 (WSL):** sidecar-cyberdeck + Node B Orchestrator (Mistral-Nemo-12B) + Obsidian Sync start.
*   **Layer 1 (Windows):** Foundry VTT launches via CDP bridge.

Monitor the **EVENT LOG** and **THOUGHT STREAM** quadrants in the Deck to verify all components reach **● RUNNING**.

---

## 3. :/463N7-UPL1NK //

1.  Start your AI agent (Gemini, Claude, or GLM-5.1).
2.  **MANDATORY:** If the vault is locked, select **UNSEAL 7H3-V4UL7** from the Nucleus Deck dropdown.
3.  Proceed with development or session dominance.

---

## 4. :/54F3-5HU7D0WN //

1.  Close Foundry VTT.
2.  Use the **REBOOT NODE_A** or **SHUTDOWN** commands in the Nucleus Deck for an immediate halt.
3.  The Node B watchdog will otherwise trigger a graceful shutdown within 5 minutes of disconnect.

---
**::/5Y573M-N071C3 : TRU7H UN1F13D. 5Y573M V3R1F13D. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
