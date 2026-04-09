#!/usr/bin/env bash
export VK_ICD_FILENAMES=/run/opengl-driver/share/vulkan/icd.d/dzn_icd.x86_64.json
export MESA_LOADER_DRIVER_OVERRIDE=""

echo "Testing adapter 1..."
export MESA_D3D12_DEFAULT_ADAPTER_INDEX=1
vulkaninfo --summary 2>&1 | head -n 20 &
sleep 2; kill $! 2>/dev/null

echo "Testing adapter 0..."
export MESA_D3D12_DEFAULT_ADAPTER_INDEX=0
vulkaninfo --summary 2>&1 | head -n 20 &
sleep 2; kill $! 2>/dev/null
