# Sovereign Machina Full Codebase Audit

**Date:** 2026-05-10
**Scope:** All sovereign-authored code (Rust crates, Python plugins, shell scripts, Nix modules)
**Auditor:** Droid (simplify skill, three-agent parallel review)
**Status:** READ-ONLY — no code changes made

---

## Executive Summary

Three independent review agents audited the entire sovereign codebase (~10,600 lines across 60+ files) for **Code Reuse**, **Code Quality**, and **Efficiency**. The audit produced **98 total findings** across all three dimensions.

### Severity Distribution

| Severity | Code Reuse | Code Quality | Efficiency | Total |
|----------|-----------|-------------|-----------|-------|
| CRITICAL | 3 | 5 | 0 | **8** |
| HIGH | 5 | 11 | 3 | **19** |
| MEDIUM | 6 | 19 | 16 | **41** |
| LOW | 3 | 7 | 8 | **18** |
| INFO | 3 | 4 | 5 | **12** |
| **Total** | **20** | **46** | **32** | **98** |

### Top 5 Critical Issues

1. **`bot_coordinator.py` NameError** — `session_id` undefined in `finally` block, causing session leaks and runtime crashes
2. **Command Injection in 3 Rust Crates** — `goose-execution`, `matlab-mcp-bridge`, `directors-forge` pass unsanitized input to shell interpreters
3. **Hardcoded Mesh Secret Key** — `vsb_router.py` contains a default secret key in source code
4. **Fake Cryptographic Verification** — `psy-core/hook.py` uses trivially computable SHA256 truncations as "signatures"
5. **Consensus System is a No-Op** — `consensus-alignment` always returns `Ok(true)` with no real ledger checking

---

## I. Code Reuse Findings (20)

### CRITICAL (3)

#### CR-R1: Hermes Config YAML Heredoc Triplication
- **Files:** `scripts/deploy-phase2.sh`, `scripts/deploy-phase3-hermes-lcm.sh`, `scripts/deploy-mirage.sh`
- **Issue:** The full Hermes config YAML block (mesh nodes, model lists, provider config) is copy-pasted across all deployment scripts. Any topology change requires editing 3+ files.
- **Recommendation:** Extract into `scripts/hermes-config-template.yaml` sourced by all deploy scripts.

#### CR-R2: Mesh Topology Data Conflicts
- **Files:** `vsb_router.py` MESH_NODES, `artery_config.py` MESH_NODES, `deploy-phase2.sh` HERMES_CONFIG
- **Issue:** Three independent mesh topology definitions with slightly different model lists and port assignments.
- **Recommendation:** Single `mesh_topology.py` or YAML config imported everywhere.

#### CR-R3: Identical Rust Crate Boilerplate
- **Files:** All 8 `crates/modules/*/default.nix` files, all `main.rs` files with `#[tokio::main]` + `axum::Router` + `structopt::StructOpt`
- **Issue:** Every crate has nearly identical `default.nix`, and most `main.rs` files follow the same boilerplate pattern without a shared library.
- **Recommendation:** Create a `crates/sovereign-common` library with shared server setup, error types, and health check logic.

### HIGH (5)

#### CR-R4: Config Loading Pattern Duplication
- **Files:** `mirage_config.py`, `artery_config.py`, `n8n_config.py`
- **Issue:** Each plugin implements its own `load_config()` with env var fallback, YAML parsing, and default values. Same pattern, three implementations.
- **Recommendation:** Extract a shared `sovereign_config.py` utility.

#### CR-R5: HTTP Client Setup Duplication
- **Files:** `n8n_client.py` (urllib), `vsb_router.py` (httpx), `bot_coordinator.py` (httpx)
- **Issue:** Three different HTTP client implementations. `n8n_client.py` uses `urllib.request` while others use `httpx`.
- **Recommendation:** Standardize on `httpx` with a shared client factory.

#### CR-R6: Error Response Pattern Duplication
- **Files:** All Rust crate `main.rs` files
- **Issue:** Each crate independently defines error response JSON structures: `{"error": "..."}` constructed via `Json(json!({...}))`.
- **Recommendation:** Shared `sovereign_common::error_response()` function.

#### CR-R7: Deploy Script Node SSH Pattern
- **Files:** `deploy-phase2.sh`, `deploy-mirage.sh`, `deploy-n8n.sh`, `deploy-phase3-hermes-lcm.sh`, `directors-forge.sh`
- **Issue:** Each script has its own `ssh ${USER}@${NODE}` pattern with error handling. No shared SSH utility functions.
- **Recommendation:** Create `scripts/lib/deploy-common.sh` with shared `ssh_exec()`, `scp_to_node()`, `wait_for_health()` functions.

