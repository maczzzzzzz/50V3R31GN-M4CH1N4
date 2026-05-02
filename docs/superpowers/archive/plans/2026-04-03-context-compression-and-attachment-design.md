# Design: Context Compression & Entity Attachment
**Date:** 2026-04-03
**Target:** v3.8.26-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS+ (Phase 18 Pre-requisites)

## 1. Architecture & Data Flow

**Core Concept:**
We must offload non-essential data processing and spatial logic from the LLMs to the Foundry client. By adopting logic from `Token Action HUD` and `Token Attacher`, we drastically reduce the context window size required for Node B and eliminate the need for the LLM to calculate relative spatial coordinates for grouped entities.

**1. Context Compression (Token Action HUD Pattern):**
Instead of sending a massive, 200+ line JSON object representing a Cyberpunk RED Actor sheet to Mistral-Nemo, the Foundry module will pre-parse the actor's inventory, skills, and cyberware into a flat, valid action list.
*   *Data Flow:* Foundry Client -> Parses Actor -> Returns `["fire_heavy_pistol_single", "reload", "brawl", "quickhack"]` -> Sends to Node B.
*   *Benefit:* Saves thousands of tokens per request, significantly speeding up Node B inference and reducing hallucination.

**2. Entity Attachment (Token Attacher Pattern):**
Establish parent-child hierarchies directly within Foundry's canvas. When a vehicle moves, all passengers move with it automatically.
*   *Data Flow:* Foundry Hook (`preUpdate`) -> Detects movement of Parent Token -> Calculates delta -> Applies exact same delta to all registered Child Tokens.
*   *Benefit:* Zero impact on LLM compute or Node A/B VRAM. The LLM only needs to command the "Vehicle" to move; the client handles the rest.

## 2. Components
*   **`ActionCompressionService` (Foundry Client):** A JavaScript class that scans a `cpred` actor and outputs a sanitized string array of available combat/netrunning options.
*   **`TokenAttachmentManager` (Foundry Client):** A manager that listens to `preUpdateToken` and `updateToken` hooks. It reads a custom `flags.asp.attached` array on the parent token to synchronize transforms.

---
**LINKS:** [[OS_CORE]]
