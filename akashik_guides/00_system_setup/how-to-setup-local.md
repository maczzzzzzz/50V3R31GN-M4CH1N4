# Local Setup: Node B (NixOS/WSL Orchestrator)
### 50V3R31GN-M4CH1N4 v3.4.2 | Hardened Security Milestone

This document details the configuration for **Node B**, the primary narrative and vision orchestrator, unified on **NixOS (WSL 2)**.

---

## 💻 Hardware Prerequisites
- **CPU:** AMD Ryzen 9 5950X (16 Core) for VSB High-Priority Threads.
- **GPU:** AMD Radeon RX 9060 XT (16GB VRAM) for Director/Vision.
- **FS:** Project MUST be in `/home/nixos/` (ext4), NOT `/mnt/d/` (9p).

## 🛠️ Step 1: NixOS Environment Setup
1. **WSL Import:** Ensure NixOS is imported and operational.
2. **Nix Config:** Enable `nix-command` and `flakes` in `/etc/nix/nix.conf`.
3. **Shell:** Enter the directory and run `nix develop --impure`.

## 🚀 Step 2: Build & Installation
```bash
# Enter the Reproducible Env
cd /home/nixos/50v3r31gn-m4ch1n4
nix develop --impure

# Install Dependencies (pnpm v10+)
pnpm install

# Build CLI Core
npm run build
```

## 🧠 Step 3: Model Provisioning
The system uses native `llama-server` for zero-overhead inference and explicit VRAM control.

### Node B (Director)
1. **Models:** 
   - `mistralai-Mistral-Nemo-Instruct-2407-extensive-BP-abliteration-12B.i1-Q4_K_M.gguf`
2. **Ignite:** (Managed by the Nucleus Artery during boot).

### Node A (The Kernel)
Run the automated setup on Node A:
```bash
bash scripts/setup-node-a.sh
```

## 🌐 Step 4: System Ignition (WebGL First)
As of Phase 50, the primary ignition method is the **Nucleus Command Deck**.

1.  **Start the Artery:**
    ```bash
    npm run crush nucleus
    ```
2.  **Access the Deck:**
    Navigate to `http://localhost:3030`.
3.  **Engage:**
    Use the **◈ NUCLEUS** dropdown to select **[FULL_ENGAGE]**. This triggers the background orchestration via `deck-igniter` in headless mode.

---
**::/5Y573M-N071C3 : TRU7H UN1F13D. 5Y573M V3R1F13D. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
