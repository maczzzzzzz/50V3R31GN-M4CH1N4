/**
 * src/core/ingest/hash.ts
 * Phase 57: SHA-256 content hashing for semantic deduplication.
 */

import { createHash } from 'node:crypto';

/**
 * Returns a 64-char hex SHA-256 digest of the given text.
 * Used as `semantic_hash` in `chronicle_seeds` to prevent duplicate ingestion.
 */
export function semanticHash(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex');
}
