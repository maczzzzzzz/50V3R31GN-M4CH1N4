# Changelog

All notable changes to this project will be documented in this file.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
versioning follows [Semantic Versioning](https://semver.org/spec/v3.8.0.html).

## [3.8.2] - 2026-04-26

### Added
- **Host-Mesh Artery (Phase 81):** Materialized the Go-native Windows sidecar (`sovereign-host.exe`) with VSB UDP listener on port 7878.
- **Blackout Shroud Implementation:** Shored visual redaction logic in the host sidecar to mask protected source code windows (`Code.exe`, `Terminal.exe`).
- **FS Gate (Option C):** Enforced Zero-Trust filesystem boundaries with autonomous R/W in `/scratch/` and Vesper-gated deletion/traversal.
- **Tiered Web Ingress:** Materialized `WebScraperSidecar.ts` implementing the 3-Tier model (Comms/Media/Research) with high-fidelity Markdown distillation.
- **Hermes /host Routing:** Integrated direct host command dispatch into the `LangGraphOrchestrator`, bridging the Flutter HUD to the Windows host.

### Fixed
- **Gauntlet Gap:** Materialized `v81-host.ts` to provide 100% regression protection for the host-bridge and visual redaction arteries.

## [3.8.1] - 2026-04-25

### Added
- **Node C Model Farm Orchestration:** Refactored `hermes-router` to dynamically select between Q3 (8081), Q4 (8082), and Q5 (8083) model shards based on profile `inference_preference`.
- **OpenClaw v3.8.0 Integration:** Staged ports for Hybrid Search Transparency, OTEL Trace Correlation, and MCP Loopback Hardening.
- **Tactical Terminal:** Materialized a dedicated **[TERM]** navigation tab in the Flutter HUD for real-time passive VSB monitoring.
- **Command Priming:** Implemented structured JSON command dispatch in the Artery Client, preparing the mesh for Windows Host Control.

### Fixed
- **VSB Port Desync:** Corrected VSB frequency from 9090 (WebSocket) to 7878 (UDP Binary) in the mobile HUD.
- **Ignition Hardening:** Implemented `ZOMBIE_CHECK` in `ignite-all.sh` to ensure port sovereignty before daemon startup.

## [3.8.0] - 2026-04-25

### Added
- **Sovereign Hall (Phase 80):** Materialized the autonomous agent collaboration space. 
  - `SovereignHall.tsx`: 2.5D Isometric visualization of agent swarms.
  - `crush meeting`: CLI controller for forced deadlock resolution.
- **Vesper Enforcer:** Empowered Vesper with the `FailureTracker` to force mandatory Hall meetings on 3rd agentic failure.
- **Ouroboros Loop:** Integrated failure pattern reflection into the nightly Dream Cycle for automated logic vaccination.

<details>
<summary>Historical Archive (Older Versions)</summary>

... [Legacy versions preserved in master history] ...

</details>


---
**LINKS:** [[OS_CORE]]
