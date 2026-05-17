# Node D: 5060 Ti 16GB OC OCuLink Upgrade Plan

**Date:** 2026-05-17
**Node:** D (Quaternary) -- Tailscale 100.120.225.12
**Hardware:** Intel Core Ultra Meteor Lake, 48GB DDR5, NPU (excluded)
**Upgrade:** RTX 5060 Ti 16GB OC via OCuLink

---

## 1. CURRENT STATE

| Item | Value |
|------|-------|
| OS | NixOS 26.05 (pre-release) |
| Inference | CPU-only, Nix llama.cpp v8983, 8 threads |
| Model | Qwen3.5-35B-A3B-MTP Q4_K_M (20GB on disk) |
| Throughput | prompt 8.8 t/s, gen 6.1 t/s |
| RAM usage | ~21GB (43.6% of 48GB) |
| Port | 8080 |
| Custom builds | llama.cpp-latest (GCC 15.2, build 64b38b5), ik_llama.cpp (source, GCC 15 fails) |

## 2. UPGRADE TARGET

| Item | Value |
|------|-------|
| GPU | RTX 5060 Ti 16GB OC |
| Interface | OCuLink (PCIe 4x or 2x depending on Meteor Lake lanes) |
| VRAM | 16GB GDDR7 |
| CUDA arch | sm_120 (Blackwell) or check with nvidia-smi |
| Target model | Qwen3.5-35B-A3B-MTP UD-Q4_K_M (~12-13GB) |

## 3. VRAM BUDGET

| Component | Size | Notes |
|-----------|------|-------|
| Model weights | ~12.5GB | UD-Q4_K_M, MoE ~22B unique params |
| KV cache (q4_0) | ~1.5GB | 8192 ctx, single user |
| Overhead | ~0.5GB | CUDA context, fragmentation |
| **Total** | **~14.5GB** | **Fits in 16GB with ~1.5GB headroom** |

If tight, options:
- Drop to UD-Q3_K_M (~10GB) for more KV room
- Reduce ctx-size to 4096
- Use UD-IQ4_XS (~9GB) for maximum KV headroom

## 4. PRE-UPGRADE CHECKLIST (before hardware arrives)

- [ ] Verify OCuLink port on Node D motherboard is functional
- [ ] Confirm PCIe lane allocation (4x ideal, 2x acceptable for inference)
- [ ] Install NVIDIA driver on NixOS 26.05 (`hardware.nvidia` config)
- [ ] Build ik_llama.cpp with CUDA support for sm_120
  - Note: ik_llama.cpp GCC 15 IQK kernel failure. Use GCC 14 or clang.
  - Fallback: stock llama.cpp with CUDA (already builds on D)
- [ ] Download model to Node D (Qwen3.5-35B-A3B-UD-Q4_K_M.gguf)
- [ ] Prepare systemd service with GPU offload flags

## 5. UPGRADE DAY PROCEDURE

### Phase 1: Hardware Install (30 min)
1. Power down Node D
2. Install 5060 Ti in OCuLink enclosure
3. Connect OCuLink cable to motherboard port
4. Power on, verify PCIe device visible: `lspci | grep NVIDIA`

### Phase 2: Driver + CUDA (30 min)
1. Update NixOS config:
   ```nix
   hardware.nvidia = {
     modesetting.enable = true;
     package = config.boot.kernelPackages.nvidiaPackages.latest;
   };
   services.xserver.videoDrivers = [ "nvidia" ];
   ```
2. `sudo nixos-rebuild switch`
3. Verify: `nvidia-smi` shows 5060 Ti, 16GB VRAM
4. Verify CUDA: `nvidia-smi -q | grep "CUDA Version"`

### Phase 3: Build Inference Binary (20 min)
```bash
cd /home/maczz/llama.cpp-latest
mkdir -p build-cuda && cd build-cuda
cmake .. -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=120
cmake --build . --config Release -j$(nproc)
```
If CUDA arch 120 is not recognized (Blackwell may need newer CUDA toolkit):
- Try `native` or `89` as fallback arch
- Or use Nix CUDA package if available for 26.05

