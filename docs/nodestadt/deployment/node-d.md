# ◈ NODE D (QUATERNARY ARTERY) PROVISIONING

**Version:** 3.8.24-SYNTHESIS-SYNTHESIS
**Hardware:** GMKtec K15 (Intel Core Ultra 5)
**Role:** Heavy Reasoner & 128k Hyper-Context

---

## ◈ 1. OS INSTALLATION

1.  **Base OS:** Install NixOS (preferred) or Ubuntu Server 24.04 LTS (Headless).
2.  **User:** Create user `nixos`.
3.  **SSH:** Enable OpenSSH and copy your `id_ed25519.pub` from Node B.

---

## ◈ 2. NIX INSTALLATION & SHELL ENTRY

Node D uses **Nix** to manage its hardware-optimized inference environment.

1.  **Install Nix:**
    ```bash
    curl -L https://nixos.org/nix/install | sh
    ```
2.  **Clone Repository:**
    ```bash
    git clone https://github.com/nodestadt/50V3R31GN-M4CH1N4 ~/50V3R31GN-M4CH1N4
    ```
3.  **Enter Quaternary Shell:**
    ```bash
    cd ~/50V3R31GN-M4CH1N4
    nix develop --impure
    ```

---

## ◈ 3. INTEL NPU / OPENVINO OPTIMIZATION

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
