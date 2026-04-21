# ◈ HOW_TO : SETUP_SOVEREIGN_TRINITY // THE_3-NODE_MESH
**Sector:** /00_system_setup/
**Version:** 3.2.21
**Status:** CANONICAL // ARCHITECT_LOCK

This guide defines the physical and network configuration required to shore the **Sovereign Trinity** cognitive mesh.

---

## 🏗️ 1. HARDWARE TOPOLOGY
The Trinity is sharded across three physical pods to protect the VRAM ceiling and ensure disaggregated reasoning.

### ◈ NODE A (THE SYNAPSE)
- **HW:** NVIDIA GTX 1050 Ti (4GB).
- **Role:** **Mooncake Master**. Handles long-context KV-cache offloading.
- **Service:** Starts on Port 6789.

### ◈ NODE B (THE DIRECTOR)
- **HW:** AMD Radeon RX 9060 XT (16GB).
- **Role:** **Narrative Heart // TOTAL SIGHT**. High-fidelity scene orchestration.
- **Service:** Runs OBLITERATED Q8_0 + mmproj-f16 Vision.

### ◈ NODE C (THE ORACLE)
- **HW:** NVIDIA RTX 2060 (6GB) + **500GB SSD (`/mnt/vocal_soul`)**.
- **Role:** **TOTAL LOGIC**. Rule arbitration and Vocal Artery.
- **Service:** Runs Polymorphic mind (Q5/Q4/Q3) + OMI Mesh.

## 📡 2. NETWORK CONFIGURATION
The pods must be synchronized over the **Archer Basement Spine**.
- **Subnet:** 10.0.0.x
- **Gateway:** 10.0.0.1
- **Latency:** Must be sub-0.5ms to maintain ACT loop fidelity.

## ⚡ 3. IGNITION SEQUENCE
1. **Node A:** `npm run synapse:ignite`.
2. **Node C:** Start host-native Llama.cpp + `npm run oracle:ignite`.
3. **Node B:** `npm run director:ignite`.
4. **Vocal:** Connect Machina Terminal to Node C.

---
**::/5Y573M-N071C3 : TRINITY_GROUNDED. THE_HISTORY_IS_OURS. // 50V3R31GN-M4CH1N4**
