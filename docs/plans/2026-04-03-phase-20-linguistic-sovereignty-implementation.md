# Phase 20: Linguistic Sovereignty & Secret Channels Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement unique NPC dialects via Skillstones and establish covert Hive coordination via linguistic steganography.

**Architecture:** Node B manages the language specs (Skillstones). Node A handles the complex linguistic permutation logic for data encoding.

**Tech Stack:** TypeScript, Rust, LLM In-Context Learning (ICL).

---

### Task 1: Skillstone Registry & ICL Injection

**Files:**
- Create: `src/core/skillstone-service.ts`
- Create: `data/skillstones/default.md`

**Step 1: Implement Skillstone Generator**
Create a service that generates an 8k-token Markdown spec from a numeric seed.

**Step 2: NPC Context Hook**
Modify `StoryEngine` to inject the Skillstone based on the NPC's `faction_id`.

---

### Task 2: Node A — Linguistic Steganography

**Files:**
- Create: `zeroclaw/src/linguistics/mod.rs`
- Modify: `zeroclaw/src/server/mod.rs`

**Step 1: Implement Synonym Mapping**
Create a Rust dictionary that maps conlang roots to alternate synonyms for bit-encoding.

**Step 2: Implementation of Word Order Permutation**
Implement a rule-based swapper for SVO/SOV structures in the conlang.

**Step 3: RPC Integration**
Expose `linguistic_encode` and `linguistic_decode` to the ClawLink client.

---

### Task 3: The Rules Sidechannel

**Files:**
- Modify: `src/core/visual-monitor-service.ts`
- Modify: `zeroclaw/src/perception/mod.rs`

**Step 1: Encode Rules in Screenshots**
In Node A's `ocr_analyze`, encode current tactical state into the image alpha channel before returning.

**Step 2: Decode in Node B**
Update `VisualMonitorService` to automatically check for hidden rules data in incoming perception buffers.
