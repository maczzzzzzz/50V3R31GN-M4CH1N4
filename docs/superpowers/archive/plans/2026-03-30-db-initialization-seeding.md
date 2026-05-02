# Node A Artery of Truth Initialization & Seeding Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Initialize the pgvector schema on Node A and populate the vector store with rulebook and campaign data from Node B.

**Architecture:** Node B acts as the ingestion orchestrator, generating embeddings locally via Ollama and pushing them over the network to Node A's PostgreSQL instance.

**Tech Stack:** pgvector, PostgreSQL, Ollama (nomic-embed-text), TypeScript, SSH.

---

### Task 1: Schema Initialization on Node A

**Files:**
- Reference: `src/db/schema.sql`

**Step 1: Execute schema initialization via SSH**

Run: `ssh maczz@192.168.0.50 "PGPASSWORD=ch00m psql -h localhost -U nitro_admin -d nitro_db -f - < src/db/schema.sql"`
Expected: SQL output showing table and index creation.

**Step 2: Verify table existence**

Run: `ssh maczz@192.168.0.50 "PGPASSWORD=ch00m psql -h localhost -U nitro_admin -d nitro_db -c '\dt'"`
Expected: Output showing the `pdf_chunks` table.

### Task 2: Data Seeding from Node B

**Files:**
- Execute: `npm run seed`

**Step 1: Verify Node B Ollama Readiness**

Run: `curl http://localhost:11434/api/tags`
Expected: Output containing `nomic-embed-text`.

**Step 2: Execute Seed Orchestrator**

Run: `$env:NODE_A_PASSWORD='ch00m'; npm run seed`
Expected: Structured JSON logs showing progress, followed by a human-readable "Seed Run Report" indicating files processed and chunks inserted.

**Step 3: Verification Query**

Run: `ssh maczz@192.168.0.50 "PGPASSWORD=ch00m psql -h localhost -U nitro_admin -d nitro_db -c 'SELECT count(*) FROM pdf_chunks;'"`
Expected: A non-zero count (likely several hundred or thousand depending on data volume).

### Task 3: Harden MCP Tool Validation

**Files:**
- Modify: `src/mcp/nitro-db/index.ts`

**Step 1: Debug Zod Hammer failure**

The current implementation of `server.tool` in the SDK might not be throwing an error if the arguments are completely missing or if it's falling back to defaults. We'll add explicit validation if necessary.

**Step 2: Run Pre-flight Audit**

Run: `$env:NODE_A_HOST='3.8.24-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS.50'; $env:NODE_A_PASSWORD='ch00m'; npx tsx tests/db/phase4-preflight.ts`
Expected: 🟢 PASS on all three tests.


---
**LINKS:** [[OS_CORE]]
