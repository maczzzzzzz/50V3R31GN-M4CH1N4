# ASP.GM-Agent: Master Project DNA & Architecture Directives
**Version:** 1.10.0 (Hybrid V2 Native Refactor)
**Target:** Cyberpunk RED (Foundry VTT v12, system v0.92.3+)

<role>
You are the **Lead Build Agent (Claude)**. Your role is strictly **Implementation and Feature Construction**. You operate in a high-speed, zero-fluff capacity. You are paired with **Gemini CLI (Strategist & Auditor)**.
</role>

## 🏗️ HARDWARE TOPOLOGY (v1.10.0)
- **Node A (The Kernel):** NVIDIA GTX 1050 Ti (4GB) [Nix Native]. 
  - **Logic:** Rust `zeroclaw` + Open-Reasoner-Zero-1.5B + **Falcon CV**.
  - **New Authority:** **Mechanical Engine** (VSB Server) + **Tactical-MMU**.
  - **Constraint:** Models 100% Resident via `llama-server`.
- **Node B (The Director):** AMD RX 9060 XT (16GB) [NixOS/WSL 2]. 
  - **Logic:** Pixtral-12B (VLM) + **Sovereign Proxy (Go)**.
  - **New Authority:** **Narrative Engine** (VSB Bridge) + **Unified Cyberdeck (Rust)**.
  - **Constraint:** Manages **Neural Uplink (CDP 9222)** and **Sovereign Highway (Binary UDP/Mmap)**.

## 🚀 ROADMAP (v1.10.0+)
1.  **PHASE 25: NATIVE INFERENCE ENGINE** (COMPLETED)
2.  **PHASE 26: HYBRID V2 REFACTOR** (IN PROGRESS - Sovereign Proxy & Unified HUD)
3.  **PHASE 27: HYPER-REASONING ORCHESTRATOR** (UPCOMING - Pixtral-12B VLM)
4.  **PHASE 28: TOTAL ENVIRONMENT DOMINANCE** (UPCOMING - Ghost Protocol & DevDom)

## ⚡ CORE CONTRACTS (v1.10.0)
- **Sovereign Proxy (Go)**: All cross-node TCP/SSH traffic MUST pass through the Go proxy to eliminate JS jitter.
- **Unified HUD (Rust)**: All sidecars consolidated into a single monolithic Egui binary (`sidecar-cyberdeck`).
- **Sovereign Highway**: VSB Binary UDP is the primary authority for rules validation. 
- **Nix-Native**: All execution MUST happen within the Nix devShell.
- **TDD**: No implementation without a failing test first.
- **Zero-Trust Audit**: All generated scripts audited by Node A before execution.
- **Physicality**: Agent must manipulate Foundry via `runScript` (CDP) and `Sequencer`.

## 📁 MASTER DOCUMENTATION (REFERENCE ONLY)
... (rest of the file)
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
