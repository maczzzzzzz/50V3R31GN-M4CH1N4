# Phase 107: NODESTADT Organization Pivot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the Sovereign Machina to a professional monorepo structure and finalize the declarative sidecar framework, forcing all core communication through the zero-trust arteries established in Phase 106.

**Architecture:** We use Nix Flakes to define a multi-package monorepo. The core logic in `src/` is refactored into modular packages (e.g., `packages/hermes-core`). A new `plugins/` directory hosts declarative sidecars (Rust/Go) managed by the `PluginRegistry`. `HermesSingularity` is re-wired to communicate strictly via the SPIFFE/V2F-enforced `hermes-router`.

**Tech Stack:** Nix (Flakes), TypeScript (Node.js 22), Rust, Go, SPIFFE/SPIRE

---

### Task 1: Monorepo Scaffolding & Directory Migration

**Files:**
- Modify: `flake.nix`
- Create: `packages/hermes-core/package.json`
- Create: `packages/hermes-core/tsconfig.json`

- [ ] **Step 1: Update Root Flake for Multi-Package Support**

Update `flake.nix` to include development shells for different sub-packages (e.g., core, dashboard, sidecars).

```nix
# Example modification to flake.nix (simplified)
{
  outputs = { self, nixpkgs }: {
    devShells.x86_64-linux = {
      default = ...;
      hermes-core = ...;
      dashboard = ...;
    };
  };
}
```

- [ ] **Step 2: Initialize hermes-core package**

Create `packages/hermes-core/package.json` and move core logic from `src/` to `packages/hermes-core/src/`.

- [ ] **Step 3: Update Import Maps**

Update `tsconfig.json` and `package.json` workspaces to point to the new directory structure.

```json
{
  "workspaces": [
    "packages/*",
    "sidecars/*",
    "crates/*",
    "dashboard"
  ]
}
```

- [ ] **Step 4: Verify Compilation**

Run: `nix develop --command npm run build`
Expected: Successful build across all workspaces.

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "feat(arch): scaffold NODESTADT monorepo and migrate core logic"
```

---

### Task 2: Declarative Profile & Plugin Framework

**Files:**
- Create: `packages/hermes-core/src/plugins/PluginManifest.ts`
- Create: `plugins/example-rust-sidecar/manifest.yaml`

- [ ] **Step 1: Define the Declarative Manifest Schema**

Implement a Zod-based schema for plugin manifests that includes SPIFFE identity requirements and VSB intent registration.

```typescript
export const PluginManifestSchema = z.object({
  name: z.string(),
  version: z.string(),
  binary: z.string(),
  spiffe_id: z.string(),
  vsb_intents: z.array(z.number()),
  configuration: z.record(z.any()),
});
```

- [ ] **Step 2: Implement the Plugin Loader**

Update `PluginRegistry.ts` to scan the `plugins/` directory for `manifest.yaml` files and automatically provision the corresponding sidecar processes.

- [ ] **Step 3: Test Plugin Provisioning**

Write a test to ensure a mock plugin is correctly registered and its SPIFFE ID is validated.

- [ ] **Step 4: Commit**

```bash
git add packages/hermes-core/src/plugins/
git commit -m "feat(arch): implement declarative plugin framework"
```

---

### Task 3: Nervous System Re-wiring (Primitive Unification)

**Files:**
- Modify: `packages/hermes-core/src/hermes/HermesSingularity.ts`
- Modify: `src/core/periphery/VSBClient.ts`

- [ ] **Step 1: Force HermesSingularity through the Artery**

Refactor the `invoke` method in `HermesSingularity.ts` to remove direct model URL calls. It MUST now route all requests through `http://127.0.0.1:7341` (hermes-router) using mTLS.

```typescript
// From:
// const res = await fetch(`${state.nodeUrl}/v1/chat/completions`, ...);
// To:
// const res = await this.arteryClient.post('/v1/chat/completions', ...);
```

- [ ] **Step 2: Integrate ST3GG into SovereignObserver**

Update `SovereignObserver.ts` to call `crush identity_st3gg` to sign its visual frames before transmitting them on the VSB bus.

- [ ] **Step 3: E2E Security Verification**

Run the mesh and verify that `hermes-router` rejects requests if the `HermesSingularity` does not present a valid V2F pulse.

- [ ] **Step 4: Commit**

```bash
git add packages/hermes-core/src/hermes/
git commit -m "refactor(hermes): re-wire nervous system to enforced security arteries"
```

---

### Task 4: Scoped Swarm Injection (Ankh.md Integration)

**Files:**
- Create: `packages/hermes-core/src/hermes/ScopedSwarmManager.ts`

- [ ] **Step 1: Implement Local `.agent/` Config Discovery**

Create a service that scans the current working directory (and parent directories) for `.agent/` folders containing project-specific `manifest.yaml` or `Ankh.md` instructions.

- [ ] **Step 2: Implement Context Merging**

Update `RootsInjector.ts` to merge project-specific instructions from Ankh.md into the base system prompt during `discover_state`.

- [ ] **Step 3: Commit**

```bash
git add packages/hermes-core/src/hermes/
git commit -m "feat(hermes): implement scoped swarm injection (Ankh.md)"
```
