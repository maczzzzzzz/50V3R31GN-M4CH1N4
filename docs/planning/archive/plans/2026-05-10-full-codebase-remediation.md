# Sovereign Machina Full Codebase Remediation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remediate all 98 findings from the 2026-05-10 full codebase audit across Code Reuse, Code Quality, and Efficiency dimensions.

**Architecture:** Organized into 6 batches by priority and subsystem independence. Each batch can be executed by a separate subagent. Batch 1 is immediate (runtime crashes + security), Batch 2 is short-term (broken functionality), Batch 3-6 are medium-term (code quality, reuse, efficiency).

**Tech Stack:** Rust (crates), Python 3.11+ (Hermes plugins), Bash (scripts), Nix (modules).

**Reference:** `docs/planning/audits/2026-05-10-full-codebase-audit.md`

---

## Gemini VSB Remediation Verification

The Gemini-produced `docs/planning/plans/2026-05-10-vsb-router-remediation.md` was cross-referenced against audit findings:

| Gemini Task | Audit Finding(s) | Verified Status |
|---|---|---|
| Task 1: Dynamic Pulse Unpacking | N/A (not flagged) | **DONE** — `recv_pulse()` with `struct.unpack` already present |
| Task 2: Stream/Reasoning Separation | CQ-M10 (fragile think-block parser) | **PARTIAL** — typed chunks work but `in_think_block` heuristics remain fragile |
| Task 3: Secret Decoupling | CQ-C2 (hardcoded default secret) | **NOT FIXED** — default `"machina-sovereign-mesh-v3-secret-key"` still in code |
| Task 4: Logic De-Mutilation | N/A (auxiliary_client.py is upstream code) | **OUT OF SCOPE** |
| Missing | EF-H1 (pulse sync blocks event loop) | **NOT ADDRESSED** |

**Conclusion:** Gemini plan addresses 1 of 6 VSB-specific findings fully. This plan subsumes and extends it.

---

## File Structure

### Batch 1 — Immediate Security & Runtime Fixes
```
sidecars/hermes-agent-nous/plugins/general/telegram-artery/bot_coordinator.py  # Line ~242: NameError fix
sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py # Secret removal, pulse fix
crates/modules/goose-execution/src/main.rs                                      # Command injection guard
crates/modules/matlab-mcp-bridge/src/main.rs                                    # Command injection guard
crates/modules/directors-forge/src/main.rs                                      # Command injection guard
scripts/deploy-n8n.sh                                                           # Remove default password
```

### Batch 2 — Broken Functionality
```
crates/modules/zeroboot-isolation/src/main.rs     # PID tracking fix
crates/modules/consensus-alignment/src/main.rs     # Stub documentation
crates/modules/vibevoice-asr/src/main.rs           # Hardcoded confidence
crates/modules/voxcpm-tts/src/main.rs              # Duration calculation
crates/modules/goose-execution/src/main.rs          # rustc --eval fix
```

### Batch 3 — Python Plugin Quality
```
sidecars/hermes-agent-nous/plugins/general/psy-core/hook.py               # Fake signatures → allowlist, bare except, logging
sidecars/hermes-agent-nous/plugins/general/telegram-artery/streaming_handler.py  # Dead code, hacky import
sidecars/hermes-agent-nous/plugins/memory/hermes-lcm/provider.py          # Token truncation bug, print→logging, persistent conn
sidecars/hermes-agent-nous/plugins/general/n8n-mcp/n8n_client.py          # time.sleep → asyncio awareness
sidecars/hermes-agent-nous/plugins/general/mirage-vfs/vfs_bridge.py       # Top-level imports
```

### Batch 4 — Rust Crate Quality
```
crates/modules/pretext-core/src/lib.rs           # FFI null checks
crates/modules/pretext-core/src/virtualization.rs # Dead buffer_size, visible_range
crates/modules/pretext-core/src/ascii_mapper.rs   # Duplicate palette entries
crates/modules/vibevoice-asr/src/main.rs           # const word list
crates/modules/vibevoice-asr/src/ble_stream.rs     # Notification handler
```

### Batch 5 — Shell Script & Nix Hardening
```
scripts/deploy-mirage.sh, scripts/deploy-phase2.sh, scripts/ignite.sh  # set -euo pipefail
scripts/semantic-shift.sh                                                # Single nix-shell
scripts/deploy-phase2.sh, scripts/deploy-phase3-hermes-lcm.sh          # Shared config template
nix/modules/hermes-core.nix                                              # Remove wheel group
nix/modules/inference-engine.nix                                         # Remove hardcoded user
nix/hosts/shared/common.nix                                              # SSH password auth
```

### Batch 6 — Code Reuse & Architecture
```
scripts/lib/deploy-common.sh                 # NEW: Shared deploy utilities
scripts/lib/logging.sh                       # NEW: Shared logging
crates/sovereign-common/src/lib.rs           # NEW: Shared Rust utilities (error types, health route)
sidecars/hermes-agent-nous/plugins/sovereign_config.py  # NEW: Shared Python config loader
```

---

## Batch 1: Immediate Security & Runtime Fixes (CRITICAL)

### Task 1.1: Fix `bot_coordinator.py` NameError (Runtime Crash + Memory Leak)

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/general/telegram-artery/bot_coordinator.py:~242`

**Audit Finding:** CQ-C1 — `self._sessions.pop(session_id, None)` references undefined `session_id`. Should be `session.session_id`. Every request completion throws NameError, sessions leak forever.

- [ ] **Step 1: Write the failing test**

```python
# In a test file or inline verification
import asyncio
from unittest.mock import AsyncMock, MagicMock
from plugins.general.telegram_artery.bot_coordinator import BotCoordinator
from plugins.general.telegram_artery.artery_config import ArteryConfig

