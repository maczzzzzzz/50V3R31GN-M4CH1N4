# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org).

## [3.8.32-SOVEREIGN-MESH] - 2026-05-03

### Added
- **Sovereign Monorepo Architecture:** Established two-repo model — `50V3R31GN-M4CH1N4` as the single development home, `nodestadt/hermes-agent` as the patched fork. All 12 sidecars now properly tracked as git submodules or directories. Nothing auto-syncs — submodule SHAs are deliberate pins.
- **nodestadt/hermes-agent Fork:** Forked `NousResearch/hermes-agent` (MIT) to `github.com/nodestadt/hermes-agent`. `sovereign-patches` branch carries 4 commits on top of upstream: ST3GG guard, whisper-mcp stub, Tactical Authority palette, cli-config.yaml MCP registrations. Fork `main` merged at `0ce9231`.
- **Sidecar Submodule Restoration:** All 11 integral Sovereign Machina sidecars restored to git tracking: `halo` (context-labs), `hermeshub`, `hermes-web-ui` (EKKOLearnAI), `hermes-desktop` (fathah), `worldseed` (AIScientists-Dev), `free-claude-proxy` (Alishahryar1), `skill-marketplace`, `paperclip-adapter` (NousResearch), `zeroboot`. Plus `git-nexus` and `sidecar-proxy` as tracked directories.
- **Architecture Document:** `docs/nodestadt/architecture/hermes-fork-workflow.md` — complete two-repo model spec, submodule mechanics, daily dev workflow, upstream pull procedure, sidecar sovereignty principles.

### Fixed
- **13 Orphaned Gitlink Entries Purged:** Ghost `160000`-mode index entries (stale submodule pointers with no `.gitmodules` mapping) removed from the git index. These accumulated from prior incomplete `git rm` calls instead of `git submodule deinit`. No files were deleted — `git rm --cached` is index-only.

### Changed
- **`sidecars/hermes-agent-nous/`:** Converted from raw vendored directory to initialized git submodule pinned to `nodestadt/hermes-agent @ 0ce9231`. Files unchanged; git now tracks the SHA pin and `.gitmodules` mapping.

---

## [3.8.31-PHASE-118-119] - 2026-05-03

### Added
- **Phase 118 — Hermes Clinical Fork:** Deleted `packages/hermes-core/` (94 files, 10,033 lines of Node.js shadow logic). `sidecars/hermes-agent-nous/` (NousResearch Python harness) becomes single source of truth for all Hermes reasoning.
- **ST3GG Tool-Guard:** Injected `_st3gg_verify()` + `_clinical_refusal()` into `environments/agent_loop.py`. Unsigned tool intents are clinically refused before dispatch. Stub wires to `crates/sidecar-cyberdeck/st3gg` in Phase 120.
- **Phase 118.5 — Sovereign Whisper Artery:** New Rust crate `crates/sovereign-whisper-mcp` — MCP stdio server with 30s PCM-16 ring buffer, UDP VSB ingestor on port 7878, `whisper://live-transcript` + `whisper://ring-buffer-status` MCP resources, `transcribe_buffer` tool stub. `cargo check` passing.
- **`sidecars/hermes-agent-nous/cli-config.yaml`:** Created from example. Registers `sovereign_mcp_bridge` (VSB bridge) and `sovereign_whisper_mcp` (STT artery) as MCP servers.
- **`_get_ambient_intent_from_whisper_mcp()` stub:** Added to `tools/transcription_tools.py`. Phase 120 will wire full MCP client.
- **Phase 119 — HUD Encapsulation:** Tactical Authority v1.3.1 palette applied to `sidecars/hermes-agent-nous/web/src/index.css` (`#1A282F` bg, `#376374` accent, Cinzel/Lexend). `VISION_ARTERY_URL` + `VISION_ARTERY_HZ` env constants registered in `agent_loop.py` for 1Hz frame stream from Node B Director.
- **`crates/sovereign-mcp-bridge/`:** New Rust MCP bridge — JSON-RPC 2.0 stdio transport, UDP listener on port 7878, exposes `/vitals`, `/memory`, `/mesh` as MCP resources.

