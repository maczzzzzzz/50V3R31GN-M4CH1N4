# Research Report: P2-T3 Context Spillover (KV-Cache Offload via RPC)

## Executive Summary
**Status: Not Feasible for "KV-Cache Only" offloading. Partially feasible for Pipeline Parallelism but highly discouraged due to Tailscale latency and hardware mismatch.**

Using `llama.cpp`'s RPC backend to offload *only* the KV cache from Node D (Quaternary, 48GB RAM) to Node A (Synapse, 16GB RAM, GTX 1050 Ti) over Tailscale is architecturally unsupported. In `llama.cpp`, the KV cache is inextricably tied to the model layers; a node must compute the layer to store its KV cache. While we *could* offload a subset of the 35B model's layers to Node A to utilize its RAM, the severe compute mismatch and Tailscale network latency (~1-5ms per hop per layer) would introduce catastrophic pipeline bubbles, rendering inference unusably slow compared to keeping it local on Node D.

We strongly recommend keeping the KV cache entirely local on Node D and utilizing its 48GB DDR5 RAM, or using disk-based prompt caching if long-term state persistence is required across the mesh.

---

## Technical Findings

### 1. Does llama.cpp or ik_llama.cpp support RPC-based KV-cache offloading to a remote node? What is the `--rpc` flag?
`llama.cpp` (and by extension `ik_llama.cpp`) supports an RPC backend, enabled at compile time (`-DGGML_RPC=ON`). The `--rpc <ip:port>` flag allows a master node to delegate the execution of specific model layers to remote worker nodes running `rpc-server`. 

However, it **does not support KV-cache-only offloading**. When you offload over RPC, `llama.cpp` automatically distributes the model's layers and the KV cache proportionally based on available memory. The remote node must hold the weights for its assigned layers, compute the attention/feed-forward passes for those layers, and store the resulting KV cache. You cannot compute a layer on Node D and simply "park" the KV data on Node A.

### 2. Current State of llama.cpp RPC (As of May 2026)
The RPC backend is stable for its intended use case: pipeline parallelism across homogeneous local networks (e.g., aggregating VRAM across multiple machines on a 10Gbps+ or RDMA network). It currently supports layer-aware memory distribution (preventing OOMs on smaller GPUs like Node A's 4GB GTX 1050 Ti). However, it remains highly sensitive to network bandwidth because intermediate tensor activations must be transmitted back and forth across the network for every single token generated.

### 3. Node A as a Remote KV-Cache Target & Latency Implications
Node A has 16GB of system RAM and a 4GB GTX 1050 Ti. While it has enough RAM to hold a portion of the cache, using it as an RPC worker over Tailscale is a severe anti-pattern for our topology:
*   **Compute Mismatch:** Node D (Meteor Lake, DDR5) is vastly faster than Node A (older CPU / GTX 1050 Ti). Forcing Node D to wait for Node A to compute its assigned layers would create a massive bottleneck.
*   **Tailscale Latency:** Tailscale (WireGuard) introduces ~1-5ms of latency. In pipeline parallelism, activations are sent over the network. If Node A computes even one block of layers, every token generation requires a round-trip over Tailscale. Generating 100 tokens would incur 100-500ms of pure network wait time, destroying tokens-per-second (TPS) throughput.

### 4. Alternative Approaches
*   **Local RAM Spillover (Recommended):** Node D has 48GB of DDR5. The Qwen3.5-35B quantized model requires ~22.6GB. A 32K context KV cache requires ~8GB. Node D can comfortably run this model and host the KV cache locally in its own RAM without network overhead.
*   **Prompt Caching (`--prompt-cache`):** If the goal is "state persistence" across sessions, use `llama.cpp`'s native prompt caching. Node D can save the conversation state to a `.bin` file. This file could be synced or backed up to Node A asynchronously, allowing Node D to resume a session without recalculating the prompt, without adding per-token network latency.
*   **Context Shift:** Utilize `llama.cpp`'s native context shifting (rolling KV cache) to keep memory usage bounded indefinitely during long conversations.

### 5. Build Flags and Configuration (If forced to proceed)
If we were to attempt this despite the warnings, the setup requires:
*   **Build:** Compile both nodes with `-DGGML_RPC=ON`. (Node A might use `-DGGML_CUDA=ON`, Node D might use standard AVX/OpenVINO).
*   **Node A (Worker):** `./rpc-server --host 0.0.0.0 --port 50052`
*   **Node D (Master):** `./llama-cli -m model.gguf --rpc 100.96.253.114:50052 ...`

### 6. Memory Requirements for Qwen3.5-35B KV Cache
*   **Formula:** ~0.25 MB per token (assuming typical 35B architecture: 64 layers, 8 KV heads, 128 head dim, FP16).
*   **8K Context:** ~2.0 GB
*   **32K Context:** ~8.0 GB
Node A's 16GB RAM is perfectly capable of holding this size. However, to host 10% of the KV cache over RPC, Node A must also host 10% of the model weights (~2.26GB). This fits within Node A's 4GB VRAM or 16GB RAM, but again, the network and compute latency make it impractical.

---

## Local Codebase Context (`sidecars/hermes-agent-nous/`)
An audit of `sidecars/hermes-agent-nous/` confirms that while "RPC" is heavily used in the project, it refers entirely to JSON-RPC over stdio/HTTP for the UI (Ink TUI gateway), Signal CLI integrations, and the Python `execute_code` tool sandboxing. There are **no existing distributed inference bindings** or `llama.cpp` RPC integrations present in the `hermes-agent-nous` sidecar logic.

---

## Recommendation & Next Steps
**Do not proceed with P2-T3 as currently defined.**
1. **Abandon** the `llama.cpp` RPC KV-cache spillover approach over Tailscale. 
2. **Pivot** Node A's "state persistence" role to handle asynchronous synchronization of `llama.cpp` prompt cache files (`--prompt-cache`) instead of live memory offloading.
3. **Configure** Node D to rely exclusively on its local 48GB DDR5 for both weights and KV cache.