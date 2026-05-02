# Phase 115: The Omniscient Artery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the "Physicalized Mind" by integrating high-fidelity voice (VoxCPM2), wearable ambient ingress (OMI), and authenticated browser agency (ST3GG-Harness) into a monolithic Node D Daemon.

**Architecture:** 
- **VoxCPM2 Artery:** High-fidelity 48kHz local TTS engine on Node D.
- **OMI Relay:** PCM-16 ambient audio ingestion with local Whisper transcription.
- **ST3GG Cookie Vault:** Steganographically-authenticated browser session porting.
- **Kinetic HUD Synergy:** Real-time visual feedback for voice and browser actions across all interfaces.

**Tech Stack:** Rust (Sidecars), Flutter (HUD), Go (Bridge), ONNX/ROCm (Inference), Playwright/Chromium.

---

### Task 1: VoxCPM2 Inference Artery (Node D)

**Files:**
- Create: `sidecars/voxcpm-tts/Cargo.toml`
- Create: `sidecars/voxcpm-tts/src/main.rs`
- Create: `nix/modules/voxcpm-tts.nix`

- [ ] **Step 1: Scaffold the Rust Sidecar**
Create the `voxcpm-tts` sidecar directory with a standard `Cargo.toml` including `ort` (ONNX Runtime) and `tokio`.

- [ ] **Step 2: Implement voxcpm::generate tool**
Write the core TTS generation logic in `src/main.rs`. Expose it as an MCP tool `sovereign.voice.generate`.

- [ ] **Step 3: Define Nix Service**
Materialize `nix/modules/voxcpm-tts.nix` to handle model weights and systemd service orchestration.

- [ ] **Step 4: Commit**
```bash
git add sidecars/voxcpm-tts nix/modules/voxcpm-tts.nix
git commit -m "feat(voice): materialize VoxCPM2 inference artery sidecar"
```

---

### Task 2: OMI Ingress Hardening

**Files:**
- Modify: `crush/nucleus.go`
- Modify: `terminal-app/lib/services/artery_client.dart`

- [ ] **Step 1: Implement Local Whisper Transcription on Node D**
Add a local transcription step to the PCM-16 stream in the Machina Daemon.

- [ ] **Step 2: Implement "Live Override" Logic**
Update `handleVoiceWS` in `crush/nucleus.go` to treat OMI commands as high-priority interrupts for Hermes.

- [ ] **Step 3: HUD Transcription Pulse**
Update `ArteryClient.dart` to push live transcription fragments to the mobile UI state.

---

### Task 3: ST3GG Cookie Vault & Browser-Harness

**Files:**
- Create: `sidecars/browser-agent-harness/Cargo.toml`
- Create: `sidecars/browser-agent-harness/src/main.rs`
- Modify: `crates/hermes-router/src/security.rs`

- [ ] **Step 1: Scaffold Browser Harness (Rust)**
Use `playwright-rust` or `chromium-oxide` to build the agentic browser controller.

- [ ] **Step 2: Implement ST3GG Verification**
Update `security.rs` to validate steganographic pulses from the Mobile HUD before unsealing the Cookie Vault.

- [ ] **Step 3: Implement Cookie Porting**
Write the logic to inject authenticated session cookies into the isolated Chromium instance.

---

### Task 4: HUD Kinetic Synergy

**Files:**
- Modify: `terminal-app/lib/screens/pretext_dashboard.dart`
- Modify: `dashboard/app/components/PretextHUD.tsx`

- [ ] **Step 1: Integrate Voice Waveform Visualizer**
Add a CSS/Flutter canvas component that pulses with OMI audio intensity.

- [ ] **Step 2: Add Agent Tab Status Shard**
Materialize a "Browser Terminal" box in the HUD showing the current URL, page title, and agent activity from the Harness.

---

### Task 5: Final Scribe & Validation

- [ ] **Step 1: Run Gauntlet Phase 115**
Verify e2e flow: Voice Command -> Local Transcription -> Browser Action -> Voice Confirmation.

- [ ] **Step 2: Universal Sync**
```bash
npm run scribe
```

- [ ] **Step 3: Final Commit & Push**
```bash
git add .
git commit -m "feat(mesh): seal Phase 115 Omniscient Artery"
git push origin master
```

---
**::/5Y573M-N071C3 : PLAN_LOCKED. THE_BUS_IS_TRUTH. // 50V3R31GN-M4CH1N4**
