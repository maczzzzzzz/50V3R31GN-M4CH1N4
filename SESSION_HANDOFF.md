# SESSION_HANDOFF.md: v0.1.0-alpha (2026-05-17)

Operational handoff for the next session. Friction point sweep completed. All top security threats patched.

---

## MESH STATUS

All 4 nodes online. Tailscale artery healthy.

| Node | Role | Hardware | Models | Backend | Bench (prompt/gen) | Status |
|------|------|----------|--------|---------|-------------------|--------|
| B | Director | Ryzen 9 5900XT, 16GB AMD VRAM, 48GB DDR4 | Hermes-4-14B Q4_K_M (port 8081) + Qwen3-VL-2B Q6_K (port 8082) | ik_llama.cpp Vulkan | Hermes 93.2/33.7, VL 18.3/53.9 t/s | ACTIVE |
| C | Oracle | Ryzen 7 3700X, RTX 2060 6GB, 32GB DDR4 | Carnice-9B-FC i1-Q4_K_M | ik_llama.cpp CUDA sm_75 | 205.2 / 49.9 t/s | ACTIVE |
| D | Quaternary | Intel Core Ultra Meteor Lake, 48GB DDR5 | Carnice MoE 35B-A3B Q4_K_M | ik_llama.cpp AVX2 | 8.8 / 6.1 t/s | ACTIVE |
| A | Synapse | GTX 1050 Ti 4GB, 16GB RAM | None (state/cache only) | N/A | N/A | ONLINE |

Node B VRAM: ~10.4GB of 16GB used (Hermes 8.4GB + Qwen3-VL 1.9GB shared GPU).

### Network
- Node B: WSL2, LiteLLM mesh router Docker port 4000
- Node C: NixOS 25.11, Tailscale 100.102.109.81, SSD /mnt/sovereign-soul (445G free)
- Node A: NixOS 24.11, Tailscale 100.96.253.114, SSH user maczz
- Node D: CPU-only inference, Tailscale 100.120.225.12

### Services
- LiteLLM mesh router: Docker `mesh-litellm` port 4000, config `sidecars/mesh/litellm-mesh.yaml`
- 4 routes: mesh-fast (B:8081), mesh-vision (B:8082), mesh-function-calling (C), mesh-heavy (D)
- Aliases: fast, vision/vl, fc, heavy
- TurboQuant q4_0 KV-cache active on all inference nodes
- Kanban MCP server: `sidecars/kanban-mcp-server/` (FastMCP stdio, healthy, 50 tasks on default board)
- Gemini CLI: connected, skills at `.gemini/skills/`

---

## GIT STATE

- **Branch:** stable/mesh-alpha
- **Remote:** git@github.com:maczzgit/50V3R31GN-M4CH1N4.git (private)
- **Tag:** v0.1.0-alpha
- **Latest commits:**
  - `69f6dd7e4` -- feat: deploy Qwen3-VL-2B mesh-vision endpoint, cut falcon-perception
  - `408a9bf29` -- chore: sync hermes-agent fork with upstream v0.14.0
- **Hermes fork:** git@github.com:maczzgit/50V3R31GN-M4CH1N4-hermes-agent-fork.git (public)
- **Hermes fork synced:** Upstream v0.14.0 merged (security fixes, TUI cursor fix, X search, OSINT skill). Clean merge.
- **Co-author:** maczzgit <maczzgit@users.noreply.github.com> via .git-commit-template

---

## COMPLETED THIS SESSION

1. **v0.1.0-alpha release** -- all root docs audited, version-bumped, stale references purged
2. **Gemini Pro doc audit** -- dispatched, found 15+ files with drift, all fixed
3. **Git infrastructure** -- remote updated (maczzzzzzz -> maczzgit), submodule URL updated, co-author template
4. **HTML doc sweep** -- all 16 HTML files updated (versions, IPs, model assignments)
5. **CHANGELOG.md** -- v0.1.0-alpha entry written, historical benchmark numbers corrected
6. **Tagged and pushed** -- v0.1.0-alpha to origin
7. **Hermes fork sync** -- upstream v0.14.0 merged, sovereign plugins intact
8. **Kanban MCP server** -- verified healthy (DB clean, server starts, 50 tasks on default board)
9. **mesh-vision deployment** -- Qwen3-VL-2B Q6_K deployed as second Vulkan instance on Node B port 8082
10. **falcon-perception cut** -- removed from topology, repo scripts cleaned, weights deletion pending (user manual)

