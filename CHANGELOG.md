# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.2.15.html).

## [3.2.15] - 2026-04-18
### Added
- **Phase 63: Advanced Hermes Orchestration:** Formalized the integration of Hermes ecosystem components (`hermes-control-interface`, `hermes-hud`) as headless services on Node C, embedded via WebGL into the Node B Nucleus Command Deck.
- **OpenMAIC State Architecture:** Adopted LangGraph routing and finite-state playback mechanisms from the Tsinghua University OpenMAIC project to orchestrate complex generation tasks across the Triad.

## [3.2.14] - 2026-04-18
### Added
- **Phase 62: Sovereign Trinity:** Formalized the architectural shift to a 3-node Cognitive Mesh using Mooncake disaggregated memory and SGLang RadixAttention.
- **Trinity Research:** Conducted supplementary validation of the Mooncake KVCache Transfer Engine and GEPA Reflective Evolution patterns.
- **Advanced Hermes Integration:** Mapped the log-step hash verification protocol between Node B (Director) and Node C (Oracle) to ensure mechanical infallibility.

## [3.2.13] - 2026-04-18
### Added
- **Deep Systems Audit:** Mapped the "Macro Gaps" in the official repo (Housing, Lifestyle, Contraband rarity, and Addiction logic) to the Sovereign architecture.
- **Phase 60 Expansion:** Defined the Sovereign Economy Engine, including automated "Monthly Burn" logic and dynamic Night Market generation.
- **Phase 61 Expansion:** Defined UI/UX Sovereignty, transforming the dashboard into a full Command-and-Control hub with real-time Node A reasoning visualization.

## [3.2.12] - 2026-04-18
### Added
- **Phase 59: Canonical Mirror:** Initiated the total rebuild of the Sovereign Mind using the official Cyberpunk RED Core repository as the canonical source of truth.
- **Rules Kernel (Rust):** Architectural blueprint for porting canonical `CPRSkillRoll` and `CPRDamageRoll` logic into the `zeroclaw` Rust kernel for bit-identical mechanical resolution.
- **Akashik.db v4 Schema:** Defined a relational expansion to support `dv_tables`, `item_components`, and `situational_modifiers`, bridging the gap between narrative simulation and official mechanics.
- **Repo Audit Report:** Physicalized exhaustive research into the official CPR repository, mapping 1000+ YAML entities and deep logic arteries.

### Fixed
- **Infrastructure Recovery Block:** Documented the WSL corruption and GGUF metadata pointer mismatch (Error 14123288431433875456) as a critical blocker in the implementation plan.

## [3.2.11] - 2026-04-17
### Added
- **Ability Shard 57:** Formalized Sovereign Mind Rebuild protocols and verification.
- **Gauntlet orch-57:** Verification test for relational density, normalization, and narrative quarantine.
- **Narrative Prose Wing:** Dedicated `Global/Narrative_Prose` wing in the Obsidian RKG vault.
- **Enhanced Logger:** Structured logging now includes `nodeId` and stack trace capture for deep-trace debugging.
- **Sovereign Socket Artery:** Consolidated all Unix sockets under `SOVEREIGN_SOCKET_ROOT` (`.gemini/tmp/`) to eliminate path fragmentation.
- **Unified Integrity Hashing:** Standardized on **FNV-1a 64-bit** across Go (Crush) and Rust (ZeroClaw) to align with VSB binary standards.
- **Kinetic Dominance Anchors:** Physically grounded 61 weapon sound assets and PBR masks for Atlas maps.

### Fixed
- **Database Reconstruction:** Successfully recovered from a malformed disk image (power outage) via manual SQLite and Python ingestion bypass.
- **Architectural Drift Purge:** Systematic repository-wide removal of legacy `OLLAMA`, `asp-gm`, and `cyan` identifiers.
- **Visual DNA Alignment:** Purged all legacy cyan remnants in favor of the "Total Red" palette across TS, Rust, and CSS.
- **Normalization Drift:** Eliminated case-sensitivity ghosts in district folders (e.g., Downtown RED).
- **Asset Indexing Fallback:** Fixed anchor promotion logic to ensure Phase 551 verification passes.
- **Node A Cleanup:** Surgically purged legacy `asp-gm-agent` artifacts and consolidated scattered logs on the remote server.

