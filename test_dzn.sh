#!/usr/bin/env bash
export VK_ICD_FILENAMES=/run/opengl-driver/share/vulkan/icd.d/dzn_icd.x86_64.json
export LD_LIBRARY_PATH=/usr/lib/wsl/lib:/run/opengl-driver/lib:$LD_LIBRARY_PATH
export MESA_D3D12_DEFAULT_ADAPTER_INDEX=0
echo "=== Vulkaninfo with DZN ==="
vulkaninfo --summary 2>&1 | grep -E "GPU|driverName|ERROR" || echo "Failed"

export VK_ICD_FILENAMES=/run/opengl-driver/share/vulkan/icd.d/radeon_icd.x86_64.json
echo "=== Vulkaninfo with RADV ==="
vulkaninfo --summary 2>&1 | grep -E "GPU|driverName|ERROR" || echo "Failed"
