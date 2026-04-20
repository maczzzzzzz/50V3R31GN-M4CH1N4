# BASEMENT SUBNET & TRIAD NETWORKING Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transition the Sovereign Trinity to the `10.0.0.x` subnet across all environment variables, configuration files, and integration tests.

**Architecture:** This plan executes a systemic find-and-replace of legacy IP identifiers (`192.168.0.x`) with the new basement subnet (`10.0.0.x`). It prioritizes environment variables and hardcoded fallbacks in Go and TypeScript components to ensure zero-stutter inference.

**Tech Stack:** Bash, Go, TypeScript, Vitest.

---

### Task 1: Environment Hardening

**Files:**
- Modify: `.env`
- Modify: `.env.example`

- [ ] **Step 1: Update `.env` (Local Artery)**
  - Update `NODE_A_HOST` to `10.0.0.10`
  - Update `NODE_A_LLAMA_URL` to `http://10.0.0.10:8080/v1`
  - Update `CDP_BRIDGE_HOST` to `10.0.0.11` (if present)

- [ ] **Step 2: Update `.env.example` (Blueprint)**
  - Update `NODE_A_HOST` to `10.0.0.10`
  - Update `NODE_A_LLAMA_URL` to `http://10.0.0.10:8080/v1`

- [ ] **Step 3: Commit**
  ```bash
  git add .env .env.example
  git commit -m "config: transition environment variables to basement subnet 10.0.0.x"
  ```

---

### Task 2: Go Component Fallbacks

**Files:**
- Modify: `crush/config.go`
- Modify: `deck-igniter/config.go`

- [ ] **Step 1: Update `crush/config.go`**
  - Replace `192.168.0.50` fallback with `10.0.0.10`

- [ ] **Step 2: Update `deck-igniter/config.go`**
  - Update `NodeAHost` to `10.0.0.10`
  - Update `NodeALlamaURL` to `http://10.0.0.10:8080/v1`

- [ ] **Step 3: Verify with `go test`**
  - Run: `cd crush && go test ./...`
  - Expected: PASS

- [ ] **Step 4: Commit**
  ```bash
  git add crush/config.go deck-igniter/config.go
  git commit -m "refactor(go): update hardcoded networking fallbacks to 10.0.0.10"
  ```

---

### Task 3: TypeScript Component Fallbacks

**Files:**
- Modify: `scripts/gauntlet/vision-client.ts`
- Modify: `scripts/gauntlet/engine.ts`
- Modify: `src/main.ts`
- Modify: `src/mcp/nitro-logic/index.ts`

- [ ] **Step 1: Update `scripts/gauntlet/vision-client.ts`**
  - Replace `192.168.0.50` default with `10.0.0.10` in `NODE_A_URL`

- [ ] **Step 2: Update `scripts/gauntlet/engine.ts`**
  - Replace `192.168.0.51` default with `10.0.0.11` in `bridgeHost`
  - Replace `192.168.0.50` default with `10.0.0.10` in `nodeAHost`

- [ ] **Step 3: Update `src/main.ts`**
  - Replace `192.168.0.50` defaults with `10.0.0.10` in `baseUrl` and `host`

- [ ] **Step 4: Update `src/mcp/nitro-logic/index.ts`**
  - Replace `192.168.0.50` default with `10.0.0.10` in `llamaBaseUrl`

- [ ] **Step 5: Commit**
  ```bash
  git add scripts/gauntlet/vision-client.ts scripts/gauntlet/engine.ts src/main.ts src/mcp/nitro-logic/index.ts
  git commit -m "refactor(ts): align resident IP fallbacks with basement subnet"
  ```

---

### Task 4: Integration Test Alignment

**Files:**
- Modify: `tests/integration/vsb_live_canary.ts`
- Modify: `tests/api/vsb-client.test.ts`
- Modify: `tests/core/nitro-logic-client.test.ts`

- [ ] **Step 1: Update `tests/integration/vsb_live_canary.ts`**
  - Update `NODE_A_IP` to `10.0.0.10`

- [ ] **Step 2: Update `tests/api/vsb-client.test.ts`**
  - Update `host` to `10.0.0.10`

- [ ] **Step 3: Update `tests/core/nitro-logic-client.test.ts`**
  - Update `baseUrl` to `http://10.0.0.10:8080/v1`

- [ ] **Step 4: Run Pre-Flight Tests (Mocked)**
  - Run: `npm test tests/core/nitro-logic-client.test.ts`
  - Expected: PASS

- [ ] **Step 5: Commit**
  ```bash
  git add tests/integration/vsb_live_canary.ts tests/api/vsb-client.test.ts tests/core/nitro-logic-client.test.ts
  git commit -m "test: update integration test vectors to 10.0.0.10"
  ```
