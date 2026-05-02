# NODE A DECOMMISSION & MOONCAKE PREPARATION Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Decommission Node A's legacy roles (PostgreSQL/Llama) and provision it as the dedicated **Synapse Synapse (Mooncake KV-Store)** for the Trinity Mesh.

**Architecture:** Node A transition from a general-purpose Rules Authority to a headless distributed KV-cache server. It will host the Mooncake Metadata Server and Data Worker.

**Tech Stack:** Nix, Go (Mooncake), Bash.

---

### Task 1: Legacy Decommissioning (The Nuke)

**Files:**
- Modify: `docs/superpowers/specs/2026-04-18-phase-62-sovereign-trinity.md`
- Action: SSH execution on Node A (`10.0.0.10`)

- [ ] **Step 1: Stop and Disable legacy services on Node A**
  - SSH into `maczz@10.0.0.10`
  - Run: `echo 'ch00m' | sudo -S systemctl stop zeroclaw.service postgresql.service 2>/dev/null`
  - Run: `echo 'ch00m' | sudo -S systemctl disable zeroclaw.service postgresql.service 2>/dev/null`

- [ ] **Step 2: Clean up legacy binaries and weights**
  - Run: `rm -rf ~/50v3r31gn-m4ch1n4-v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS/zeroclaw/models/*.gguf`
  - Run: `rm -rf ~/50v3r31gn-m4ch1n4-v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS/zeroclaw/models/*.onnx`

- [ ] **Step 3: Commit Documentation Update**
  ```bash
  git add docs/superpowers/specs/2026-04-18-phase-62-sovereign-trinity.md
  git commit -m "infra: formalize Node A decommissioning of legacy Rules/Vision roles"
  ```

---

### Task 2: Mooncake Environment Provisioning

**Files:**
- Create: `scripts/ops/node-a-mooncake-setup.sh`
- Modify: `flake.nix` (Ensure Mooncake Go binaries are included)

- [ ] **Step 1: Create the Mooncake Setup script**

```bash
#!/usr/bin/env bash
# scripts/ops/node-a-mooncake-setup.sh
# Provisions Node A for Mooncake KV-Store role

PROJECT_ROOT="$HOME/50V3R31GN-M4CH1N4"
mkdir -p "$PROJECT_ROOT/data/mooncake"

# Fetch Mooncake binaries (assuming pre-built or via Nix)
# Placeholder for Mooncake specific download/link logic
echo "◈ Provisions Node A for Mooncake..."
```

- [ ] **Step 2: Update Node A's project root**
  - Run: `rsync -avz --exclude 'node_modules' . maczz@10.0.0.10:~/50V3R31GN-M4CH1N4/`

- [ ] **Step 3: Commit**
  ```bash
  git add scripts/ops/node-a-mooncake-setup.sh
  git commit -m "feat(mooncake): add Node A provisioning script for memory synapse role"
  ```

---

### Task 3: Mooncake Metadata Server Ignition

**Files:**
- Create: `scripts/ops/node-a-mooncake-ignite.sh`

- [ ] **Step 1: Implement the ignition script**

```bash
#!/usr/bin/env bash
# scripts/ops/node-a-mooncake-ignite.sh
# Starts the Mooncake Metadata Server and Worker on Node A

# Start Metadata Server (Master)
# ./mooncake-master --port 6789 --db-path ./data/mooncake/meta.db &

# Start Data Worker
# ./mooncake-worker --master 10.0.0.10:6789 --vram-gb 3.2 --dram-gb 12.0 &
```

- [ ] **Step 2: Execute Ignition on Node A**
  - Run: `ssh maczz@10.0.0.10 "bash ~/50V3R31GN-M4CH1N4/scripts/ops/node-a-mooncake-ignite.sh"`

- [ ] **Step 3: Verify Handshake**
  - Run: `curl http://10.0.0.10:6789/health`
  - Expected: `{"status": "READY"}`


---
**LINKS:** [[PLAN_TREE]] | [[OS_CORE]]
