# Phase 1 Implementation Plan: Kinetic Agency + Node D GPU Upgrade

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** Complete Phase 1 (vision, terminal control, screen triage) and lay groundwork for Node D GPU upgrade (RTX 5060 Ti via OCuLink).

**Architecture:** Three parallel workstreams. Workstream A completes the remaining P1 vision/terminal tasks. Workstream B handles the Node D GPU hardware deployment and model migration. Workstream C is the screen triage sidecar (blocked on A). Workstreams A and B can run in parallel.

**Tech Stack:** ik_llama.cpp (CUDA/AVX2/Vulkan), LiteLLM, NixOS, Docker Desktop, Qwen3-VL-2B, Hermes toolsets, Tailscale SSH

---

## Prerequisites / Entry State

- Phase 0: CLOSED. All benchmarks verified.
- mesh-vision route: LIVE on LiteLLM (Qwen3-VL-2B Q6_K on Node B port 8082)
- mesh-fast route: LIVE (Qwopus3.5-9B Q4_K_M on Node B port 8081)
- mesh-function-calling: LIVE (Carnice-9B-FC on Node C port 8081)
- mesh-heavy: LIVE (Carnice MoE 35B on Node D port 8080)
- Docker Desktop: OPERATIONAL on Node B (WSL2 integration complete)
- Tailscale: all 4 nodes online
- Research: RTX 5060 Ti upgrade analysis saved in `docs/planning/research/`

---

## WORKSTREAM A: Vision & Terminal (P1 Core)

### Task A1: Verify mesh-vision end-to-end latency

**Objective:** Confirm Qwen3-VL-2B responds within usable latency via the mesh-vision route.

**Files:**
- Read: `sidecars/mesh/litellm-mesh.yaml` (mesh-vision route config)

**Step 1: Test vision model with a text prompt**

Run:
```bash
curl -s http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-sov...roxy" \
  -H "Content-Type: application/json" \
  -d '{"model":"mesh-vision","messages":[{"role":"user","content":"Describe what you see in: a black terminal screen with green text"}],"max_tokens":100}' \
  -w "\nTime: %{time_total}s\n"
```
Expected: Response within 3-5 seconds. Model responds with description.

**Step 2: Test vision model with actual image URL**

Run:
```bash
curl -s http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-sov...roxy" \
  -H "Content-Type: application/json" \
  -d '{"model":"mesh-vision","messages":[{"role":"user","content":[{"type":"text","text":"What is in this image?"},{"type":"image_url","image_url":{"url":"https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/PNG_transparency_demonstration_1.png/280px-PNG_transparency_demonstration_1.png"}}]}],"max_tokens":100}' \
  -w "\nTime: %{time_total}s\n"
```
Expected: Response describing dice/cubes image. Time < 10s end-to-end.

**Step 3: Record benchmark**

Document prompt latency and generation speed in SOVEREIGN_VITAL_SIGNS.md under mesh-vision entry.

**Verification:** Both text and image requests return valid responses. Latency recorded.

---

### Task A2: Wire mesh-vision into Hermes auxiliary vision config

**Objective:** Configure Hermes to use mesh-vision route as its vision backend.

**Files:**
- Read: `~/.hermes/config.yaml`
- Modify: `~/.hermes/config.yaml` (add vision provider config)

**Step 1: Check current Hermes vision config**

Run:
```bash
grep -A10 "vision\|auxiliary" ~/.hermes/config.yaml 2>/dev/null || echo "No vision config found"
```

**Step 2: Add mesh-vision as vision provider**

Add to `~/.hermes/config.yaml`:
```yaml
vision:
  provider: openai
  model: mesh-vision
  api_base: http://localhost:4000/v1
  api_key: "sk-sov...roxy"
```

**Step 3: Test from Hermes**

Run:
```bash
hermes chat -m mesh-vision -p "Describe a terminal window with green text on black background"
```
Expected: Response from mesh-vision route.

**Verification:** Hermes successfully routes vision queries to mesh-vision endpoint.

---

### Task A3: Verify terminal control across Tailscale mesh

