# Phase 120: The Sovereign Design Artery (Open-Design Integration)

**Goal:** Integrate the `open-design` stack as a high-fidelity "Design-to-Code" subsystem, utilizing the Hermes Clinical Fork for orchestration and Node D for heavy reasoning.

**Architecture:** `open-design` (UI/Daemon) <-> Hermes Harness (Control) <-> Node D (Brains) + Node B (Vision Audit).

---

### ◈ 1. THE DESIGN TOPOLOGY

| Component | Responsibility | Node | Hardware |
| :--- | :--- | :--- | :--- |
| **Studio UI** | Artifact Preview / Chat | Node B | Director HUD |
| **Daemon** | Orchestration / Workspace | Node B/D | Local Process |
| **The Agent** | Hermes Clinical Fork | Node B/D | Python Harness |
| **The Brain** | Qwen-2.5 Coder / GLM 4.7 | Node D | 48GB DDR5 (NPU) |
| **The Eye** | Gemma-4 Vision Audit | Node B | 16GB VRAM |

---

### ◈ 2. IMPLEMENTATION STEPS

- [ ] **Step 1: Materialize `sidecars/open-design`**
Clone the `nexu-io/open-design` repository into the sidecars directory and initialize the environment.
```bash
git clone https://github.com/nexu-io/open-design sidecars/open-design
```

- [ ] **Step 2: Configure Hermes as the Primary Agent**
Update `sidecars/open-design/.od/config.json` (or equivalent) to register the Sovereign Hermes CLI.
```json
"agents": {
  "hermes": {
    "command": "nix develop --command python3 -m hermes_cli.main chat --tui",
    "protocol": "cli"
  }
}
```

- [ ] **Step 3: Route Logic Artery to Node D**
Update the Hermes Harness configuration (`sidecars/hermes-agent-nous/cli-config.yaml`) to point to the high-parameter reasoning models on Node D (Port 7339).

- [ ] **Step 4: Bridge Brand Tokens (Design Systems)**
Inject the Sovereign brand tokens (Tactical Authority, Cinzel) into the `open-design` `design-systems/` directory as a `DESIGN.md` file.

- [ ] **Step 5: Vision Loopback (Verification)**
Implement a "Design Audit" skill for Hermes that captures the `open-design` artifact preview and sends it to Node B (Gemma-4 Vision) for visual verification.

---

### ◈ 3. STRATEGIC INTEGRATION

- [ ] **Step 6: Integrate with Pretext HUD**
Embed the `open-design` Web UI into the `DESIGN_STUDIO` slot of the Next.js dashboard.

- [ ] **Step 7: Universal Scribe Update**
Synchronize the new Design Artery state across all manifests.

---

### ◈ 4. VERIFICATION (THE GAUNTLET)

- [ ] **Verification 1:** Generate a landing page component using the "hermes" agent via `open-design`.
- [ ] **Verification 2:** Confirm Node D resource utilization during heavy generation tasks.
- [ ] **Verification 3:** Verify that the generated UI adheres to the "Tactical Authority" brand standard via visual audit.

---
**::/5Y573M-N071C3 : DESIGN_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