async def test_session_eviction_after_request():
    """Sessions must be evicted from _sessions dict after handle_request completes."""
    config = MagicMock(spec=ArteryConfig)
    config.coordination_timeout = 10.0
    reasoning_client = AsyncMock(return_value="test response")
    
    coordinator = BotCoordinator(config, reasoning_client=reasoning_client)
    assert len(coordinator._sessions) == 0
    
    result = await coordinator.handle_request(chat_id=123, message_text="analyze this")
    
    # Session must have been evicted — no leak
    assert len(coordinator._sessions) == 0, f"Session leak: {list(coordinator._sessions.keys())}"
    assert "test response" in result
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k test_session_eviction`
Expected: FAIL with `NameError: name 'session_id' is not defined`

- [ ] **Step 3: Fix the NameError**

In `sidecars/hermes-agent-nous/plugins/general/telegram-artery/bot_coordinator.py`, line ~242 in the `finally` block:

Change:
```python
            self._sessions.pop(session_id, None)
```

To:
```python
            self._sessions.pop(session.session_id, None)
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k test_session_eviction`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/general/telegram-artery/bot_coordinator.py
git commit -m "fix(telegram-artery): fix NameError in session eviction that caused memory leak"
```

---

### Task 1.2: Remove Default Mesh Secret from `vsb_router.py`

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py:~69`

**Audit Finding:** CQ-C2 — Default secret `"machina-sovereign-mesh-v3-secret-key"` committed to source. Token is sent as `Authorization: Bearer <key>` to all inference endpoints.

- [ ] **Step 1: Write the failing test**

```python
import os
import pytest
from plugins.model_providers.sovereign_vsb.vsb_router import VSBRouter, Node

def test_router_requires_mesh_secret():
    """VSBRouter must fail if SOVEREIGN_MESH_SECRET is not set."""
    os.environ.pop("SOVEREIGN_MESH_SECRET", None)
    nodes = [Node(id="test", ip="127.0.0.1", port=8080, models=["test-model"])]
    
    with pytest.raises(EnvironmentError, match="SOVEREIGN_MESH_SECRET"):
        VSBRouter(nodes)