**Objective:** Confirm Hermes terminal toolset can execute commands on all mesh nodes via SSH.

**Files:**
- Read: `~/.hermes/config.yaml` (terminal/SSH config)
- Read: `~/.ssh/config` (if exists)

**Step 1: Test SSH connectivity from Node B to Node C**

Run:
```bash
ssh -o ConnectTimeout=5 maczz@100.102.109.81 "hostname && uname -a"
```
Expected: Node C hostname and kernel info. (Previously verified working.)

**Step 2: Test SSH connectivity from Node B to Node D**

Run:
```bash
ssh -o ConnectTimeout=5 maczz@100.120.225.12 "hostname && uname -a"
```
Expected: Node D hostname and kernel info. (Previously verified working.)

**Step 3: Test SSH connectivity from Node B to Node A**

Run:
```bash
ssh -o ConnectTimeout=5 maczz@100.96.253.114 "hostname && uname -a"
```
Expected: Node A hostname and kernel info. (Previously verified working.)

**Step 4: Test Docker environments on remote nodes**

Run:
```bash
ssh maczz@100.102.109.81 "docker ps" 2>&1
```
Expected: Docker output or "docker not installed" (Node C runs inference, may not have Docker).

**Step 5: Document SSH access matrix**

Record connectivity results. Note any nodes that require key setup or have stale credentials.

**Verification:** SSH works to all 3 remote nodes from Node B.

---

### Task A4: Update IMPLEMENTATION_PLAN.md Phase 1 task status

**Objective:** Mark completed P1 tasks in the implementation plan.

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md` (Phase 1 section)

**Step 1: Update P1-T1 status**

Change P1-T1 checkbox to checked if mesh-vision is confirmed operational:
```markdown
- [x] **P1-T1: Vision-Enabled UI Automation.** DEPLOYED. Qwen3-VL-2B Q6_K on mesh-vision route. Benchmark: [recorded latency].
```

**Step 2: Update P1-T2 status**

Change P1-T2 checkbox if terminal control verified:
```markdown
- [x] **P1-T2: Terminal Control.** VERIFIED. SSH B->C/D/A confirmed. Docker environments documented.
```

**Step 3: Commit**

```bash
git add IMPLEMENTATION_PLAN.md
git commit -m "docs: update Phase 1 task status (P1-T1 vision, P1-T2 terminal)"
```

**Verification:** IMPLEMENTATION_PLAN.md reflects actual state.

---

## WORKSTREAM B: Node D GPU Upgrade (Hardware + Model Migration)

**Status:** BLOCKED on hardware purchase. Tasks below assume user has acquired:
- RTX 5060 Ti 16GB (ASUS Prime or equivalent)
- OCuLink dock/enclosure
- PSU (400W+)

### Task B1: Physical installation and NixOS driver setup

**Objective:** Install GPU in OCuLink dock, connect to Node D, configure NVIDIA drivers.

**Files:**
- Read: Node D `/etc/nixos/configuration.nix` (or flake.nix)
- Modify: Node D NixOS config (add NVIDIA + CUDA)

**Step 1: Physical install**

1. Install RTX 5060 Ti in OCuLink enclosure
2. Connect PSU to enclosure
3. Connect OCuLink cable from enclosure to Node D's OCuLink port
4. Power on enclosure, then boot Node D

**Step 2: Verify PCIe detection**

Run on Node D:
```bash
lspci | grep -i nvidia
```
Expected: NVIDIA device listed. OCuLink is transparent to OS.

**Step 3: Configure NixOS NVIDIA driver**

Add to Node D's NixOS config:
```nix
# NVIDIA Blackwell (RTX 5060 Ti)
hardware.graphics = {
  enable = true;
  extraPackages = with pkgs; [ nvidia-vaapi-driver ];
};
services.xserver.videoDrivers = [ "nvidia" ];
hardware.nvidia = {
  modesetting.enable = true;
  open = false;  # Blackwell needs proprietary
  package = config.boot.kernelPackages.nvidiaPackages.latest;
};
```

Note: May need `nixos-unstable` channel or explicit `hardware.nvidia.package` override for Blackwell (570.xx+ driver).

**Step 4: Rebuild NixOS**

Run on Node D:
```bash
sudo nixos-rebuild switch -I nixpkgs=/nix/var/nix/profiles/per-user/root/channels/nixos
```
Expected: Clean rebuild, nvidia driver loaded.

**Step 5: Verify driver**

Run:
```bash
nvidia-smi
```
Expected: RTX 5060 Ti listed with 16GB VRAM, driver version 570+.

**Verification:** GPU detected, driver loaded, nvidia-smi shows correct card.

---

### Task B2: Build ik_llama.cpp with CUDA for Blackwell

**Objective:** Compile ik_llama.cpp on Node D with CUDA support targeting Blackwell.

**Files:**
- Read: Node D ik_llama.cpp source location (currently `/home/maczz/llama.cpp/`)
- Build: ik_llama.cpp with CUDA backend

**Step 1: Verify CUDA toolkit**

Run on Node D:
```bash
nvcc --version 2>/dev/null || echo "CUDA not found"
nix-store -q --references /run/current-system/sw | grep cuda
```
Expected: CUDA 12.8+ available. If not, add to NixOS config:
```nix
environment.systemPackages = with pkgs; [ cudaPackages_12_8.cudatoolkit ];
```

**Step 2: Clone or update ik_llama.cpp on Node D**

Run on Node D:
```bash
cd /home/maczz
git clone https://github.com/ikawrakow/ik_llama.cpp.git ik_llama.cpp-cuda 2>/dev/null || \
  (cd ik_llama.cpp-cuda && git pull)
