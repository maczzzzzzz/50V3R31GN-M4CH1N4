# ◈ NODE D (QUATERNARY ARTERY) PROVISIONING

**Version:** 3.8.8
**Hardware:** GMKtec K15 (Intel Core Ultra 5)
**Role:** Heavy Reasoner & 128k Hyper-Context

---

## ◈ 1. OS INSTALLATION

1.  **Base OS:** Install Ubuntu Server 24.04 LTS (Headless).
2.  **User:** Create user `nixos` (for consistency with the mesh).
3.  **SSH:** Enable OpenSSH and copy your `id_ed25519.pub` from Node B.

---

## ◈ 2. NIX INSTALLATION & SHELL ENTRY

Node D uses **Nix** to manage its hardware-optimized inference environment.

1.  **Install Nix:**
    ```bash
    sh <(curl -L https://nixos.org/nix/install) --daemon
    ```
2.  **Clone Repository:**
    ```bash
    git clone https://github.com/maczzzzzzz/50V3R31GN-M4CH1N4 ~/50V3R31GN-M4CH1N4
    ```
3.  **Enter Quaternary Shell:**
    ```bash
    cd ~/50V3R31GN-M4CH1N4
    nix develop .#quaternary
    ```

---

## ◈ 3. INTEL NPU / OPENVINO OPTIMIZATION

Node D leverages the **Intel AI Boost NPU** for background perception.

1.  **Build llama.cpp with OpenVINO:**
    ```bash
    mkdir build && cd build
    cmake .. -DGGML_OPENVINO=ON
    make -j$(nproc)
    ```
2.  **Deploy Models:**
    Download the Gemma-4-26B A4B (Q6_K) GGUF to `~/models/`.

---

## ◈ 4. DAEMON IGNITION

The Node D Command daemon must be active for the Artery to function.

```bash
# Start the Quaternary Strategic Oracle
bash scripts/ops/node-d-command-ignition.sh
```

---
**::/5Y573M-N071C3 : NODE_D_PROVISIONED. HYPER_CONTEXT_ACTIVE. // 50V3R31GN-M4CH1N4**
