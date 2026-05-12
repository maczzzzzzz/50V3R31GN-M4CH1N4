# Hardware Acceleration Pivot & Windows Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize OpenVINO acceleration on Node D (Intel Meteor Lake) and bridge Windows-hosted inference on Node B to restore Tier 1 and Tier 2 performance.

**Architecture:** 
1. **Node D:** Deploy `llama-cpp` with `-DGGML_OPENVINO=ON` via Nix to utilize the Meteor Lake iGPU/NPU.
2. **Node B:** Reconfigure LiteLLM to route local requests to the Windows Host (outside WSL2) to bypass the broken `dxg` bridge.

**Tech Stack:** Nix, OpenVINO, LiteLLM, llama-cpp.

---

### Task 1: Node D - OpenVINO Inference Materialization

**Files:**
- Create: `nix/packages/llama-cpp-openvino.nix`
- Modify: `flake.nix`
- Modify: `nix/hosts/node-d/default.nix`

- [ ] **Step 1: Create the OpenVINO-enabled llama-cpp derivation**
Create `nix/packages/llama-cpp-openvino.nix` using upstream `llama-cpp` with OpenVINO build flags.

- [ ] **Step 2: Register package in `flake.nix`**
Add `llama-cpp-openvino` to the overlay and packages output in `flake.nix`.

- [ ] **Step 3: Update Node D host configuration**
Update `nix/hosts/node-d/default.nix` to use `pkgs.llama-cpp-openvino` and ensure the service points to the correct binary name (`llama-server`).

- [ ] **Step 4: Verify Node D evaluation**
Run: `nix eval .#nixosConfigurations.node-d.config.services.ik-llama.package.pname`
Expected: `llama-cpp-openvino` (or similar)

---

### Task 2: Node B - Windows Inference Bridge

**Files:**
- Modify: `sidecars/mesh/litellm-mesh.yaml`

- [ ] **Step 1: Identify Windows Host IP**
Run: `grep nameserver /etc/resolv.conf | awk '{print $2}'`
Note the IP (e.g., `172.29.144.1`).

- [ ] **Step 2: Update LiteLLM Configuration**
Update `sidecars/mesh/litellm-mesh.yaml` to point `mesh-carnice` to the Windows Host IP on port 8080.

- [ ] **Step 3: Restart LiteLLM**
Run: `docker compose -f sidecars/mesh/proxy.yml restart litellm`

- [ ] **Step 4: Verify Local Bridge**
(Assuming the user has started the server on Windows)
Run: `curl -s http://127.0.0.1:4000/v1/chat/completions ...`

---

### Task 3: Documentation & Vitals Calibration

**Files:**
- Modify: `SOVEREIGN_VITAL_SIGNS.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Update Vital Signs**
Reflect the transition to Windows-bridged inference and OpenVINO acceleration.

- [ ] **Step 2: Update Changelog**
Record the hardware pivot.
