#!/usr/bin/env bash
echo "=== Testing AMDVLK (WSL Injected) ==="
export VK_ICD_FILENAMES=$(find /usr/lib/wsl/drivers -name "amd-vulkan64.json" | head -n 1)
vulkaninfo --summary 2>&1 | grep -E "GPU|driverName|ERROR|deviceCount" || echo "Failed"

echo "=== Testing Dozen ==="
export VK_ICD_FILENAMES=/run/opengl-driver/share/vulkan/icd.d/dzn_icd.x86_64.json
export MESA_LOADER_DRIVER_OVERRIDE=""
vulkaninfo --summary 2>&1 | grep -E "GPU|driverName|ERROR|deviceCount" || echo "Failed"

echo "=== Testing Zink (User Fallback) ==="
export VK_ICD_FILENAMES=""
export MESA_LOADER_DRIVER_OVERRIDE="zink"
export GALLIUM_DRIVER="zink"
vulkaninfo --summary 2>&1 | grep -E "GPU|driverName|ERROR|deviceCount" || echo "Failed"