### Phase 4: Deploy Model + Service (15 min)
1. Copy model if not already present:
   ```bash
   cp /home/maczz/models/Qwen3.5-35B-A3B-UD-Q4_K_M.gguf /home/maczz/models/
   ```
2. Create systemd service:
   ```ini
   [Unit]
   Description=Node D Heavy Reasoner (GPU)
   After=network.target

   [Service]
   Type=simple
   User=maczz
   ExecStart=/home/maczz/llama.cpp-latest/build-cuda/bin/llama-server \
       -m /home/maczz/models/Qwen3.5-35B-A3B-UD-Q4_K_M.gguf \
       --host 0.0.0.0 --port 8080 \
       --ctx-size 8192 --flash-attn on \
       --cache-type-k q4_0 --cache-type-v q4_0 \
       -ngl 99 -t 4 \
       --spec-type draft-mtp \
       --parallel 1 --metrics
   Restart=on-failure
   RestartSec=10

   [Install]
   WantedBy=multi-user.target
   ```
3. Enable: `sudo systemctl enable llama-heavy-reasoner`

### Phase 5: Benchmark (15 min)
```bash
# Prompt throughput
curl http://localhost:8080/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model":"qwen35-mtp","messages":[{"role":"user","content":"Explain quantum computing"}],"max_tokens":200}'

# Watch nvidia-smi during inference
nvidia-smi dmon -s pucvmet -d 1
```

## 6. EXPECTED PERFORMANCE

| Metric | CPU (current) | GPU (expected) | Speedup |
|--------|---------------|----------------|---------|
| Prompt t/s | 8.8 | 100-200+ | 12-23x |
| Gen t/s | 6.1 | 30-50+ | 5-8x |
| RAM usage | 21GB | ~2GB (offloaded) | 10x reduction |
| MTP boost | N/A (broken) | +1.3-1.5x if working | Additional |

Conservative estimate: 30+ t/s generation with MTP. Could hit 50+ if speculation acceptance is high.

## 7. RISKS

| Risk | Mitigation |
|------|-----------|
| OCuLink PCIe bandwidth bottleneck | Inference is compute-bound, not bandwidth-bound. 4x PCIe 4 = ~8GB/s, model loads once into VRAM |
| CUDA sm_120 not supported | Use latest CUDA toolkit or fallback to sm_89 compatible build |
| VRAM overflow with 35B MoE | Drop to UD-Q3_K_M or reduce ctx-size. 9B model as backup |
| ik_llama.cpp GCC 15 failure | Use stock llama.cpp. CUDA performance is similar for MoE |
| NixOS 26.05 NVIDIA driver issues | Pin to stable driver package. 26.05 is pre-release |
| Thermal throttling (OCuLink enclosure) | Monitor temps. OC model may need manual fan curve |

## 8. FALLBACK MODEL PLACEMENT

If 35B MoE does not fit or perform well on 16GB:
- **Option A:** Qwen3.5-9B-MTP Q4_K_M (~5.5GB) + Qwen3.5-4B-MTP Q4_K_M (~2.5GB) as draft model
- **Option B:** Qwen3.6-27B-MTP Q3_K_M (~12.5GB) -- tight but possible with small KV cache
- **Option C:** Keep 35B MoE on CPU, use GPU for smaller fast model

## 9. LITELLM ROUTE UPDATE

After deployment, update LiteLLM config on Node B:
```yaml
# mesh-heavy route -> Node D GPU (was CPU)
- model_name: mesh-heavy
  litellm_params:
    model: huggingface/Qwen3.5-35B-A3B-MTP
    api_base: http://100.120.225.12:8080/v1
    rpm: 10
```

---

::/5Y573M-N071C3 : NODE_D_GPU_UPGRADE_PLAN. OCULINK_TRUTH. // 50V3R31GN-M4CH1N4
