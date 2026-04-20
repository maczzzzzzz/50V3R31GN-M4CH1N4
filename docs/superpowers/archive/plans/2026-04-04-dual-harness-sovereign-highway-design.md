# Design: Dual-Harness Sovereign Highway (v3.2.19)
**Date:** 2026-04-04
**Target:** Phase 22 (Sovereign Highway Milestone)

## 1. Overview
The Dual-Harness Sovereign Highway is a distributed agentic architecture that forks the `claw-code` Rust runtime into two specialized engines: **The Director (Node B)** and **ZeroClaw (Node A)**. These engines are linked via a high-performance **Virtual System Bus (VSB)** using Binary UDP and Mmap for sub-1ms state synchronization.

## 2. Architecture & Data Flow
The system decomposes the single-process `claw-code` harness into a "Soul & Body" split:

### 2.1 Node B: The Narrative Engine (`director-rs`)
- **Role:** The "Soul" of the system. Manages high-level narrative intent and NPC consciousness.
- **Hardware:** AMD RX 9060 XT (16GB VRAM) / 16-core CPU.
- **Components:**
    - `director-core`: Fork of `claw-code::runtime` managing the 12B Brain (Mistral-Nemo).
    - `session-manager`: Handles context window pruning (25B+ tokens) and Skillstone Registry integration.
    - `narrative-plugin`: Intercepts LLM outputs and serializes them into **Abstract Intent Packets**.
    - `vsb-bridge`: High-performance UDP/Mmap client for receiving **Mechanical Result Packets**.

### 2.2 Node A: The Mechanical Engine (`zeroclaw`)
- **Role:** The "Body" of the system. Enforces physical rules and hardware perception.
- **Hardware:** NVIDIA GTX 1050 Ti (4GB VRAM) / Nix-Sandboxed.
- **Components:**
    - `zeroclaw-core`: Fork of `claw-code::tools` runner managing the 1B Judge and Falcon Perception.
    - `mechanical-plugin`: Maps Abstract Intents to physical rule-checks (Tactical-MMU, D10 Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle).
    - `vsb-server`: The authority on the Sovereign Highway; serializes reality into binary packets.
    - `task-router-proxy`: Manages VRAM swapping between Open-Reasoner-Zero-1.5B and Falcon models.

## 3. The Sovereign Loop
1. **Intent Generation (Node B):** 12B Brain generates an action; `director-rs` captures and serializes it as an Abstract Intent.
2. **Rules Validation (Node A):** `zeroclaw` receives the intent and triggers the 1B Judge and Tactical-MMU (LOS/Cover).
3. **The Flush Gate (Node A):** If valid, the D10 Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle calculates the outcome and commits it to the local `Akashik.db` (Mmap mirror).
4. **World State Sync (Node B):** `director-rs` receives the result, updates the session context, and pushes the change to Foundry VTT via Port 9222.

## 4. Resilience & Error Handling
- **Hardware Contention:** Node A sends a `BUSY` signal during VRAM swaps; Node B queues tasks to prevent hallucinations.
- **Narrative Divergence:** 1B Judge issues `HARD_REJECT` for impossible actions; Node B injects "Sensory Feedback" into the 12B Brain.
- **Bus Integrity:** Uses Sequence-IDs for UDP packets; harnesses resync via the Mmap Synapse Mirror if packets are dropped.

## 5. Metadata
- **Co-Authored-By:** Claude Sonnet <noreply@anthropic.com>
- **Co-Authored-By:** Gemini CLI <gemini-cli@google.com>