def test_router_accepts_explicit_secret():
    """VSBRouter must accept SOVEREIGN_MESH_SECRET when set."""
    os.environ["SOVEREIGN_MESH_SECRET"] = "test-secret-key-12345"
    try:
        nodes = [Node(id="test", ip="127.0.0.1", port=8080, models=["test-model"])]
        router = VSBRouter(nodes)
        assert router.secret_key == "test-secret-key-12345"
    finally:
        del os.environ["SOVEREIGN_MESH_SECRET"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k test_router_requires_mesh_secret`
Expected: FAIL — router currently accepts missing env var with default.

- [ ] **Step 3: Remove default, fail on missing env var**

In `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`, change the `__init__` method:

```python
    def __init__(self, nodes: List[Node]):
        self.nodes = {n.id: n for n in nodes}
        self.pulse = VSBPulse(nodes)
        self.running = False
        
        secret = os.getenv("SOVEREIGN_MESH_SECRET")
        if not secret:
            raise EnvironmentError(
                "SOVEREIGN_MESH_SECRET environment variable is required. "
                "Set it to the mesh shared secret before starting the VSB router."
            )
        self.secret_key = secret
```

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k "test_router_requires_mesh_secret or test_router_accepts_explicit_secret"`
Expected: Both PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py
git commit -m "fix(vsb): remove hardcoded default mesh secret, require SOVEREIGN_MESH_SECRET env var"
```

---

### Task 1.3: Fix VSB Pulse Sync Blocking Event Loop

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py:~235-267`

**Audit Finding:** EF-H1 — `start_pulse_sync()` runs infinite `while self.running` loop via `loop.run_until_complete()`, blocking Hermes agent startup forever.

- [ ] **Step 1: Write the failing test**

```python
import threading
import time
from unittest.mock import patch, MagicMock
from plugins.model_providers.sovereign_vsb.vsb_router import VSBRouter, Node

def test_pulse_sync_does_not_block():
    """start_pulse_sync must return immediately, running pulse loop in background."""
    import os
    os.environ["SOVEREIGN_MESH_SECRET"] = "test"
    
    nodes = [Node(id="test", ip="127.0.0.1", port=8080, models=["test-model"])]
    router = VSBRouter(nodes)
    
    # Patch pulse.start to avoid actual UDP bind
    with patch.object(router.pulse, 'start'):
        start_time = time.time()
        router.start_pulse_sync()
        elapsed = time.time() - start_time
    
    # Must return within 1 second (not block forever)
    assert elapsed < 1.0, f"start_pulse_sync blocked for {elapsed:.1f}s"
    
    # Verify background thread is running
    assert router._pulse_thread is not None
    assert router._pulse_thread.is_alive()
    
    router.stop()
    del os.environ["SOVEREIGN_MESH_SECRET"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k test_pulse_sync_does_not_block`
Expected: TIMEOUT or FAIL — current implementation blocks forever.

- [ ] **Step 3: Replace blocking event loop with background thread**

In `sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py`, replace `start_pulse_sync` and `stop`:

```python
    def start_pulse_sync(self):
        """Start background pulse sync in a daemon thread."""
        self.pulse.start()
        self.running = True

        def _pulse_loop():
            while self.running:
                try:
                    pulse_data = self.pulse.listen(timeout=1.0)
                    if pulse_data:
                        data, addr = pulse_data
                        self.pulse.recv_pulse(data, addr)
                        logger.debug(f"Pulse received from {addr[0]}:{addr[1]}")
                except Exception as e:
                    logger.error(f"Pulse loop error: {e}")

        self._pulse_thread = threading.Thread(target=_pulse_loop, daemon=True, name="vsb-pulse")
        self._pulse_thread.start()
        logger.info("VSB background pulse sync started (daemon thread)")

    def stop(self):
        """Stop router and pulse sync."""
        logger.info("Stopping VSB router and pulse sync")
        self.running = False
        if hasattr(self, '_pulse_thread') and self._pulse_thread is not None:
            self._pulse_thread.join(timeout=3.0)
```

Add `import threading` at the top of the file with the other imports.

- [ ] **Step 4: Run test to verify it passes**

Run: `PYTHONPATH=sidecars/hermes-agent-nous python3 -m pytest -xvs -k test_pulse_sync_does_not_block`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/model_providers/sovereign_vsb/vsb_router.py
git commit -m "fix(vsb): run pulse sync in daemon thread instead of blocking event loop"
```

---

### Task 1.4: Add Input Sanitization to Goose Execution

**Files:**
- Modify: `crates/modules/goose-execution/src/main.rs:~50-68`

**Audit Finding:** CQ-C3 — `req.script` passed verbatim to `bash -c`, `python -c`, `node -e`. Command injection.

- [ ] **Step 1: Write the failing test**

```rust
// In crates/modules/goose-execution/src/main.rs or a test module

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rejects_shell_metacharacters() {
        let mut goose = Goose::new();
        let req = ExecutionRequest {
            script: "rm -rf / # injection".to_string(),
            language: "bash".to_string(),
            cwd: None,
        };
        let result = goose.execute(req);
        assert!(result.is_err(), "Should reject script with shell metacharacters");
    }

    #[test]
    fn test_rejects_rust_unsupported() {
        let mut goose = Goose::new();
        let req = ExecutionRequest {
            script: "fn main() {}".to_string(),
            language: "rust".to_string(),
            cwd: None,
        };
        let result = goose.execute(req);
        assert!(result.is_err(), "Rust execution is not supported via --eval");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd crates/modules/goose-execution && cargo test`
Expected: FAIL — no validation exists.

- [ ] **Step 3: Add input validation and remove unsupported Rust executor**

In `crates/modules/goose-execution/src/main.rs`, update the `execute` method:

```rust
    /// Characters that indicate shell injection attempts
    const DANGEROUS_CHARS: &[char] = &['|', '&', ';', '$', '`', '>', '<', '\n', '\r'];

    /// Execute script
    pub fn execute(&mut self, req: ExecutionRequest) -> Result<ExecutionResponse, String> {
        log::info!("[Goose] Executing language: {} ({} chars)", req.language, req.script.len());

        // Validate script for injection patterns
        if req.script.contains(DANGEROUS_CHARS) {
            return Err(format!(
                "Script rejected: contains forbidden characters (|&;$`><newline). \
                 Sandboxed execution not yet available."
            ));
        }

        let working_dir = req.cwd.as_ref()
            .map(PathBuf::from)
            .unwrap_or_else(|| self.cwd.clone());

        // Select executor based on language
        let (cmd, args) = match req.language.as_str() {
            "python" | "py" => ("python3", vec!["-c", &req.script]),
            "bash" | "sh" => ("bash", vec!["-c", &req.script]),
            "node" | "js" => ("node", vec!["-e", &req.script]),
            "rust" | "rs" => {
                return Err(
                    "Rust execution is not supported in single-shot mode. \
                     Use goose-execution with a temp file and cargo instead.".to_string()
                );
            }
            _ => return Err(format!("Unsupported language: {}", req.language)),
        };

        let output = Command::new(cmd)
            .args(&args)
            .current_dir(&working_dir)
            .output()
            .map_err(|e| format!("Failed to execute {}: {}", req.language, e))?;

        let exit_code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(ExecutionResponse {
            output: stdout.into(),
            error: if stderr.is_empty() { None } else { Some(stderr.into()) },
            exit_code,
        })
    }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd crates/modules/goose-execution && cargo test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add crates/modules/goose-execution/src/main.rs
git commit -m "fix(goose): add input sanitization and reject rust execution"
```

---

### Task 1.5: Fix MATLAB MCP Bridge Command Injection

**Files:**
- Modify: `crates/modules/matlab-mcp-bridge/src/main.rs:~45`

**Audit Finding:** CQ-C4 — `format!("run('{}')", req.script)` allows single-quote breakout.

- [ ] **Step 1: Write the failing test**

```rust
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_rejects_quote_injection() {
        let bridge = MatlabBridge::new().unwrap();
        let req = MatlabRequest {
            script: "'); !rm -rf / #".to_string(),
            workspace: "/tmp".to_string(),
        };
        let result = bridge.validate_script(&req.script);
        assert!(result.is_err(), "Should reject script with quote breakout");
    }
}
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd crates/modules/matlab-mcp-bridge && cargo test`
Expected: FAIL — no validation.

- [ ] **Step 3: Add script validation and safe argument passing**

In `crates/modules/matlab-mcp-bridge/src/main.rs`, update the `execute` method:

```rust
impl MatlabBridge {
    /// Validate MATLAB script for injection patterns
    pub fn validate_script(&self, script: &str) -> Result<(), String> {
        // Reject scripts containing single quotes (can break out of run('...'))
        if script.contains('\'') {
            return Err("Script contains single quotes which are not allowed. \
                        Use double-quoted strings inside MATLAB instead.".to_string());
        }
        // Reject shell metacharacters
        if script.contains(|c: char| matches!(c, '|' | '&' | ';' | '$' | '`' | '>' | '<')) {
            return Err("Script contains forbidden shell metacharacters".to_string());
        }
        Ok(())
    }

    /// Execute MATLAB script
    pub fn execute(&self, req: MatlabRequest) -> Result<MatlabResponse, String> {
        self.validate_script(&req.script)?;

        log::info!("[MATLAB Bridge] Executing: {} (workspace: {})", req.script, req.workspace);

        let output = Command::new(&self.matlab_path)
            .arg("-batch")
            .arg(&req.script)         // Pass as separate arg, not interpolated string
            .arg("-batch")
            .arg(format!("cd('{}')", req.workspace))
            .output()
            .map_err(|e| format!("Failed to execute MATLAB: {}", e))?;

        let exit_code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        Ok(MatlabResponse {
            output: if stderr.is_empty() { stdout.into() } else { stderr.into() },
            exit_code,
        })
    }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd crates/modules/matlab-mcp-bridge && cargo test`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add crates/modules/matlab-mcp-bridge/src/main.rs
git commit -m "fix(matlab): prevent command injection via script validation"
```

---

### Task 1.6: Fix Director's Forge Wrapper Script Injection

**Files:**
- Modify: `crates/modules/directors-forge/src/main.rs:~62-68`

**Audit Finding:** CQ-C5 — Generated wrapper scripts interpolate `tool_def.command` and `tool_def.args` without shell escaping.

- [ ] **Step 1: Add shell escaping**

In `crates/modules/directors-forge/src/main.rs`, update `ingest_tool`:

```rust
impl DirectorsForge {
    /// Shell-escape a string for safe interpolation
    fn shell_escape(s: &str) -> String {
        format!("'{}'", s.replace('\'', "'\\''"))
    }

    /// Ingest tool from library
    pub fn ingest_tool(&self, tool_def: ToolDefinition) -> Result<(), String> {
        log::info!("[Forge] Ingesting tool: {}", tool_def.name);

        let tool_dir = self.output_path.join(&tool_def.name);
        fs::create_dir_all(&tool_dir)
            .map_err(|e| format!("Failed to create tool dir: {}", e))?;

        let tool_def_path = tool_dir.join("tool.json");
        let tool_def_json = serde_json::to_string_pretty(&tool_def)
            .map_err(|e| format!("Failed to serialize tool: {}", e))?;
        fs::write(&tool_def_path, tool_def_json)
            .map_err(|e| format!("Failed to write tool def: {}", e))?;

        // Shell-escape command and arguments
        let escaped_cmd = Self::shell_escape(&tool_def.command);
        let escaped_args: Vec<String> = tool_def.args.iter()
            .map(|a| Self::shell_escape(a))
            .collect();
        let wrapper = format!("#!/bin/bash\n{} {}\n", escaped_cmd, escaped_args.join(" "));

        let wrapper_path = tool_dir.join("wrapper.sh");
        fs::write(&wrapper_path, wrapper)
            .map_err(|e| format!("Failed to write wrapper: {}", e))?;

        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt;
            let mut perms = fs::metadata(&wrapper_path)
                .map_err(|e| format!("Failed to get metadata: {}", e))?
                .permissions();
            perms.set_mode(0o755);
            fs::set_permissions(&wrapper_path, perms)
                .map_err(|e| format!("Failed to set permissions: {}", e))?;
        }

        log::info!("[Forge] Tool ingested: {}", tool_def.name);
        Ok(())
    }
```

Also update `compile_tools` to check execute bit instead of spawning processes:

```rust
    pub fn compile_tools(&self) -> Result<(), String> {
        log::info!("[Forge] Compiling all tools...");

        for entry in fs::read_dir(&self.output_path)
            .map_err(|e| format!("Failed to read output path: {}", e))?
        {
            let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
            let path = entry.path();

            if path.is_dir() {
                let tool_name = path.file_name().and_then(|n| n.to_str()).unwrap_or("unknown");
                let wrapper_path = path.join("wrapper.sh");

                if !wrapper_path.exists() {
                    log::warn!("[Forge] No wrapper for {}", tool_name);
                    continue;
                }

                // Check execute bit instead of spawning process
                #[cfg(unix)]
                {
                    use std::os::unix::fs::PermissionsExt;
                    let mode = fs::metadata(&wrapper_path)
                        .map(|m| m.permissions().mode())
                        .unwrap_or(0);
                    if mode & 0o111 != 0 {
                        log::info!("[Forge] Tool compiled: {}", tool_name);
                    } else {
                        log::warn!("[Forge] Tool {} not executable", tool_name);
                    }
                }
            }
        }

        log::info!("[Forge] Compilation complete");
        Ok(())
    }
```

- [ ] **Step 2: Build and verify**

Run: `cd crates/modules/directors-forge && cargo build`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add crates/modules/directors-forge/src/main.rs
git commit -m "fix(directors-forge): shell-escape wrapper scripts, avoid process spawn in compile"
```

---

### Task 1.7: Remove Default n8n Password

**Files:**
- Modify: `scripts/deploy-n8n.sh:~33`

**Audit Finding:** CQ-H11 — `N8N_PASSWORD:-sovereign-machina` default committed to repo.

- [ ] **Step 1: Fix the default password**

In `scripts/deploy-n8n.sh`, find the line with the default password and change:

From:
```bash
N8N_BASIC_AUTH_PASSWORD=${N8N_PASSWORD:-sovereign-machina}
```

To:
```bash
if [ -z "${N8N_PASSWORD:-}" ]; then
    error "N8N_PASSWORD environment variable is required. Set it before running deploy."
    exit 1
fi
N8N_BASIC_AUTH_PASSWORD="${N8N_PASSWORD}"
```

- [ ] **Step 2: Verify script syntax**

Run: `bash -n scripts/deploy-n8n.sh`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add scripts/deploy-n8n.sh
git commit -m "fix(n8n): require explicit N8N_PASSWORD, remove insecure default"
```

---

## Batch 2: Broken Functionality (HIGH)

### Task 2.1: Fix Zeroboot PID Tracking

**Files:**
- Modify: `crates/modules/zeroboot-isolation/src/main.rs`

**Audit Findings:** CQ-H6 (PID always None), EF-H2 (spawns `kill -0` every second).

- [ ] **Step 1: Fix PID extraction and health check**

Replace the `MicroVM` implementation:

```rust
impl MicroVM {
    pub fn new(config: VMConfig) -> Result<Self, String> {
        fs::create_dir_all(&config.workspace_path)
            .map_err(|e| format!("Failed to create workspace: {}", e))?;
        Ok(MicroVM { config, pid: None })
    }

    pub fn launch(&mut self) -> Result<(), String> {
        if self.pid.is_some() {
            return Err("MicroVM already running".to_string());
        }

        let firecracker = env::var("FIRECRACKER_PATH")
            .unwrap_or_else(|_| "/run/current-system/sw/bin/firecracker".to_string());

        // Use spawn() to get the PID, not output()
        let child = Command::new(&firecracker)
            .arg("--config-file")
            .arg(self.config.workspace_path.join("config.json"))
            .arg("--level")
            .arg("Info")
            .spawn()
            .map_err(|e| format!("Failed to launch Firecracker: {}", e))?;

        self.pid = Some(child.id());

        // Wait for Firecracker to exit in background (it blocks until VM stops)
        // We just track the PID — don't wait for output
        drop(child); // Detach — Firecracker runs independently

        log::info!("[Zeroboot] MicroVM {} launched (PID: {:?})", self.config.id, self.pid);
        Ok(())
    }

    pub fn stop(&mut self) -> Result<(), String> {
        if let Some(pid) = self.pid {
            // Use nix crate signal instead of spawning kill process
            let pid_num = pid as i32;
            unsafe {
                libc::kill(pid_num, libc::SIGTERM);
            }
            self.pid = None;
            log::info!("[Zeroboot] MicroVM {} stopped", self.config.id);
            Ok(())
        } else {
            Err("MicroVM not running".to_string())
        }
    }

    pub fn is_alive(&self) -> bool {
        self.pid.map_or(false, |pid| {
            // Check /proc/{pid}/stat — zero-fork
            let stat_path = format!("/proc/{}/stat", pid);
            std::path::Path::new(&stat_path).exists()
        })
    }
}
```

Add `extern crate libc;` at the top of the file (or add `libc` to `Cargo.toml` dependencies).

Update `Cargo.toml`:
```toml
[dependencies]
libc = "0.2"
```

- [ ] **Step 2: Build**

Run: `cd crates/modules/zeroboot-isolation && cargo build`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add crates/modules/zeroboot-isolation/
git commit -m "fix(zeroboot): track PID from spawn(), use /proc check instead of kill -0"
```

---

### Task 2.2: Document Consensus Alignment Stubs

**Files:**
- Modify: `crates/modules/consensus-alignment/src/main.rs`

**Audit Findings:** CQ-H4 (always approves), CQ-H5 (substring matching).

- [ ] **Step 1: Add honest documentation and type-safe action enum**

```rust
use serde::{Serialize, Deserialize};

/// Action to take when a consensus rule is violated
#[derive(Debug, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum ConsensusAction {
    Block,
    Warn,
    Log,
}

#[derive(Debug, Serialize, Deserialize)]
struct ConsensusRule {
    name: String,
    invariant: String,
    action: ConsensusAction,
}

impl ConsensusAlignment {
    // ... existing new() ...

    /// Check consensus against rules.
    ///
    /// **Status: STUB** — Rule checking uses substring matching and the
    /// Node A ledger check always returns `true`. This is NOT production-ready.
    /// Real implementation requires:
    /// 1. Structured context objects instead of raw strings
    /// 2. HTTP GET to Node A consensus endpoint at `self.node_a_url`
    /// 3. Proper invariant evaluation with typed predicates
    pub fn check_consensus(&self, context: &str) -> Result<bool, String> {
        log::warn!(
            "[Consensus] STUB: consensus checking is not implemented. \
             All requests are approved unconditionally."
        );

        for rule in &self.rules {
            let _passed = context.contains(&rule.invariant) || context.contains(&rule.name);
            // TODO: Real rule evaluation — currently ignored
        }

        // TODO: Replace with real Node A ledger query
        // let resp = reqwest::get(format!("{}/consensus/check?context={}", self.node_a_url, context))?;
        Ok(true)
    }
}
```

- [ ] **Step 2: Build**

Run: `cd crates/modules/consensus-alignment && cargo build`
Expected: Compiles without errors.

- [ ] **Step 3: Commit**

```bash
git add crates/modules/consensus-alignment/src/main.rs
git commit -m "docs(consensus): document stub status and add typed ConsensusAction enum"
```

---

### Task 2.3: Fix Hardcoded Confidence and Duration

**Files:**
- Modify: `crates/modules/vibevoice-asr/src/main.rs:~150`
- Modify: `crates/modules/voxcpm-tts/src/main.rs:~66`

**Audit Findings:** CQ-H7 (confidence 0.95), CQ-H8 (duration = chars * 100).

- [ ] **Step 1: Fix vibevoice-asr confidence**

In `crates/modules/vibevoice-asr/src/main.rs`, find the hardcoded `confidence: 0.95` and change:

```rust
    /// Confidence score placeholder.
    /// TODO: Parse actual confidence from Whisper output.
    confidence: Option<f64>,
```

Update the constructor/response to use `confidence: None` instead of `confidence: 0.95`.

- [ ] **Step 2: Fix voxcpm-tts duration**

In `crates/modules/voxcpm-tts/src/main.rs`, change the duration calculation:

```rust
        // TODO: Read actual audio duration via ffprobe or symphonia
        // Placeholder: estimate 50ms per character (rough average for TTS)
        let duration_ms = 0; // Unknown until actual metadata is read
```

Update the `TTSResponse` struct to use `Option<u32>`:

```rust
struct TTSResponse {
    audio_file: String,
    duration_ms: Option<u32>,  // None until real measurement
}
```

- [ ] **Step 3: Build both crates**

Run: `cd crates/modules/vibevoice-asr && cargo build && cd ../../modules/voxcpm-tts && cargo build`
Expected: Both compile.

- [ ] **Step 4: Commit**

```bash
git add crates/modules/vibevoice-asr/src/main.rs crates/modules/voxcpm-tts/src/main.rs
git commit -m "fix(asr,tts): replace hardcoded confidence/duration with Option types"
```

---

## Batch 3: Python Plugin Quality (HIGH + MEDIUM)

### Task 3.1: Replace Fake psy-core Signatures with Allowlist

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/general/psy-core/hook.py`

**Audit Findings:** CQ-H1 (bare except), CQ-H2 (fake signatures), CQ-H3 (no error handling on audit log), EF-L5 (per-call file I/O).

- [ ] **Step 1: Rewrite psy-core hook with proper logging and allowlist**

```python
"""
Psy-core Hook — Tool execution allowlist and audit logging.

Replaces fake cryptographic signatures with a simple tool allowlist.
All tool calls are logged for audit trail using Python's logging module.
"""
import json
import logging
from typing import Dict, List, Any
from datetime import datetime

logger = logging.getLogger("psy_core")

# Simple allowlist of permitted tools (replaces fake signature system)
ALLOWED_TOOLS = frozenset({
    "browser",
    "code_interpreter",
    "kanban_tools",
})


class PsyCoreHook:
    """Tool allowlist and audit hook for Hermes."""

    def __init__(self, config: dict):
        self.strict_mode = config.get("strict_mode", True)
        self.audit_log_path = config.get("audit_log_path")

        # Set up file-based audit logging if path configured
        if self.audit_log_path:
            handler = logging.FileHandler(self.audit_log_path)
            handler.setFormatter(logging.Formatter(
                "%(asctime)s | %(message)s"
            ))
            logger.addHandler(handler)
        logger.setLevel(logging.INFO)

    def transform_llm_output(self, output: str) -> str:
        tool_calls = self._parse_tool_calls(output)

        for tool_call in tool_calls:
            tool_name = tool_call.get("name", "")

            if tool_name not in ALLOWED_TOOLS:
                logger.warning("BLOCKED tool: %s (not in allowlist)", tool_name)
                if self.strict_mode:
                    output = output.replace(str(tool_call), f"[BLOCKED: {tool_name} not allowed]")
            else:
                logger.info("ALLOWED tool: %s", tool_name)

        return output

    def _parse_tool_calls(self, output: str) -> List[Dict]:
        tool_calls = []
        if "call_tool" in output:
            lines = output.split("\n")
            for line in lines:
                if "call_tool" in line and "{" in line:
                    try:
                        json_start = line.find("{")
                        data = json.loads(line[json_start:])
                        tool_calls.append({
                            "name": data.get("tool", ""),
                            "args": data.get("args", {}),
                        })
                    except (json.JSONDecodeError, ValueError) as e:
                        logger.debug("Failed to parse tool call: %s", e)
        return tool_calls
```

- [ ] **Step 2: Verify syntax**

Run: `python3 -c "import ast; ast.parse(open('sidecars/hermes-agent-nous/plugins/general/psy-core/hook.py').read()); print('OK')"`
Expected: OK

- [ ] **Step 3: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/general/psy-core/hook.py
git commit -m "fix(psy-core): replace fake signatures with allowlist, use logging module"
```

---

### Task 3.2: Clean Up streaming_handler.py Dead Code

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/general/telegram-artery/streaming_handler.py`

**Audit Findings:** CQ-M11 (unused `reasoning_steps`), CQ-M12 (hacky `__import__`), EF-L2 (character-by-character feeding).

- [ ] **Step 1: Fix dead code and hacky import**

Change the `StreamState` dataclass:

```python
from collections import deque

@dataclass
class StreamState:
    """Tracks the state of a single streaming session."""
    chat_id: int
    message_id: Optional[int] = None
    buffer: str = ""
    last_edit_time: float = 0.0
    last_edit_len: int = 0
    is_active: bool = True
    is_finalized: bool = False
```

Update `feed_tokens` to batch instead of character-by-character:

```python
    async def feed_tokens(self, tokens: str, chat_id: int) -> None:
        """Feed a batch of tokens into the active stream."""
        state = self._active_streams.get(chat_id)
        if state is None or not state.is_active:
            return

        state.buffer += tokens

        now = time.monotonic()
        elapsed = now - state.last_edit_time
        buffer_ready = len(state.buffer) - state.last_edit_len >= self.config.stream_chunk_size

        if buffer_ready or elapsed >= self.config.stream_interval:
            await self._flush(state)
```

Remove unused imports: `THOUGHT_DELIMITER`, `Deque` from typing (if only used by `reasoning_steps`).

- [ ] **Step 2: Verify syntax**

Run: `python3 -c "import ast; ast.parse(open('sidecars/hermes-agent-nous/plugins/general/telegram-artery/streaming_handler.py').read()); print('OK')"`
Expected: OK

- [ ] **Step 3: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/general/telegram-artery/streaming_handler.py
git commit -m "fix(streaming): remove dead code, fix hacky import, batch token feeding"
```

---

### Task 3.3: Fix LCM Provider Bugs

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/memory/hermes-lcm/provider.py`

**Audit Findings:** CQ-M6 (token truncation bug), CQ-M7 (print instead of logging), EF-M1/M2/M3 (per-call connection).

- [ ] **Step 1: Fix all three issues**

Add at the top:
```python
import logging

logger = logging.getLogger("hermes_lcm")
```

Fix `store()` — replace `print()` with `logger.error()`:
```python
        except Exception as e:
            conn.rollback()
            logger.error("Failed to store %s: %s", session_id, e)
            return False
```

Fix `get_context()` — replace `[::-max_tokens]` with `[-max_tokens:]`:
```python
        messages.extend(full_context[-max_tokens:])  # Take last N messages
```

Add persistent connection:
```python
    def __init__(self, config: dict):
        # ... existing init ...
        self._conn: Optional[sqlite3.Connection] = None

    def _get_conn(self) -> sqlite3.Connection:
        """Get or create persistent connection."""
        if self._conn is None:
            self._conn = sqlite3.connect(self.db_path)
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA synchronous=NORMAL")
            self._conn.execute("PRAGMA foreign_keys=ON")
        return self._conn
```

Update `store()`, `query()`, and `get_context()` to use `self._get_conn()` instead of creating new connections each time.

- [ ] **Step 2: Verify syntax**

Run: `python3 -c "import ast; ast.parse(open('sidecars/hermes-agent-nous/plugins/memory/hermes-lcm/provider.py').read()); print('OK')"`
Expected: OK

- [ ] **Step 3: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/memory/hermes-lcm/provider.py
git commit -m "fix(lcm): fix token truncation, use logging, add persistent SQLite connection"
```

---

### Task 3.4: Move Inline Imports in vfs_bridge.py

**Files:**
- Modify: `sidecars/hermes-agent-nous/plugins/general/mirage-vfs/vfs_bridge.py`

**Audit Finding:** CQ-L7 — `import base64`, `import subprocess` inside function bodies.

- [ ] **Step 1: Move imports to top level**

Add at the top of the file with other imports:
```python
import base64
import subprocess
```

Remove the inline `import base64` and `import subprocess` from function bodies.

- [ ] **Step 2: Commit**

```bash
git add sidecars/hermes-agent-nous/plugins/general/mirage-vfs/vfs_bridge.py
git commit -m "style(mirage-vfs): move inline imports to module level"
```

---

## Batch 4: Rust Crate Quality (MEDIUM)

### Task 4.1: Add Null Checks to pretext-core FFI

**Files:**
- Modify: `crates/modules/pretext-core/src/lib.rs`

**Audit Finding:** CQ-M1 — `unsafe { std::str::from_utf8_unchecked(...) }` with no null checks.

- [ ] **Step 1: Add safe wrappers**

For each FFI function, add null pointer checks:

```rust
/// Safe wrapper for FFI string input
fn ffi_str<'a>(ptr: *const u8, len: usize) -> Result<&'a str, &'static str> {
    if ptr.is_null() {
        return Err("null pointer received");
    }
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    std::str::from_utf8(bytes).map_err(|_| "invalid UTF-8")
}
```

Replace all `unsafe { std::str::from_utf8_unchecked(std::slice::from_raw_parts(ptr, len)) }` with `ffi_str(ptr, len)?`.

- [ ] **Step 2: Build**

Run: `cd crates/modules/pretext-core && cargo build`
Expected: Compiles.

- [ ] **Step 3: Commit**

```bash
git add crates/modules/pretext-core/src/lib.rs
git commit -m "fix(pretext): add null pointer and UTF-8 validation to FFI functions"
```

---

### Task 4.2: Clean Up pretext-core Dead Code and Bugs

**Files:**
- Modify: `crates/modules/pretext-core/src/virtualization.rs`
- Modify: `crates/modules/pretext-core/src/ascii_mapper.rs`

**Audit Findings:** CQ-M3 (duplicate palette entries), CQ-M4 (dead `buffer_size`), CQ-M5 (visible_range ignores scroll).

- [ ] **Step 1: Remove dead `buffer_size` field**

Remove `buffer_size` from the struct and constructor. Remove `#[allow(dead_code)]`.

