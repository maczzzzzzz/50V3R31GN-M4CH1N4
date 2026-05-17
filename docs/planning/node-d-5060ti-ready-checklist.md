# Node D RTX 5060 Ti OCuLink Ready Checklist (v0.5.0)

**Target:** When the card arrives, execute in <90 minutes with zero guesswork.
**Node:** D (Quaternary) — Meteor Lake + OCuLink
**Model:** Qwen3.5-35B-A3B-MTP UD-Q4_K_M
**Binary:** ik_llama.cpp (latest main with Qwen3.5 MTP fix)

---

## Pre-Arrival (do now)

1. Switch Node D flake input to nixos-unstable for CUDA 12.9
2. Add `cudaPackages_12_9` overlay in flake.nix
3. Prepare ik_llama.cpp derivation with:
   - `-DCMAKE_CUDA_ARCHITECTURES=120a;121a`
   - GCC 14 + CUDA 12.9 (or GCC 13 + CUDA 12.8)
   - `-DGGML_NATIVE=OFF` (OCuLink safe)
4. Confirm OCuLink port works (lspci test with dummy card if available)

---

## Day 0: Hardware + Software (single session)

### 1. Physical Install (10 min)
```bash
# Power off, install 5060 Ti in OCuLink enclosure
# Connect OCuLink cable BEFORE powering on
sudo reboot
lspci | grep -i nvidia   # should show GA206 / GB206
nvidia-smi               # 16GB VRAM visible
```

### 2. NixOS NVIDIA + CUDA 12.9 (15 min)
Update `nix/hosts/node-d/default.nix`:
```nix
hardware.nvidia = {
  modesetting.enable = true;
  package = config.boot.kernelPackages.nvidiaPackages.latest; # 595+
};
services.xserver.videoDrivers = ["nvidia"];
```

```bash
sudo nixos-rebuild switch --impure
nvidia-smi -q | grep "CUDA Version"   # must be 12.8+
```

### 3. Build ik_llama.cpp (20 min)
```bash
cd ~/llama.cpp
git checkout main && git pull
git checkout 0ab9bdf7   # Qwen3.5 MTP fix commit

cmake -B build-cuda \
  -DGGML_CUDA=ON \
  -DGGML_NATIVE=OFF \
  -DCMAKE_CUDA_ARCHITECTURES="120a;121a" \
  -DGGML_AVX2=ON -DGGML_FMA=ON \
  -DCMAKE_BUILD_TYPE=Release

cmake --build build-cuda -j$(nproc)
```

Verify:
```bash
./build-cuda/bin/llama-server --help | grep -E "mtp|spec"
```

### 4. Deploy Model + Service (10 min)
```bash
# Model already at ~/models/Qwen3.5-35B-A3B-MTP-UD-Q4_K_M.gguf
sudo tee /etc/systemd/system/llama-heavy.service > /dev/null <<EOF
[Unit]
Description=Node D Heavy Reasoner (RTX 5060 Ti)
After=network.target

[Service]
Type=simple
User=maczz
ExecStart=/home/maczz/llama.cpp/build-cuda/bin/llama-server \
  -m /home/maczz/models/Qwen3.5-35B-A3B-MTP-UD-Q4_K_M.gguf \
  --host 0.0.0.0 --port 8080 \
  --ctx-size 16384 --flash-attn on \
  --cache-type-k q8_0 --cache-type-v q8_0 \
  -ngl 99 -t 8 -b 2048 \
  -mtp --draft-max 5 --spec-autotune \
  --metrics
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now llama-heavy
```

### 5. Verify Mesh Route (5 min)
From Node B:
```bash
curl -s -H "Authorization: Bearer sk-sovmesh-proxy-9f3k2p8q" \
  http://localhost:4000/v1/models | grep mesh-heavy
```

Expected: `mesh-heavy` now points to GPU-accelerated Qwen3.5-35B.

---

## Expected Post-Upgrade Numbers (to be measured)

| Metric              | CPU (current) | GPU (target) | Notes                     |
|---------------------|---------------|--------------|---------------------------|
| Prompt t/s          | 12.7          | 140-220      | -ngl 99                   |
| Gen t/s             | 7.0           | 38-55        | Base                      |
| Gen t/s + MTP       | N/A (broken)  | 48-70        | 5 draft, high acceptance  |
| VRAM usage          | N/A           | ~13.8 GB     | 35B MoE + 16k ctx         |

---

## Rollback

If OCuLink is unstable:
- Keep CPU binary on port 8080
- Run GPU binary on port 8081
- Update LiteLLM route to prefer 8081 only for heavy tasks

---

**Status:** Ready to execute the moment the card is in hand. All research validated against current ik_llama.cpp main and nixos-unstable CUDA 12.9.

Next: Task 2 — Vision latency benchmark.