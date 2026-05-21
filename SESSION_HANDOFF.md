# SESSION HANDOFF (v0.4.0-alpha)

**Last session:** May 21, 2026
**Branch:** stable/mesh-alpha

## Completed This Session

1. **Mesh-wide model purge.** Removed orphan models from all nodes (verified actively served first).
   - Node D: Deleted Qwen3.5-35B-A3B-MTP UD-Q4_K_M.gguf (22 GB freed).
   - Node C: Deleted 15x ggml-vocab-*.gguf benchmark artifacts (37 MB).
2. **Dead code and crate purge.** Removed from repo:
   - `crates/modules/vibevoice-asr/` entire crate (cancelled, Hermes has native Whisper/TTS).
   - `nix/modules/directors-forge.nix` (service euthanized May 17).
   - `nix/packages/llama-cpp-openvino.nix` (OpenVINO never deployed, NPU excluded).
   - Root garbage: `constants.py`, `extract.py`, `fetch.py`, `gguf-dump.py`, `gguf_reader.py`, `venv/`, `.npm-global`, `node_modules/`, `.releaserc.json`, `audit_results.txt`.
3. **Sidecar cache purge.** Removed .venv caches from mesh, mesh-router, kanban-mcp-server (586 MB). Removed sovereign-sniffer/node_modules/ (197 MB). Removed prisma-bin engines, stale Docker Compose variants.
4. **flake.nix cleaned.** Removed vibevoice-asr, directors-forge, mirage-vfs, llama_cpp_openvino from overlay and packages. Only zeroboot-isolation remains in sovereign crates.
5. **v0.4.0-alpha manifest scribe pass.** All version-bearing files updated: CHANGELOG, IMPLEMENTATION_PLAN, SOVEREIGN_VITAL_SIGNS, KANBAN_MAP, README, AGENTS.
6. **Tagged v0.4.0-alpha.** Committed and pushed to origin.

## Current Running State

- Node D: Carnice APEX I-Mini 35B MoE on port 8080 (CUDA, -ngl 99, 12 threads)
- Node C: Carnice-9B-FC on port 8081 (CUDA sm_75, needs LD_LIBRARY_PATH)
- Node A: Qwen3-0.6B on port 8080 (CPU, systemd service llama-micro.service)
- Node B: Qwopus3.5-9B port 8081, Qwen3-VL port 8082 (Windows Vulkan batch files)
- LiteLLM: Docker Desktop mesh-litellm-1, port 4000, stateless v1.84.0
- Socat bridges: Node B WSL2 (launched manually, not persistent)

## Open Items

- Node D systemd service for auto-start
- Node A firewall persistence (iptables -> NixOS config)
- Node C: LD_LIBRARY_PATH fragile (nix-store paths may GC). Needs service wrapper.
- Socat bridges need persistent startup (systemd user service or cron).