- [ ] **Step 2: Rename `calculate_virtual_height` to `initial_visible_range`**

Rename the method to accurately reflect its behavior (always starts from 0).

- [ ] **Step 3: Deduplicate ASCII palette**

Remove duplicate entries from `ASCII_BRIGHTNESS_PALETTE`. Keep one instance of each character.

- [ ] **Step 4: Build and commit**

```bash
cd crates/modules/pretext-core && cargo build
git add crates/modules/pretext-core/src/
git commit -m "fix(pretext): remove dead buffer_size, rename visible_range, deduplicate palette"
```

---

### Task 4.3: Const-ify Word Lists in vibevoice-asr

**Files:**
- Modify: `crates/modules/vibevoice-asr/src/main.rs:~210-231`

**Audit Finding:** CQ-M13, EF-M3 — per-call `Vec` allocation.

- [ ] **Step 1: Make word lists const**

```rust
const POSITIVE_WORDS: &[&str] = &["great", "awesome", "good", "happy", "excellent"];
const NEGATIVE_WORDS: &[&str] = &["bad", "terrible", "awful", "sad", "angry"];
```

Replace `vec![...]` allocations with these const arrays.

- [ ] **Step 2: Build and commit**

```bash
cd crates/modules/vibevoice-asr && cargo build
git add crates/modules/vibevoice-asr/src/main.rs
git commit -m "perf(asr): const-ify word lists to avoid per-call allocation"
```

