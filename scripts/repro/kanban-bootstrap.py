#!/usr/bin/env python3
"""Bootstrap kanban board from IMPLEMENTATION_PLAN.md v3.6.0-ALPHA."""
import subprocess, json, sys

def kc(title, body, priority=5, parent=None):
    """Create a kanban card. Priority: lower = higher priority."""
    cmd = ['hermes', 'kanban', 'create', title, '--body', body,
           '--priority', str(priority), '--json']
    if parent:
        cmd.extend(['--parent', parent])
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    if r.returncode != 0:
        print(f"  FAIL: {title} | {r.stderr.strip()[:150]}", file=sys.stderr)
        return None
    try:
        data = json.loads(r.stdout)
        tid = data['id']
        print(f"  OK: {tid} | {title}")
        return tid
    except (json.JSONDecodeError, KeyError):
        print(f"  PARSE FAIL: {title} | {r.stdout[:150]}", file=sys.stderr)
        return None

# Priority mapping: 1=critical, 2=high, 5=medium, 8=low
CRIT, HIGH, MED, LOW = 1, 2, 5, 8

print("=== Bootstrapping Kanban Board ===\n")

# ── Phase 2: Kinetic Agency (ACTIVE) ──────────────────────────────
print("Phase 2: Kinetic Agency")
p2 = kc(
    "PHASE 2: Kinetic Agency",
    "Epic: Granting the mesh physical agency over workspace interfaces and high-speed perception. "
    "Branch: stable/mesh-alpha. Zero Shadow Logic. Hermes-First.",
    priority=CRIT
)
if not p2:
    print("FATAL: Cannot create cards. Aborting.")
    sys.exit(1)

p2t1 = kc(
    "P2-T1: Vision-Enabled UI Automation",
    "Calibrate Qwen3-VL-2B (0.8B screen triage) for sub-second terminal and browser control on Node B. "
    "(1) Verify sovereign-proxy routing for qwen3-vl-2b-instruct via LiteLLM. "
    "(2) Calibrate auxiliary vision config in config.yaml. "
    "(3) Benchmark inference latency through the Artery (Node B local -> LiteLLM -> response). "
    "(4) Document baseline latency benchmarks. "
    "Refs: sidecars/sovereign-sniffer/, stagehand-audit-260507.html. "
    "Hardware: Node B 16GB VRAM AMD WSL2. Constraint: sub-second inference.",
    priority=HIGH, parent=p2
)

p2t2 = kc(
    "P2-T2: Terminal Control Calibration",
    "Stabilize Hermes terminal harness for multi-node bash execution. "
    "(1) Verify terminal toolset across Tailscale Artery (Node A-D). "
    "(2) Test SSH remote execution from Node B to Node C/D. "
    "(3) Validate Docker terminal environments (sidecars/mesh/*.yml). "
    "(4) Ensure WSL2 terminal bridge stable under load. "
    "Refs: nix/modules/hermes-core.nix, scripts/ignite.sh, sidecars/mesh/. "
    "Hardware: Node B primary, targets all nodes.",
    priority=HIGH, parent=p2
)

p2t3 = kc(
    "P2-T3: Real-Time Screen Triage",
    "Deploy sovereign-sniffer sidecar to Node B for persistent interface awareness. "
    "(1) Review sidecars/sovereign-sniffer/ state and integration points. "
    "(2) Integrate with Stagehand SDK observe/extract primitives. "
    "(3) Wire sniffer output into Hermes tool calling pipeline. "
    "(4) Deploy as persistent systemd service on Node B. "
    "(5) Verify sniffer -> vision model -> agent loop latency. "
    "Depends on P2-T1 (vision model calibration). "
    "Refs: sidecars/sovereign-sniffer/, stagehand-audit-260507.html. "
    "Hardware: Node B AMD GPU WSL2.",
    priority=HIGH, parent=p2
)

# ── Phase 3: Recursive Sovereignty (PLANNED) ──────────────────────
print("\nPhase 3: Recursive Sovereignty")
p3 = kc(
    "PHASE 3: Recursive Sovereignty",
    "Epic: Port Sovereign-specific features as native Hermes v0.13.0 plugins. "
    "Psy-Core, Consensus Alignment, Sovereign State Persistence. "
    "Depends on Phase 2 completion.",
    priority=MED
)

p3t1 = kc(
    "P3-T1: Psy-Core Native Port",
    "Integrate zero-trust tool auditing into Hermes core reasoning loop. "
    "(1) Review current psy-core implementation. "
    "(2) Port to native Hermes plugin using Tenacity surfaces. "
    "(3) Implement tool allowlist validation. "
    "(4) Add FileHandler audit logging. "
    "Constraint: Zero Shadow Logic. Refs: crates/modules/. Hardware: mesh-wide.",
    priority=MED, parent=p3
)

p3t2 = kc(
    "P3-T2: Consensus Alignment",
    "Implement mesh-wide architectural consensus as native Tenacity coordinator. "
    "(1) Review consensus-alignment crate (currently honest stub). "
    "(2) Implement typed ConsensusAction enum (Block/Warn/Log). "
    "(3) Wire into Hermes coordination pipeline. "
    "Refs: crates/modules/consensus-alignment/, nix/modules/consensus-alignment.nix. "
    "Hardware: Node D primary, mesh-wide.",
    priority=MED, parent=p3
)

