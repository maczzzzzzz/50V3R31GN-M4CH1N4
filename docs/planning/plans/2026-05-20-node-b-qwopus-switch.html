# Node B Model Switch Plan: Qwopus3.5-9B Q8_0

**Date:** 2026-05-20  
**Status:** Planned  
**Priority:** High (pre-Phase 3)

## Objective
Replace Qwopus3.5-9B Q4_K_M on Node B with Qwopus3.5-9B-Coder-GGUF at Q8_0. Prioritize highest reasoning and vision quality.

## Locked Configuration
- Model: Qwopus3.5-9B-Coder-GGUF
- Quant: Q8_0
- Context: 32k with f16 KV cache (Vulkan requirement)
- Vision: Reuse existing Qwen3-VL mmproj
- Expected VRAM: ~10.2 GiB (9.2 GiB model + 1.0 GiB KV)
- Headroom: ~1.08 GiB on RX 9060 XT 16 GB

## Current State (Node B)
- Primary: Qwopus3.5-9B Q4_K_M (port 8081, Vulkan b9190)
- Vision: Qwen3-VL-2B Q6_K (port 8082)
- Backend: llama.cpp b9190 Vulkan
- LiteLLM route: mesh-fast

## Migration Steps

1. Download Qwopus3.5-9B Q8_0 GGUF to D:\llama.cpp\models\
2. Create new startup script: `start-qwopus.bat`
3. Update `start-hermes.bat` or consolidate into single launcher
4. Launch new model on port 8081 (or new port if parallel testing)
5. Update LiteLLM config: change mesh-fast target to new model
6. Run benchmark: prompt + gen speed + vision test with existing mmproj
7. Retire Hermes-14B after validation

## Verification
- Generation speed target: > 50 t/s
- Vision: Confirm mmproj loads and produces coherent descriptions
- VRAM usage: Confirm < 11 GiB under load
- Mesh routing: Confirm LiteLLM still routes correctly

## Rollback
- Keep Hermes-14B binary and start script available for 48 hours
- Revert LiteLLM route and restart original service if needed

## Notes
- Q8_0 chosen over Q6 for superior reasoning and visual CoT quality.
- 32k context maintained to stay within safe VRAM budget with f16 KV.
- Switch executed before Phase 3 work begins.