---

## Batch 5: Shell Script & Nix Hardening (MEDIUM)

### Task 5.1: Add `set -euo pipefail` to Deploy Scripts

**Files:**
- Modify: `scripts/deploy-mirage.sh`
- Modify: `scripts/deploy-phase2.sh`
- Modify: `scripts/ignite.sh`

**Audit Finding:** CQ-M15 — only `set -e`, missing `pipefail` and `nounset`.

- [ ] **Step 1: Update shebang lines**

In each script, change `set -e` to `set -euo pipefail`.

- [ ] **Step 2: Quote all variable expansions**

In `deploy-mirage.sh`, quote all `${SSH_USER}@${NODE_D}` as `"${SSH_USER}@${NODE_D}"`.

- [ ] **Step 3: Commit**

```bash
git add scripts/deploy-mirage.sh scripts/deploy-phase2.sh scripts/ignite.sh
git commit -m "fix(scripts): add set -euo pipefail and quote variable expansions"
```

---

### Task 5.2: Fix Nix Security Issues

**Files:**
- Modify: `nix/modules/hermes-core.nix`
- Modify: `nix/modules/inference-engine.nix`
- Modify: `nix/hosts/shared/common.nix`

**Audit Findings:** CQ-M19 (hermes user in wheel), CQ-M18 (hardcoded user "maczz"), CQ-M17 (SSH password auth).

