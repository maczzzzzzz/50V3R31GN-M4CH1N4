# Advanced Hermes Orchestration (Phase 63) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Materialize the sharded context and stateless delegation architecture to achieve engineering-grade orchestration across the 3-node mesh.

**Architecture:** Sharded `AGENTS.md` (Sector Stones) + Stateless `delegate_task` workflow + LLM-driven Strategic Replan.

**Tech Stack:** TypeScript, Markdown, Hermes-3 Patterns.

---

### Task 1: Context Sharding (Ability Stones)

**Files:**
- Create: `zeroclaw/AGENTS.md`
- Create: `dashboard/AGENTS.md`
- Create: `scripts/AGENTS.md`
- Modify: `AGENTS.md` (Global)

- [ ] **Step 1: Materialize the Zeroclaw Stone**
  - Extract Rust/CUDA rules from global manifest.
  - Define bit-identical math invariants.

- [ ] **Step 2: Materialize the Dashboard Stone**
  - Extract Next.js/Tailwind/Three.js rules.
  - Define visual consistency and PBR lighting mandates.

- [ ] **Step 3: Modify Global AGENTS.md**
  - Transition global manifest to "Sovereign Supervisor" role.
  - Add instructions to "ls" or enter directories to "Waken Local Expertise."

- [ ] **Step 4: Commit**
  ```bash
  git add zeroclaw/AGENTS.md dashboard/AGENTS.md scripts/AGENTS.md AGENTS.md
  git commit -m "feat(arch): shard context into diegetic ability stones"
  ```

---

### Task 2: Artery Hardening (Stateless Workflow)

**Files:**
- Modify: `scripts/dev/delegate-helper.ts` (if exists) or equivalent.

- [ ] **Step 1: Force stateless flags on batch tasks**
  - Update all maintenance scripts to use `skip_memory: true` and `skip_context_files: true` when delegating.

- [ ] **Step 2: Commit**
  ```bash
  git add .
  git commit -m "feat(orchestration): mandate stateless ephemeral units for batch tasks"
  ```

---

### Task 3: Self-Healing Ignition (Healer Protocol)

**Files:**
- Modify: `CLAUDE.md` / `GEMINI.md`

- [ ] **Step 1: Codify the Strategic Replan protocol**
  - Mandate that failures trigger an analysis of `tool_trace` before any retry.

- [ ] **Step 2: Final Verification**
  - Trigger a dummy failure (e.g., trying to read a protected path).
  - Verify the agent proposes a "Strategy Shift" rather than simple repeat.

- [ ] **Step 3: Commit**
  ```bash
  git add .
  git commit -m "feat(healer): materialize the strategic replan protocol"
  ```
