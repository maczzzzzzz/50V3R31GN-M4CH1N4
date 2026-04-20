# OpenMythos RDT Integration (Rust-Native) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deploy a high-performance Recurrent-Depth Transformer (RDT) engine on Node C using Rust and `candle-rs`, replacing the Python-based OpenMythos prototype.

**Architecture:** The RDT engine is implemented as a Rust binary on Node C. It utilizes `sovereign-sdk` for VSB communication and `candle-core` for CUDA-accelerated tensor operations. KV-cache shards are offloaded to Node A via Mooncake.

**Tech Stack:** Rust 1.75+, `candle-core`, `candle-nn`, `sovereign-sdk`, Mooncake (Go/C++ Mesh).

---

### Task 1: Environment Integration (Node C)

**Files:**
- Create: `crush/harness/experimental/rdt-oracle/Cargo.toml`
- Create: `crush/harness/experimental/rdt-oracle/src/main.rs`

- [ ] **Step 1: Initialize Rust Project on Node C**
  - SSH into `maczz@10.0.0.12`
  - Run: `cd ~/50V3R31GN-M4CH1N4/crush/harness/experimental && cargo new rdt-oracle`

- [ ] **Step 2: Define Dependencies in Cargo.toml**

```toml
[package]
name = "rdt-oracle"
version = "3.2.19"
edition = "2021"

[dependencies]
candle-core = "0.3.0"
candle-nn = "0.3.0"
sovereign-sdk = { path = "../../../../sovereign-sdk" }
tokio = { version = "1.0", features = ["full"] }
anyhow = "1.0"
```

- [ ] **Step 3: Commit**
  ```bash
  git add crush/harness/experimental/rdt-oracle/
  git commit -m "infra: initialize Rust-native RDT Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle project on Node C"
  ```

---

### Task 2: RDT Core Implementation (Rust/Candle)

**Files:**
- Create: `crush/harness/experimental/rdt-oracle/src/model.rs`
- Create: `crush/harness/experimental/rdt-oracle/src/recurrent.rs`

- [ ] **Step 1: Port 'RecurrentBlock' to Rust**
  - Implement the looped transformer block using `candle-nn`.
  - Integrate sinusoidal `loop_index_embedding`.

- [ ] **Step 2: Port 'ACTHalting' and 'Remainder Trick'**
  - Implement the Graves (2016) halting probability logic in Rust.

- [ ] **Step 3: Implement VSB Listener via 'sovereign-sdk'**

```rust
use sovereign_sdk::protocol::{IntentPacket, from_bytes};
use tokio::net::UdpSocket;

async fn listen_vsb() -> anyhow::Result<()> {
    let socket = UdpSocket::bind("0.0.0.0:7878").await?;
    let mut buf = [0u8; 1024];
    loop {
        let (len, _addr) = socket.recv_from(&mut buf).await?;
        if let Some(pkt) = unsafe { from_bytes::<IntentPacket>(&buf[..len]) } {
            if pkt.header.is_valid() {
                // Trigger RDT Loop
            }
        }
    }
}
```

---

### Task 3: Multi-Latent Attention (MLA) Integration

**Files:**
- Create: `crush/harness/experimental/rdt-oracle/src/attention.rs`

- [ ] **Step 1: Implement DeepSeek-style MLA in Candle**
  - Implement low-rank KV compression to satisfy the 6GB VRAM limit on Node C.

- [ ] **Step 2: Verify CUDA Acceleration**
  - Run: `cargo run --release --features cuda`
  - Expected: Model initializes on RTX 2060 and performs dummy inference.

- [ ] **Step 3: Commit**
  ```bash
  git add crush/harness/experimental/rdt-oracle/
  git commit -m "feat(oracle): implement Rust-native RDT core with ACT and MLA"
  ```
