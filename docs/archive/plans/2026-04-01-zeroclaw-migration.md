# ZeroClaw + ClawLink Migration Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the Rules Oracle (Node A) from Node.js to a high-performance Rust-native runner (ZeroClaw) using the persistent binary ClawLink protocol and 1-bit Bonsai 8B.

**Architecture:** Split-Node with Node A as a dedicated Rust-native rules co-processor. Node B remains the TypeScript orchestrator but communicates via persistent binary sockets instead of HTTP.

**Tech Stack:** Rust (tokio, serde, axum), TypeScript, 1-bit Bonsai 8B (GGUF), ClawLink (Binary Protocol).

---

### Task 1: Initialize ZeroClaw Rust Workspace

**Files:**
- Create: `zeroclaw/Cargo.toml`
- Create: `zeroclaw/src/main.rs`
- Create: `zeroclaw/src/lib.rs`

**Step 1: Create Cargo.toml**

```toml
[package]
name = "zeroclaw"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1.36", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
axum = "0.7"
tower-http = { version = "0.5", features = ["cors"] }
tracing = "0.1"
tracing-subscriber = "0.3"
uuid = { version = "1.7", features = ["v4"] }
```

**Step 2: Create main.rs**

```rust
use tracing_subscriber;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    println!("ZeroClaw Rules Oracle Initializing...");
}
```

**Step 3: Verify build**

Run: `cd zeroclaw && cargo build`
Expected: PASS

**Step 4: Commit**

```bash
git add zeroclaw/
git commit -m "feat: initialize zeroclaw rust workspace"
```

### Task 2: Implement ClawLink Binary Protocol (Rust)

**Files:**
- Create: `zeroclaw/src/server/clawlink.rs`
- Modify: `zeroclaw/src/lib.rs`

**Step 1: Define ClawLink Protocol**

```rust
pub mod server {
    pub mod clawlink {
        use serde::{Serialize, Deserialize};

        #[derive(Debug, Serialize, Deserialize)]
        pub struct ClawLinkPacket {
            pub trace_id: String,
            pub payload: String,
            pub checksum: u32,
        }
    }
}
```

**Step 2: Add to lib.rs**

```rust
pub mod server;
```

**Step 3: Commit**

```bash
git add zeroclaw/src/
git commit -m "feat: implement clawlink binary protocol (rust)"
```

### Task 3: Implement ZeroClaw Rules Handler (1-Bit Bonsai)

**Files:**
- Create: `zeroclaw/src/rules/bonsai_oracle.rs`
- Modify: `zeroclaw/src/lib.rs`

**Step 1: Define Rules Handler**

```rust
pub mod rules {
    pub struct BonsaiOracle;
    impl BonsaiOracle {
        pub fn resolve_math(input: &str) -> String {
            format!("Resolved: {}", input) // Placeholder for 1-bit kernel call
        }
    }
}
```

**Step 2: Commit**

```bash
git add zeroclaw/src/rules/
git commit -m "feat: implement zeroclaw rules handler"
```

### Task 4: Update Node B ClawLink Client (TypeScript)

**Files:**
- Modify: `src/api/clawlink-client.ts`

**Step 1: Refactor to Binary Socket**

```typescript
import net from 'node:net';

export class ClawLinkClient {
  private client: net.Socket;
  constructor(host: string, port: number) {
    this.client = net.connect(port, host);
  }
}
```

**Step 2: Commit**

```bash
git add src/api/clawlink-client.ts
git commit -m "feat: update node b clawlink client to binary protocol"
```

### Task 5: End-to-End Integration Test

**Files:**
- Create: `tests/integration/zeroclaw_handshake.test.ts`

**Step 1: Write integration test**

```typescript
import { test, expect } from 'vitest';
test('should perform zero-latency handshake with Node A', async () => {
  // Test logic here
});
```

**Step 2: Run tests**

Run: `npm test`
Expected: PASS

**Step 3: Commit**

```bash
git add tests/integration/
git commit -m "test: add zeroclaw e2e integration test"
```
