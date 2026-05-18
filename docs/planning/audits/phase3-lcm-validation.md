# Phase 3 Memory Validation Gate (Hermes-LCM)

**Status:** REQUIRED BEFORE IMPLEMENTATION  
**Date:** 2026-05-20  
**Owner:** Lead Architect

## Mandatory Validation Criteria

### 1. Local Vendoring Verified
- [ ] Hermes-LCM source lives in `sidecars/hermes-lcm/`
- [ ] No runtime dependency on external git clone
- [ ] Plugin loads via local path in Hermes config

### 2. Path Consistency
- [ ] All references use `/mnt/sovereign-soul` (hyphen)
- [ ] Node C fstab and mounts match current AGENTS.md

### 3. Hardware Fit
- [ ] LCM SQLite DB fits on Node A (16GB RAM)
- [ ] Sync to Node C SSD adds <5% CPU overhead under load
- [ ] No impact on active inference (Node B Vulkan, Node C CUDA)

### 4. Hermes Integration Test
- [ ] `hermes plugins` shows hermes-lcm
- [ ] Basic context compression works in fresh session
- [ ] Cross-node sync test passes (Node A <-> Node C)

### 5. Prove-First Benchmark
- [ ] Measure context compression latency (target <50ms per turn)
- [ ] Measure retrieval quality vs native session_search
- [ ] Document KV / RAM usage delta

**Gate:** All items above must pass before any production deployment of Hermes-LCM.

**Next after gate:** Update IMPLEMENTATION_PLAN.md and activate P3-T1.