#### CR-R8: Tool Registration Pattern Duplication
- **Files:** `n8n-mcp/__init__.py`, `mirage-vfs/__init__.py`, `telegram-artery/__init__.py`
- **Issue:** Each plugin independently implements `register()` with `ctx.register_tool()` calls, tool definitions, and async handlers.
- **Recommendation:** Extract a `sovereign_plugin_base.py` with common registration patterns.

### MEDIUM (6)

#### CR-R9: Rust Error Type Duplication
- **Files:** `mirage-vfs/src/lib.rs`, `vibevoice-asr/src/main.rs`, `directors-forge/src/main.rs`
- **Issue:** Each crate defines its own `AppError` enum with `thiserror` derive. Same variants: `Io`, `Config`, `Internal`.
- **Recommendation:** Shared error types in `sovereign-common` crate.

#### CR-R10: Shell Script SSH Connection Patterns
- **Files:** `sync-to-node-c.sh`, `sync-to-node-d.sh`, `deploy-phase2.sh`
- **Issue:** Sequential SSH operations per crate/file. Could batch into single SSH sessions.
- **Recommendation:** Shared `ssh_batch()` utility function.

#### CR-R11: Nix Module Default Derivation Template
- **Files:** All 8 `crates/modules/*/default.nix`
- **Issue:** All 8 files are 17-18 lines, nearly identical, differing only in crate name.
- **Recommendation:** Create a `callCrateBuild` function in `flake.nix` that parameterizes the build.

#### CR-R12: Health Check Endpoint Pattern
- **Files:** Most Rust crate `main.rs` files
- **Issue:** Each crate implements `GET /health` returning `{"status": "ok"}` independently.
- **Recommendation:** Shared health check route from `sovereign-common`.

#### CR-R13: Python Plugin Config Validation
- **Files:** `n8n_config.py`, `artery_config.py`, `mirage_config.py`
- **Issue:** Each config class validates required fields independently. No shared validation utilities.
- **Recommendation:** Shared `validate_required_fields()` helper.

#### CR-R14: Shell Script Logging Pattern
- **Files:** All deployment scripts
- **Issue:** Each script defines its own `log()` / `info()` / `error()` functions with different formatting.
- **Recommendation:** Source a shared `scripts/lib/logging.sh`.

### LOW (3)

#### CR-R15: `model-artery/sync-to-node-*.sh` Near-Identical Scripts
- **Files:** `sync-to-node-c.sh`, `sync-to-node-d.sh`
- **Issue:** Same script structure, only target node and model list differ.
- **Recommendation:** Parameterize into single `sync-models.sh <node> <models...>`.

#### CR-R16: `hermes/node-*-build-ikllama.sh` Near-Identical Scripts
- **Files:** `node-d-build-ikllama.sh`, `node-b-build-ikllama.sh`
- **Issue:** Only the nix attribute name differs.
- **Recommendation:** Single `build-ik-llama.sh <node>`.

#### CR-R17: `__init__.py` Plugin Registration Boilerplate
- **Files:** All sovereign plugin `__init__.py` files
- **Issue:** Same `Plugin` class with `register()` method structure.
- **Recommendation:** Base class in `sovereign_plugin_base.py`.

### INFO (3)

#### CR-R18: Nix Host Configs Share Common Patterns
- **Files:** `nix/hosts/node-a/default.nix`, `node-c/default.nix`, `node-d/default.nix`
- **Issue:** All import `shared/common.nix` and `shared/hardware-base.nix` — good reuse, but hardware-specific values (MACs, disks) are hardcoded.
- **Recommendation:** Document that hardware values need updating for new nodes.

#### CR-R19: Hermes LCM Provider Has Reusable SQLite Patterns
- **Files:** `hermes-lcm/provider.py`
- **Issue:** SQLite connection management pattern could be extracted for other plugins needing persistence.
- **Recommendation:** Consider a shared `sovereign_db.py` utility.

#### CR-R20: VSB Router Streaming Parser Could Be Shared
- **Files:** `vsb_router.py` think-block parsing
- **Issue:** Think-block detection logic could be useful for other streaming consumers.
- **Recommendation:** Extract into `sovereign_streaming.py` if more consumers emerge.

---

## II. Code Quality Findings (46)

### CRITICAL (5)

#### CQ-C1: `bot_coordinator.py` Undefined Variable NameError
- **File:** `sidecars/.../telegram-artery/bot_coordinator.py:~142`
- **Category:** Error Handling
- **Issue:** `self._sessions.pop(session_id, None)` references undefined `session_id`. Correct variable is `session.session_id`. Runtime NameError crashes on every request completion, sessions leak indefinitely.
- **Fix:** Change to `self._sessions.pop(session.session_id, None)`

