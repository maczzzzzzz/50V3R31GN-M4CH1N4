# Phase 22: The Sovereign Highway Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a distributed `claw-code` Rust harness for sub-1ms state synchronization between Node A (Rules) and Node B (Director).

**Architecture:** Split-node distributed runtime using Binary UDP + Synapse-Mapped Files (Mmap) for the Virtual System Bus (VSB). Node B handles Narrative Intent (12B), while Node A enforces Mechanical Reality (1B + Rules).

**Tech Stack:** Rust (Tokio), `shared_memory` crate, UDP, Nix (Bubblewrap).

---

### Task 1: Virtual System Bus (VSB) Shared Synapse Scaffold (Node A/B)

**Files:**
- Create: `zeroclaw/src/vsb/mmap.rs`
- Create: `src/core/vsb-bridge.rs` (Node B Rust Mesh)
- Test: `zeroclaw/tests/vsb_mmap_test.rs`

**Step 1: Write the failing test**

```rust
#[cfg(test)]
mod tests {
    use zeroclaw::vsb::mmap::SovereignBuffer;

    #[test]
    fn test_mmap_sync_between_processes() {
        let mut buffer = SovereignBuffer::new("vsb_test", 1024).unwrap();
        buffer.write(0, &[1, 3, 3, 7]).unwrap();
        
        let reader = SovereignBuffer::open("vsb_test").unwrap();
        let data = reader.read(0, 4).unwrap();
        assert_eq!(data, vec![1, 3, 3, 7]);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `cargo test --test vsb_mmap_test` (in `zeroclaw`)
Expected: FAIL with "module mmap not found"

**Step 3: Write minimal implementation**

```rust
// zeroclaw/src/vsb/mmap.rs
use shared_memory::*;

pub struct SovereignBuffer {
    shmem: Shmem,
}

impl SovereignBuffer {
    pub fn new(flink: &str, size: usize) -> Result<Self, ShmemError> {
        let shmem = ShmemConf::new().size(size).os_id(flink).create()?;
        Ok(Self { shmem })
    }

    pub fn open(flink: &str) -> Result<Self, ShmemError> {
        let shmem = ShmemConf::new().os_id(flink).open()?;
        Ok(Self { shmem })
    }

    pub fn write(&mut self, offset: usize, data: &[u8]) -> Result<(), ShmemError> {
        let ptr = self.shmem.as_ptr();
        unsafe {
            std::ptr::copy_nonoverlapping(data.as_ptr(), ptr.add(offset), data.len());
        }
        Ok(())
    }

    pub fn read(&self, offset: usize, len: usize) -> Result<Vec<u8>, ShmemError> {
        let ptr = self.shmem.as_ptr();
        let mut buf = vec![0u8; len];
        unsafe {
            std::ptr::copy_nonoverlapping(ptr.add(offset), buf.as_mut_ptr(), len);
        }
        Ok(buf)
    }
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test --test vsb_mmap_test`
Expected: PASS

**Step 5: Commit**

```bash
git add zeroclaw/src/vsb/mmap.rs zeroclaw/tests/vsb_mmap_test.rs
git commit -m "feat(vsb): implement shared memory buffer for Sovereign Highway"
```

---

### Task 2: Binary UDP Intent Dispatcher (Node B)

**Files:**
- Create: `src/core/vsb-udp.rs`
- Test: `tests/core/vsb_udp_test.ts` (Mocking Rust UDP)

**Step 1: Write the failing test**

```typescript
import { describe, it, expect } from 'vitest';
// Test that Node B can serialize an Intent and send it via UDP
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/core/vsb_udp_test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```rust
// src/core/vsb-udp.rs (Node B Rust side)
use tokio::net::UdpSocket;

pub async fn dispatch_intent(addr: &str, intent_id: u32, payload: &[u8]) -> std::io::Result<()> {
    let socket = UdpSocket::bind("0.0.0.0:0").await?;
    let mut packet = vec![];
    packet.extend_from_slice(&intent_id.to_le_bytes());
    packet.extend_from_slice(payload);
    socket.send_to(&packet, addr).await?;
    Ok(())
}
```

**Step 4: Run test to verify it passes**

Run: `cargo test` (or vitest equivalent)
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/vsb-udp.rs
git commit -m "feat(vsb): implement binary UDP intent dispatcher for Node B"
```

---

### Task 3: Sovereign Loop Integration (Node A/B)

**Files:**
- Modify: `zeroclaw/src/main.rs`
- Modify: `src/main.ts`

**Step 1: Write the failing test**

```typescript
// Test the full end-to-end loop: Intent -> Mechanical Rules -> Result
```

**Step 2: Run test to verify it fails**

Run: `npx vitest tests/integration/sovereign_loop.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

[Detailed code for integrating the VSB into the main loops of zeroclaw and director-rs]

**Step 4: Run test to verify it passes**

Run: `npx vitest tests/integration/sovereign_loop.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git commit -m "feat(sovereign): implement full end-to-end Sovereign Loop"
```


---
**LINKS:** [[OS_CORE]]
