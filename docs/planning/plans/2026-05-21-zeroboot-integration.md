# P5-T1: Zeroboot Integration Plan

**Status:** TODO | **Priority:** 10 | **Updated:** 2026-05-21

---

## Overview

Integrate upstream [zerobootdev/zeroboot](https://github.com/zerobootdev/zeroboot) for sub-millisecond agent sandbox isolation via copy-on-write KVM forking.

---

## Upstream Capabilities

| Metric | Value |
|--------|-------|
| Spawn latency p50 | 0.79ms |
| Spawn latency p99 | 1.74ms |
| Memory per sandbox | ~265KB |
| Fork + exec (Python) | ~8ms |
| 1000 concurrent forks | 815ms |

**Architecture:**
```
Firecracker snapshot → mmap(MAP_PRIVATE) → KVM VM + restored CPU state
```

Each sandbox is a real KVM VM with hardware-enforced memory isolation via Intel VT-x/AMD-V.

---

## Deployment Target

**Node D (Quaternary):**
- Intel Core Ultra Meteor Lake (VT-x supported)
- 48GB DDR5
- Already runs mesh-heavy inference
- KVM access required

**Alternative:** Node C (RTX 2060, 32GB DDR4, NixOS with KVM)

---

## Integration Steps

### Phase 1: Self-Host Setup (Node D)
1. Verify KVM access: `ls -la /dev/kvm`
2. Clone zerobootdev/zeroboot
3. Build Rust binary: `cargo build --release`
4. Create Python template with Hermes tool dependencies
5. Generate snapshot: `./target/release/zeroboot template create`

### Phase 2: API Deployment
1. Deploy API server on port 8768 (non-conflicting)
2. Configure auth via Hermes secret pool
3. Test fork latency: `curl -X POST localhost:8768/v1/exec -d '{"code":"print(1+1)"}'`

### Phase 3: Mesh Integration
1. Add `mesh-sandbox` route to LiteLLM config (optional)
2. Hermes plugin for sandbox orchestration
3. SCION isolation for inter-node communication (optional layer)

---

## SCION Integration

Upstream Zeroboot has no networking inside sandboxes (serial I/O only). SCION [GoogleCloudPlatform/scion](https://github.com/GoogleCloudPlatform/scion) provides path-aware networking for:

- Inter-node mesh communication
- Cryptographic authentication between agent sandboxes
- Path-level DDoS mitigation

**Scope:** SCION wraps the Zeroboot host, not individual sandboxes. Deploy as a separate mesh layer on Node D.

---

## Known Limitations (Upstream)

1. CSPRNG state shared from snapshot → userspace PRNGs need reseeding
2. Single vCPU per fork (multi-vCPU not implemented)
3. No networking inside forks (serial I/O only)
4. Template updates require full re-snapshot (~15s)

---

## Local Prototype Status

`crates/modules/zeroboot-isolation/` is a naive Firecracker wrapper without CoW forking. **Archived** — upstream implementation is fundamentally faster.

---

## References

- [Zeroboot GitHub](https://github.com/zerobootdev/zeroboot)
- [Zeroboot Architecture](https://github.com/zerobootdev/zeroboot/blob/main/docs/ARCHITECTURE.md)
- [SCION GCP Fork](https://github.com/GoogleCloudPlatform/scion)
- [Firecracker Snapshot Guide](https://github.com/firecracker-microvm/firecracker/blob/main/docs/snapshotting/random-for-clones.md)

---

Sovereign Machina v0.3.13-alpha // 50V3R31GN-M4CH1N4
