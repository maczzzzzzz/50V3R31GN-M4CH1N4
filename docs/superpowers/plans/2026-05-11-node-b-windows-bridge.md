# Node B Windows Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move inference from Node B WSL2 (CPU) to the Windows Host (GPU) to utilize 16GB VRAM for vision and screen awareness.

**Architecture:** 
1. Disable the internal `ik-llama` service in WSL2.
2. Update LiteLLM configuration to route `mesh-carnice` requests to the Windows Host IP (`172.28.128.1`).
3. Provide instructions for running `llama-server.exe` on Windows, binding to `0.0.0.0:8080`.

**Tech Stack:** NixOS, LiteLLM, llama-cpp (Windows/ROCm)

---

### Task 1: Deactivate Internal Inference

**Files:**
- Modify: `ik-llama.service` (systemd)

- [ ] **Step 1: Stop and disable the internal ik-llama service**

```bash
sudo systemctl stop ik-llama
sudo systemctl disable ik-llama
```

- [ ] **Step 2: Verify port 8080 is free in WSL2**

Run: `sudo netstat -tulpn | grep 8080`
Expected: No output (or no process bound to 8080).

### Task 2: Update LiteLLM Configuration

**Files:**
- Modify: `sidecars/mesh/litellm-mesh.yaml`

- [ ] **Step 1: Ensure api_base points to the Windows Host IP**

Check `sidecars/mesh/litellm-mesh.yaml` and verify the `mesh-carnice` entry:

```yaml
  - model_name: mesh-carnice
    litellm_params:
      model: openai/carnice-9b
      api_base: http://172.28.128.1:8080/v1
      api_key: "machina-sovereign-mesh-v3-secret-key"
```

- [ ] **Step 2: Restart LiteLLM container**

```bash
sudo docker restart mesh-litellm-1
```

### Task 3: Windows Host Execution (Actionable for User)

- [ ] **Step 1: Locate model on Windows**

The model is located in WSL2 at `/var/lib/hermes/models/Carnice-9b-Q8_0.gguf`.
Windows Path: `\\wsl.localhost\NixOS\var\lib\hermes\models\Carnice-9b-Q8_0.gguf`

- [ ] **Step 2: Run llama-server.exe on Windows**

Provide the user with the following PowerShell command:

```powershell
# In Windows Terminal (PowerShell)
.\llama-server.exe -m "\\wsl.localhost\NixOS\var\lib\hermes\models\Carnice-9b-Q8_0.gguf" --host 0.0.0.0 --port 8080 --n-gpu-layers 35 --ctx-size 32000
```

### Task 4: Verification

- [ ] **Step 1: Test connectivity from WSL2 to Windows Host**

Run: `curl -I http://172.28.128.1:8080/v1/models`
Expected: `HTTP/1.1 200 OK`

- [ ] **Step 2: Test LiteLLM routing**

Run: `curl -X POST http://localhost:4000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-sovereign-mesh-proxy" \
  -d '{
    "model": "mesh-carnice",
    "messages": [{"role": "user", "content": "ping"}]
  }'`
Expected: Successful response from the GPU-backed Windows server.
