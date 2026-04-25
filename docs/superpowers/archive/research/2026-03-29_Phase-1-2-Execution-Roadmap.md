# Research Report: Phase 1 & 2 Execution Roadmap
**Date:** Sunday, March 29, 2026
**Subject:** Technical Requirements for Tasks 1–7 (Ingestion through Nitro-Logic)

## 1. Task 1: PdfFileParser (TDD)
- **Library:** `pdf-parse` (Local-only, no cloud dependencies).
- **Metadata Extraction:** Research confirms `pdf-parse` provides `numpages` and text segments that can be mapped to `pageStart` and `pageEnd`.
- **SourceRef Generation:** Must follow the pattern: `[FILE-ALIAS]-p[PAGE_NUMBER]` (e.g., `CPRED-CRB-p169`).
- **TDD Requirement:** Test must verify that multi-page PDFs are correctly chunked with accurate page numbering.

## 2. Task 2: ChunkInserter (TDD)
- **Artery of Truth:** PostgreSQL + `pgvector` on Node A (192.168.0.50).
- **Idempotency:** Research indicates `ON CONFLICT (source_file, chunk_index) DO UPDATE` is the mandatory pattern to prevent duplicate embeddings.
- **Batching:** Optimal batch size for `pgvector` on the GTX 1050 Ti (4GB VRAM) is **50–100 chunks** per transaction to avoid memory overflow on Node A.

## 3. Task 3 & 4: SeedOrchestrator & run-seed.ts
- **Namespace Isolation:** The orchestrator must dynamically map the three local directories to their respective `pgvector` namespaces:
  1. `docs/raw_data/core_rules/` -> `core_rules`
  2. `docs/raw_data/campaign_ttta/` -> `campaign_ttta`
  3. `docs/raw_data/entities_mooks/` -> `entities_mooks`
- **Ollama Rate Limiting:** Research suggests a **200ms delay** between embedding batches to ensure Node B's Mistral-Nemo (16GB VRAM) remains responsive for the Crush CLI session.

## 4. Task 5: nitro-db MCP Server (TDD)
- **Protocol:** Model Context Protocol (MCP) v1.0.
- **Transport:** `stdio` (Command-line based) for native Crush/Catwalk integration.
- **Capabilities:** Must expose a `rag_query` tool that accepts `query`, `namespace`, `topK`, and `similarityThreshold`.

## 5. Task 6: NitroLogicClient (TDD)
- **Endpoint:** `http://192.168.0.50:8080/v1/chat/completions`.
- **Chain of Thought (CoT):** Research confirms Llama-3.2-3B requires a mandatory system prompt suffix: *"Explain your math step-by-step before providing the final JSON result."*
- **Parameter Hardening:** Force `temperature: 0.0` and `top_k: 1` in the client implementation to ensure deterministic TRPG results.

## 6. Task 7: nitro-logic MCP Server (TDD)
- **Tool Mapping:** Must expose tools for `resolve_attack`, `calculate_dv`, and `oracle_roll`.
- **Zero-Trust Validation:** The server must use Zod to validate the JSON returning from the `NitroLogicClient` before passing it to the Crush console.

---

## 7. Strategic Implementation Sequence
1.  **Red Phase:** Write failing Vitest tests for `PdfFileParser` and `ChunkInserter`.
2.  **Green Phase:** Implement the parsers and verified Node A handshake.
3.  **Refactor Phase:** Ensure all metadata fields (`source_ref`, `context_type`, `capability_req`) are populated according to the **Metadata Mandate**.
4.  **Final Integration:** Verify the `stdio` MCP connection within the Crush CLI.


---
**LINKS:** [[OS_CORE]]
