---
name: qa-crates
description: >
  QA tests for Sovereign Machina Rust crates and Nix build system. Verifies
  that all crates compile, tests pass, and Nix flake evaluations succeed.
---

# QA Tests: Rust Crates & Nix Build

**Testing Target:** All Rust crates in `crates/modules/` and the Nix flake build system. Includes: zeroboot-isolation, matlab-mcp-bridge, goose-execution, graphify-ast, vibevoice-asr, voxcpm-tts, consensus-alignment, pretext-core, mirage-vfs.

## Test Flow Menu

### F1: Nix Flake Evaluation
**When to run:** Changes to `flake.nix`, `flake.lock`, any `default.nix`, or `Cargo.toml`.
**Steps:**
1. `nix flake check --show-trace` -- verify no evaluation errors
2. `nix build .#mirage-vfs --dry-run` -- verify new crate resolves (if mirage-vfs changed)
3. `nix build .#vibevoice-asr --dry-run` -- verify updated crate resolves
4. Report any evaluation failures with full error output

### F2: Crate Build Verification
**When to run:** Changes to any `crates/modules/<crate>/src/*.rs` or `Cargo.toml`.
**Steps:**
1. Identify which crate changed from the diff
2. `cd crates/modules/<crate> && cargo check 2>&1` -- verify compilation
3. `cd crates/modules/<crate> && cargo test 2>&1` -- run unit tests
4. Report test results (pass/fail count)

### F3: VibeVoice ASR Multi-Source
**When to run:** Changes to `crates/modules/vibevoice-asr/`.
**Steps:**
1. Build the crate: `cd crates/modules/vibevoice-asr && cargo build 2>&1`
2. Run tests: `cd crates/modules/vibevoice-asr && cargo test 2>&1`
3. Verify `AudioSource` enum is present in the compiled binary
4. Verify log output includes `Source:` prefix when source is specified

### F4: Mirage VFS Operations
**When to run:** Changes to `crates/modules/mirage-vfs/`.
**Steps:**
1. Build the crate: `cd crates/modules/mirage-vfs && cargo build 2>&1`
2. Run tests: `cd crates/modules/mirage-vfs && cargo test 2>&1`
3. Verify `MirageVfs` struct methods: mount, unmount, health_check, read_file, write_file, list_dir
4. If Node D is accessible, test mount status: `ls /mnt/mirage`

### F5: Pretext Core
**When to run:** Changes to `crates/modules/pretext-core/`.
**Steps:**
1. Build: `cd crates/modules/pretext-core && cargo build 2>&1`
2. Test: `cd crates/modules/pretext-core && cargo test 2>&1`
3. Verify all 20 tests pass (per Phase 4 completion record)

### F6: Firmware Build Verification
**When to run:** Changes to `sidecars/omi-monorepo-fork/`.
**Steps:**
1. Verify C files compile syntactically: check for obvious errors in `sovereign_artery_ble.c`
2. Verify `CMakeLists.txt` includes `sovereign_artery_ble.c`
3. Verify `Kconfig` has `CONFIG_OMI_ENABLE_SOVEREIGN_ARTERY` option
4. Verify `omi.conf` has `CONFIG_CRYPTO=y`
5. Note: Full firmware build requires nRF Connect SDK -- not available in CI

### F7: Nix Node Configuration
**When to run:** Changes to `nix/`, `flake.nix` node configurations.
**Steps:**
1. Verify all node configs evaluate: `nix build .#nixosConfigurations.node-a.config.system.build.toplevel --dry-run`
2. Same for node-b, node-d
3. Report any evaluation errors

## Known Failure Modes

1. **Nix daemon not running.** On WSL2, the nix daemon may need to be started: `sudo systemctl start nix-daemon`
2. **Cargo.lock drift.** If Cargo.toml changed but Cargo.lock wasn't regenerated, builds fail. Fix: `cd crates/modules/<crate> && cargo generate-lockfile`
3. **Missing nRF SDK.** Firmware C files cannot be compiled without nRF Connect SDK. Syntax verification only.
4. **Build sandbox issues.** Nix sandboxing may prevent network access during builds. Use `--dry-run` for evaluation-only checks.
5. **Rust version mismatch.** The flake pins a specific Rust version. If `cargo` is from a different install, builds may fail. Always use `nix develop` or the flake's dev shell.