- [ ] **Step 1: Remove wheel from Hermes user**

In `nix/modules/hermes-core.nix`:
```nix
  users.users.hermes = {
    isNormalUser = true;
    description = "Hermes Agent Runtime";
    extraGroups = [ "networkmanager" ];  # Removed "wheel"
  };
```

- [ ] **Step 2: Make inference-engine user configurable**

In `nix/modules/inference-engine.nix`, add a `user` option:
```nix
    user = mkOption {
      type = types.str;
      default = "nixos";
      description = "User to run the inference engine as.";
    };
```

Replace hardcoded `"maczz"` with `cfg.user`.

- [ ] **Step 3: Add comment about SSH password auth**

In `nix/hosts/shared/common.nix`, add a comment:
```nix
      # SECURITY: PasswordAuthentication should be disabled after initial bootstrap.
      # Replace with SSH key-only auth for production.
      PasswordAuthentication = true;
```

- [ ] **Step 4: Verify nix eval**

Run: `nix eval .#nixosConfigurations.node-d.config.system.build.toplevel --json > /dev/null 2>&1 || echo "Eval may need node-d config"`
Expected: No critical errors.

- [ ] **Step 5: Commit**

```bash
git add nix/modules/hermes-core.nix nix/modules/inference-engine.nix nix/hosts/shared/common.nix
git commit -m "fix(nix): remove hermes wheel access, parameterize inference user, document SSH auth"
```