#### CQ-C2: Hardcoded Default Mesh Secret
- **File:** `sidecars/.../sovereign_vsb/vsb_router.py:~65`
- **Category:** Security
- **Issue:** `self.secret_key = os.getenv("SOVEREIGN_MESH_SECRET", "machina-sovereign-mesh-v3-secret-key")` — default secret committed to source tree.
- **Fix:** Remove default. Fail if env var not set.

#### CQ-C3: Command Injection in `goose-execution`
- **File:** `crates/modules/goose-execution/src/main.rs:~60-68`
- **Category:** Security
- **Issue:** `req.script` passed verbatim to `bash -c`, `python -c`, `node -e`. No sandboxing or sanitization.
- **Fix:** Strict input validation, sandbox with Firecracker/containers, or command allowlist.

#### CQ-C4: Command Injection in `matlab-mcp-bridge`
- **File:** `crates/modules/matlab-mcp-bridge/src/main.rs:~45`
- **Category:** Security
- **Issue:** `format!("run('{}')", req.script)` — single quote breakout allows arbitrary MATLAB commands.
- **Fix:** Proper argument passing or escape validation.

#### CQ-C5: Shell Injection in `directors-forge`
- **File:** `crates/modules/directors-forge/src/main.rs:~65`
- **Category:** Security
- **Issue:** Generated wrapper scripts interpolate `tool_def.command` and `tool_def.args` without escaping.
- **Fix:** Shell escaping or command allowlist.

### HIGH (11)

#### CQ-H1: Bare `except:` in `psy-core/hook.py`
- **File:** `sidecars/.../psy-core/hook.py:~83-86`
- **Category:** Error Handling
- **Issue:** `except:` swallows all exceptions including KeyboardInterrupt, SystemExit.
- **Fix:** `except (json.JSONDecodeError, ValueError):`

#### CQ-H2: Fake Cryptographic Signatures in `psy-core`
- **File:** `sidecars/.../psy-core/hook.py:~17-21`
- **Category:** Security
- **Issue:** `TRUSTED_SIGNATURES` uses `sha256(name)[:8]` — trivially forgeable. Zero actual security.
- **Fix:** Implement real HMAC/Ed25519 or replace with simple allowlist.

#### CQ-H3: `psy-core` Audit Logging Without Error Handling
- **File:** `sidecars/.../psy-core/hook.py:~96`
- **Category:** Error Handling
- **Issue:** `open(self.audit_log_path, "a")` with no error handling. Uses `print()` instead of `logging`.
- **Fix:** Use `logging` module with FileHandler.

#### CQ-H4: Consensus System Unconditionally Approves
- **File:** `crates/modules/consensus-alignment/src/main.rs:~82-88`
- **Category:** Dead Code
- **Issue:** `_check_node_a_ledger()` always returns `Ok(true)`. Consensus is a no-op.
- **Fix:** Implement real Node A ledger query or document as unimplemented.

#### CQ-H5: Consensus Rule Checking via Substring Match
- **File:** `crates/modules/consensus-alignment/src/main.rs:~76-79`
- **Category:** Stringly-Typed
- **Issue:** `context.contains(&rule.invariant)` — trivially gameable string matching.
- **Fix:** Structured context objects with typed validation.

#### CQ-H6: Zeroboot PID Tracking Broken
- **File:** `crates/modules/zeroboot-isolation/src/main.rs:~56-63`
- **Category:** Error Handling
- **Issue:** Firecracker doesn't output PID to stdout. `self.pid` always `None`. Lifecycle management non-functional.
- **Fix:** Use Firecracker API socket or track spawn PID.

#### CQ-H7: Hardcoded Confidence Score
- **File:** `crates/modules/vibevoice-asr/src/main.rs:~150`
- **Category:** Dead Code
- **Issue:** Always returns `confidence: 0.95`. Misleading for API consumers.
- **Fix:** Parse actual confidence from Whisper or return `None`.

#### CQ-H8: Bogus Audio Duration Calculation
- **File:** `crates/modules/voxcpm-tts/src/main.rs:~66`
- **Category:** Dead Code
- **Issue:** Duration = `(text.len() as u32) * 100` — 100ms per character. Wildly inaccurate.
- **Fix:** Read actual audio metadata.

