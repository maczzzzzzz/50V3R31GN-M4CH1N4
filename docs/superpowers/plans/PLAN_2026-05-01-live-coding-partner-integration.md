# Live Coding Partner Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate Warp/Oz telemetry mining and Hermes v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS "Curator" capabilities to create a fully local, live coding partner experience via the Quaternary Mesh.

**Architecture:** A Rust-based `sovereign-warp-observer` sidecar on Node D streams Warp telemetry to MemPalace via MCP. The `HermesSingularity` orchestrates a structured `Triage -> Spec -> Implement -> Review` pipeline based on this telemetry. A new `gepa-curator` sidecar periodically prunes and grades the local skill library. All system prompts are updated to the `[IMPORTANT:]` standard to align with Hermes v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS.

**Tech Stack:** Rust (Tokio, axum, mcp), TypeScript (Node.js), SQLite (MemPalace)

---

### Task 1: Initialize the Sovereign Warp Observer Sidecar

**Files:**
- Create: `sidecars/warp-observer/Cargo.toml`
- Create: `sidecars/warp-observer/src/main.rs`

- [ ] **Step 1: Create the Cargo manifest**

Write the following to `sidecars/warp-observer/Cargo.toml`:

```toml
[package]
name = "sovereign-warp-observer"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full"] }
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tracing = "0.1"
```

- [ ] **Step 2: Write the baseline Observer logic**

Write the following to `sidecars/warp-observer/src/main.rs`:

```rust
use serde::{Deserialize, Serialize};
use tracing::{info, Level};

#[derive(Debug, Deserialize)]
struct WarpTelemetry {
    file_path: String,
    git_status: String,
    last_command: String,
    timestamp: u64,
}

#[derive(Debug, Serialize)]
struct TelemetryAck {
    status: String,
}

// In a real implementation, this connects via MCP to MemPalace.
// For Task 1, we establish the struct and mock the ingestion.
async fn receive_telemetry(payload: WarpTelemetry) -> Result<TelemetryAck, String> {
    info!("◈ [WARP_OBSERVER] Received telemetry from: {}", payload.file_path);
    // TODO: Store DevEpisode via MemPalace
    // TODO: Trigger GEPA live reflection
    Ok(TelemetryAck { status: "ingested".to_string() })
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();
    info!("◈ SOVEREIGN_WARP_OBSERVER : Node D Telemetry Ingress Active");
    // Placeholder for SPIFFE/MCP agent registration
}
```

- [ ] **Step 3: Verify Compilation**

Run: `cd sidecars/warp-observer && cargo check`
Expected: Successful compilation without errors.

- [ ] **Step 4: Commit**

```bash
git add sidecars/warp-observer/
git commit -m "feat(warp-observer): initialize baseline telemetry sidecar"
```

### Task 2: Formalize the Oz Pipeline in HermesSingularity

**Files:**
- Modify: `src/core/hermes/HermesSingularity.ts`

- [ ] **Step 1: Introduce the Oz Pipeline State**

In `src/core/hermes/HermesSingularity.ts`, update the `OrchestratorState` (or similar interface) to include the Oz pipeline stage:

```typescript
export type OzPipelineStage = 'Triage' | 'Spec' | 'Implement' | 'Review';

export interface OzDevEpisode {
  stage: OzPipelineStage;
  telemetry: any;
}
```
*(Add this near the top of the file, below existing interfaces).*

- [ ] **Step 2: Add Pipeline Orchestration Method**

Add the following method to the `HermesSingularity` class:

```typescript
  /**
   * ◈ Phase 106+: Mined Oz Contribution Pipeline
   * Routes incoming Warp telemetry through the structured Triage -> Spec -> Implement -> Review loop.
   */
  public async handleWarpTelemetry(episode: OzDevEpisode): Promise<void> {
    this.logger?.info('HermesSingularity', 'trace', `[OZ_PIPELINE] Processing telemetry at stage: ${episode.stage}`);
    
    switch (episode.stage) {
      case 'Triage':
        // Trigger GEPA reflection to categorize the issue
        this.logger?.debug('HermesSingularity', 'trace', 'Triaging developer intent...');
        break;
      case 'Spec':
        // Generate structured spec based on triage
        this.logger?.debug('HermesSingularity', 'trace', 'Generating implementation spec...');
        break;
      case 'Implement':
        // Push rich blocks to Warp / Pretext HUD
        this.logger?.debug('HermesSingularity', 'trace', 'Suggesting implementation refactors...');
        break;
      case 'Review':
        // Grade the outcome against success metrics
        this.logger?.debug('HermesSingularity', 'trace', 'Reviewing dev episode outcome...');
        break;
    }
  }
```

