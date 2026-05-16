# Phase 3: Memory Architecture - Hybrid SQLite Approach

**Status:** APPROVED (Option 1 - Hybrid)
**Date:** May 14, 2026

---

## ARCHITECTURE OVERVIEW

### Components
1. **Hermes-LCM** (Primary memory system)
   - SQLite backend
   - DAG-based context compression
   - Split storage: Node A (primary) + Node C external SSD (redundancy)
   - Session-aware memory management
   - Lossless context management

2. **CodeGraph-Rust** (Code-aware memory augmentation)
   - SurrealDB backend (multi-model: graph + document + KV)
   - Knowledge graph for code relationships
   - MCP tools: context, impact, architecture, quality
   - Rust-native (fits project architecture)

3. **MemPalace** (SKIPPED - Phase 4 reconsideration)
   - Postpone until memory system complexity evaluation
   - Can be added later if cross-session semantic search needed

---

## STORAGE LAYOUT

### Node A (Synapse) - Primary LCM Store
- Location: `/mnt/data/hermes-lcm/` (or appropriate path)
- Purpose: Primary Hermes-LCM database
- Redundancy: Syncs to Node C external SSD

### Node C (Oracle) - LCM Redundancy Store
- Location: `/mnt/sovereign_soul/hermes-lcm/` (external SSD)
- Purpose: Redundant copy of Hermes-LCM database
- Size: 476.9GB ext4 partition (SOVEREIGN_SOUL)
- UUID: 511d1a67-a3c0-49f8-899d-e509eab53c1a
- Mount point: `/mnt/sovereign_soul`

### CodeGraph Storage
- Location: TBD (local to each node or shared via NFS?)
- Backend: SurrealDB (multi-model)
- Purpose: Code knowledge graph for 50V3R31GN-M4CH1N4 + hermes-agent-nous

---

## MCP TOOL INTEGRATION

### CodeGraph-Rust MCP Tools (ADOPTED)

**High-Value Tools (Essential):**
1. **agentic_context**
   - Purpose: Gather comprehensive code context, answer semantic questions
   - Use Case: "Why is X implemented this way?", "Show me all authentication flows"
   - Native Gap: search_files can find patterns but doesn't understand relationships
   - Priority: HIGH

2. **agentic_impact**
   - Purpose: Map change impact, dependency chains, call flows
   - Use Case: "What breaks if I change this function?", "What depends on this module?"
   - Native Gap: No dependency tracking or impact analysis
   - Priority: HIGH

3. **agentic_architecture**
   - Purpose: System structure, API surfaces, architectural patterns
   - Use Case: "Show me the mesh routing architecture", "What are the boundaries?"
   - Native Gap: No architectural pattern recognition
   - Priority: MEDIUM

4. **agentic_quality**
   - Purpose: Complexity hotspots, coupling metrics, refactoring priorities
   - Use Case: "What are the most complex functions?", "Where should I refactor first?"
   - Native Gap: No complexity analysis or metrics
   - Priority: MEDIUM

### MemPalace MCP Tools (SKIPPED)
- Decision: Postpone until Phase 4
- Reason: Hermes-LCM + session_search provides sufficient memory for now
- Revisit if cross-session semantic search becomes critical

---

## INDEXING STRATEGY

### Phase 1: Main Repository
- Target: `/home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha`
- Index Tier: `balanced` (LSP + enrichment + module linking)
- Purpose: Base understanding of project architecture

### Phase 2: Hermes Agent Fork
- Target: `~/50V3R31GN-M4CH1N4-stable-mesh-alpha/sidecars/hermes-agent-nous`
- Index Tier: `balanced` or `full` (if needed for deep analysis)
- Purpose: Understand Hermes Agent internals for customization

### Phase 3: Individual Crates (Optional)
- Targets:
  - `crates/modules/directors-forge`
  - `crates/modules/mirage-vfs`
  - `crates/modules/vibevoice-asr`
- Index Tier: `full` (maximum accuracy/richness)
- Purpose: Deep analysis for Phase 4 work

---

## IMPLEMENTATION TASKS

### Task 1: Mount Node C External SSD (Requires sudo on Node C)
**Priority:** BLOCKING

```bash
# On Node C (100.102.109.81)
# Add to /etc/fstab:
UUID=511d1a67-a3c0-49f8-899d-e509eab53c1a  /mnt/sovereign_soul  ext4  defaults,noatime  0  2

# Reboot or mount manually:
sudo mount -a

# Verify mount:
df -h /mnt/sovereign_soul
ls -lh /mnt/sovereign_soul/
```

### Task 2: Install Hermes-LCM
**Priority:** HIGH

```bash
# Clone as general user plugin
git clone https://github.com/stephenschoettler/hermes-lcm \
  ~/.hermes/plugins/hermes-lcm

# Configure in ~/.hermes/config.yaml:
plugins:
  enabled:
    - hermes-lcm

context:
  engine: lcm

lcm:
  sync_targets:
    - node_c: /mnt/sovereign_soul/hermes-lcm

# Restart Hermes
hermes plugins
```

### Task 3: Install CodeGraph-Rust
**Priority:** MEDIUM

```bash
# On all nodes (start with Node B - Director)
cargo install --git https://github.com/Jakedismo/codegraph-rust codegraph

# Initialize for main repo
codegraph init /home/nixos/50V3R31GN-M4CH1N4-stable-mesh-alpha

# Index with tier=balanced
CODEGRAPH_INDEX_TIER=balanced codegraph index

# Start MCP server (stdio mode for Hermes)
codegraph start mcp --port 3000
```

