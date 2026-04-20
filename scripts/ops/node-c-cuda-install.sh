#!/usr/bin/env bash
# scripts/ops/node-c-cuda-install.sh
# 50V3R31GN-M4CH1N4: Node C NVIDIA/CUDA Driver Provisioning

PASS="ch00m"

echo "◈ 50V3R31GN-M4CH1N4 : INITIATING_CUDA_PROVISIONING (Node C)..."

# 1. Update and install drivers
echo "◈ Installing NVIDIA drivers..."
echo "$PASS" | sudo -S apt-get update
echo "$PASS" | sudo -S ubuntu-drivers autoinstall

# 2. Install CUDA Toolkit
echo "◈ Installing CUDA toolkit..."
echo "$PASS" | sudo -S apt-get install -y nvidia-cuda-toolkit

echo "◈ CUDA_PROVISIONING_COMPLETE. Reboot recommended."
echo "◈ Verify via: nvidia-smi"