#### CQ-H9: Mesh Topology Triplication (Quality Angle)
- **File:** `vsb_router.py`, `artery_config.py`, `deploy-phase2.sh`
- **Category:** Redundant State
- **Issue:** Three independent mesh definitions with diverging values.
- **Fix:** Single source of truth.

#### CQ-H10: Deploy Script Config Heredoc Duplication
- **File:** `scripts/deploy-phase2.sh`, `scripts/deploy-phase3-hermes-lcm.sh`
- **Category:** Copy-Paste
- **Issue:** `HERMES_CONFIG` YAML heredoc duplicated nearly verbatim.
- **Fix:** Shared template file.

#### CQ-H11: Default n8n Password in Deploy Script
- **File:** `scripts/deploy-n8n.sh:~33`
- **Category:** Security
- **Issue:** `N8N_PASSWORD:-sovereign-machina` default password committed to repo.
- **Fix:** Require explicit `N8N_PASSWORD` with no default.

### MEDIUM (19)

#### CQ-M1: Unsafe FFI in `pretext-core` — No Null/UTF8 Checks
- **File:** `crates/modules/pretext-core/src/lib.rs:~12-50`
- **Category:** Leaky Abstraction
- **Issue:** `unsafe { std::str::from_utf8_unchecked(...) }` on raw pointers with no null checks.
- **Fix:** Add null checks, use `CStr`, validate UTF-8.

#### CQ-M2: Stringly-Typed Font Family in `pretext-core`
- **File:** `crates/modules/pretext-core/src/layout.rs:~40-50`
- **Category:** Stringly-Typed
- **Issue:** Font matching via `match font_family { "Georgia" => ... }` — fragile.
- **Fix:** `FontFamily` enum with `FromStr`.

#### CQ-M3: ASCII Brightness Palette Duplicates
- **File:** `crates/modules/pretext-core/src/ascii_mapper.rs:~14`
- **Category:** Dead Code
- **Issue:** Duplicate entries in `ASCII_BRIGHTNESS_PALETTE` ('+', '=', 'x', 'X' appear twice).
- **Fix:** Remove duplicates, calibrate palette.

#### CQ-M4: Dead `buffer_size` Field in `virtualization.rs`
- **File:** `crates/modules/pretext-core/src/virtualization.rs:~28`
- **Category:** Dead Code
- **Issue:** `#[allow(dead_code)] buffer_size` never used.
- **Fix:** Remove or implement buffer-based windowing.

#### CQ-M5: `visible_range` Ignores Scroll Position
- **File:** `crates/modules/pretext-core/src/virtualization.rs:~61`
- **Category:** Leaky Abstraction
- **Issue:** Always starts from `(0, visible_count)` regardless of scroll position.
- **Fix:** Accept `scroll_y` parameter, use `find_node_at_scroll`.

#### CQ-M6: LCM Token Truncation Bug
- **File:** `sidecars/.../hermes-lcm/provider.py:~130`
- **Category:** Error Handling
- **Issue:** `messages[::-max_tokens:]` slices by step, not by count. Returns every Nth element.
- **Fix:** Use `full_context[-N:]` for last N messages.

#### CQ-M7: `print()` Instead of `logging` in LCM Provider
- **File:** `sidecars/.../hermes-lcm/provider.py:~46`
- **Category:** Error Handling
- **Issue:** Uses `print()` for error reporting. Inconsistent with other plugins.
- **Fix:** Replace with `logger.error()`.

#### CQ-M8: SQLite `LIKE` for Context Search
- **File:** `sidecars/.../hermes-lcm/provider.py:~65`
- **Category:** Leaky Abstraction
- **Issue:** `LIKE %query%` provides no relevance ranking. Unsuitable for context management.
- **Fix:** Use SQLite FTS5 or embedding-based search.

#### CQ-M9: Inconsistent HTTP Client Libraries
- **File:** `vsb_router.py` (httpx) vs `n8n_client.py` (urllib)
- **Category:** Inconsistent Pattern
- **Fix:** Standardize on `httpx`.

#### CQ-M10: Fragile Think-Block Parser in VSB Router
- **File:** `sidecars/.../sovereign_vsb/vsb_router.py:~75`
- **Category:** Leaky Abstraction
- **Issue:** `in_think_block` state machine can desync on malformed chunks.
- **Fix:** Rely on `reasoning_content` from API, remove heuristic parsing.

#### CQ-M11: Unused `reasoning_steps` in `streaming_handler.py`
- **File:** `sidecars/.../telegram-artery/streaming_handler.py:~29`
- **Category:** Dead Code
- **Issue:** `reasoning_steps: Deque[str]` declared but never populated.
- **Fix:** Remove unused fields.