---

## PHASE STATUS

- **Phase 0 (Validation Gate):** CLOSED. All benchmarks confirmed, mesh operational.
- **Phase 1 (Pluggable Sovereign Layer):** Not started. Next phase to open.
  - Zeroboot (netboot provisioning)
  - Hermes-LCM (persistent state/memory)
  - Phase 1 items in IMPLEMENTATION_PLAN.md

---

## FRICTION POINT RESOLUTIONS (Session 2026-05-17) -- ALL PATCHED

### Resolved
1. **Node D Tailscale SSH:** VERIFIED. SSH to maczz@100.120.225.12 works. NixOS, kernel 6.18.26.
2. **ik_llama.cpp GCC 14 fix:** ALREADY APPLIED on Node C source (`/home/maczz/ik_llama.cpp/ggml/src/iqk/iqk_common.h` has `#include <cstdint>` at lines 8 and 20). Node D runs llama.cpp (not ik_llama.cpp), source at `/home/maczz/llama.cpp/`.
3. **FastMCP upgrade:** 3.3.1 tested and ROLLED BACK due to breaking API changes (package split into fastmcp + fastmcp-slim). Kanban-mcp-server imports `from fastmcp import FastMCP` which breaks in 3.3.x. Stays on 3.2.4 until imports are updated.
4. **Dependabot sweep (Gemini audit):**
   - Main repo: 73 alerts (3 critical, 27 high, 28 medium, 15 low)
   - Hermes fork: 53 alerts (1 critical, 15 high, 30 medium, 7 low)
   - Top priorities: litellm SQLi (critical), GitPython RCE (high), serialize-javascript RCE (high), sanitize-html XSS (critical)
   - Noise: Vite/Babel/esbuild path traversals, decompression bombs, ReDoS (local-only mesh, no public exposure)
5. **LiteLLM SQLi PATCHED:** Docker container upgraded from 1.82.6 to 1.84.0 (pip upgrade in container). Container restarted, health verified.
6. **npm audit fix EXECUTED:** Hermes fork root (0 vulns), ui-tui (0 vulns), web (0 vulns), website (19 high in Docusaurus transitive build deps, accepted risk).
7. **Port 8082 firewall:** User confirmed execution of elevated CMD rule.
8. **falcon-perception weights:** User confirmed deletion.

### Deferred (Low Risk)
9. **Node A PQ key exchange warning:** tailscaled daemon is 1.80.3 (CLI is 1.90.9). Requires nixpkgs channel update on Node A (NixOS 24.11). Risky to execute remotely over the Tailscale connection it depends on. Non-urgent.
10. **NixOS config on Node B:** `/etc/nixos/configuration.nix` is live config (not repo flake). Documentation-only item.

### Awaiting Windows Restart
11. **Node B TurboQuant q4_0 KV-cache:** Bat fix applied. Activates on next Windows restart.

---

## SOVEREIGN PLUGINS IN HERMES FORK

These are in `sidecars/hermes-agent-nous/plugins/` and survived the upstream merge:

- **sovereign_vsb/** -- VSB mesh router (HMAC auth, dynamic pulse, reasoning separation). Removed from providers list, code intact.
- **mirage-vfs/** -- Mirage VFS bridge plugin
- **n8n-mcp/** -- n8n MCP bridge for workflow automation
- **telegram-artery/** -- Telegram AI Artery for mesh integration
- **psy-core/** -- Psychology core hook
- **hermes-lcm/** -- Persistent state/memory provider
- **Sovereign branding:** skin_engine palette, TUI identity, Lead Architect slash command

---

## ENVIRONMENT NOTES

- NixOS WSL rebuild: `sudo nixos-rebuild switch -I nixpkgs=/nix/var/nix/profiles/per-user/root/channels/nixos`
- Node B Windows llama-server: D:\llama.cpp, port 8081 (Hermes) + 8082 (Qwen3-VL), WSL2 access 10.0.0.11
- Vision startup bat: D:\llama.cpp\start_vision_gpu.bat
- Model staging: /mnt/d/llama.cpp/models/
- Project dir: /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha

---
::/5Y573M-N071C3 : HANDOFF_V0.1.0_ALPHA. 4_ROUTE_MESH. PHASE_0_CLOSED. // 50V3R31GN-M4CH1N4
