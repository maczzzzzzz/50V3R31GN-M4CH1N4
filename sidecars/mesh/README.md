# Hybrid Mesh Runtime Compose Files

Docker Compose configurations for the Sovereign Mesh heterogeneous GPU cluster.

| File | Target Node(s) | Runtime | GPU Vendor |
|------|----------------|---------|------------|
| `nvidia.yml` | Node A, Node C | llama.cpp (CUDA) | NVIDIA |
| `amd.yml` | Node B (WSL2) | llama.cpp (ROCm/HIP) | AMD |
| `intel.yml` | Node D | llama.cpp (Intel SYCL) | Intel NPU |

## Deployment

Each node pulls its compose file and starts containers via systemd-managed docker compose:

```bash
# On target node:
docker compose -f /etc/mesh/compose.yml up -d
```

Container management is handled by the `mesh-runtime` NixOS module (`nix/modules/mesh-runtime.nix`).

## Model Format

All runtimes use **GGUF** model files, mounted read-only from `/var/lib/hermes/models/`. The compose files reference node-specific model files matching the hardware constraints.