p3t3 = kc(
    "P3-T3: Sovereign State Persistence",
    "Materialize semantic ledger on Node A for mesh-wide state consistency. "
    "(1) Verify hermes-lcm MemoryProvider on Node A (primary sync). "
    "(2) Extend DAG-based SQLite storage for mesh state. "
    "(3) Configure sync nodes B/C/D via nix/modules/hermes-lcm.nix. "
    "(4) Validate cross-node state consistency. "
    "Refs: sidecars/hermes-lcm/, nix/modules/hermes-lcm.nix. Hardware: Node A (4GB).",
    priority=MED, parent=p3
)

# ── Phase 4: Appendage Integration (PLANNED) ──────────────────────
print("\nPhase 4: Appendage Integration")
p4 = kc(
    "PHASE 4: Appendage Integration",
    "Epic: Finalizing high-fidelity voice and engineering perception on Node C. "
    "OMI Voice/Vision, MATLAB Bridge, VoxCPM2 vocal synthesis.",
    priority=LOW
)

p4t1 = kc(
    "P4-T1: OMI Voice and Vision",
    "Stabilize OMI monorepo appendages on Node C for ambient perception. "
    "(1) Review sidecars/omi-monorepo-fork/ current state. "
    "(2) Stabilize omi-backend systemd service (nix/modules/omi-backend.nix). "
    "(3) Integrate nRF firmware encryption (AES-256-CCM). "
    "(4) Test BLE audio pipeline to vibevoice-asr. "
    "Refs: sidecars/omi-monorepo-fork/. Hardware: Node C RTX 2060 6GB.",
    priority=LOW, parent=p4
)

p4t2 = kc(
    "P4-T2: MATLAB Engineering Bridge",
    "Finalize MCP-based MATLAB bridge for engineering calculations. "
    "(1) Review crates/modules/matlab-mcp-bridge/. "
    "(2) Validate safe script execution (validate_script + separate -batch args). "
    "(3) Test MCP protocol integration with Hermes tool discovery. "
    "(4) Deploy to Node C and Node D. "
    "Refs: crates/modules/matlab-mcp-bridge/. Hardware: Node C + Node D.",
    priority=LOW, parent=p4
)

p4t3 = kc(
    "P4-T3: VoxCPM2 Vocal Synthesis",
    "Deploy VoxCPM2 for zero-shot vocal synthesis on Node C. "
    "(1) Review crates/modules/voxcpm-tts/ current state. "
    "(2) Implement real duration metadata reading (replace TODO stub). "
    "(3) Integrate with vibevoice-asr for full voice pipeline. "
    "(4) Benchmark synthesis latency on RTX 2060. "
    "Refs: crates/modules/voxcpm-tts/. Hardware: Node C 6GB VRAM limit.",
    priority=LOW, parent=p4
)

# ── Phase 5: Avatar & Stealth (FUTURE) ────────────────────────────
print("\nPhase 5: Avatar and Stealth")
p5 = kc(
    "PHASE 5: Avatar and Stealth",
    "Epic: Visual PETS/HUD and holographic interfaces. "
    "Sovereign HUD, CloakBrowser Stealth, Mesh-wide Materialization. "
    "Refs: phase-7-avatar-pets-stealth.md, sovereign-companion-spec.html.",
    priority=LOW
)

p5t1 = kc(
    "P5-T1: Sovereign HUD Integration",
    "Deploy Pretext-based visual HUD for real-time mesh telemetry. "
    "(1) Review pretext-core crate and WASM bridge (wasm/). "
    "(2) Validate dashboard/hermes-workspace swarm telemetry integration. "
    "(3) Wire mesh vitals (Node A-D status) to HUD components. "
    "(4) Test KineticThoughtStream and FluidRenderer WebGL. "
    "Refs: crates/modules/pretext-core/, dashboard/hermes-workspace/. Hardware: Node B.",
    priority=LOW, parent=p5
)

p5t2 = kc(
    "P5-T2: CloakBrowser Stealth",
    "Integrate browser harness for un-attributable information gathering. "
    "(1) Design CloakBrowser provider (Stagehand + stealth context). "
    "(2) Implement CDP stealth context with fingerprint randomization. "
    "(3) Wire into Hermes browser toolset. "
    "Refs: phase-7-avatar-pets-stealth.md Task 1, browser-harness-prompt-for-llms.html. "
    "Hardware: Node B.",
    priority=LOW, parent=p5
)

p5t3 = kc(
    "P5-T3: Mesh-wide Materialization",
    "Final verification of 100% Sovereign-native mesh alpha. "
    "(1) Full mesh integration test across all 4 nodes. "
    "(2) Verify all inference endpoints (Node B AMD, Node C NVIDIA, Node D Intel). "
    "(3) Validate TurboQuant q4_0 KV-cache across all endpoints. "
    "(4) Run full QA suite (.factory/skills/qa/). "
    "(5) Update SOVEREIGN_VITAL_SIGNS.md with final status. "
    "Refs: turboquant-research-2026-05-11.html, .factory/skills/qa/. Hardware: all nodes.",
    priority=LOW, parent=p5
)

print("\n=== Bootstrap Complete ===")
print("Phase 2 (ACTIVE): 4 cards | Phase 3 (PLANNED): 4 cards | Phase 4 (PLANNED): 4 cards | Phase 5 (FUTURE): 4 cards")
print("Total: 16 cards created")
