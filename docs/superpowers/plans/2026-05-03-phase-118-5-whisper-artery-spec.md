# Phase 118.5: The Sovereign Whisper Artery (STT-MCP)

**Goal:** Materialize a high-performance, hardware-accelerated Speech-to-Text (STT) artery that integrates with the Hermes-Agent Clinical Fork via the Model Context Protocol (MCP).

**Architecture:** A decoupled Rust-based MCP Sidecar that consumes PCM-16 audio from the VSB (Virtual Sovereign Bus) and provides transcription resources to the Hermes Harness.

---

### ◈ 1. THE ARTERY TOPOLOGY

| Component | Logic | Hardware | Artery |
| :--- | :--- | :--- | :--- |
| **Collector** | VSB UDP Sink (Port 7878) | Node C/D | Binary PCM-16 |
| **Inference** | Candle-Whisper (Rust) / OpenVINO | Node C (GPU) / Node D (NPU) | Tensor Ops |
| **Interface** | MCP Server (JSON-RPC) | Stdout/SSE | Intent Logic |

---

### ◈ 2. IMPLEMENTATION STEPS

- [ ] **Step 1: Scaffold `crates/sovereign-whisper-mcp`**
Initialize a new Rust project using `candle-transformers` and `mcp-sdk-rs`.
```bash
cargo new crates/sovereign-whisper-mcp
```

- [ ] **Step 2: Implement VSB Audio Ingestor**
Create a UDP listener that captures chunks from the VSB and maintains a rolling 30s ring buffer.

- [ ] **Step 3: Integrate Whisper-Large-v3-Turbo (Candle)**
Load the `safetensors` model weights and implement the `transcribe` function. Use **Node C (CUDA)** for primary command transcription.

- [ ] **Step 4: Expose MCP Resources & Tools**
  - **Resource:** `whisper://live-transcript` (Stream of partials)
  - **Tool:** `transcribe_buffer(seconds: int)` (Block transcription)

- [ ] **Step 5: OMI Port (Node D / NPU)**
Implement an alternative execution path using **OpenVINO** to utilize the Intel NPU for background ambient transcription.

---

### ◈ 3. HERMES FORK INTEGRATION

- [ ] **Step 6: Register Whisper-MCP in Hermes Harness**
Update `sidecars/hermes-agent-nous/cli-config.yaml` to include the new MCP server.
```yaml
mcp_servers:
  whisper:
    command: "nix develop --command cargo run --release --bin sovereign-whisper-mcp"
```

- [ ] **Step 7: Re-wire 'voice_mode' to Sovereign Artery**
Modify the Python core to prioritize the MCP `whisper://live-transcript` over the default internal `faster-whisper` loop.

---

### ◈ 4. VERIFICATION (THE GAUNTLET)

- [ ] **Verification 1:** Run `cargo test` on the Whisper encoder.
- [ ] **Verification 2:** Verify sub-200ms transcription latency on Node C.
- [ ] **Verification 3:** Confirm VSB-to-MCP data flow via `mcp-inspector`.

---
**::/5Y573M-N071C3 : WHISPER_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
