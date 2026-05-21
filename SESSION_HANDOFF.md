# SESSION HANDOFF (v0.4.1-alpha)

**Last session:** May 22, 2026
**Branch:** stable/mesh-alpha
**Last commit:** 48d3d7a8b

## Completed This Session

1. **Node D systemd service deployed.** `llama-heavy.service` (systemd user, linger enabled). Auto-starts Carnice APEX I-Mini on boot.
2. **Node A firewall persistence fixed.** `configuration.nix` updated with `networking.firewall.allowedTCPPorts = [ 22 8080 8767 ]`. Rebuild completed and verified.
3. **Node C systemd service deployed.** `llama-fc.service` (systemd user, linger enabled). LD_LIBRARY_PATH baked in. Service active.
4. **Socat bridges persistent startup.** `mesh-bridge.service` (systemd user on Node B WSL2, enabled, active). All 5 bridge ports verified healthy.
5. **P4-T1 Voice Pipeline CANCELLED.** Hermes has native Whisper/TTS. No redundant sidecar needed.

## Current Running State

- Node D: Carnice APEX I-Mini 35B MoE on port 8080 (CUDA, -ngl 99, 12 threads). Service: llama-heavy.service (user systemd, linger enabled).
- Node C: Carnice-9B-FC on port 8081 (CUDA sm_75). Service: llama-fc.service (user systemd, linger enabled).
- Node A: Qwen3-0.6B on port 8080 (CPU). Service: llama-micro.service (user systemd, linger enabled). Firewall ports 22/8080/8767 open via NixOS config.
- Node B: Qwopus3.5-9B port 8081, Qwen3-VL port 8082 (Windows Vulkan batch files). Socat bridges: mesh-bridge.service (systemd user, enabled).
- LiteLLM: Docker Desktop mesh-litellm-1, port 4000, stateless v1.84.0
- hermes-relay: Docker, port 8767

## Open Items

- P4-T2: Open Design Integration (TODO)
- P4-T3: Mesh-wide Verification (TODO)
- P5-T1: Zeroboot Isolation Layer (TODO)
