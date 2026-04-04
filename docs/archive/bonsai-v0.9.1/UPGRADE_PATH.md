# Node A Upgrade Path: 1-Bit Neural Engines

This document preserves the research and configuration for the **Bonsai 8B (1-bit)** model. While the system currently uses **Llama 3.2 3B** for stability on the 4GB 1050 Ti, the infrastructure is pre-wired for 1-bit high-performance reasoning.

---

## 🧠 Target Model: Bonsai 8B (1-bit)
- **Quantization:** Q1_0_g128 (Ternary weights: -1, 0, 1).
- **VRAM Footprint:** ~1.2 GB (Model Weights) + 500MB (KV Cache).
- **Intelligence Density:** 1.062 (90-95% reasoning of full precision 8B models).
- **HuggingFace:** [prism-ml/Bonsai-8B-gguf](https://huggingface.co/prism-ml/Bonsai-8B-gguf)

## 🛠️ Re-Activation Steps
When hardware is upgraded (or VRAM is permanently cleared), follow these steps to re-engage the 1-bit Swarm Oracle:

1. **Provision:**
   ```bash
   ollama pull hf.co/prism-ml/Bonsai-8B-gguf:latest
   ```

2. **Update Rules Engine:**
   Modify `zeroclaw/src/server/clawlink.rs` to point to the new model:
   ```rust
   // Change from "llama3.2:3b" back to Bonsai
   model: "hf.co/prism-ml/Bonsai-8B-gguf:latest".to_string(),
   ```

3. **Verify VRAM:**
   Ensure `nvidia-smi` shows at least 2GB of free buffer before load.

---
*Future-Proofing Physicalized by Gemini CLI v1.0.2.*