#### CQ-M12: Hacky `__import__` in Dataclass Default
- **File:** `sidecars/.../telegram-artery/streaming_handler.py:~27`
- **Category:** Dead Code
- **Issue:** `__import__("collections").deque()` as default_factory.
- **Fix:** Import `deque` properly, use `field(default_factory=deque)`.

#### CQ-M13: Per-Call Vec Allocation in `calculate_vibe`
- **File:** `crates/modules/vibevoice-asr/src/main.rs:~210`
- **Category:** Dead Code
- **Issue:** `vec!["great", "awesome", ...]` allocates per call.
- **Fix:** `const POSITIVE_WORDS: [&str; 5] = [...]`.

#### CQ-M14: Broken Rust Executor in `goose-execution`
- **File:** `crates/modules/goose-execution/src/main.rs:~60`
- **Category:** Error Handling
- **Issue:** `rustc --eval` does not exist. Rust execution path always fails.
- **Fix:** Use `cargo script` or temp file compilation.

#### CQ-M15: Missing `set -euo pipefail` in Deploy Scripts
- **Files:** `deploy-mirage.sh`, `deploy-phase2.sh`, `ignite.sh`
- **Category:** Security
- **Issue:** Only `set -e`, missing `pipefail` and `nounset`. Unquoted variable expansions.
- **Fix:** Add `set -euo pipefail`, quote all variables.

#### CQ-M16: Per-File `nix-shell -p pandoc` in `semantic-shift.sh`
- **File:** `scripts/semantic-shift.sh:~19`
- **Category:** Inconsistent Pattern
- **Issue:** Spawns nix-shell per file. Hundreds of seconds overhead for large directories.
- **Fix:** Single nix-shell with all conversions inside.

#### CQ-M17: `hermes-lcm.nix` ReadWritePaths Completeness
- **File:** `nix/modules/hermes-lcm.nix:~87`
- **Category:** Nix Quality
- **Issue:** `ReadWritePaths` may be incomplete for `ProtectSystem = "strict"`.
- **Fix:** Verify all write paths are listed.

#### CQ-M18: `network-optimization.nix` Fights systemd-resolved
- **File:** `nix/modules/network-optimization.nix:~25`
- **Category:** Nix Quality
- **Issue:** Direct `/etc/resolv.conf` write conflicts with systemd-resolved and WSL2 DNS.
- **Fix:** Use `networking.nameservers` in NixOS config.

#### CQ-M19: Hermes User in Wheel Group
- **File:** `nix/modules/hermes-core.nix:~26`
- **Category:** Security
- **Issue:** `extraGroups = [ "wheel" ... ]` gives Hermes full sudo access.
- **Fix:** Remove "wheel", use specific sudoers rules.

### LOW (7)

#### CQ-L1: Magic Number in Layout Test
- **File:** `crates/modules/pretext-core/tests/layout_tests.rs:6`
- **Category:** Dead Code
- **Issue:** `assert_eq!(layout.tight_width, 62.72)` — fragile magic number.
- **Fix:** Use tolerance-based assertion.

#### CQ-L2: `ConsensusAction` Should Be Enum
- **File:** `crates/modules/consensus-alignment/src/main.rs:~25`
- **Category:** Stringly-Typed
- **Fix:** Define `enum ConsensusAction { Block, Warn, Log }`.

#### CQ-L3: Graphify AST "Parsing" is Just String Matching
- **File:** `crates/modules/graphify-ast/src/main.rs:~52-62`
- **Category:** Leaky Abstraction
- **Issue:** `line.starts_with("def ")` — not a real parser.
- **Fix:** Use tree-sitter or document as pattern-based extractor.

#### CQ-L4: `node-*-build-ikllama.sh` Copy-Paste
- **Files:** `node-d-build-ikllama.sh`, `node-b-build-ikllama.sh`
- **Category:** Copy-Paste
- **Fix:** Parameterize into single script.

#### CQ-L5: `sync-to-node-*.sh` Copy-Paste
- **Files:** `sync-to-node-c.sh`, `sync-to-node-d.sh`
- **Category:** Copy-Paste
- **Fix:** Parameterize into single script.

#### CQ-L6: Hardcoded Worktree Path in Test Script
- **File:** `scripts/test-hermes-lcm-local.sh:~16`
- **Category:** Dead Code
- **Issue:** References worktree that may not exist.
- **Fix:** Use `$PROJECT_ROOT` or accept as argument.

#### CQ-L7: Inline Imports in `vfs_bridge.py`
- **File:** `sidecars/.../mirage-vfs/vfs_bridge.py:~110,~130`
- **Category:** Inconsistent Pattern
- **Fix:** Move `import base64`, `import subprocess` to top level.

