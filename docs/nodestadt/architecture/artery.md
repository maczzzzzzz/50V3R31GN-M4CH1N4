# NODESTADT Authority OS: The Artery
## Connection Logic & Transport Protocols

The **Artery** defines the physical and logical pathways through which the NODESTADT Authority OS maintains its distributed state. It is designed for low-latency state synchronization and high-resiliency packet delivery.

### 1. ClawLink SSH Tunnels
The base layer of the Artery is constructed using **ClawLink** encrypted tunnels.

- **Boot Sequence:** Upon system ignition, each node initiates a ClawLink handshake with Node A.
- **Persistence:** Tunnels are maintained with heartbeat checks (30s interval). If a tunnel collapses, the node enters `ISOLATION_MODE` until the Artery is reconstructed.
- **Security:** Key-based authentication only. No password-based access is permitted on Artery-exposed ports.

### 2. VSB UDP Binary Protocol (The Pulse)
High-frequency state updates are transmitted via the **Vesper System Bus (VSB)** protocol.

- **Format:** Pure binary UDP for maximum throughput.
- **Packet Size:** Fixed 302-byte packets to prevent fragmentation and ensure deterministic processing.
- **Payload Structure:**
  - `Header` [16 bytes]: Source Node ID, Sequence Number, Timestamp.
  - `Body` [270 bytes]: Encrypted logic shard or state delta.
  - `Signature` [16 bytes]: CRC64 and XOR-based signing derived from Node A's rolling synapse key.
- **Delivery Guarantee:** Best-effort with sequence-based reconstruction for critical logic chains.

### 3. SSE Short-Circuit (HUD Streaming)
Real-time telemetry and the "Heads-Up Display" (HUD) utilize a dedicated **Server-Sent Events (SSE)** pathway.

- **Endpoint:** `localhost:3015/stream/hud`
- **Purpose:** Bypasses the heavy binary processing of the VSB for direct-to-visual telemetry.
- **Optimization:** Short-circuits traditional HTTP overhead to provide sub-50ms visual updates of system vitals.

---

### Logical Flow Matrix

| Protocol | Layer | Function | Port Range |
| :--- | :--- | :--- | :--- |
| ClawLink | L4 (SSH) | Encrypted Backbone | 2222, 2223 |
| VSB | L3 (UDP) | Logic Synchronization | 3010-3014 |
| SSE | L7 (HTTP) | Sensorium/HUD | 3015 |

---
**::/5Y573M-N071C3 : ARTERY_CALIBRATED. // NODESTADT_AUTHORITY_OS**
