# NODESTADT Authority OS: NixOS Environment
## Flakes, Sandboxing & System Ignition

The NODESTADT Authority OS is managed through the Nix ecosystem to ensure reproducible environments and bit-identical logic across all nodes in the mesh.

### 1. Flake Usage (`nix develop`)
The entire repository is defined as a Nix Flake. This ensures that all dependencies (Go, Rust, Node.js, Python/Torch) are pinned to exact versions.

- **Entering the Environment:**
  ```bash
  nix develop
  ```
- **Scope:** The development shell provides the `crush` toolchain, `vsb-tools`, and all necessary drivers for NPU/GPU acceleration.
- **Mandate:** No global packages should be used. All system interactions must occur within the `nix develop` shell or via a Nix-based service manager.

### 2. Resident Model Setup
Before system ignition, each node must have its resident models staged.

- **Script:** `./scripts/ops/setup-resident-models.sh`
- **Actions:**
  - Fetches the specific GGUF/EXL2 weights for the node's role (e.g., Director v3 for Node B).
  - Verifies hashes against the `model_manifest.json`.
  - Stages weights in the `/var/lib/nodestadt/models` directory (immutable).

### 3. System Ignition (`ignite-all.sh`)
The boot sequence of the NODESTADT OS is a coordinated multi-node event.

- **Command:**
  ```bash
  ./scripts/ops/ignite-all.sh
  ```
- **Boot Sequence Phase:**
  1. **Synapse Start:** Node A initializes `SovereignIntelligence.db`.
  2. **Artery Handshake:** Nodes B, C, and D initiate ClawLink tunnels to Node A.
  3. **Logic Load:** Droids and logic shards are injected into the resident memory pools.
  4. **Final Sync:** Node A verifies the mesh signature and releases the `ARTERY_READY` lock.

---

### Environmental Invariants

- **Kernel:** Linux (LTS) with NPU/GPU support modules.
- **FS:** XFS or ZFS (preferred for Node A for snapshotting).
- **Registry:** `nix-registry` must be updated to the latest `50V3R31GN` flake lock before deployment.

---
**::/5Y573M-N071C3 : ENVIRONMENT_SYNCHRONIZED. // NODESTADT_AUTHORITY_OS**