```

**Step 3: Build with CUDA**

Run on Node D:
```bash
cd /home/maczz/ik_llama.cpp-cuda
mkdir -p build && cd build
cmake .. -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES="100;120" -DCMAKE_BUILD_TYPE=Release
cmake --build . --config Release -j$(nproc)
```
Expected: Clean build. Binaries in `build/bin/`.

**Step 4: Verify CUDA build**

Run on Node D:
```bash
./build/bin/llama-server --version
./build/bin/llama-server -h | grep -i cuda
```
Expected: Version output shows CUDA support.

**Verification:** ik_llama.cpp binary runs with CUDA backend on RTX 5060 Ti.

---

### Task B3: Download and deploy Qwen3.6-27B model

**Objective:** Download the target model for Node D's new GPU.

**Files:**
- Download: Qwen3.6-27B GGUF (Unsloth Dynamic Q3_K or Q4_K_M depending on VRAM fit)

**Step 1: Research exact model and quant availability**

Check Unsloth HuggingFace for Qwen3.6-27B GGUF quants:
- Target: UD-Q3_K or Q4_K_M
- Must fit in 16GB VRAM with KV cache headroom
- If Q4_K_M exceeds 16GB, fall back to UD-Q3_K_XS

**Step 2: Download model to Node D**

Run on Node D:
```bash
mkdir -p /home/maczz/models
# Download via huggingface-cli or wget
# Exact URL determined in Step 1
huggingface-cli download <org>/<repo> <filename> --local-dir /home/maczz/models/
```

**Step 3: Verify download**

Run:
```bash
ls -lh /home/maczz/models/<model-file>.gguf
```
Expected: File size consistent with quant level (~12-15 GB).

**Verification:** Model file present and correct size.

---

### Task B4: Benchmark Qwen3.6-27B on RTX 5060 Ti

**Objective:** Benchmark the new model and compare against current CPU-only 35B MoE.

**Files:**
- Run: ik_llama.cpp llama-server on Node D

**Step 1: Launch inference server**

Run on Node D:
```bash
/home/maczz/ik_llama.cpp-cuda/build/bin/llama-server \
  -m /home/maczz/models/<model-file>.gguf \
  -ngl 99 \
  -c 4096 \
  --port 8081 \
  -ctk q4_0 -ctv q4_0 \
  --host 0.0.0.0
