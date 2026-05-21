# 50V3R31GN-M4CH1N4

<p align="center">
  <a href="CHANGELOG.md"><img src="https://img.shields.io/badge/version-0.4.0--alpha-blue.svg" alt="Version"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-green.svg" alt="License"></a>
  <a href="https://github.com/maczzgit/50V3R31GN-M4CH1N4-hermes-agent-fork"><img src="https://img.shields.io/badge/hermes-fork-orange.svg" alt="Hermes Fork"></a>
</p>

**A distributed quaternary AI mesh built on physical hardware. Local inference. Zero cloud dependency. Full sovereignty.**

50V3R31GN-M4CH1N4 runs [Hermes Agent](https://github.com/NousResearch/hermes-agent) (forked) as its orchestration core, distributed across four physical nodes connected via Tailscale. Every inference call stays on local hardware. No API keys. No cloud relays. No shadow logic.

See [CONTRIBUTORS.md](CONTRIBUTORS.md) for the active sovereign team. GitHub's automatic contributor graph includes upstream Hermes history.

---

## Architecture

Four nodes. One mesh. All inference on bare metal.

| Node | Role | Hardware | Model | Throughput |
|------|------|----------|-------|------------|
| **B** (Director) | Fast responder, workspace | Ryzen 9 5900XT, RX 9060 XT 16GB, 48GB DDR4 | Qwopus3.5-9B Q8_0 (Vulkan) | 322 / 34.1 t/s |
| **C** (Oracle) | Function-calling, perception | Ryzen 7 3700X, RTX 2060 6GB, 32GB DDR4 | Carnice-9B-FC Q4_K_M (CUDA) | 205.2 / 49.9 t/s |
| **D** (Quaternary) | Heavy reasoning | Intel Meteor Lake, RTX 5060 Ti 16GB OCuLink, 48GB DDR5 | Carnice APEX I-Mini 35B MoE (CUDA) | ~580 / 118 t/s |
| **A** (Synapse) | State persistence, cache | i7-7700HQ, GTX 1050 Ti 4GB, 16GB RAM | Qwen3-0.6B Q8_0 (CPU) | 169 / 46.8 t/s |

All nodes run NixOS (25.11, except Node A on 24.11). Interconnected via Tailscale zero-trust mesh.

## Inference Stack

- **Backend:** [llama.cpp](https://github.com/ggml-org/llama.cpp) (Nodes B, D) and [ik_llama.cpp](https://github.com/ikawrakow/ik_llama.cpp) (Node C)
- **Routing:** LiteLLM mesh router (Docker Desktop, Node B port 4000) with 5 routes: `mesh-fast`, `mesh-vision`, `mesh-function-calling`, `mesh-heavy`, `mesh-micro`
- **KV Cache:** f16 on Vulkan (Node B), q4_0 on CUDA/CPU (Nodes C, D)
- **Models:** Q4_K_M/Q8_0 quantized, sized to fit each node's VRAM/RAM budget exactly

## Agent Orchestration

| Agent | Role | Model |
|-------|------|-------|
| GLM-5.1 (Z.ai) | Lead Architect, orchestration | Hermes CLI via `hermes chat` |
| Gemini CLI | Subordinate worker, research/audit | Flash (default), Pro (heavy tasks) |
| Claude Code | Subordinate coder | As needed |
| Codex | Batch coding | As needed |

The Lead Architect dispatches tasks, reviews output, and owns final quality. Subordinates never commit directly.

## Project Structure

```
50V3R31GN-M4CH1N4/
├── AGENTS.md              # Agent roles and hardware topology
├── SOUL.md                # Operating contract and agent identity
├── LEAD_ARCHITECT.md      # Lead architect directives
├── GEMINI.md              # Subordinate agent directives
├── IMPLEMENTATION_PLAN.md # Phase tracking and status
├── SOVEREIGN_VITAL_SIGNS.md # Mesh health dashboard
├── CHANGELOG.md           # Release history
├── SESSION_HANDOFF.md     # Cross-session task continuity
├── flake.nix              # Dev shell (Nix)
├── nix/                   # Nix modules (inference, proxy, tailscale)
├── sidecars/
│   ├── mesh/              # LiteLLM config
│   ├── kanban-mcp-server/ # Cross-agent kanban (FastMCP stdio)
│   └── hermes-agent-nous/ # Hermes fork (submodule)
└── docs/                  # Reference docs and plans
```

## Key Documents

| Document | Purpose |
|----------|---------|
| [AGENTS.md](AGENTS.md) | Hardware specs, agent roles, mesh topology |
| [SOUL.md](SOUL.md) | Operating contract, identity, autonomy boundaries |
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Phase tracking, benchmarks, status gates |
| [SOVEREIGN_VITAL_SIGNS.md](SOVEREIGN_VITAL_SIGNS.md) | Live mesh health and node status |
| [CHANGELOG.md](CHANGELOG.md) | Version history |
| [GitHub Wiki](https://github.com/maczzgit/50V3R31GN-M4CH1N4/wiki) | Operational knowledge base (topology, models, runbook) |
| [HTML Docs](docs/index.html) | Full documentation suite (browse locally) |

## Status

Phase 0 (Validation Gate) is **closed**. Phase 2 (Cognitive Hierarchy) is **in progress**. All five inference routes deployed and benchmarked. The mesh is operational. Node D GPU upgrade (RTX 5060 Ti) is the next hardware milestone.

## License

MIT
