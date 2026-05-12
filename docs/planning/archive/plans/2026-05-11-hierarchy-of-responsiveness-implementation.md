# Hierarchy of Responsiveness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize a high-performance, two-tier model mesh by routing all default traffic to Node B (Qwen3-14B-9B) and strategic traffic to Node D (Qwen2.5-Coder-14B) via the Sovereign LiteLLM Proxy.

**Architecture:**
1. **Model Distribution:** Deploy Qwen3-14B-9B on Node B and Qwen2.5-Coder-14B on Node D.
2. **Proxy Routing:** Update `nix/hosts/node-b/litellm-mesh.yaml` to include both models with defined routing strategies.
3. **Hermes Configuration:** Update `~/.hermes/config.yaml` to point to the proxy and set context length overrides.

**Tech Stack:** LiteLLM (Proxy), Llama.cpp (Inference), YAML (Config), NixOS (System modules).

---

### Task 1: Update Node D Inference Service

**Files:**
- Modify: `nix/hosts/node-d/default.nix`

- [ ] **Step 1: Update the inference engine parameters for Qwen2.5-Coder-14B (Q6)**

```nix
# In nix/hosts/node-d/default.nix

services.ik-llama = {
  enable = true;
  modelPath = "/home/nixos/50V3R31GN-M4CH1N4/models/Qwen2.5-Coder-14B-Instruct-Q6_K.gguf";
  port = 8080;
  memoryMax = "20G"; # Tighten for 24GB VRAM limit + KV cache
};
```

- [ ] **Step 2: Commit**

```bash
git add nix/hosts/node-d/default.nix
git commit -m "feat(mesh): update Node D to Qwen2.5-Coder-14B (Q6) for high-fidelity reasoning"
```

---

### Task 2: Configure Sovereign Proxy (LiteLLM)

**Files:**
- Modify: `nix/hosts/node-b/litellm-mesh.yaml`

- [ ] **Step 1: Update routing to handle high-fidelity model routing**

```yaml
# nix/hosts/node-b/litellm-mesh.yaml

model_list:
  - model_name: "brain-v2-27b" # Proxy internal alias for Node B local
    litellm_params:
      model: "openai/brain-v2-27b"
      api_base: "http://10.0.0.13:8080/v1" 
      api_key: "machina-sovereign-mesh-v3-secret-key"
  - model_name: "qwen-14b"
    litellm_params:
      model: "openai/qwen2.5-coder-14b"
      api_base: "http://10.0.0.13:8080/v1"
      api_key: "machina-sovereign-mesh-v3-secret-key"

router_settings:
  routing_strategy: usage-based-routing-v2
  enable_pre_call_checks: true
  # ... (rest of config)
```

- [ ] **Step 2: Commit**

```bash
git add nix/hosts/node-b/litellm-mesh.yaml
git commit -m "chore(mesh): synchronize proxy routing table with Qwen 14B materialization"
```

---

### Task 3: Hermes Mesh Re-Configuration

**Files:**
- Modify: `~/.hermes/config.yaml`

- [ ] **Step 1: Set Node B as Default Dispatcher**

```yaml
# In ~/.hermes/config.yaml
model:
  default: brain-v2-27b
  provider: sovereign-proxy
  context_length: 256000

# Add alias for strategic reasoning
provider_aliases:
  reasoning: "qwen-14b"
```

- [ ] **Step 2: Commit**

```bash
# Since config is managed locally in ~/.hermes, no git commit needed for this step
echo "Config: UPDATED"
```

---

### Task 4: Verification & Final Deployment

- [ ] **Step 1: Restart Services**
Run: `./scripts/ignite.sh`

- [ ] **Step 2: Test Route 1 (Local)**
Run: `hermes chat -q "Hello"`
Expected: TTFT < 100ms via Node B.

- [ ] **Step 3: Test Route 2 (Strategic)**
Run: `hermes chat -m qwen-14b -q "Architect Phase 6"`
Expected: TTFT < 500ms via Node D.

---
**::/5Y573M-N071C3 : PLAN_SAVED. STANDING_BY_FOR_EXECUTION. // 50V3R31GN-M4CH1N4**