```

**Step 2: Run benchmark prompt**

Run from Node B:
```bash
curl -s http://100.120.225.12:8081/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"default","messages":[{"role":"user","content":"Write a detailed analysis of distributed systems consensus algorithms, comparing Raft, Paxos, and Byzantine Fault Tolerance."}],"max_tokens":500}' \
  -w "\nPrompt: %{time_starttransfer}s | Total: %{time_total}s\n"
```

**Step 3: Record throughput**

Measure prompt processing speed and generation speed. Compare to baseline:
- Current (35B MoE CPU): 8.8/6.1 t/s
- Target (27B GPU OCuLink): 35-65+ t/s

**Step 4: Test MTP if available**

If ik_llama.cpp supports MTP speculative decoding for Qwen3.6:
```bash
/home/maczz/ik_llama.cpp-cuda/build/bin/llama-server \
  -m /home/maczz/models/<model-file>.gguf \
  -ngl 99 -c 4096 --port 8081 \
  --spec-draft-n-max 2 \
  -ctk q4_0 -ctv q4_0 \
  --host 0.0.0.0
```

**Verification:** Benchmarked throughput recorded. Meets or exceeds 35 t/s generation target.

---

### Task B5: Migrate mesh-heavy route to new model

**Objective:** Update LiteLLM config to point mesh-heavy at new Node D model.

**Files:**
- Modify: `sidecars/mesh/litellm-mesh.yaml` (mesh-heavy route)

**Step 1: Update mesh-heavy route**

Change `sidecars/mesh/litellm-mesh.yaml` mesh-heavy entry:
```yaml
  - model_name: mesh-heavy
    litellm_params:
      model: openai/qwen3.6-27b
      api_base: http://100.120.225.12:8081/v1
      api_key: "machina-sovereign-mesh-v3-secret-key"
      tpm: 100000
      rpm: 100
    model_info:
      id: mesh-heavy
      object: model
      owned_by: nodestadt-mesh
      permission: []
      root: mesh-heavy
      parent: null
```

**Step 2: Restart LiteLLM container**

Run:
```bash
sg docker -c "docker restart mesh-litellm"
```

**Step 3: Verify route**

Run:
```bash
curl -s http://localhost:4000/v1/chat/completions \
  -H "Authorization: Bearer sk-sov...roxy" \
  -H "Content-Type: application/json" \
  -d '{"model":"mesh-heavy","messages":[{"role":"user","content":"Hello, respond briefly."}],"max_tokens":50}'
```
Expected: Response from new Qwen3.6-27B model.

**Step 4: Commit**

```bash
git add sidecars/mesh/litellm-mesh.yaml
git commit -m "feat: migrate mesh-heavy to Qwen3.6-27B on RTX 5060 Ti (Node D GPU)"
```

**Verification:** mesh-heavy route serves new model. Old 35B MoE CPU server stopped.

---

### Task B6: Stop old 35B MoE CPU inference server

**Objective:** Decommission the CPU-only ik_llama.cpp instance on Node D.

**Step 1: Verify new GPU server is serving mesh-heavy**

Run:
```bash
curl -s http://100.120.225.12:8081/v1/models
```
Expected: Qwen3.6-27B model listed.

**Step 2: Stop old CPU server on Node D**

SSH to Node D:
```bash
ssh maczz@100.120.225.12
# Find and stop the old llama.cpp/ik_llama.cpp process serving port 8080
lsof -i :8080 | grep LISTEN
kill <pid>
```

**Step 3: Update port mapping if needed**

If old server was on port 8080 and new is on 8081, update any hardcoded references in docs and configs.

**Verification:** Port 8080 no longer listening on Node D. Only 8081 (GPU server) active.

---

## WORKSTREAM C: Screen Triage Sidecar (P1-T3)

**Depends on:** Task A1 (mesh-vision verified), Task A2 (Hermes vision config)

### Task C1: Design screen capture pipeline

**Objective:** Define how screen capture feeds into vision model for triage.

**Files:**
- Create: `sidecars/sniffer/` (new directory)
- Create: `sidecars/sniffer/capture.py` (screen capture utility)

**Step 1: Evaluate capture method**

Options for Node B (WSL2):
1. Windows native screenshot -> WSL2 filesystem -> vision model
2. Browser CDP screenshot -> vision model (if browser-harness available)
3. scrot/pyautogui inside WSL2 (limited -- no display server)

Most viable: Windows-side PowerShell screenshot script triggered from WSL2.

**Step 2: Write capture script**

Create `sidecars/sniffer/capture.py`:
```python
#!/usr/bin/env python3
"""Screen capture utility for mesh-vision triage."""
import subprocess
import base64
import sys
import os
from datetime import datetime

