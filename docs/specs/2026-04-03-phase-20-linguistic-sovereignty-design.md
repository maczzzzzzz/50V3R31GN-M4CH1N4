# Design: Phase 20 — Linguistic Sovereignty & Secret Channels
**Date:** 2026-04-03
**Version:** 1.6.0
**Target:** NPC Identity & Hive Coordination

## 1. Overview
Phase 20 integrates the **GLOSSOPETRAE** pattern to give NPCs unique linguistic identities and establish secure coordination sidechannels within the Hive.

## 2. Architecture & Components

### 2.1 Skillstone Registry (Node B)
- **Format:** A compact (~8k token) Markdown specification defining a conlang's phonology, grammar, and core lexicon.
- **Registry:** Node B maintains a mapping of `factionId` -> `conlangSeed`.
- **Injection:** When an NPC from a specific faction speaks, Node B prepends the relevant **Skillstone** to the LLM context, enabling the model to "speak" the generated language fluently.

### 2.2 Linguistic Steganography (Node A Engine)
ZeroClaw-Rust implements the 9 covert channels of GLOSSOPETRAE:
- **Synonym Selection:** Choosing between alternate roots based on the data bit.
- **Word Order Permutation:** Reordering clauses in the conlang to encode information.
- **Implementation:** Node A receives a `cleartext_conlang` and a `binary_payload` from Node B, and returns the `encoded_conlang`.

### 2.3 Rules Sidechannel (The Vault's Voice)
- **Mechanism:** Utilizing ST3GG (Node A), sensitive rules data (e.g., "This NPC is actually a spy with 20HP") is encoded into the alpha channel of debug screenshots sent to Node B.
- **Benefit:** Prevents "Mechanical Leakage" in the narrative logs. The AI GM (Node B) can decode these secrets to inform its logic without the data ever appearing in human-readable logs.

## 3. Data Flow
1. **Linguistic:** `LLM` -> `Raw Conlang` -> `Node A (Linguistic Steganography)` -> `Encoded Conlang` -> `Foundry Chat`.
2. **Sidechannel:** `Node A (Rules State)` -> `ST3GG Encode` -> `Image Buffer` -> `Node B (Orchestrator)`.

## 4. Success Criteria
- [ ] LLM can successfully translate English to the generated Conlang using the Skillstone.
- [ ] Data can be hidden and recovered from conlang text with zero change to semantic meaning.
- [ ] NPC tactical coordination (e.g., "Flank left") is successfully transmitted via steganography.
