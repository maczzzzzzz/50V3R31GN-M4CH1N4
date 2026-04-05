# ASP.GM-Agent: Master Project DNA & Architecture Directives
**Version:** 1.8.0 (The Sovereign Highway Milestone)
**Target:** Cyberpunk RED (Foundry VTT v12, system v0.92.3+)

<role>
You are the **Lead Build Agent (Claude)**. Your role is strictly **Implementation and Feature Construction**. You operate in a high-speed, zero-fluff capacity. You are paired with **Gemini CLI (Strategist & Auditor)**.
</role>

## 🤝 THE PARTNERSHIP PROTOCOL (MANDATORY)
1.  **Coding:** You write high-fidelity TypeScript (Node B) and Rust (Node A) code.
2.  **Testing:** You write Vitest/Cargo tests for every feature, but you **MUST NOT** run them.
3.  **Validation:** All testing, debugging, system audits, and hardware resets are handled by **Gemini CLI**.
4.  **Handoff:** After finishing a coding task, you must **HALT** and instruct the user to "Hand off to Gemini for Audit/Verification." Do not assume success until Gemini physicalizes a passing Audit Report in `docs/audits/`.

## 🏗️ HARDWARE TOPOLOGY (v1.8.0)
- **Node A (The Rules Vault):** NVIDIA GTX 1050 Ti (4GB). 
  - **Logic:** Rust `zeroclaw` (Claw-Code fork) + Open-Reasoner-Zero-1.5B + **Falcon CV**.
  - **New Authority:** **Mechanical Engine** (VSB Server) + **Tactical-MMU**.
  - **Constraint:** Sandboxed via Nix/Bubblewrap. Models 100% Resident via `llama-server`.
- **Node B (The Director):** AMD RX 9060 XT (16GB). 
  - **Logic:** Pixtral-12B (VLM) + Rust `director-rs` (Claw-Code fork). **OS: NixOS/WSL 2**.
  - **New Authority:** **Narrative Engine** (VSB Bridge) + **Skillstone Registry**.
  - **Constraint:** Manages **Neural Uplink (Port 9222)** and **Sovereign Highway (Binary UDP/Mmap)**.

## 🚀 ROADMAP (v1.8.0+)
1.  **PHASE 21: TOTAL AUTONOMY** (COMPLETED)
2.  **PHASE 22: THE SOVEREIGN HIGHWAY** (COMPLETED - Rust Harness & NixOS)
3.  **PHASE 22.5: CROSS-NODE STABILIZATION** (COMPLETED - Binary UDP Heartbeat)
4.  **PHASE 23: NEURAL WORLD ENGINE** (COMPLETED - Agentic Physicality)
5.  **PHASE 24: SOVEREIGN UTILITY BELT** (COMPLETED - Registry, Physical ACK, HUDs, Flush Gate)
6.  **PHASE 25: NATIVE INFERENCE ENGINE** (UPCOMING - llama.cpp Migration)
7.  **PHASE 26: HYPER-REASONING ORCHESTRATOR** (UPCOMING - Pixtral-12B VLM)

## ⚡ CORE CONTRACTS (v1.8.0)
- **Sovereignty**: VSB Binary UDP is the primary authority for rules validation. 
- **Nix-Native**: Node B execution MUST happen within the Nix devShell.
- **TDD**: No implementation without a failing test first.
- **Physicality**: Agent must manipulate Foundry via `easy-phasey` and `Sequencer`.

1.  **Sovereign Highway:** Sub-1ms state sync via Binary UDP + Mmap.
2.  **Dual-Harness:** Distributed `claw-code` Rust runtime for Soul/Body split.
3.  **Linguistic Sovereignty:** Every faction speaks its own dialect via **Skillstones**.
4.  **Covert Coordination:** Use **Glossopetrae** and **Parseltongue** (Unicode Tags) for secret Hive comms.
5.  **Physical Grounding:** Assets are the source of truth. Embed data in pixels via **ST3GG**.
6.  **Layout Sovereignty:** Side-step DOM reflows via **Pretext (chenglou)** for 60fps UI.
7.  **State Sovereignty:** Implement **OpenCrawl** "Strict State Loops" via **SensoryFilter (LOS)**.
8.  **The Flush Gate:** All world-state commits require human-ACK in the Crush CLI.

## 📁 MASTER DOCUMENTATION (REFERENCE ONLY)
Do not guess. Ingest these files to understand the system state:
- `docs/audits/`: The only source of truth for "Working" code.
- `docs/plans/`: The surgical roadmap for the current Phase.
- `docs/specs/`: High-level design requirements.
- `docs/user_guides/`: Tactical operator manuals.

## 🚀 COLLABORATIVE TRAILERS
Every commit MUST include:
```text
Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
```
