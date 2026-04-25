# Phase 20: Linguistic Sovereignty & Parseltongue Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this task-by-task.

**Goal:** Establish the "Sovereign Linguistic Layer" by integrating GLOSSOPETRAE and P4RS3LT0NGV3 patterns.

**Architecture:** Node B (TypeScript) manages conlang specs and invisible command embedding. Node A (Rust) handles high-speed linguistic permutation for steganography.

**Tech Stack:** TypeScript (String manipulation), Rust (Linguistic logic), LLM (In-Context Learning).

---

### Task 1: Skillstone Registry & NPC Dialect Integration

**Files:**
- Create: `src/core/skillstone-service.ts`
- Modify: `src/core/story-engine.ts`

**Step 1: Implement the Skillstone Service**
Develop a generator that creates deterministic conlang specifications (Skillstones) from a numeric seed.

**Step 2: NPC Context Hook**
Update the `StoryEngine` to fetch the faction's conlang seed from `Akashik.db` and prepend the Skillstone to the LLM system prompt.

---

### Task 2: Parseltongue — Invisible Command Protocol

**Files:**
- Create: `src/shared/parseltongue-codec.ts`
- Modify: `src/api/clawlink-client.ts`

**Step 1: Implement the Unicode Tag Block (U+E0000) Codec**
Create an encoder/decoder that hides/reveals JSON strings as invisible Unicode tags within benign text.

**Step 2: Narrative Mesh Integration**
Update the `ClawLink` client to scan incoming narrative strings for these invisible tags and automatically execute the world-state mutations they contain.

---

### Task 3: Node A — Linguistic Steganography Engine

**Files:**
- Create: `zeroclaw/src/linguistics/mod.rs`
- Modify: `zeroclaw/src/server/mod.rs`

**Step 1: Implement Synonym & Word Order Mutation**
Create a Rust module that takes a "Cleartext Conlang" and a "Binary Payload" and returns the "Encoded Conlang" using P4RS3LT0NGV3-inspired transforms.

**Step 2: RPC Exposition**
Expose `linguistic_encode` and `linguistic_decode` variants to the ClawLink protocol for high-performance data smuggling.


---
**LINKS:** [[OS_CORE]]
