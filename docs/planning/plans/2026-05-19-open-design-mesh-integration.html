# Open-Design Mesh Integration Spec

**Date:** 2026-05-19  
**Status:** Draft  
**Version:** 0.1  
**Related:** Phase 3 / Phase 4 work, P4-T2 (Cancelled)

## 1. Objective

Integrate **nexu-io/open-design** as a first-class capability in the NODESTADT mesh so Hermes can invoke it natively for design, prototyping, and visual generation tasks.

## 2. Two Integration Options

### Option 1: Native Hermes Plugin (Recommended for Sovereignty)

**Approach:**
- Build a proper Hermes plugin following https://hermes-agent.nousresearch.com/docs/guides/build-a-hermes-plugin
- Register tools such as:
  - `design:generate`
  - `design:preview`
  - `design:export`
  - `design:list-systems`
- Use Hermes plugin lifecycle hooks for startup/shutdown of the open-design engine
- Expose open-design capabilities as slash commands (`/design ...`)
- Bundle a skill for common design workflows

**Advantages:**
- Deep integration with Hermes command surface and model routing
- Can directly use mesh models (`mesh-fast`, `mesh-heavy`, `mesh-vision`)
- Consistent with "Hermes-First" mandate
- Plugin can be versioned and distributed inside the repo

**Disadvantages:**
- Higher initial development effort
- Must maintain compatibility with open-design updates

### Option 2: Standalone Sidecar Service (Faster Path)

**Approach:**
- Deploy open-design as a Docker service on a chosen node (see Node Selection below)
- Expose it via port + socat bridge (consistent with current LiteLLM + hermes-relay pattern)
- Hermes invokes it via:
  - Subprocess calls to the Hermes CLI (since open-design supports Hermes)
  - Simple HTTP/MCP bridge
  - Dedicated skill that wraps the CLI

**Advantages:**
- Can be running in hours instead of days
- No need to wrap the entire open-design codebase
- Easier to move between nodes later

**Disadvantages:**
- Less "native" feel
- Requires separate process management

## 3. Recommended Node Placement

**Primary Recommendation: Node B (Director)**

**Rationale:**
- Already runs Docker Desktop + hermes-relay
- Good GPU (RX 9060 XT) for preview and rendering workloads
- Primary workspace node where design work is most likely to be initiated
- Easiest to wire into existing mesh bridge infrastructure

**Future Migration Path:**
- After RTX 5060 Ti is installed on Node D, move heavy generation/export workloads there
- Keep a lightweight interactive surface on Node B

## 4. Architecture Overview

```
Hermes (chat / TUI)
   │
   ├── Option 1: Native Plugin
   │     └── open-design plugin (tools + skill)
   │
   └── Option 2: Sidecar
         └── Docker service on Node B
               └── Exposed via socat bridge (port TBD)
```

Both options should support:
- Using local mesh models
- Sandboxed preview
- Export to HTML / PDF / PPTX / MP4 / HyperFrames

## 5. Implementation Phases

### Phase A — Research & Decision (Current)
- Evaluate both options
- Choose primary path (recommend Option 1 long-term, Option 2 for quick value)

### Phase B — Quick Win (Option 2)
- Deploy open-design as Docker sidecar on Node B
- Add to `sidecars/` structure
- Create basic Hermes skill to invoke it
- Update mesh bridge script

### Phase C — Native Integration (Option 1)
- Implement Hermes plugin using the official plugin guide
- Register design tools and slash commands
- Add telemetry and model routing

### Phase D — Polish & Migration
- Move heavy workloads to Node D after GPU upgrade
- Add KineticThoughtStream / Pretext integration points (separate thread)

## 6. Risks & Mitigations

- **Risk:** open-design is a large, fast-moving codebase
  - **Mitigation:** Start with Option 2 (sidecar) while plugin work happens in parallel
- **Risk:** Resource usage during design generation
  - **Mitigation:** Use Node B now, offload to Node D later
- **Risk:** Model access
  - **Mitigation:** Route all requests through LiteLLM mesh so open-design can use `mesh-*` models

## 7. Deliverables

- [ ] Decision on primary option (1 vs 2)
- [ ] Deployment plan for chosen option
- [ ] Hermes plugin skeleton (if Option 1)
- [ ] Sidecar Docker compose + bridge config (if Option 2)
- [ ] Skill for common design workflows

---
**Status:** Ready for review and decision.  
**Next:** Choose Option 1 or Option 2 (or both in parallel) and begin implementation.