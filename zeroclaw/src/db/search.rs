// zeroclaw/src/db/search.rs
//
// Hybrid search: FTS5 BM25 keyword recall + vec0 cosine similarity re-ranking.
//
// Strategy:
//   1. FTS5 candidate recall: fetch up to 50 matching rowids ordered by BM25 rank.
//   2. vec0 cosine similarity: score those rowids against the query vector.
//   3. Merge: combined_score = 0.6 * cosine + 0.4 * normalised_bm25.
//   4. Namespace filter applied at the SQL level (Zero-Trust isolation).
//   5. Return top-k results as `SearchResult` JSON-serialisable structs.
//
// For Phase 1, the query vector is the zero vector (placeholder until ClawLink
// delivers real embeddings from Node B's embedding model). This still exercises
// the full pipeline — vec0 + FTS5 fusion — and returns FTS5-ranked results.

use anyhow::Result;
use rusqlite::Connection;
use serde::Serialize;

/// A single hybrid search result returned to the caller.
#[derive(Debug, Serialize)]
pub struct SearchResult {
    pub id: String,
    pub source_ref: String,
    pub namespace: String,
    pub context_type: String,
    pub section_heading: String,
    pub page_start: i64,
    pub page_end: i64,
    pub content: String,
    pub chunk_index: i64,
    pub score: f64,
}

