# Hybrid Sovereign Mesh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Materialize the Hybrid Sovereign Mesh (NixOS stability + Docker Compose runtime agility) across four heterogeneous nodes.

**Architecture:** 
- **Host Layer:** Stable NixOS 24.11 hosts managed via Flakes.
- **Runtime Layer:** Docker Compose projects managed as `systemd` services.
- **Coordination Layer:** LiteLLM Hub on Node B orchestrating traffic to heterogeneous model runtimes.

**Tech Stack:** NixOS 24.11, Docker, Compose, LiteLLM, Tailscale.

---

## Phase 1: Host Standardization (NixOS 24.11)

- [ ] **Task 1: Pin Nixpkgs**
    - Modify `flake.nix` to pin all node configurations to `nixos-24.11`.
    - Apply `nixpkgs.config.allowUnfree = true` globally for CUDA/Proprietary drivers.

- [ ] **Task 2: Enable OCI Infrastructure**
    - Update `nix/modules/base.nix` (or equivalent) to enable `virtualisation.docker.enable = true`.
    - Configure `docker` daemon to use `overlay2` storage driver for performance.

- [ ] **Task 3: Firewall Hardening**
    - Update `nix/modules/firewall.nix` to allow all traffic over the Tailscale interface (`tailscale0`).
    - Explicitly open TCP ports: 8000 (API), 8642 (Gateway), 9119 (Dashboard).

---

## Phase 2: Runtime Materialization (Compose)

- [ ] **Task 4: Node A/C (NVIDIA) Runtime**
    - Create `sidecars/mesh/nvidia.yml`:
      ```yaml
      services:
        vllm:
          image: vllm/vllm-openai:latest
          runtime: nvidia
          ports: ["8000:8000"]
          deploy:
            resources:
              reservations:
                devices: [{driver: nvidia, count: 1, capabilities: [gpu]}]
      ```

- [ ] **Task 5: Node B (AMD) Runtime**
    - Create `sidecars/mesh/amd.yml`:
      ```yaml
      services:
        rocm:
          image: ghcr.io/huggingface/text-generation-inference:latest
          devices: ["/dev/kfd", "/dev/dri"]
          ports: ["8000:8000"]
      ```

- [ ] **Task 6: Node D (Intel NPU) Runtime**
    - Create `sidecars/mesh/intel.yml`:
      ```yaml
      services:
        openvino:
          image: openvino/model_server:latest
          volumes: ["./models:/models"]
          ports: ["8000:8000"]
      ```

---

## Phase 3: Mesh Orchestration (LiteLLM)

- [ ] **Task 7: Central Routing Hub (Node B)**
    - Configure `sidecars/mesh/litellm.conf.yaml` to define model routing across Tailscale IPs:
      ```yaml
      model_list:
        - model_name: cuda-model
          litellm_params: { model_list: http://100.90.196.70:8000 } # Node A
        - model_name: amd-model
          litellm_params: { model_list: http://100.66.173.31:8000 } # Node B
        - model_name: intel-model
          litellm_params: { model_list: http://100.120.225.12:8000 } # Node D
      ```

- [ ] **Task 8: Systemd Auto-start**
    - Implement `nix/modules/mesh-runtime.nix`:
      ```nix
      systemd.services.mesh-runtime = {
        script = "docker-compose -f /etc/mesh/compose.yml up -d";
        wantedBy = [ "multi-user.target" ];
      };
      ```

---

**Plan complete and saved to `docs/planning/plans/2026-05-11-hybrid-mesh-implementation.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration.

**2. Inline Execution** - Execute tasks in this session using `executing-plans`, batch execution with checkpoints.

**Which approach?**
