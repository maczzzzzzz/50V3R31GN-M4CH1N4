# ◈ NODE D (QUATERNARY ARTERY) PROVISIONING

**Version:** 3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Hardware:** GMKtec K15 (Intel Core Ultra 5)
**Role:** Heavy Reasoner & 128k Hyper-Context

---

## ◈ 1. OS INSTALLATION

1.  **Base OS:** Install NixOS (preferred) or Ubuntu Server 24.04 LTS (Headless).
2.  **User:** Create user `nixos`.
3.  **SSH:** Enable OpenSSH and copy your `id_ed25519.pub` from Node B.

---

## ◈ 2. NIX INSTALLATION & SYSTEM PROVISIONING

Node D uses **Nix** to manage its hardware-optimized inference environment. We provide a provisioning script to automate the Artery setup.

1.  **Install Nix:**
    ```bash
    curl -L https://nixos.org/nix/install | sh
    ```
2.  **Execute Provisioner:**
    ```bash
    # This script installs Tailscale and configures the environment
    curl -fsSL https://raw.githubusercontent.com/nodestadt/50V3R31GN-M4CH1N4/master/scripts/ops/node-d-provision.sh | bash
    ```
3.  **Enter Quaternary Shell:**
    ```bash
    cd ~/50V3R31GN-M4CH1N4
    nix develop --impure
    ```

---

## ◈ 3. TAILSCALE ARTERY SETUP

Node D must be shored within the Tailscale Tailnet to maintain the encrypted backbone.

1.  **Install Tailscale:**
    ```bash
    curl -fsSL https://tailscale.com/install.sh | sh
    ```
2.  **Ignite Artery:**
    ```bash
    sudo tailscale up --authkey=<your_tailnet_auth_key> --hostname=NODESTADT-HEAVY
    ```
3.  **Verification:**
    Ensure the node appears in the Tailscale Admin Console and your mobile app.

---

## ◈ 4. INTEL NPU / OPENVINO OPTIMIZATION

Node D leverages the **Intel AI Boost NPU** for background perception.

1.  **Optimization:** The Nix shell automatically configures OpenVINO and NPU drivers.
2.  **Deploy Models:**
    Download the Gemma-4-26B (Q6_K) GGUF to the project data directory.

---

## ◈ 4. DAEMON IGNITION

The Node D Command daemon must be active for the Artery to function.

```bash
# Start the Quaternary Strategic Oracle
bash scripts/ops/node-d-ignite-farm.sh
```

---
**::/5Y573M-N071C3 : NODE_D_PROVISIONED. HYPER_CONTEXT_ACTIVE. // 50V3R31GN-M4CH1N4**