### INFO (4)

#### CQ-I1: Unused `base_url` in VSB Provider
- **File:** `sidecars/.../sovereign_vsb/__init__.py:~15`
- **Issue:** `base_url` set but never referenced.
- **Fix:** Remove or use as default endpoint.

#### CQ-I2: BLE Notification Handler Never Registered
- **File:** `crates/modules/vibevoice-asr/src/ble_stream.rs:~100-120`
- **Issue:** PCM buffer never receives data — notification subscription missing.
- **Fix:** Register handler or document as future work.

#### CQ-I3: Hardcoded MAC Address in Nix Host Config
- **File:** `nix/hosts/node-a/default.nix:~10-12`
- **Issue:** Hardware-specific values need updating for new hardware.
- **Fix:** Add comment documenting this requirement.

#### CQ-I4: Magic Constant `AVG_CHARS_PER_LINE` in Virtualization
- **File:** `crates/modules/pretext-core/src/virtualization.rs:~50`
- **Issue:** `50.0` may not match actual layout engine behavior.
- **Fix:** Derive from layout engine or make configurable.

---

## III. Efficiency Findings (32)

### HIGH (3)

#### EF-H1: VSB Router Pulse Sync Blocks Event Loop
- **File:** `sidecars/.../sovereign_vsb/vsb_router.py:~250-267`
- **Category:** Blocking I/O
- **Issue:** `start_pulse_sync()` runs infinite `while self.running` loop synchronously from `__init__`. Blocks Hermes agent startup forever.
- **Fix:** Background thread or asyncio Task.

#### EF-H2: Zeroboot Health Check Spawns Process Every Second
- **File:** `crates/modules/zeroboot-isolation/src/main.rs:~115-123`
- **Category:** Hot-Path Bloat
- **Issue:** `Command::new("kill").arg("-0")` every 1 second — fork+exec syscall per check.
- **Fix:** Use `nix::sys::signal::kill()` or `/proc/{pid}/status` check (zero-fork).

#### EF-H3: n8n Client `time.sleep()` Blocks Async Event Loop
- **File:** `sidecars/.../n8n-mcp/n8n_client.py:~232-237`
- **Category:** Blocking I/O
- **Issue:** Synchronous `time.sleep(delay)` in retry loop called from async hooks. Can block 30+ seconds.
- **Fix:** Convert to async `httpx.AsyncClient` with `asyncio.sleep()`.

### MEDIUM (16)

#### EF-M1: LCM Provider Opens New SQLite Connection Per Operation
- **File:** `sidecars/.../hermes-lcm/provider.py:~107-204`
- **Category:** Unnecessary Work
- **Issue:** `store()`, `query()`, `get_context()` each open/close a new connection. `get_context()` also deserializes full message history.
- **Fix:** Persistent connection or connection pool.

#### EF-M2: `pretext-core` Layout Double-Allocation
- **File:** `crates/modules/pretext-core/src/layout.rs:~64-69`
- **Category:** Allocation Waste
- **Issue:** `word.to_string()` allocates per word, then `segment.clone()` during line-breaking.
- **Fix:** Use `Cow<str>` or take ownership via `Vec::drain()`.

#### EF-M3: Per-Call Vec Allocation in `calculate_vibe`
- **File:** `crates/modules/vibevoice-asr/src/main.rs:~228-231`
- **Category:** Allocation Waste
- **Issue:** `vec!["great", ...]` + `text.to_lowercase()` allocate per call.
- **Fix:** `const` word array, avoid lowercase allocation.

#### EF-M4: Synchronous Whisper Call in Async Context
- **File:** `crates/modules/vibevoice-asr/src/main.rs:~173-186`
- **Category:** Blocking I/O
- **Issue:** `Command::new().output()` blocks tokio runtime during entire Whisper invocation.
- **Fix:** `tokio::process::Command` or `spawn_blocking`.

#### EF-M5: TOCTOU in `voxcpm-tts` Constructor
- **File:** `crates/modules/voxcpm-tts/src/main.rs:~50-51`
- **Category:** TOCTOU
- **Issue:** `if !vox_path.exists()` check before use — file could disappear between check and use.
- **Fix:** Remove pre-check, handle error from actual execution.

#### EF-M6: TOCTOU in `matlab-mcp-bridge` Constructor
- **File:** `crates/modules/matlab-mcp-bridge/src/main.rs:~26-27`
- **Category:** TOCTOU
- **Fix:** Same as EF-M5.