### Changed
- **`npm run terminal`:** Rewired to `sidecars/hermes-agent-nous` Python CLI via Nix dev shell.
- **`npm run dashboard:hermes`:** Rewired to Python shard dashboard on port 9119.
- **`dashboard/app/globals.css`:** `sovereign-theme.css` inlined before `packages/hermes-core/` deletion. Phase 119 Tactical Authority parity vars added (`--ta-accent`, `--ta-bg-deep`).
- **`dashboard/components/HermesInteractiveTUI.tsx`:** iframe embed renders when `status === 'online'`; `onLoad` logger added; sandbox includes `allow-popups`.
- **`terminal-app/lib/services/openclaw_bridge.dart`:** WebSocket URL remapped to `ws://node-b:8000/ws` (configurable via `gateway_url` SharedPreferences key).
- **Dead scripts stubbed:** `npm run start`, `dream`, `dream:once`, `mind:ingest` → `echo '[DECOMMISSIONED]'` with migration note.

### Removed
- **`packages/hermes-core/`:** Entire Node.js TypeScript hermes reimplementation deleted (94 files, 10,033 lines). All TypeScript tests importing from this package (62 test files) removed.

---

## [3.8.31-TAC-AUTH] - 2026-05-03

### Added
- **Tactical Authority Palette (v1.3.1):** Materialized new color standard extracted from primary brand assets: Authority Primary (#376374), Gold Highlight (#836A46), and Tactical Base (#1A282F).
- **Brand Identity Deep-Sync:** Globally synchronized hex codes across Next.js Dashboard, Flutter TUI, Golang Artery, and Three.js engine.
- **Phase 118.5:** Materialized the `Sovereign Whisper Artery` specification for hardware-accelerated STT.
- **Phase 120:** Materialized the `Sovereign Design Artery` specification (Open-Design Integration).

### Changed
- **Visual Standard:** Migrated from "Orange Rust" to "Tactical Authority" visual language.
- **Universal Branding Lock:** Materialized `terminal-app/assets/app-icon.png` as the absolute app icon.
- **Architectural Pivot:** Locked the transition to the Hermes-Agent Clinical Fork as the primary operator harness.

## [3.8.30-RENEWAL] - 2026-05-03

### Added
- **Hermes-Agent Clinical Fork:** Initialized strategic pivot to fork `nousresearch/hermes-agent` as primary operator harness.
- **HermesInteractiveTUI:** New Next.js component to embed the Python Shard into the Pretext HUD.

### Fixed
- **Next.js ESM Death:** Resolved 'WidthProvider' runtime error via resilient import patterns.
- **Node B Vision OOM:** Patched llama-server context limit to 8k to prevent Vulkan allocation fatalities.
- **Mobile HUD Connectivity:** Remapped hardcoded local IPs to Tailscale/ClawLink mesh.

### Changed
- **Architectural Consolidation:** Decommissioned 'Shadow Logic' sidecars in favor of upstream Hermes-Ecosystem maintained modules.
- **Command Re-wiring:** Root `npm run terminal` now targets the Python Shard native CLI.

## [3.8.29-GOLD] - 2026-05-02

### Added
- **Final Release Shards:** Materialized the definitive builds for the Flutter HUD (v3.8.28-GOLD+1), Obsidian Artery (v3.8.28-GOLD), and Vivaldi Ingress extension (v3.8.28-GOLD).
- **Security Lockdown:** Shored 23 vulnerabilities via `pnpm audit fix` and added resolution overrides to the root manifest.
- **Mesh Purification:** Purged all tech bloat, orphan worktrees, and ghost processes. The mesh is now 100% clean and secured.

<details>
<summary>Historical Archive (Older Versions)</summary>

... [Legacy versions preserved in master history] ...

</details>

---
**LINKS:** [[Sovereign_OS]]