- [ ] **Step 3: Verify TypeScript Compilation**

Run: `nix develop --command npm run typecheck`
Expected: `Exit Code: 0` (or your existing baseline, ensuring no *new* errors in `HermesSingularity.ts`).

- [ ] **Step 4: Commit**

```bash
git add src/core/hermes/HermesSingularity.ts
git commit -m "feat(hermes): implement mined Oz pipeline orchestration"
```

### Task 3: Update System Prompts to Hermes v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS Standard

**Files:**
- Modify: `src/core/hermes/HermesSingularity.ts`
- Modify: `src/core/hermes/HealerProtocol.ts`

- [ ] **Step 1: Update Markers in HermesSingularity**

In `src/core/hermes/HermesSingularity.ts`, find any instances of `[SYSTEM:` and replace them with `[IMPORTANT:]`.

```typescript
// Look for lines like:
// const prompt = `[SYSTEM: STRICT ADHERENCE REQUIRED] ...`;
// Change to:
// const prompt = `[IMPORTANT: STRICT ADHERENCE REQUIRED] ...`;
```
*(Use `sed` or your editor. If none exist, skip this step).*

- [ ] **Step 2: Update Markers in HealerProtocol**

In `src/core/hermes/HealerProtocol.ts`, perform the same replacement.

```typescript
// Look for lines like:
// `[SYSTEM: PREVIOUS TRAJECTORY FAILED. CORRECT IMMEDIATELY]`
// Change to:
// `[IMPORTANT: PREVIOUS TRAJECTORY FAILED. CORRECT IMMEDIATELY]`
```
*(Use `sed` or your editor. If none exist, skip this step).*

- [ ] **Step 3: Commit**

```bash
git add src/core/hermes/HermesSingularity.ts src/core/hermes/HealerProtocol.ts
git commit -m "chore(prompts): migrate system markers to Hermes v3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS [IMPORTANT:] standard"
```

### Task 4: Initialize the GEPA Curator Sidecar

**Files:**
- Create: `sidecars/gepa-curator/Cargo.toml`
- Create: `sidecars/gepa-curator/src/main.rs`

- [ ] **Step 1: Create the Cargo manifest**

Write the following to `sidecars/gepa-curator/Cargo.toml`:

```toml
[package]
name = "sovereign-gepa-curator"
version = "0.1.0"
edition = "2021"

[dependencies]
tokio = { version = "1", features = ["full", "time"] }
tracing = "0.1"
```

- [ ] **Step 2: Write the baseline Curator logic**

Write the following to `sidecars/gepa-curator/src/main.rs`:

```rust
use std::time::Duration;
use tokio::time;
use tracing::{info, Level};

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_max_level(Level::INFO).init();
    info!("◈ SOVEREIGN_GEPA_CURATOR : Background Skill Pruning Engine Active");

    // Default 7-day cycle simulated with a periodic tick
    let mut interval = time::interval(Duration::from_secs(604800)); // 7 days

    loop {
        interval.tick().await;
        run_curation_cycle().await;
    }
}

async fn run_curation_cycle() {
    info!("◈ [CURATOR] Initiating weekly skill and memory consolidation...");
    // TODO: Read .agents/skills/ directory
    // TODO: Apply heuristic classification
    // TODO: Generate logs/curator/REPORT.md
    info!("◈ [CURATOR] Cycle complete.");
}
```

- [ ] **Step 3: Verify Compilation**

Run: `cd sidecars/gepa-curator && cargo check`
Expected: Successful compilation.

- [ ] **Step 4: Commit**

```bash
git add sidecars/gepa-curator/
git commit -m "feat(gepa-curator): initialize background skill consolidation engine"
```