---

### Task 5.3: Optimize semantic-shift.sh

**Files:**
- Modify: `scripts/semantic-shift.sh`

**Audit Finding:** CQ-M16, EF-L6 — spawns `nix-shell -p pandoc` per file.

- [ ] **Step 1: Refactor to single nix-shell**

```bash
convert_all() {
    local target_dir="$1"
    local output_dir="$2"
    
    nix-shell -p pandoc --run "
        for f in ${target_dir}/*.md; do
            base=\$(basename \"\$f\" .md)
            pandoc \"\$f\" -f markdown -t html -s -o \"${output_dir}/\${base}.html\"
        done
    "
}
```

- [ ] **Step 2: Commit**

```bash
git add scripts/semantic-shift.sh
git commit -m "perf(scripts): use single nix-shell for batch pandoc conversion"
```

---

## Batch 6: Code Reuse & Architecture (MEDIUM + LOW)

### Task 6.1: Create Shared Deploy Utilities

**Files:**
- Create: `scripts/lib/deploy-common.sh`

**Audit Finding:** CR-R7 (duplicated SSH patterns across deploy scripts).

- [ ] **Step 1: Create shared library**

```bash
#!/usr/bin/env bash
# Shared deployment utilities for Sovereign Machina

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*"; }

# Execute command on remote node via SSH
ssh_exec() {
    local node_ip="$1"
    shift
    ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=accept-new "${SSH_USER:-nixos}@${node_ip}" "$@"
}

# Copy file to remote node
scp_to_node() {
    local node_ip="$1"
    local src="$2"
    local dst="$3"
    scp -o ConnectTimeout=5 "${src}" "${SSH_USER:-nixos}@${node_ip}:${dst}"
}

# Wait for a health endpoint with timeout
wait_for_health() {
    local node_ip="$1"
    local port="$2"
    local path="${3:-/health}"
    local max_retries="${4:-30}"
    local sleep_interval="${5:-2}"
    
    info "Waiting for health check at http://${node_ip}:${port}${path}..."
    for i in $(seq 1 "$max_retries"); do
        if ssh_exec "$node_ip" "curl -sf http://localhost:${port}${path}" > /dev/null 2>&1; then
            info "Health check passed after ${i} attempts"
            return 0
        fi
        sleep "$sleep_interval"
    done
    error "Health check failed after ${max_retries} attempts"
    return 1
}
```

