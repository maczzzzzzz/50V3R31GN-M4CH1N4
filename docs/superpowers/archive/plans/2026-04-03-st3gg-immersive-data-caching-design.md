# Design: ST3GG Immersive Data Caching (Dynamic Screamsheet Drops)
**Date:** 2026-04-03
**Target:** v3.4.2 (Phase 17 Integration)

## 1. Architecture & Data Flow

**Core Concept:**
Utilize ST3GG's Least Significant Bit (LSB) steganography logic to hide dynamically generated, lore-accurate secrets (passwords, clues, lore) directly within standard image files in Foundry VTT. This mechanic ("The Screamsheet Drop") turns passive investigation or Netrunning into an active, immersive decryption minigame. 

**Overhead Constraint Management:**
*   **Zero GPU Cost:** LSB encoding/decoding is pure pixel-math. It will be executed entirely on Node B's CPU, requiring 0 VRAM and bypassing Node A entirely.
*   **Asset Reuse:** Instead of generating new images via Stable Diffusion (which costs VRAM/time), the system will inject LSB payloads into a pre-existing directory of "Junk Data" templates (e.g., generic corporate logos, static screens, screamsheet headers).

**Data Flow:**
1.  **The Trigger (Foundry):** A player succeeds on a Netrunning check (e.g., bypassing a File node) or a meat-space investigation check. The Mesh routes this success to Node B.
2.  **Context Generation (Node B - GPU):** Mistral-Nemo generates a short, contextual secret based on the current scene (e.g., "Access code for sublevel 3 is 'Icarus'").
3.  **Dynamic Encoding (Node B - CPU):** A new lightweight `steganography-service.ts` randomly selects a "Junk Data" image template. It encodes the LLM's secret into the image's LSBs via a fast, CPU-bound canvas/buffer operation.
4.  **The Drop (Foundry):** Node B sends the encoded image file path back to Foundry. The GM (or automation) drops this image into the chat as a "Corrupted File" handout.
5.  **The Decryption (Foundry/Node B):** The player uses a custom Foundry Macro ("Run Decryption Daemon") on the image. The image path is sent to Node B's CPU, which decodes the LSB payload and whispers the hidden secret to the player in Foundry chat.

## 2. Components

1.  **`steganography-service.ts` (Node B):**
    *   A pure TypeScript implementation of basic LSB encoding/decoding.
    *   Manages a library of "template" PNGs.
    *   Handles the buffer manipulation required to flip the least significant bits of the image channels to store the binary representation of the LLM-generated string.
2.  **`hybrid-routing-controller.ts` (Node B):**
    *   Intercepts specific "investigation success" or "file extraction" events from Foundry.
    *   Queries `StoryEngine` for the secret text.
    *   Calls `SteganographyService` to generate the image.
    *   Routes the resulting image path back to Foundry.
3.  **Foundry "Decrypt" Macro (Client):**
    *   A simple JavaScript macro provided to players (representing a software program like a "Decryption Demon").
    *   When executed on a selected image in chat/journal, it sends an RPC request to the Mesh -> Node B to decode that specific image path and return the result.

## 3. Testing Plan

1.  **Steganography Service Unit Tests (Node B):** Verify that `steganography-service.ts` can take a known PNG, encode a 256-character string into its LSBs, save it, read it back, and decode the exact string without data loss. Ensure execution time is < 50ms.
2.  **LLM Generation Pipeline Test (Node B):** Verify the `HybridRoutingController` correctly requests a contextual secret from Mistral-Nemo when triggered by a mock "file_extraction" event.
3.  **Foundry Macro Integration:** Test the end-to-end loop: The Macro sends a request to the Mesh, the Mesh forwards to Node B, Node B decodes the file, and the text is whispered back to the specific Foundry user.

---
**LINKS:** [[OS_CORE]]
