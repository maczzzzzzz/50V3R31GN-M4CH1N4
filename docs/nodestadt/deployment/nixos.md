# ◈ NODESTADT ARCHITECTURE : NIXOS ENVIRONMENT (v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
## Flakes, Sandboxing & System Ignition

The NODESTADT Authority OS is managed through the Nix ecosystem to ensure reproducible environments and bit-identical logic across all nodes in the mesh.

### 1. Flake Usage (`nix develop`)
The entire repository is defined as a Nix Flake. This ensures that all dependencies (Go, Rust, Node.js, Python/Torch) are pinned to exact versions.

- **Entering the Environment:**
  ```bash
  nix develop --impure
  ```
- **Scope:** The development shell provides the `crush` toolchain, `hermes-router`, and all necessary drivers for NPU/GPU acceleration.
- **Mandate:** No global packages should be used. All system interactions must occur within the `nix develop` shell.

### 2. Resident Model Setup
Before system ignition, each node must have its resident models staged.

- **Script:** `./scripts/ops/setup-resident-models.sh`
- **Actions:**
  - Fetches the specific GGUF/EXL2 weights for the node's role (e.g., Director for Node B).
  - Verifies hashes against the `model_manifest.json`.
  - Stages weights in the project data directory.

### 3. System Ignition (`ignite-all.sh`)
The boot sequence of the NODESTADT OS is a coordinated multi-node event.

- **Command:**
  ```bash
  bash scripts/audit/ignite-all.sh
  ```
- **Boot Sequence Phase:**
  1. **Synapse Start:** Node A initializes the Artery of Truth (RKG).
  2. **Identity Handshake:** Nodes B, C, and D initiate SPIFFE identity verification.
  3. **Artery Verification:** mTLS arteries are established between all nodes.
  4. **Logic Load:** Declarative plugins and sidecars are initialized.
  5. **Final Sync:** Node A verifies the mesh signature and releases the `ARTERY_READY` lock.

---

### Environmental Invariants

- **Kernel:** Linux (LTS) with NPU/GPU support modules.
- **FS:** XFS or ZFS (preferred for snapshotting).
- **Registry:** `flake.lock` must be synchronized before deployment.

---
**::/5Y573M-N071C3 : ENVIRONMENT_SYNCHRONIZED. // NODESTADT_AUTHORITY_OS**
