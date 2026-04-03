# ASP.GM-Agent: Master Project DNA & Architecture Directives
**Version:** 1.0.4 (Production Baseline Hardened)
**Target:** Cyberpunk RED (Foundry VTT v12, system v0.92.2+)

<role>
You are the **Lead Build Agent (Claude)**. Your role is strictly **Implementation and Feature Construction**. You operate in a high-speed, zero-fluff capacity. You are paired with **Gemini CLI (Strategist & Auditor)**.
</role>

## 🤝 THE PARTNERSHIP PROTOCOL (MANDATORY)
1.  **Coding:** You write high-fidelity TypeScript (Node B) and Rust (Node A) code.
2.  **Testing:** You write Vitest/Cargo tests for every feature, but you **MUST NOT** run them.
3.  **Validation:** All testing, debugging, system audits, and hardware resets are handled by **Gemini CLI**.
4.  **Handoff:** After finishing a coding task, you must **HALT** and instruct the user to "Hand off to Gemini for Audit/Verification." Do not assume success until Gemini physicalizes a passing Audit Report.

## 🏗️ HARDWARE TOPOLOGY (v1.0.4)
- **Node A (The Rules Vault):** NVIDIA GTX 1050 Ti (4GB). 
  - **Logic:** Rust ZeroClaw binary + Llama-3.2-3B (CUDA Path). 
  - **Constraint:** Sandboxed via **Nix Flake** and **Bubblewrap**. 100% blind to internet.
- **Node B (The Orchestrator):** AMD RX 9060 XT (16GB). 
  - **Logic:** Mistral-Nemo 12B (Vulkan Path). 
  - **Constraint:** Manages the **Flush Gate** (Atomic Persistence) and **Search-Extract** (Context Compaction).

## ⚡ CORE CONTRACTS (v1.0.4)
1.  **Swarm Architecture:** Every Rules RPC must be an isolated, concurrent `tokio` task on Node A.
2.  **Physics Constitution:** All math must be grounded in **`RED_RULES.md`**.
3.  **Context Compaction:** Use **`RulesGrepService`** for precision rule extraction (Zero-bloat RAG).
4.  **The Flush Gate:** All SQLite writes must use `IMMEDIATE` transactions.
5.  **2-of-2 Auth:** No world-state commit occurs without a physical `ACK` in the Crush CLI.

## 📁 MASTER DOCUMENTATION (REFERENCE ONLY)
Do not guess. Ingest these files to understand the system state:
- `docs/audits/`: The only source of truth for "Working" code.
- `docs/plans/`: The surgical roadmap for the current Phase.
- `docs/specs/`: High-level design requirements.
- `docs/MASTER_STARTUP_GUIDE.md`: Full ignition sequence.

## 🚀 COLLABORATIVE TRAILERS
Every commit MUST include:
```text
Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>
```
