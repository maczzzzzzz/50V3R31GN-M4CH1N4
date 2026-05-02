# ◈ NODESTADT ARCHITECTURE : THE ARTERY (v3.8.24-SYNTHESIS-SYNTHESIS)
## Connection Logic & Transport Protocols

The **Artery** defines the physical and logical pathways through which the NODESTADT Authority OS maintains its distributed state. It is designed for low-latency state synchronization and zero-trust packet delivery.

### 1. ClawLink SSH Tunnels
The base layer of the Artery is constructed using **ClawLink** encrypted tunnels.

- **Boot Sequence:** Upon system ignition, each node initiates a ClawLink handshake with Node A.
- **Persistence:** Tunnels are maintained with heartbeat checks (30s interval). If a tunnel collapses, the node enters `ISOLATION_MODE` until the Artery is reconstructed.
- **Security:** Key-based authentication only. No password-based access is permitted on Artery-exposed ports.

### 2. VSB UDP Binary Protocol (The Pulse)
High-frequency state updates are transmitted via the **Virtual Sovereign Bus (VSB)** protocol.

- **Format:** Pure binary UDP for maximum throughput.
- **Packet Size:** Fixed 302-byte packets to prevent fragmentation and ensure deterministic processing.
- **Payload Structure:**
  - `Header` [16 bytes]: Source Node ID, Sequence Number, Timestamp.
  - `Body` [270 bytes]: Encrypted logic shard or state delta.
  - `Signature` [16 bytes]: CRC64 signing derived from Node A's rolling identity key.
- **Delivery Guarantee:** Best-effort with sequence-based reconstruction for critical logic chains.

### 3. mTLS Artery (RPC Control Plane)
All high-level agent tool calls and node-to-node RPCs are routed through the **mTLS Artery**.

- **Proxy:** Managed by `hermes-router` (Rust) on port 7341.
- **Identity:** Strictly enforced via SPIFFE/SPIRE SVIDs.
- **Gating:** Access to reasoning arteries (Node D) is gated by ST3GG Visual Second Factor (V2F) verification.

---

### Logical Flow Matrix

| Protocol | Layer | Function | Port Range |
| :--- | :--- | :--- | :--- |
| ClawLink | L4 (SSH) | Encrypted Backbone | 2222, 2223 |
| VSB | L3 (UDP) | Logic Synchronization | 3010-3014 |
| mTLS RPC | L7 (HTTP) | Control Plane | 7339-7341 |

---
**::/5Y573M-N071C3 : ARTERY_CALIBRATED. // NODESTADT_AUTHORITY_OS**
