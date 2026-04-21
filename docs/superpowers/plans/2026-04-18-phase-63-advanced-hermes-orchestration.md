# Phase 63: Advanced Hermes Orchestration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Integrate the Hermes ecosystem and OpenMAIC orchestration logic into Node C (Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle), bridging its headless compute with the Node B Nucleus Command Deck.

**Architecture:** Node C runs `hermes-control-interface` headlessly. Node B integrates these visual feeds via WebGL. Node C leverages LangGraph patterns for sub-task routing across the Trinity cluster.

**Tech Stack:** Nix, Node.js, LangGraph, React, WebSocket (VSB), PIXI.js.

---

### Task 1: Node C Headless Hermes Deployment

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Add Hermes Tooling to the Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle Shell**
Update `flake.nix` to include dependencies necessary to run the `hermes-control-interface` within the `oracle` shell. Include an environment variable `HERMES_HEADLESS=true` and a port configuration (`8080`).

- [ ] **Step 2: Commit**

```bash
git add flake.nix
git commit -m "infra: add headless hermes-control-interface to node c devShell"
```

---

### Task 2: Nucleus Command Deck Integration (Node B)

**Files:**
- Modify: `dashboard/app/page.tsx`
- Create: `dashboard/components/HermesProxy.tsx`

- [ ] **Step 1: Implement WebGL Proxy Component**
Create a new React component (`HermesProxy.tsx`) that embeds an iframe pointing to `http://node-c-ip:8080` (or the respective local proxy endpoint). Ensure this component matches the cyberpunk HUD aesthetic.

- [ ] **Step 2: Integrate into Dashboard Layout**
Mount the `HermesProxy` within the main `page.tsx` layout to ensure the GM has immediate visibility of the Hermes Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Strategic Oracle state.

- [ ] **Step 3: Commit**

```bash
git add dashboard/app/page.tsx dashboard/components/HermesProxy.tsx
git commit -m "ui: embed hermes-control-interface proxy into nucleus command deck"
```

---

### Task 3: OpenMAIC Orchestration Port

**Files:**
- Create: `src/core/hermes/LangGraphOrchestrator.ts`
- Create: `src/core/hermes/PlaybackStateMachine.ts`

- [ ] **Step 1: Implement LangGraph Director Graph**
Create a state-machine orchestrator defining the turn-taking transitions between Node A (Synapse Fetch), Node C (Rule Calculation), and Node B (Narrative Synthesis).

- [ ] **Step 2: Implement the Playback State Machine**
Formalize the cluster execution states (`idle`, `scheduling`, `executing`, `monitoring`) for complex generation tasks like Gigs and Night Markets.

- [ ] **Step 3: Commit**

```bash
git add src/core/hermes/LangGraphOrchestrator.ts src/core/hermes/PlaybackStateMachine.ts
git commit -m "feat(hermes): port openmaic langgraph and state machine patterns for node c"
```

---

### Task 4: Hermes-Wiki Auto-Documentation

**Files:**
- Create: `scripts/dev/hermes-wiki-sync.ts`

- [ ] **Step 1: Implement RKG Wiki Daemon**
Create a background script that polls `Akashik.db` and utilizes the `hermes-wiki` patterns to automatically generate markdown documentation back to the `docs/raw_data/` or Obsidian vault, ensuring the human-readable lore stays in sync with the Triad's state.

- [ ] **Step 2: Commit**

```bash
git add scripts/dev/hermes-wiki-sync.ts
git commit -m "feat(ops): implement hermes-wiki daemon for auto-documenting rkg state"
```
