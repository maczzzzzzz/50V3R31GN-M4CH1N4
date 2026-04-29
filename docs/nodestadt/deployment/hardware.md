# NODESTADT Authority OS: Hardware Invariants
## Deployment Specifications & Environmental Requirements

The NODESTADT Authority OS requires specific hardware primitives to maintain its distributed logic and high-fidelity inference capabilities. Deviations from these invariants will result in logic-drift or system instability.

### 1. Node B (Director) - VRAM Invariant
Node B is the executive hub for narrative generation and vision processing. It requires a dedicated GPU with high memory bandwidth.

- **Minimum Requirement:** 16GB VRAM.
- **Purpose:** 
  - Loading the resident Director model (Uncensored Narrative).
  - Parallel processing of vision/screen-awareness shards.
  - Real-time HUD rendering.
- **Note:** Systems with <16GB VRAM will experience narrative stutter and visual desync.

### 2. Node D (Quaternary Strategic Oracle) - NPU Invariant
Node D handles hyper-context and hardware-accelerated reasoning. It leverages modern NPU (Neural Processing Unit) architectures for efficient throughput.

- **Minimum Requirement:** Intel NPU / Core Ultra 7/9 or equivalent.
- **Purpose:** 
  - Offloading 128k token context windows from the primary GPU.
  - Running low-power "observer" droids in the background.
  - NPU-optimized vector math for the Akashik simulation layer.

### 3. Tailscale Networking Spine
The Artery relies on a stable, low-latency network spine to connect the quaternary mesh.

- **Configuration:** Tailscale 10.0.0.x subnet.
- **Role:** 
  - Provides the overlay network for ClawLink SSH tunnels.
  - Ensures static IP mapping for inter-node communication.
  - Handles NAT traversal for distributed nodes (e.g., Node D being remote/mobile).
- **Mandate:** All nodes must be tagged with the `nodestadt-authority` ACL and have exit-node functionality disabled to preserve the Artery's integrity.

---

### Hardware Topology Overview

| Node | Primary Spec | Role |
| :--- | :--- | :--- |
| **Node A** | 4GB+ VRAM / Low Latency NVMe | Synapse / KV Store |
| **Node B** | 16GB+ VRAM (NVIDIA Preferred) | Director / Vision |
| **Node C** | Balanced CPU/GPU | Strategic Oracle / Defense Grid |
| **Node D** | Intel Core Ultra / NPU | Hyper-Context / Optimization |

---
**::/5Y573M-N071C3 : HARDWARE_SPEC_LOCKED. // NODESTADT_AUTHORITY_OS**