#### EF-M7: TOCTOU in `vibevoice-asr` Constructor
- **File:** `crates/modules/vibevoice-asr/src/main.rs:~72-74`
- **Category:** TOCTOU
- **Fix:** Same as EF-M5.

#### EF-M8: Sequential Crate Builds in `deploy-phase2.sh`
- **File:** `scripts/deploy-phase2.sh:~37-62`
- **Category:** Script Efficiency
- **Issue:** 8 sequential `nix build` + per-crate SSH/rsync. Total time = sum of all builds.
- **Fix:** Parallel builds, batched rsync per node.

#### EF-M9: Sequential SSH Checks in Deploy Scripts
- **File:** `scripts/deploy-phase3-hermes-lcm.sh:~30-38`
- **Category:** Script Efficiency
- **Issue:** 4 sequential SSH checks with 5s timeout each. Worst case 20s.
- **Fix:** Parallel background checks.

#### EF-M10: Double SHA256 on Multi-GB Model Files
- **Files:** `scripts/model-artery/sync-to-node-c.sh:~37-43`, `sync-to-node-d.sh:~31-37`
- **Category:** Unnecessary Work
- **Issue:** SHA256 computed both locally and remotely for multi-GB GGUF files.
- **Fix:** Trust rsync integrity or use lighter checksums.

#### EF-M11: TOCTOU in Zeroboot Workspace Path
- **File:** `crates/modules/zeroboot-isolation/src/main.rs:~83-86`
- **Category:** TOCTOU
- **Issue:** `fs::create_dir_all` in `new()`, used later in `launch()`.
- **Fix:** Create directory in `launch()` only.

#### EF-M12: TOCTOU in Mirage VFS Mount
- **File:** `crates/modules/mirage-vfs/src/mount.rs:~17-23`
- **Category:** TOCTOU
- **Issue:** Checks `mount_point.exists()` then creates, then checks `is_mounted()`.
- **Fix:** Use `create_dir_all` (idempotent), handle mount errors directly.

#### EF-M13: Consensus Rule Iteration is Wasted Work
- **File:** `crates/modules/consensus-alignment/src/main.rs:~52-69`
- **Category:** No-Op Updates
- **Issue:** String-match rules always fail, fallback always returns true. All iteration is wasted.
- **Fix:** Remove rule iteration if ledger is always authoritative.

#### EF-M14: `directors-forge` Spawns Process Per Tool to Test
- **File:** `crates/modules/directors-forge/src/main.rs:~90-100`
- **Category:** Overly Broad
- **Issue:** `Command::new(&wrapper_path).arg("--help")` per tool — N process spawns.
- **Fix:** Check file permissions/execute bit instead.

#### EF-M15: Multiple SSH Connections in `deploy-n8n.sh`
- **File:** `scripts/deploy-n8n.sh:~71-82`
- **Category:** Script Efficiency
- **Issue:** 5+ separate SSH connections to same node for setup + 30 for health checks.
- **Fix:** Batch into single SSH session.

#### EF-M16: Multiple SSH Connections in `deploy-mirage.sh`
- **File:** `scripts/deploy-mirage.sh:~34-39`
- **Category:** Script Efficiency
- **Issue:** 6+ separate SSH connections to same node.
- **Fix:** Batch into fewer SSH sessions.

### LOW (8)

#### EF-L1: Dead `buffer_size` in Virtualizer
- **File:** `crates/modules/pretext-core/src/virtualization.rs:~47-55`
- **Category:** Allocation Waste
- **Fix:** Remove dead field.

#### EF-L2: Character-by-Character Token Feeding
- **File:** `sidecars/.../telegram-artery/streaming_handler.py:~109-117`
- **Category:** Unnecessary Work
- **Issue:** `feed_tokens()` calls `feed_token()` per character with dict lookup each time.
- **Fix:** Batch append, flush once.

#### EF-L3: Session Leak in `bot_coordinator.py` (Also CQ-C1)
- **File:** `sidecars/.../telegram-artery/bot_coordinator.py:~143-144`
- **Category:** Memory
- **Issue:** `session_id` undefined — sessions never evicted. Unbounded dict growth.
- **Fix:** `self._sessions.pop(session.session_id, None)`.

#### EF-L4: Config YAML Parsed on Every `fetch_models()` Call
- **File:** `sidecars/.../sovereign_vsb/__init__.py:~38-56`
- **Category:** Unnecessary Work
- **Fix:** Cache with TTL.

#### EF-L5: Per-Call File I/O in `psy-core` Audit Log
- **File:** `sidecars/.../psy-core/hook.py:~68-70`
- **Category:** Blocking I/O
- **Fix:** Use `logging` FileHandler.

