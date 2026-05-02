# Monorepo Scaffolding & Directory Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the Sovereign Machina to a professional monorepo structure.

**Architecture:** Moving core TypeScript logic from root `src/` to `packages/hermes-core/src/`, updating workspaces configuration, and refining the Nix development environment.

**Tech Stack:** Nix, pnpm workspaces, TypeScript.

---

### Task 1: Update Root Flake for Multi-Package Support

**Files:**
- Modify: `flake.nix`

- [ ] **Step 1: Update devShells in flake.nix**

Update `flake.nix` to include devShells that are more modular if needed, or at least ensure the default shell supports the new structure. The task says "include development shells for different sub-packages (e.g., core, dashboard, sidecars)".

```nix
      devShells.${system} = {
        default = pkgs.mkShell { ... };
        hermes-core = pkgs.mkShell { ... };
        dashboard = pkgs.mkShell { ... };
        # ...
      };
```

- [ ] **Step 2: Commit**

```bash
git add flake.nix
git commit -m "chore: update flake.nix for multi-package support"
```

### Task 2: Initialize hermes-core package

**Files:**
- Create: `packages/hermes-core/package.json`
- Create: `packages/hermes-core/tsconfig.json`
- Move: `src/` -> `packages/hermes-core/src/`

- [ ] **Step 1: Create directory structure**

Run: `mkdir -p packages/hermes-core/src`

- [ ] **Step 2: Create packages/hermes-core/package.json**

```json
{
  "name": "@hermes/core",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@google/generative-ai": "^0.24.1",
    "@modelcontextprotocol/sdk": "1.29.0",
    "@opendataloader/pdf": "^2.2.1",
    "better-sqlite3": "12.8.0",
    "blake3": "2.1.7",
    "chokidar": "^3.6.0",
    "chromadb": "^3.4.3",
    "chrome-remote-interface": "^0.34.0",
    "dotenv": "17.3.1",
    "js-yaml": "^4.1.1",
    "jsdom": "^29.0.2",
    "node-cron": "^4.2.1",
    "pdf-parse": "1.1.1",
    "pixelmatch": "^5.3.0",
    "playwright-core": "1.58.2",
    "pngjs": "^7.0.0",
    "sqlite-vec": "^0.1.9",
    "ws": "8.20.0",
    "zod": "3.25.76"
  },
  "devDependencies": {
    "@types/better-sqlite3": "7.6.13",
    "@types/js-yaml": "^4.0.9",
    "@types/jsdom": "^28.0.1",
    "@types/node": "22.19.15",
    "@types/node-cron": "^3.0.11",
    "@types/pdf-parse": "1.1.5",
    "@types/pixelmatch": "^5.2.6",
    "@types/pngjs": "^6.0.5",
    "@types/ws": "8.18.1",
    "typescript": "5.8.3"
  }
}
```

- [ ] **Step 3: Create packages/hermes-core/tsconfig.json**

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*.ts"]
}
```

- [ ] **Step 4: Move src content**

Run: `mv src/* packages/hermes-core/src/`

- [ ] **Step 5: Commit**

```bash
git add packages/hermes-core
git rm -r src
git commit -m "feat: initialize hermes-core package and migrate src"
```

### Task 3: Update Import Maps and Workspaces

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json` (root)
- Modify: `tsconfig.json` (root)

- [ ] **Step 1: Update pnpm-workspace.yaml**

```yaml
packages:
  - "packages/*"
  - "dashboard"
```

- [ ] **Step 2: Update root package.json scripts**

Update `start` and other scripts to point to new location or use workspace commands.

- [ ] **Step 3: Update root tsconfig.json**

Update `include` and potentially `paths`.

- [ ] **Step 4: Commit**

```bash
git add pnpm-workspace.yaml package.json tsconfig.json
git commit -m "chore: update root workspace configuration"
```

### Task 4: Verify Compilation

- [ ] **Step 1: Install dependencies**

Run: `pnpm install`

- [ ] **Step 2: Run typecheck**

Run: `nix develop --command npm run typecheck`

- [ ] **Step 3: Commit**

```bash
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml after migration"
```