### Task 4: Configure CodeGraph MCP in Hermes
**Priority:** MEDIUM

```yaml
# Add to ~/.hermes/config.yaml:
mcp_servers:
  codegraph:
    url: "http://localhost:3000"
    enabled: true
```

### Task 5: Verify Integration
**Priority:** HIGH

```bash
# Verify Hermes-LCM
hermes plugins  # Should show hermes-lcm
lcm_status

# Verify CodeGraph
hermes mcp list  # Should show codegraph

# Test CodeGraph tools
agentic_context "Show me the mesh routing architecture"
agentic_impact "What depends on the LiteLLM proxy?"
agentic_architecture "What are the module boundaries?"
agentic_quality "What are the most complex functions?"
```

### Task 6: Index Hermes Agent Fork
**Priority:** LOW (after Task 5)

```bash
codegraph init ~/50V3R31GN-M4CH1N4-stable-mesh-alpha/sidecars/hermes-agent-nous
CODEGRAPH_INDEX_TIER=balanced codegraph index
```

---

## MCP TOOL VS NATIVE CAPABILITY ANALYSIS

### CodeGraph Tools vs Native

| Tool | Purpose | Native Capability | Gap | Priority |
|-------|---------|------------------|------|----------|
| agentic_context | Semantic code context + relationships | search_files finds patterns but no relationships | HIGH | HIGH |
| agentic_impact | Dependency chains + impact analysis | None | HIGH | HIGH |
| agentic_architecture | System structure + API surfaces | Can grep for patterns but no architectural understanding | MEDIUM | MEDIUM |
| agentic_quality | Complexity metrics + hotspots | Can count lines but no complexity analysis | MEDIUM | MEDIUM |

### Native Tools (Keep Using)
- **search_files**: Fast pattern finding (ripgrep-backed)
- **read_file**: Direct file access
- **terminal**: Build, test, deployment
- **execute_code**: Scripted operations
- **session_search**: Cross-session memory (Hermes core)
- **delegate_task**: Parallel work
- **skill_manage**: Procedural knowledge

### Tools CodeGraph Replaces/Augments
- **Semantic code search**: agentic_context replaces manual grep + piecing together relationships
- **Impact analysis**: agentic_impact replaces manual dependency tracking
- **Architecture understanding**: agentic_architecture replaces manual documentation reading
- **Code quality**: agentic_quality provides metrics not available natively

---

## REDUNDANCY STRATEGY

### Hermes-LCM Sync Targets
- **Primary:** Node A (local database)
- **Redundancy:** Node C external SSD (sync target)
- **Optional:** Node B/D (if needed for additional redundancy)

### Failure Scenarios
1. **Node A failure:** Restore from Node C external SSD
2. **Node C external SSD failure:** Node A continues as primary
3. **Both fail:** Restore from last known good backup (need backup strategy)

### Backup Strategy (Future Consideration)
- Periodic snapshots of Hermes-LCM databases
- Git commit of CodeGraph indexes (if deterministic)
- Consider offsite backup of Node C external SSD

---

## PERFORMANCE CONSIDERATIONS

### SQLite (Hermes-LCM)
- **Pros:** Fast, low load, mature, zero-config
- **Cons:** Single-writer (but LCM handles this with proper locking)
- **Node Impact:** Minimal on all nodes (A: 16GB, B: 48GB, C: 32GB, D: 48GB)

### SurrealDB (CodeGraph)
- **Pros:** Multi-model, high performance, Rust-native
- **Cons:** Higher memory footprint, more complex
- **Node Impact:** Medium (B: 48GB fine, C: 32GB ok, D: 48GB fine)

### Network Overhead (Sync)
- **Tailscale Artery:** Latency ~5-10ms between nodes
- **Sync frequency:** Configurable (real-time vs batch)
- **Bandwidth:** Low (only delta changes after initial sync)

---

## PHASE 4 RECONSIDERATION

### If We Add MemPalace Later

**Triggers:**
- Cross-session semantic search becomes critical
- Session-search retrieval quality insufficient
- Need for structured indexing (wings/rooms/drawers)
- Temporal entity-relationship graph needed

**Integration Approach:**
- Keep Hermes-LCM for in-session context
- Use MemPalace for cross-session semantic search
- SQLite backend for MemPalace (replace ChromaDB default)
- Coordinate between both systems (avoid duplication)

---

## QUESTIONS FOR USER

1. **LCM Sync Frequency:** Real-time (every message) or batch (every N messages)?
   - Tradeoff: Data freshness vs bandwidth

2. **CodeGraph Deployment:**
   - Deploy on all nodes now, or start with Node B (Director) and expand later?
   - Shared CodeGraph index or separate per-node indexes?

3. **Backup Strategy:**
   - How often should we backup Hermes-LCM databases?
   - Should we backup to Node C external SSD + offsite?

4. **CodeGraph Index Update Trigger:**
   - Manual re-index after significant changes?
   - Watch mode for continuous re-indexing?

---

## REFERENCES

- Hermes-LCM: https://github.com/stephenschoettler/hermes-lcm
- CodeGraph-Rust: https://github.com/Jakedismo/codegraph-rust
- MemPalace (Phase 4): https://github.com/MemPalace/mempalace
- LCM Paper: https://papers.voltropy.com/LCM

---

**Next Step:** Implement Task 1 (Mount Node C external SSD) - requires sudo access on Node C.