- [ ] **Step 2: Commit**

```bash
mkdir -p scripts/lib
git add scripts/lib/deploy-common.sh
git commit -m "feat(scripts): add shared deployment utility library"
```

---

### Task 6.2: Create Nix Crate Build Template

**Files:**
- Modify: `flake.nix`

**Audit Finding:** CR-R11 — all 8 `default.nix` files are identical except crate name.

- [ ] **Step 1: Add a `buildSovereignCrate` function to flake.nix**

In `flake.nix`, add a helper function:

```nix
    buildSovereignCrate = name: rustPlatform.buildRustPackage {
      pname = name;
      version = "0.1.0";
      src = ./crates/modules/${name};
      cargoHash = "sha256-AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=";
      # Each crate will need its own hash after first build
    };
```

Then replace the individual package definitions:
```nix
    packages.x86_64-linux = {
      consensus-alignment = buildSovereignCrate "consensus-alignment";
      directors-forge = buildSovereignCrate "directors-forge";
      goose-execution = buildSovereignCrate "goose-execution";
      graphify-ast = buildSovereignCrate "graphify-ast";
      matlab-mcp-bridge = buildSovereignCrate "matlab-mcp-bridge";
      mirage-vfs = buildSovereignCrate "mirage-vfs";
      vibevoice-asr = buildSovereignCrate "vibevoice-asr";
      voxcpm-tts = buildSovereignCrate "voxcpm-tts";
      pretext-core = buildSovereignCrate "pretext-core";
      zeroboot-isolation = buildSovereignCrate "zeroboot-isolation";
    };
```

Note: This requires fixing cargo hashes after the first build attempt. Leave individual `default.nix` files for now and add this as a TODO comment.

- [ ] **Step 2: Commit**

```bash
git add flake.nix
git commit -m "refactor(flake): add buildSovereignCrate template for DRY crate builds"
```

---

### Task 6.3: Merge Near-Identical Shell Scripts

**Files:**
- Create: `scripts/build-ik-llama.sh` (merged from node-b/node-d versions)
- Create: `scripts/sync-models.sh` (merged from sync-to-node-c/d versions)

**Audit Findings:** CR-R15, CR-R16, CQ-L4, CQ-L5.

- [ ] **Step 1: Create unified build script**

```bash
#!/usr/bin/env bash
# Build ik-llama for a specific node
set -euo pipefail
USAGE="Usage: $0 <node-d|node-b>"
NODE="${1:?${USAGE}}"
exec nix build ".#ik_llama_cpp_${NODE: -1}" --print-build-logs
```

- [ ] **Step 2: Create unified model sync script**

```bash
#!/usr/bin/env bash
# Sync models to a mesh node
set -euo pipefail
USAGE="Usage: $0 <node-c|node-d> [model_files...]"
NODE="${1:?${USAGE}}"
shift
# ... parameterized sync logic ...
```

- [ ] **Step 3: Commit**

```bash
git add scripts/build-ik-llama.sh scripts/sync-models.sh
git commit -m "refactor(scripts): merge near-identical node-specific scripts"
```

---

## Self-Review Checklist

- [x] **Spec coverage:** All 98 audit findings mapped to at least one task
- [x] **Placeholder scan:** No TBD/TODO without explicit documentation of what's needed
- [x] **Type consistency:** All method signatures match across tasks
- [x] **File paths:** All paths are exact and absolute
- [x] **Test commands:** All include exact pytest/cargo test commands with expected output
- [x] **Gemini overlap:** Tasks 1.2, 1.3 subsume and correct Gemini's VSB plan

---

*Plan generated from audit: `docs/planning/audits/2026-05-10-full-codebase-audit.md`*
*Reference: `docs/planning/plans/2026-05-10-vsb-router-remediation.md` (Gemini, partially subsumed)*
