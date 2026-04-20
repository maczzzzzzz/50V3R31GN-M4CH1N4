#!/usr/bin/env bash
# scripts/ops/node-c-nvidia-bridge.sh
# 50V3R31GN-M4CH1N4: Node C GPU Bridge (NVIDIA Container Toolkit)

PASS="ch00m"

echo "◈ 50V3R31GN-M4CH1N4 : BRIDGING_GPU_TO_DOCKER..."

# 1. Add Repository GPG Key
echo "◈ Fetching GPG Key..."
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | echo "$PASS" | sudo -S gpg --dearmor --yes -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg

# 2. Add Repository List
echo "◈ Configuring Repository Artery..."
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | \
  sed "s#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g" | \
  echo "$PASS" | sudo -S tee /etc/apt/sources.list.d/nvidia-container-toolkit.list

# 3. Update and Install
echo "◈ Installing Toolkit..."
echo "$PASS" | sudo -S apt-get update
echo "$PASS" | sudo -S apt-get install -y nvidia-container-toolkit

# 4. Configure and Restart Docker
echo "◈ Linking Docker Runtime..."
echo "$PASS" | sudo -S nvidia-ctk runtime configure --runtime=docker
echo "$PASS" | sudo -S systemctl restart docker

echo "◈ BRIDGE_ESTABLISHED. Docker GPU passthrough active."