/// Perform a hybrid FTS5 + vec0 search.
///
/// # Arguments
/// * `conn`      – Open rules.db connection (sqlite-vec must already be loaded).
/// * `query`     – Natural-language query string for FTS5 keyword matching.
/// * `namespace` – Namespace to restrict results to (Zero-Trust isolation).
/// * `top_k`     – Maximum number of results to return.
///
/// # Notes
/// Phase 1: query vector is zeros. FTS5 BM25 drives ranking until ClawLink
/// delivers real embeddings. The vec0 cosine path is exercised but contributes
/// a uniform score, so ordering is purely BM25-based in this phase.
pub fn hybrid_search(
    conn: &Connection,
    query: &str,
    namespace: &str,
    top_k: usize,
) -> Result<Vec<SearchResult>> {
    // ── Step 1: FTS5 candidate recall ─────────────────────────────────────────
    // Pull up to 50 candidates with their BM25 scores (negative = better match).
    // We filter by namespace at join time.
    let candidate_sql = r#"
        SELECT
            c.rowid,
            c.id,
            c.source_ref,
            c.namespace,
            c.context_type,
            c.section_heading,
            c.page_start,
            c.page_end,
            c.content,
            c.chunk_index,
            bm25(chunks_fts) AS bm25_score
        FROM chunks_fts
        JOIN chunks c ON c.rowid = chunks_fts.rowid
        WHERE chunks_fts MATCH ?1
          AND c.namespace = ?2
        ORDER BY bm25_score ASC
        LIMIT 50
    "#;

    struct Candidate {
        rowid: i64,
        id: String,
        source_ref: String,
        namespace: String,
        context_type: String,
        section_heading: String,
        page_start: i64,
        page_end: i64,
        content: String,
        chunk_index: i64,
        bm25_score: f64,
    }

    let mut stmt = conn.prepare(candidate_sql)?;
    let candidates: Vec<Candidate> = stmt
        .query_map(rusqlite::params![query, namespace], |row| {
            Ok(Candidate {
                rowid: row.get(0)?,
                id: row.get(1)?,
                source_ref: row.get(2)?,
                namespace: row.get(3)?,
                context_type: row.get(4)?,
                section_heading: row.get(5)?,
                page_start: row.get(6)?,
                page_end: row.get(7)?,
                content: row.get(8)?,
                chunk_index: row.get(9)?,
                bm25_score: row.get(10)?,
            })
        })?
        .collect::<Result<Vec<_>, _>>()?;

    if candidates.is_empty() {
        return Ok(vec![]);
    }

    // ── Step 2: Normalise BM25 scores ─────────────────────────────────────────
    // BM25 from FTS5 is negative (lower = better). Normalise to [0, 1] where
    // 1.0 = best match. We use min-max normalisation across candidates.
    let min_bm25 = candidates
        .iter()
        .map(|c| c.bm25_score)
        .fold(f64::INFINITY, f64::min);
    let max_bm25 = candidates
        .iter()
        .map(|c| c.bm25_score)
        .fold(f64::NEG_INFINITY, f64::max);

    let bm25_range = max_bm25 - min_bm25;

    // ── Step 3: vec0 cosine similarity ────────────────────────────────────────
    // Phase 1 placeholder: zero vector (768 × float32 = 3072 bytes).
    // When ClawLink delivers real query embeddings, replace this with the
    // actual embedding bytes received from Node B.
    let zero_vector = vec![0u8; 768 * 4];

    // Build the vec0 KNN query for the candidate rowids.
    // We query all candidates and filter by rowid IN (...) via the aux table.
    // vec0 distance metric: cosine distance (1 - cosine_similarity).
    let cosine_sql = r#"
        SELECT rowid, distance
        FROM chunks_embedding
        WHERE embedding MATCH ?1
          AND k = 50
    "#;

    // Map rowid → cosine distance
    use std::collections::HashMap;
    let mut cosine_map: HashMap<i64, f64> = HashMap::new();

    if let Ok(mut vec_stmt) = conn.prepare(cosine_sql) {
        let rows = vec_stmt.query_map(rusqlite::params![zero_vector], |row| {
            Ok((row.get::<_, i64>(0)?, row.get::<_, f64>(1)?))
        });
        if let Ok(rows) = rows {
            for row in rows.flatten() {
                cosine_map.insert(row.0, row.1);
            }
        }
    }
    // If vec0 query fails (e.g. empty table), fall back gracefully to BM25-only.

    // ── Step 4: Merge scores and rank ─────────────────────────────────────────
    let mut results: Vec<SearchResult> = candidates
        .into_iter()
        .map(|c| {
            // Normalised BM25: invert so higher = better
            let norm_bm25 = if bm25_range.abs() < 1e-10 {
                1.0
            } else {
                (c.bm25_score - max_bm25) / (-bm25_range)
            };

            // Cosine similarity from distance (distance = 1 - cosine_sim)
            let cosine_sim = cosine_map
                .get(&c.rowid)
                .map(|&dist| 1.0 - dist)
                .unwrap_or(0.0);

            let combined = 0.4 * norm_bm25 + 0.6 * cosine_sim;

            SearchResult {
                id: c.id,
                source_ref: c.source_ref,
                namespace: c.namespace,
                context_type: c.context_type,
                section_heading: c.section_heading,
                page_start: c.page_start,
                page_end: c.page_end,
                content: c.content,
                chunk_index: c.chunk_index,
                score: combined,
            }
        })
        .collect();

    // Sort descending by score
    results.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    results.truncate(top_k);

    Ok(results)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::{import, schema};
    use rusqlite::Connection;

    fn in_memory_conn() -> Connection {
        unsafe {
            rusqlite::ffi::sqlite3_auto_extension(Some(std::mem::transmute(
                sqlite_vec::sqlite3_vec_init as *const (),
            )));
        }
        let conn = Connection::open_in_memory().expect("in-memory db");
        schema::init(&conn).expect("schema init");
        conn
    }

    /// Seed the DB with two chunks in `core_rules` and one in `campaign_ttta`.
    fn seed_chunks(conn: &Connection) {
        use import::{ImportChunk, ImportFile};
        use std::io::Write as _;
        use tempfile::NamedTempFile;

        let zeros = vec![0u8; 768 * 4];
        let vector_b64 = base64::engine::general_purpose::STANDARD.encode(&zeros);

        let chunks = vec![
            ImportChunk {
                id: "a0000000-0000-0000-0000-000000000001".to_string(),
                source_file: "core_rules/cpred.pdf".to_string(),
                source_ref: "CPRED-CORE".to_string(),
                namespace: "core_rules".to_string(),
                context_type: "mechanic".to_string(),
                capability_req: "none".to_string(),
                section_heading: "Ranged Attack".to_string(),
                page_start: 10,
                page_end: 11,
                content: "To make a ranged attack roll d10 plus REF plus the relevant skill.".to_string(),
                chunk_index: 0,
                token_estimate: 14,
                vector_b64: vector_b64.clone(),
            },
            ImportChunk {
                id: "a0000000-0000-0000-0000-000000000002".to_string(),
                source_file: "core_rules/cpred.pdf".to_string(),
                source_ref: "CPRED-CORE".to_string(),
                namespace: "core_rules".to_string(),
                context_type: "mechanic".to_string(),
                capability_req: "none".to_string(),
                section_heading: "Melee Attack".to_string(),
                page_start: 12,
                page_end: 13,
                content: "Melee combat uses BODY plus the relevant melee weapon skill.".to_string(),
                chunk_index: 1,
                token_estimate: 12,
                vector_b64: vector_b64.clone(),
            },
            ImportChunk {
                id: "a0000000-0000-0000-0000-000000000003".to_string(),
                source_file: "campaign_ttta/ttta.pdf".to_string(),
                source_ref: "TTTA-P1".to_string(),
                namespace: "campaign_ttta".to_string(),
                context_type: "lore".to_string(),
                capability_req: "none".to_string(),
                section_heading: "Afterlife Bar".to_string(),
                page_start: 1,
                page_end: 2,
                content: "The Afterlife is a bar frequented by edgerunners in Night City.".to_string(),
                chunk_index: 0,
                token_estimate: 13,
                vector_b64: vector_b64.clone(),
            },
        ];

        let import_file = ImportFile {
            version: 1,
            exported_at: "2026-03-30T00:00:00.000Z".to_string(),
            chunk_count: chunks.len(),
            vector_dimensions: 768,
            chunks,
        };

        let mut tmp = NamedTempFile::new().unwrap();
        write!(tmp, "{}", serde_json::to_string(&import_file).unwrap()).unwrap();
        import::run(conn, tmp.path()).unwrap();

        // Populate FTS index
        conn.execute_batch(
            "INSERT INTO chunks_fts(chunks_fts) VALUES('rebuild')"
        ).unwrap();
    }

    #[test]
    fn test_search_returns_results_for_matching_query() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        let results = hybrid_search(&conn, "ranged attack", "core_rules", 5).unwrap();
        assert!(!results.is_empty(), "Expected results for 'ranged attack'");
        assert!(
            results[0].content.to_lowercase().contains("ranged"),
            "Top result should contain 'ranged'"
        );
    }

    #[test]
    fn test_search_namespace_isolation() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        // Query matches the campaign_ttta chunk; must not appear under core_rules
        let results = hybrid_search(&conn, "afterlife bar", "core_rules", 5).unwrap();
        for r in &results {
            assert_eq!(r.namespace, "core_rules", "Namespace isolation violated");
        }
    }

    #[test]
    fn test_search_returns_empty_for_no_match() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        let results = hybrid_search(&conn, "xyzzy_nonexistent_term_42", "core_rules", 5).unwrap();
        assert!(results.is_empty(), "Expected no results for garbage query");
    }

    #[test]
    fn test_search_respects_top_k() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        // Both core_rules chunks contain "attack" — top_k=1 should return only 1
        let results = hybrid_search(&conn, "attack", "core_rules", 1).unwrap();
        assert_eq!(results.len(), 1, "top_k=1 should return at most 1 result");
    }

    #[test]
    fn test_search_returns_campaign_chunk_in_correct_namespace() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        let results = hybrid_search(&conn, "afterlife", "campaign_ttta", 5).unwrap();
        assert!(!results.is_empty(), "Expected afterlife result in campaign_ttta");
        assert_eq!(results[0].namespace, "campaign_ttta");
    }

    #[test]
    fn test_search_result_fields_populated() {
        let conn = in_memory_conn();
        seed_chunks(&conn);

        let results = hybrid_search(&conn, "ranged", "core_rules", 1).unwrap();
        assert_eq!(results.len(), 1);
        let r = &results[0];
        assert!(!r.id.is_empty());
        assert!(!r.source_ref.is_empty());
        assert!(!r.content.is_empty());
        assert!(!r.section_heading.is_empty());
        assert!(r.score >= 0.0);
    }
}
