# ◈ HOW_TO : SETUP_SOVEREIGN_TRINITY // THE_3-NODE_MESH
**Sector:** /00_system_setup/
**Version:** 3.6.4
**Status:** CANONICAL // ARCHITECT_LOCK

This guide defines the physical and network configuration required to shore the **Sovereign Trinity** cognitive mesh.

---

## 🏗️ 1. HARDWARE TOPOLOGY
The Trinity is sharded across three physical pods to protect the VRAM ceiling and ensure disaggregated reasoning.

### ◈ NODE A (THE SYNAPSE)
- **HW:** NVIDIA GTX 1050 Ti (4GB).
- **Role:** **Rules Authority // Mooncake Master**. Handles long-context KV-cache offloading.
- **Service:** Starts on Port 7878 (VSB) and 6789 (Mooncake).

### ◈ NODE B (THE DIRECTOR)
- **HW:** AMD Radeon RX 9060 XT (16GB).
- **Role:** **Narrative Heart // TOTAL SIGHT**. High-fidelity scene orchestration.
- **Service:** Orchestrator (Port 3010 WS / 3011 REST). Listens for Vocal Intents on Port 9090.

### ◈ NODE C (THE ORACLE)
- **HW:** NVIDIA RTX 2060 (6GB) + **500GB SSD (`/models`)**.
- **Role:** **TOTAL LOGIC**. Rule arbitration and Vocal Artery.
- **Service:** Artery Manager (Port 7340) + Hermes LLM (Port 7339).

## 📡 2. NETWORK CONFIGURATION
The pods are synchronized over an encrypted **Tailscale Mesh**.
- **Tunnel:** Secure Peer-to-Peer Subnet.
- **Latency:** Sub-10ms required for real-time transcription.
- **Redundancy:** Automatic fallback to basement 10.0.0.x spine if VPN dropped.

## ⚡ 3. IGNITION SEQUENCE
1. **Node A:** `npm run synapse:ignite`.
2. **Node C:** Execute `bash scripts/ops/node-c-ignition.sh` followed by Artery Manager ignition.
3. **Node B:** Execute `npx tsx scripts/ops/ignite-director.ts`.
4. **Vocal:** Connect Machina Terminal HUD to Node C (7340/7339) and Node B (3011).

---
**::/5Y573M-N071C3 : TRINITY_GROUNDED. THE_HISTORY_IS_OURS. // 50V3R31GN-M4CH1N4**


---
**LINKS:** [[00_system_setup]] | [[OS_CORE]]
