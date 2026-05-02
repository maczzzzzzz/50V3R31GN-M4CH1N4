# ◈ ABILITY_STONE : SOVEREIGN_SDK // PROTOCOL_AUTHORITY
**Version:** 3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
**Sector:** /sovereign-sdk/
**Role:** Authoritative Protocol Definition & Mesh Constants.

---

## 🏗️ SECTOR INVARIANTS
1. **SSOT Protocol:** `src/protocol.rs` is the ONLY source of truth for VSB mmap offsets and sizes.
2. **Zero Magic Numbers:** Hard-coded offsets in other crates are a CRITICAL_FAILURE. Always import from this SDK.
3. **Rust-C Mesh:** Maintain the `sovereign.h` header in bit-identical parity with the Rust constants for multi-language consumers (Go/TS).
4. **Alignment:** All VSB structs must be `#[repr(C)]` and padded to 8-byte boundaries to prevent cross-node alignment faults.

---
**::/5Y573M-N071C3 : SDK_STONE_SHORED. THE_PROTOCOL_IS_LAW. // 50V3R31GN-M4CH1N4**