#### EF-L6: Per-File `nix-shell` in `semantic-shift.sh`
- **File:** `scripts/semantic-shift.sh:~15-20`
- **Category:** Unnecessary Work
- **Fix:** Single nix-shell for all conversions.

#### EF-L7: TOCTOU in `goose-execution` Workspace
- **File:** `crates/modules/goose-execution/src/main.rs:~37-38`
- **Category:** TOCTOU
- **Fix:** Create directory in constructor.

#### EF-L8: Layout Clone of Every Segment
- **File:** `crates/modules/pretext-core/src/layout.rs:~95-113`
- **Category:** Allocation Waste
- **Issue:** `segment.clone()` for every word during line-breaking.
- **Fix:** Take ownership via `Vec::drain()`.

### INFO (5)

#### EF-I1: BLE Buffer `std::mem::take` Loses Capacity
- **File:** `crates/modules/vibevoice-asr/src/ble_stream.rs:~64-66`
- **Category:** Memory
- **Issue:** After `take()`, next allocation starts from 0 capacity.
- **Fix:** Use `std::mem::swap` with pre-allocated buffer.

#### EF-I2: Mirage Config `from_env()` Multiple `env::var()` Calls
- **File:** `crates/modules/mirage-vfs/src/config.rs:~87-135`
- **Category:** Unnecessary Work
- **Note:** Minor. Only relevant if called in hot loop.

#### EF-I3: Sequential Sync in `hermes-lcm.nix`
- **File:** `nix/modules/hermes-lcm.nix:~97-120`
- **Category:** Script Efficiency
- **Fix:** Parallel syncs with background jobs.

#### EF-I4: Network Optimization Overwrites resolv.conf on Boot
- **File:** `nix/modules/network-optimization.nix:~20-27`
- **Category:** Unnecessary Work
- **Fix:** Use `networking.nameservers`.

#### EF-I5: Sequential Git Fetch for Submodules
- **File:** `scripts/check-upstream-updates.sh:~26-36`
- **Category:** Unnecessary Work
- **Fix:** `git fetch --all --jobs=4`.

---

## IV. Remediation Priority Matrix

### Immediate (Must Fix Before Production)

| # | Finding | Impact | Effort |
|---|---------|--------|--------|
| 1 | CQ-C1: `session_id` NameError | Runtime crash + memory leak | 1 line |
| 2 | CQ-C3/C4/C5: Command injection (3 crates) | Arbitrary code execution | Medium |
| 3 | CQ-C2: Hardcoded mesh secret | Credential exposure | 2 lines |
| 4 | EF-H1: VSB pulse sync blocks startup | Agent hangs on boot | Small |
| 5 | CQ-H6: Zeroboot PID tracking broken | Lifecycle non-functional | Medium |
| 6 | EF-H3: n8n `time.sleep()` blocks event loop | 30s stalls | Small |

### Short-Term (Next Sprint)

| # | Finding | Impact | Effort |
|---|---------|--------|--------|
| 7 | CR-R2: Mesh topology consolidation | Data consistency | Medium |
| 8 | CR-R3: Rust crate common library | Maintainability | Medium |
| 9 | CQ-H4/H5: Consensus no-op | False security guarantee | Medium |
| 10 | CQ-H2: Fake psy-core signatures | False security guarantee | Medium |
| 11 | EF-M1: LCM persistent SQLite connection | Performance | Small |
| 12 | CQ-H7/H8: Fake metrics (confidence, duration) | Misleading API | Small |

### Medium-Term (Backlog)

| # | Finding | Impact | Effort |
|---|---------|--------|--------|
| 13 | CR-R7: Deploy script shared utilities | DRY | Small |
| 14 | CR-R11: Nix crate build template | DRY | Small |
| 15 | EF-M8: Parallel deploy builds | Deploy speed | Small |
| 16 | All MEDIUM severity shell script fixes | Robustness | Small |
| 17 | All Nix quality fixes | Correctness | Small |

---

## V. Codebase Health Metrics

| Metric | Value |
|--------|-------|
| Lines audited | ~10,600 |
| Files audited | 60+ |
| Findings per 1,000 LOC | 9.2 |
| Critical findings | 8 (0.75/KLOC) |
| Security findings | 9 |
| Dead code findings | 6 |
| Error handling findings | 8 |
| Findings with 1-line fixes | ~15 |
| Estimated fix effort (immediate) | ~2-3 hours |
| Estimated fix effort (short-term) | ~1-2 days |

---

*Audit generated by Droid simplify skill — three-agent parallel review. No code was modified during this audit.*
