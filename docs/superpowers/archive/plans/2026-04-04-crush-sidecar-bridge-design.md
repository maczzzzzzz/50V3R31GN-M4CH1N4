# Design: Crush Sidecar Mesh & Physical Confirmation (v3.7.0)
**Date:** 2026-04-04
**Target:** Phase 23 (Neural World Engine)

## 1. Overview
The Crush Sidecar Mesh establishes a **Modular Sidecar System** where independent Rust binaries (The Utility Belt) are managed by the **Crush CLI (Go)**. It introduces a mandatory **Physical Confirmation Flow (Operator-in-the-Loop)**, ensuring that all major systemic actions (purchases, hideout arming, AI intents) require a manual `ENTER` or `ESC` in the terminal before the state is committed to Foundry VTT.

## 2. Architecture: The Utility Belt & The Registry
Each sidecar is a focused, independent binary (`atlas-market.exe`, `atlas-vitals.exe`, etc.) managed by a central **Sidecar Registry** in Crush.

### 2.1 Crush Sidecar Registry (`crush sidecar`)
- **Registry Manager:** A new Go module (`crush/sidecars.go`) that manages the lifecycle of the sidecar binaries.
- **Process Management:** Crush uses `os/exec` to spawn sidecars as child processes, capturing logs to `.crush/logs/sidecars.log` and ensuring auto-reboots on crash.
- **Foundry Trigger:** Node B can send a `sidecar_launch` command to Crush to "remotely spawn" the HUD you need based on the in-game context.

### 2.2 Physical Confirmation Flow (Operator-in-the-Loop)
We introduce a **Tri-Node Confirmation Loop** between the Sidecar/AI, Crush, and the Director (Node B).

1. **The Proposal (Sidecar/AI -> VSB):** Any component (e.g., Night Market Sidecar) writes a `ProposalPacket` to the **VSB Shared Synapse** with a `PENDING` status.
2. **The Intercept (Crush CLI):** Crush runs a high-priority background watcher on the VSB. When it sees a `PENDING` proposal, it interrupts the CLI and renders the **Authorization Pane**.
3. **The Physical ACK (You -> Crush):** You physically press `ENTER` (Approve) or `ESC` (Deny) in your terminal.
4. **The Commit (Crush -> VSB -> Node B):** Crush updates the `status` to `APPROVED` in the VSB. The Director (Node B) sees the flag and executes the final state change in **Foundry VTT**.

## 3. Data Flow & VSB Schema: `ProposedActions`
- **ProposedActions Block:** A fixed-size ring buffer in the VSB Shared Synapse.
- **ProposalPacket Schema:**
    - `id`: Unique transaction ID.
    - `origin`: Source component (`SIDE_MARKET`, `AI_INTENT`, `SIDE_HIDEOUT`).
    - `action_type`: Type of action (`PURCHASE`, `ARM_TRAP`, `TRANSFER_EDDIES`).
    - `payload`: Encoded details of the action.
    - `status`: 2-bit state field (`00: PENDING`, `01: APPROVED`, `10: REJECTED`).

## 4. Components: The Authorization Pane
A high-contrast Lipgloss component in the Crush CLI:
- **Header:** `⟨ AUTHORIZATION REQUIRED ⟩` (Pulsating Red/Cyan).
- **Body:** Action details (e.g., `ACTION: PURCHASE [MILITECH BERSERK] | COST: 500eb`).
- **Footer:** `[ENTER] TO SIGN | [ESC] TO ABORT`.

## 5. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>


---
**LINKS:** [[OS_CORE]]
