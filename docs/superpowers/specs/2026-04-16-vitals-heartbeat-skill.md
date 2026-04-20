# Spec: `vitals-heartbeat` (Custom Skill)

## 🏁 Objectives
- **Instant Validation:** Provide a single command to verify the status of the entire 50V3R31GN-M4CH1N4 hardware/software triad.
- **Automation:** Eliminate the manual overhead of checking ports, PIDs, and socket availability.

## 🏗️ Architectural Components

### 1. Probe Registry
The skill will execute a sequence of probes across the following quadrants:
- **Quadrant 1 (Network):**
    - Port 3030 (Nucleus Artery)
    - Port 9090 (VSB Telemetry)
    - Port 9222 (Foundry CDP)
    - Port 3010 (Director WebSocket)
- **Quadrant 2 (Hardware Bus):**
    - VSB Mmap (`black_ice_state.mem`) existence and permissions (0600).
    - Unix Socket (`.gemini/tmp/sovereign-mcp.sock`) availability.
- **Quadrant 3 (Cognition):**
    - Node A Health (`http://localhost:8080/health`)
    - Node B Health (`http://localhost:3010/health`)

### 2. Output Logic
- **Visual:** VT323-styled ASCII table reporting `● ONLINE` (Green) or `✗ OFFLINE` (Red).
- **Repair Advice:** If a probe fails, suggest the specific `crush` or `npm` command to restore service.

### 3. Implementation Path
- Create `scripts/audit/vitals-heartbeat.ts`.
- Wire to `npm run audit:vitals`.

## 🛡️ Success Criteria
1. Full diagnostic pass completes in < 2 seconds.
2. Accurately detects "Zombie" processes (PID exists but port not listening).

---
**::/50V3R31GN-M4CH1N4 : 5P3C-V174L5-537. // 57R4736157_D0N3.**
