Project Black-Ice v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS → 50V3R31GN-M4CH1N4 Master Proposal, Implementation Plan & Design Specification
Document ID: ASP-GM-LOCAL-MASTER-v1.0
Date: April 1, 2026
Status: Architecture Locked & Fully Aligned with https://github.com/maczzzzzzz/-50v3r31gn-m4ch1n4 (current repo state, Phase 6 active)
1. Executive Summary
50V3R31GN-M4CH1N4 is a fully local, air-gapped, dual-node AI Game Master for Cyberpunk RED (Foundry VTT v12).
It uses 1-bit Bonsai 8B on the Nitro 5 for deterministic Rules Strategic Oracle duties and Mistral-Nemo 12B (FP8) on the main rig for rich narrative, linked by ClawLink.
All output routes exclusively to Foundry chat/AR HUD. Zero cloud, zero latency, deterministic via SQLite RKG + Ralph Auditor.
This spec locks the production-grade design and provides the exact 22-day roadmap Claude will follow directly from the live repository.
2. Hardware & Node Mapping (Current Repo State)

Node A (Nitro 5 – headless): Rules Strategic Oracle
– Bonsai 8B (1-bit Q1_0_g128, 1.15 GB)
– ZeroClaw Rust runtime + SQLite RKG
Node B (Main rig – 9060XT + 48 GB): Narrative Director
– Mistral-Nemo 12B (Q4_K_M with FP8 KV cache)
Interconnect: ClawLink (persistent binary, <10 ms) + Flush Gates + Ralph Auditor
Storage: Single SQLite world_state.db with Relational Knowledge Graph (triplet schema)

3. Core Design Principles (Locked from Repo)

100% local, zero telemetry
Rules/math always resolved by 1-bit Strategic Oracle before narrative
Narrative is prose-only and routed exclusively through Foundry chat/AR HUD
RKG triplet grounding + Ralph Auditor prevents hallucinations
AutoDream background consolidation for long-term persistence

4. Dependencies & Must-Read Material (All Direct Links)
Core Repositories

Main project: https://github.com/maczzzzzzz/-50v3r31gn-m4ch1n4
ZeroClaw / Claw RS (Rust harness): https://github.com/claw-cli/claw-code-rust
Bonsai 8B weights (GGUF): https://huggingface.co/prism-ml/Bonsai-8B-gguf
PrismML llama.cpp fork (1-bit kernels): https://github.com/PrismML-Eng/llama.cpp
ClawLink protocol reference: https://github.com/claw-cli/claw-code-rust/tree/main/claw-link

Foundry VTT & Cyberpunk RED

Foundry VTT v12 API: https://foundryvtt.com/api/v12/index.html
cyberpunk-red-core system: https://gitlab.com/cyberpunk-red-team/fvtt-cyberpunk-red-core

Research & Architecture References (Must-Read)

Bonsai 8B Announcement & Benchmarks: https://prismml.com/news/bonsai-8b
Claude Code Source Analysis (leak patterns used in repo): https://claude-code-info.vercel.app/docs/claude-src
SQLite RKG + sqlite-vec: https://github.com/asg017/sqlite-vec
Ralph Auditor & Flush Gate patterns: https://github.com/claw-cli/claw-code-rust/blob/main/bridge/flushGate.ts (and init-verifiers.ts)

5. Phased Implementation Plan (22 focused days)
Phase 0: Foundation (2 days)

Finalize Cargo workspace refactor (claw-core, claw-tools, claw-mcp)
Deploy Bonsai 8B on Nitro 5 and confirm <1.5 GB VRAM usage
Integrate CharGenApp + auto-ingest_character hook

Phase 1: World Seed & RKG (5 days)

seed-world.ts → full triplet ingestion of TttA JSONs, rulebooks, mook packs
Implement get_entity_info + grounding instruction
Enable AutoDream daemon for idle-time consolidation

Phase 2: ClawLink Hybrid Routing + Auditor (6 days)

Persistent ClawLink bridge between nodes
Routing: rules/math → Node A (8B), narrative → Node B (12B)
Flush Gates + Ralph Auditor (temperature-0 verification loop)
Core MCP tools: resolve_rules_lookup, execute_ttta_trade, roll_oracle, advance_beat

Phase 3: Core Gameplay Modules (5 days)

Fixer calls (Simple Phone + TttA lore)
Night Market (Eagle economy, vendor grid UI)
Phils AI Assistant sidebar with CharGen button

Phase 4: Polish, Testing & Release (4 days)

GM approval queue + export/import
End-to-end testing with real JSON exports
Documentation + single-command boot script (Nitro 5 + main rig)

Total: 22 days → complete local MVP (seeded world, accurate rules, immersive chat, fixer calls, Night Market)
6. MVP Success Criteria

First boot fully seeds RKG
CharGen → auto-ingest into world_state.db
Rules from Node A, narrative from Node B, output only in Foundry chat
Playable full session with zero cloud dependency

---
**LINKS:** [[OS_CORE]]
