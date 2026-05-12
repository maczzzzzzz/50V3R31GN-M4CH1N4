# Research Synthesis: Sovereign Hybrid Mesh Architecture (v3.5)

## 1. Executive Summary
This document synthesizes the architectural redesign of the Sovereign Machina mesh, transitioning from a brittle "build-from-source" NixOS model to a robust **"Hybrid Sovereign"** architecture. This shift addresses systemic stability failures and GPU utilization bottlenecks across the heterogeneous 4-node cluster (NVIDIA, AMD, Intel).

## 2. Problem Statement: The "Shadow Complexity"
Initial remediation attempts revealed that our reliance on bleeding-edge NixOS `unstable` and custom GCC/CUDA toolchains introduced unmanageable technical debt. 
- **Build Failures:** GCC 15/CUDA 12.9 toolchains failed to compile legacy SIMD code paths in `ik_llama.cpp`.
- **Hardware Blindness:** Lack of NVIDIA driver visibility (`nvidia-smi` failure) was traced to unstable NixOS modules, not physical hardware failure.
- **Resource Contention:** WSL2 `vmmem` CPU pinning on Node B stemmed from missing driver bridges, not inherent inefficiency.

## 3. The Sovereign Hybrid Strategy
The new architecture enforces a strict separation of concerns to ensure mesh integrity:

### A. Stability Layer (Host-Level)
- **Base OS:** Pinning all nodes to **NixOS 24.11 (Stable)**.
- **Hardware Integration:** 
  - **Node B (WSL2):** `wsl.useWindowsDriver = true` to bridge the host GPU/NPU stack.
  - **Node A/C (NVIDIA):** Standardized driver installation via stable NixOS modules.
  - **Node D (Intel NPU):** Integration with `OneAPI` and `intel-vpu` modules.

### B. Runtime Layer (Service-Level)
- **Decoupling:** Shifted away from compiling CUDA binaries on-host.
- **Docker-Compose Implementation:** AI runtimes (vLLM, TGI, OpenVINO) are now containerized. This allows for vendor-specific, pre-optimized runtimes that are cryptographically verified and version-pinned, eliminating build-time dependencies on the host OS.
- **Orchestration:** Docker Compose files managed as Git-tracked configuration in `sidecars/mesh/`.

### C. Mesh Orchestration
- **Hub-Spoke Topology:** Node B (Director) operates as the primary routing hub via **LiteLLM**.
- **Connectivity:** Secure, multi-node communication is strictly enforced over the **Tailscale Artery**.
- **Telemetry:** Health and load status are consolidated via a standardized `/api/connection-status` endpoint across all nodes.

## 4. Hardware Realities & Constraints
The architecture is explicitly designed for our asymmetric physical footprint:
- **Node D (Primary Reasoner):** Dedicated NVMe storage; configured for heavy model caching and high-concurrency reasoners.
- **Node B (Director):** Primary LiteLLM/Proxy node; optimized for low latency and high connectivity.
- **Nodes A/C (Compute):** Specialized CUDA workers for high-throughput inference.

## 5. Implementation Roadmap
The implementation plan (`docs/planning/plans/2026-05-11-hybrid-mesh-implementation.md`) breaks the transition into three verifiable phases:
1. **Phase 1:** Standardize the host OS to 24.11 and harden firewalls.
2. **Phase 2:** Materialize the OCI-container runtimes via `docker-compose`.
3. **Phase 3:** Synchronize the Mesh Orchestration via LiteLLM routing.

## 6. Verification & Validation (The "Shard Mandate")
Integrity is maintained by the following mandatory checks:
- **Mesh Health:** `curl http://localhost:3000/api/connection-status` must return 200/OK.
- **Service Availability:** All Docker containers must be managed by `systemd`, ensuring auto-recovery and stable uptime.
- **Zero-Trust:** All cross-node communication must resolve via Tailscale IPs with strict TLS/API token auth (defined in `~/.hermes/.env`).

---
**::/5Y573M-N071C3 : ARCHITECTURAL_SYNTHESIS_COMPLETE. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