CAPTURE_DIR = "/tmp/sovereign-sniffer"
os.makedirs(CAPTURE_DIR, exist_ok=True)

def capture_screen() -> str:
    """Capture screen via PowerShell (WSL2) and return base64."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filepath = f"{CAPTURE_DIR}/capture_{timestamp}.png"
    
    # PowerShell screenshot via WSL2
    ps_cmd = f'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Screen]::PrimaryScreen | ForEach-Object {{ $bmp = New-Object System.Drawing.Bitmap($_.Bounds.Width, $_.Bounds.Height); $g = [System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($_.Bounds.Location, [System.Drawing.Point]::Empty, $_.Bounds.Size); $bmp.Save("\\\\wsl$\\nixos{filepath.Replace("/", "\\\\")}"); $g.Dispose(); $bmp.Dispose() }}'
    
    result = subprocess.run(
        ["powershell.exe", "-Command", ps_cmd],
        capture_output=True, text=True, timeout=10
    )
    
    if result.returncode != 0:
        raise RuntimeError(f"Capture failed: {result.stderr}")
    
    with open(filepath, "rb") as f:
        b64 = base64.b64encode(f.read()).decode()
    
    return b64

if __name__ == "__main__":
    print(capture_screen())
```

**Step 3: Test capture**

Run:
```bash
python3 sidecars/sniffer/capture.py | head -c 100
```
Expected: Base64 string output (PNG data).

**Verification:** Screenshot captured and converted to base64.

---

### Task C2: Wire capture to mesh-vision for triage

**Objective:** End-to-end pipeline: capture -> vision model -> structured response.

**Files:**
- Create: `sidecars/sniffer/triage.py` (vision query with captured image)

**Step 1: Write triage script**

Create `sidecars/sniffer/triage.py`:
```python
#!/usr/bin/env python3
"""Screen triage: capture -> vision model -> structured analysis."""
import json
import requests
from capture import capture_screen

LITELLM_URL = "http://localhost:4000/v1/chat/completions"
API_KEY = "sk-sov...roxy"
MODEL = "mesh-vision"

def triage_screen(prompt: str = "Analyze this screen. What applications are visible? Are there any alerts, errors, or notifications that need attention?") -> str:
    b64_image = capture_screen()
    
    payload = {
        "model": MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64_image}"}}
            ]
        }],
        "max_tokens": 300
    }
    
    resp = requests.post(
        LITELLM_URL,
        headers={"Authorization": f"Bearer {API_KEY}", "Content-Type": "application/json"},
        json=payload,
        timeout=30
    )
    resp.raise_for_status()
    return resp.json()["choices"][0]["message"]["content"]

if __name__ == "__main__":
    result = triage_screen()
    print(result)
```

**Step 2: Test end-to-end**

Run:
```bash
cd sidecars/sniffer
python3 triage.py
```
Expected: Vision model response describing current screen contents.

**Step 3: Measure latency**

Run:
```bash
time python3 sidecars/sniffer/triage.py
```
Expected: Total time < 15 seconds (capture + encode + inference + response).

**Verification:** Full pipeline works. Latency measured and recorded.

---

### Task C3: Deploy as persistent systemd service (optional)

**Objective:** Run screen triage on a schedule or trigger.

**Note:** This is stretch scope. Only implement if Tasks C1-C2 succeed and user wants persistent monitoring.

**Step 1: Create systemd timer**

Create `sidecars/sniffer/sniffer.service` and `sniffer.timer` for periodic triage.

**Step 2: Install and activate**

```bash
sudo systemctl enable --now sniffer.timer
```

**Verification:** `systemctl status sniffer.timer` shows active.

---

## Documentation Updates (All Workstreams)

### Task D1: Update SOVEREIGN_VITAL_SIGNS.md

**Objective:** Reflect all Phase 1 changes in the vital signs document.

**Files:**
- Modify: `SOVEREIGN_VITAL_SIGNS.md`

**Updates needed:**
- Node D: add GPU specs (if hardware deployed)
- mesh-vision: add benchmark latency numbers
- mesh-heavy: update to new model + throughput (if migration complete)
- Services: add screen triage status
- Docker: note migration from native NixOS to Docker Desktop

**Verification:** Document matches physical reality.

---

### Task D2: Update IMPLEMENTATION_PLAN.md

**Objective:** Mark Phase 1 tasks complete. Update Phase 2 to reflect GPU upgrade.

**Files:**
- Modify: `IMPLEMENTATION_PLAN.md`

**Updates needed:**
- Phase 1: mark P1-T1, P1-T2, P1-T3 as complete
- Phase 2: P2-T1 (Node D Dual-Model) -- superseded by GPU upgrade (single 27B model > dual CPU models). Update description.
- Phase 2: P2-T3 (Context Spillover) -- GPU model fits in VRAM, KV spillover to Node A may no longer be needed. Re-evaluate.
- Model Strategy table: update mesh-heavy entry

**Verification:** Plan reflects actual scope.

---

### Task D3: Update SESSION_HANDOFF.md

**Objective:** Record session outcomes for next session.

**Files:**
- Modify: `SESSION_HANDOFF.md`

**Verification:** Handoff document is current.

---

### Task D4: Update AGENTS.md and KANBAN_MAP.md

**Objective:** Sync all governance docs with Phase 1 changes.

**Files:**
- Modify: `AGENTS.md` (Node D hardware section)
- Modify: `docs/planning/KANBAN_MAP.md` (Phase 1 card statuses)

**Verification:** All docs consistent.

---

## Dependency Graph

```
A1 (vision benchmark) ──> A2 (Hermes vision config) ──> C1 (capture) ──> C2 (triage) ──> C3 (service)
A3 (terminal control) ──> A4 (plan update)
B1 (hardware install) ──> B2 (ik_llama build) ──> B3 (model download) ──> B4 (benchmark) ──> B5 (route migration) ──> B6 (decommission)
D* (docs) ──> all workstreams
```

Workstream A and B are independent. C depends on A. D runs last.

---

## Execution Order

1. **Now (no hardware needed):** A1 -> A2 -> A3 -> A4 -> C1 -> C2
2. **When hardware arrives:** B1 -> B2 -> B3 -> B4 -> B5 -> B6
3. **After all workstreams:** D1 -> D2 -> D3 -> D4

---

## Risks

| Risk | Impact | Mitigation |
|:-----|:-------|:-----------|
| NixOS NVIDIA driver too old for Blackwell | Blocks B1 | May need nixos-unstable channel. Test before hardware purchase. |
| ik_llama.cpp CUDA doesn't compile for sm_100 | Blocks B2 | Fall back to mainline llama.cpp. PTX JIT may work. |
| Qwen3.6-27B Q4_K_M exceeds 16GB VRAM | Blocks B4 | Use UD-Q3_K_XS quant. Fallback to Qwen3.6-14B Q6_K. |
| OCuLink enclosure incompatible | Blocks B1 | Verify enclosure supports PCIe 4.0 x4 before purchase. |
| WSL2 screen capture unreliable | Blocks C1 | Fall back to browser CDP screenshot via browser-harness. |
| Meteor Lake OCuLink port shares lanes with NVMe | Performance | Check BIOS for PCIe lane allocation. May reduce NVMe bandwidth. |

---

*Plan by Lead Architect GLM-5. Phase 1 scope from IMPLEMENTATION_PLAN.md v0.1.0-alpha.*
*Node D GPU research: docs/planning/research/node-d-rtx5060ti-oculink-upgrade.md*
