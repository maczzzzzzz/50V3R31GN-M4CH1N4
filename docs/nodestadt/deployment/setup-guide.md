# ◈ HOW TO SET UP THE QUATERNARY MESH (NODESTADT AUTHORITY OS)

**Version:** 3.8.8
**Target:** Multi-Node Hardware Ignition

---

## ◈ 1. PREREQUISITES

### ◈ Hardware Nodes
- **Node A (Kernel):** NVIDIA GPU (4GB+), NixOS Native.
- **Node B (Director):** 16GB+ VRAM, WSL2/Ubuntu.
- **Node C (Strategic Oracle):** NVIDIA GPU (6GB+), Remote Server.
- **Node D (Quaternary):** Intel Core Ultra (NPU-Capable) or high-context CPU node.

### ◈ Networking
- **Tailscale:** All nodes must be joined to the same Tailscale Tailnet.
- **Static IPs:** Assign static 10.0.0.x IPs (recommended) or use Tailscale MagicDNS.
- **SSH Keys:** Deploy your `id_ed25519` key across all nodes for passwordless ClawLink orchestration.

---

## ◈ 2. NODE-SPECIFIC CONFIGURATION

### ◈ Node A: Synapse & Rules (NixOS)
1. Clone the repository: `git clone <repo_url> ~/50V3R31GN-M4CH1N4`
2. Enter Nix shell: `nix develop .#cuda`
3. Deploy models: `bash scripts/ops/node-a-setup-models.sh`
4. Verify VSB port: Ensure port `7878` (UDP) is open.

### ◈ Node B: Director & HUD (WSL2)
1. Install Node.js 22+ and pnpm.
2. Build sidecars: `npm run build:sidecars`
3. Configure `.env`:
   ```env
   NODE_A_HOST=10.0.0.10
   NODE_C_HOST=10.0.0.12
   NODE_D_HOST=10.0.0.13
   SOVEREIGN_KEY=<your_steganography_key>
   ```

### ◈ Node D: Heavy Reasoning (K15)
1. Install Nix: `curl -L https://nixos.org/nix/install | sh`
2. Build `llama.cpp` from source (Intel optimization):
   ```bash
   nix develop .#npu --command bash scripts/ops/node-d-provision.sh
   ```

---

## ◈ 3. SYSTEM IGNITION

From **Node B (Director)**, execute the sequential boot:
```bash
./deck-igniter-cli start
```
*Wait for the [GATE] status on all 4 nodes to turn green in the HUD.*

---
**::/5Y573M-N071C3 : SETUP_GUIDE_SHORED. v3.8.8_LOCK. // 50V3R31GN-M4CH1N4**
