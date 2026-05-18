# Hybrid Mesh Runtime Compose Files

Docker Compose configurations for the Sovereign Mesh heterogeneous GPU cluster.

| File | Target Node(s) | Runtime | GPU Vendor |
|------|----------------|---------|------------|
| `nvidia.yml` | Node C | ik_llama.cpp (CUDA sm_75) | NVIDIA |
| `amd.yml` | Node B (WSL2) | ik_llama.cpp (Vulkan) | AMD |
| `intel.yml` | Node D | ik_llama.cpp (AVX2 CPU) | Intel |

**Note:** Node A (Synapse) runs no inference. It handles KV-cache spillover and state persistence only.

**Note:** ik_llama.cpp is built manually per-node, NOT via Docker. These compose files are retained for future containerized services only. Current inference runs as native processes.

## Current Deployment

Inference endpoints are native ik_llama.cpp processes managed outside Docker:

- **Node B (Director):** `llama-server.exe` on Windows, port 8081 (Qwopus3.5-9B Q8_0, Vulkan) + port 8082 (Qwen3-VL-2B, Vulkan)
- **Node C (Oracle):** `ik_llama.cpp` CUDA build, port 8081 (Carnice-9B-FC)
- **Node D (Quaternary):** `ik_llama.cpp` AVX2 build, CPU-only (Carnice MoE 35B)

LiteLLM mesh router runs in Docker on Node B (port 4000) routing to these endpoints via Tailscale.
4 routes: mesh-fast (B), mesh-function-calling (C), mesh-heavy (D), mesh-vision (B:8082).