### Changed
- **Triad Synchronization:** Aligned Node A and Node B to bit-identical project roots (`50V3R31GN-M4CH1N4`).
- **Harmonization Artery:** Restored `district_dna` anchors from Fandom DNA and harmonized 1000+ triplets from core PDFs.
- **Inference Nomenclature:** Transitioned from `OllamaClient` to `SovereignInferenceClient` and `OLLAMA_BASE_URL` to `SOVEREIGN_INFERENCE_URL`.

## [3.2.11] - 2026-04-16
### Added
- **Phase 57: Sovereign Mind Rebuild**: Initiated the high-fidelity reconstruction of `Akashik.db` and the Obsidian RKG vault.
- **Materialized Agents**: Deployed the **Sovereign Ingestor** (Hifi Parsing) and **Sovereign Scribe** (Documentation Harmonization) droid profiles.
- **Scribe Governance**: Established the Sovereign Scribe's total jurisdiction over the `akashik_guides/` library, mandating systematic procedural audits on every major delta.
- **Diagnostic Artery**: Implemented the `vitals-heartbeat` skill (`npm run audit:vitals`) for 3-quadrant hardware/software validation.
- **Automation Artery**: Implemented the `manifest-synchronizer` skill (`npm run sync`) for cascading version and documentation alignment.
- **Agentic Grounding**: Integrated mandatory initialization protocols in `CLAUDE.md` to ensure zero-drift implementation.
- **Structural Parsing**: Adopted `opendataloader-pdf` for layout-aware PDF extraction (XY-Cut++), preserving multi-column formats and tables.
- **Semantic Chunking**: Integrated `chunknorris` for header-based splitting with parent context breadcrumb injection.
- **Polymorphic Ingestion**: Defined the `SovereignIngestService` with specialized handlers for Wiki, Foundry JSON, and high-fidelity PDF sources.
- **Vault v2 Architecture**: Established a District-first holographic palace hierarchy with mandatory metadata frontmatter.

### Changed
- **Knowledge Base**: Codified structural parsing and semantic chunking as foundational system patterns.
- **Asset Forge**: Updated the ingestion guides to prioritize high-fidelity primitives over legacy flattened text.

## [3.2.10] - 2026-04-16
### Changed
- **WebGL-First Architecture**: Formally transitioned the command surface to the **Nucleus Web Deck**. Deprecated the legacy `deck-igniter` TUI in favor of a headless backend orchestration service.
- **Crush CLI Artery**: Implemented the `--headless` flag for `crush start`, enabling seamless background ignition from the Web UI.
- **Akashik Guides Audit**: Performed a systematic remediation of the entire `akashik_guides/` library to align with Phase 50+ standards (v3.2.15).
- **Master Startup Pivot**: Updated all onboarding and setup guides to prioritize the Nucleus Artery (`npm run crush nucleus`) over legacy CLI workflows.

### Fixed
- **Architectural Drift**: Eliminated conflicting instructions across the `00_system_setup`, `01_crush_cli`, and `02_deck_igniter` guides.
- **Reference Integrity**: Updated the `COMMAND_MANIFEST` and `KNOWLEDGE_BASE` to reflect current port mappings and security hardening overrides.

## [3.2.9] - 2026-04-16
### Fixed
- **Sovereign Security Hardening**: Executed a comprehensive dependency audit and remediation pass, achieving a zero-vulnerability state in `pnpm audit`.
- **NPM Artery Patching**: Updated `vite` (v3.2.15), `hono` (v3.2.15), and `@modelcontextprotocol/sdk` (v3.2.15) to resolve multiple Path Traversal and Arbitrary File Read vulnerabilities.
- **Transitive Governance**: Implemented `pnpm.overrides` for `@hono/node-server` to force-patch deep-nested vulnerabilities within the MCP SDK.
- **Rust/Go Audit**: Synchronized `rand` crates (v3.2.15) and `golang.org/x/crypto` (v3.2.15) across all sidecars and kernels.

## [3.2.8] - 2026-04-16
### Added
- **MCP Toolbox Audit**: Utilized the `mcp-toolbox-for-databases` extension to perform a structural and security audit of `Akashik.db`.
- **Fast Reconstruction Engine**: Engineered `scripts/fast-reconstruct.py` to replace the legacy shell script, achieving a 360x performance increase for RKG materialization.
- **Audit Manifest 2026-04-16**: Physicalized the intelligence core findings and remediation status in `docs/superpowers/audits/`.

### Changed
- **Vault Orchestration**: Updated `package.json` to utilize the new Python-based reconstruction pipeline by default.
