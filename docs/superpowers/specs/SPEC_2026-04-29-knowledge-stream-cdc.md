# SPEC: Knowledge Stream Plugin (v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS)
**Architecture:** CocoIndex-style Change Data Capture (CDC) for Unstructured Knowledge.
**Goal:** Eliminate "Snapshot Drift" by treating local files as live event streams.

## ◈ OVERVIEW
The Knowledge Stream Plugin watches local directories and publishes atomic change events (Upsert/Delete) to a persistent JSONL log. Hermes agents subscribe to this stream to maintain bit-identical context freshness without periodic re-indexing.

## ◈ TECHNICAL STACK
- **Engine**: Rust (Tokio + Notify crate for fs watching).
- **Log Format**: `knowledge_stream.jsonl` (Durable, replayable).
- **Integration**: Injects directly into `ContextDAG` via `HermesSingularity`.

## ◈ CAPABILITIES
1. **Live Watching**: Real-time detection of file edits, additions, and deletions.
2. **Atomic Deltas**: Only publishes the changed fragment (CDC) rather than the whole file.
3. **Replay/Backfill**: New agents can replay the stream to reconstruct the current world-state.
4. **Audit Trail**: Every context injection is timestamped and linked to the source file offset.

## ◈ IMPLEMENTATION (PHASE 107)
### Task 1: The Watcher Sidecar (Rust)
- Scaffold `crates/sovereign-watcher`.
- Implement recursive `inotify` / `fsevents` wrapper.
- Emit `FileChangeEvent { path, action, content_hash, timestamp }`.

### Task 2: Delta Distiller (TS)
- Create `src/core/memory/KnowledgeStreamDistiller.ts`.
- Compare file hashes and extract changed blocks.
- Publish to `data/knowledge_stream.jsonl`.

### Task 3: Hermes Integration
- Add `subscribeToKnowledgeStream()` to `HermesSingularity`.
- Auto-inject "Fresh Fragments" into the active `ContextDAG` if they match the current task semantics.

---
**::/5Y573M-N071C3 : KNOWLEDGE_STREAM_SPEC_LOCKED. // 50V3R31GN-M4CH1N4**
