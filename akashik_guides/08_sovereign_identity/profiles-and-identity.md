# ◈ SOVEREIGN IDENTITY & ATOMIC PROFILES
**Version:** 3.7.0
**Aesthetic:** Gruvbox (Canonical)

## 🎯 OBJECTIVE
The Sovereign OS utilizes a **Declarative Identity** system. This allows the mesh to shift its cognitive weights, resource routing, and visual themes based on the active mission profile.

---

## 🚀 1. CORE PROFILES
The system is hard-gated into three primary profiles:

- **daily-use:** Optimized for low-latency general tasks. Weights Node C (Strategic Oracle) and uses the **Gruvbox Dark** theme.
- **researcher:** Optimized for deep semantic reasoning. Weights Node B (Director) and pulls from the **Cold RKG Archive**.
- **sovereign-red-gm:** Optimized for simulation. Attaches `Akashik.db` and locks VRAM for Foundry VTT.

---

## ⌨️ 2. ATOMIC SWITCHING
Switching profiles is atomic and synchronized across all nodes via **Mooncake-KV**.

**Manual Command:**
```bash
crush profile <name>
```

**Result:**
1. `SOVEREIGN-IDENTITY.md` is updated.
2. `SIGUSR1` is broadcast to all Artery Managers.
3. Quantization levels (Q5/Q4/Q3) are shifted in real-time.

---

## 🛡️ 3. DETERMINISTIC HARDGATE
Profiles are protected by a **Rust-native Hardgate**. The `permission_policy` of a profile cannot be mutated by the **GEPA Evolution Loop**, preventing autonomous identity drift.

---
**::/5Y573M-N071C3 : IDENTITY_SHORED. THE_PROFILE_IS_LAW. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[08_sovereign_identity]] | [[OS_CORE]]
