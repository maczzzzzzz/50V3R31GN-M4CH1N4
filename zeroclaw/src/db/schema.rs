// zeroclaw/src/db/schema.rs
//
// DDL for rules.db — vec0 virtual table + FTS5 hybrid search schema.
//
// Design:
//   - `chunks` table holds metadata (mirrors Postgres pdf_chunks minus embedding).
//   - `chunks_embedding` is a vec0 virtual table that stores the 768-dim float32
//     vectors. Its rowid is the same as chunks.rowid (direct JOIN by rowid).
//   - `chunks_fts` is an FTS5 virtual table for keyword search. Content is
//     sourced from `chunks` (content=chunks), so no data duplication.
//
// Hybrid search merges vec0 cosine similarity scores with FTS5 BM25 scores,
// weighting by namespace to enforce Zero-Trust namespace isolation.

use anyhow::Result;
use rusqlite::Connection;

const INIT_SQL: &str = r#"
-- Main chunk metadata table
CREATE TABLE IF NOT EXISTS chunks (
    rowid         INTEGER PRIMARY KEY,
    id            TEXT    UNIQUE NOT NULL,
    source_file   TEXT    NOT NULL,
    source_ref    TEXT    NOT NULL,
    namespace     TEXT    NOT NULL CHECK (namespace IN ('core_rules','campaign_ttta','entities_mooks')),
    context_type  TEXT    NOT NULL CHECK (context_type IN ('mechanic','lore')),
    capability_req TEXT   NOT NULL DEFAULT 'none',
    section_heading TEXT  NOT NULL,
    page_start    INTEGER NOT NULL DEFAULT 0,
    page_end      INTEGER NOT NULL DEFAULT 0,
    content       TEXT    NOT NULL,
    chunk_index   INTEGER NOT NULL,
    token_estimate INTEGER NOT NULL DEFAULT 0
);

-- Vector index: float32[768] blob per chunk row (rowid-joined with chunks)
-- sqlite-vec vec0 virtual table: each row stores one 768-dim float32 vector.
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_embedding USING vec0(
    embedding float[768]
);

-- FTS5 keyword index for hybrid BM25 + semantic search
-- content=chunks makes this a contentless FTS table (no duplicate data).
CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
    content,
    source_ref,
    section_heading,
    content=chunks,
    content_rowid=rowid
);

-- Namespace index for fast WHERE filtering on every RAG query
CREATE INDEX IF NOT EXISTS chunks_namespace_idx ON chunks (namespace);

-- chunk_index index for migration ordering verification
CREATE INDEX IF NOT EXISTS chunks_chunk_index_idx ON chunks (chunk_index);
"#;

/// Initialise the rules.db schema. Idempotent — safe to re-run.
pub fn init(conn: &Connection) -> Result<()> {
    conn.execute_batch(INIT_SQL)?;
    tracing::info!("rules.db schema initialised");
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    fn in_memory_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory db");
        unsafe { sqlite_vec::load(&conn).expect("sqlite-vec"); }
        conn
    }

    #[test]
    fn test_schema_init_is_idempotent() {
        let conn = in_memory_conn();
        // Should not panic on first run
        init(&conn).expect("first init");
        // Should not panic on second run (CREATE IF NOT EXISTS)
        init(&conn).expect("second init");
    }

    #[test]
    fn test_chunks_table_exists_after_init() {
        let conn = in_memory_conn();
        init(&conn).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='chunks'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_vec0_virtual_table_exists() {
        let conn = in_memory_conn();
        init(&conn).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE name='chunks_embedding'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_fts5_table_exists() {
        let conn = in_memory_conn();
        init(&conn).unwrap();

        let count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sqlite_master WHERE name='chunks_fts'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(count, 1);
    }

    #[test]
    fn test_namespace_constraint_enforced() {
        let conn = in_memory_conn();
        init(&conn).unwrap();

        let result = conn.execute(
            "INSERT INTO chunks (id, source_file, source_ref, namespace, context_type, section_heading, content, chunk_index)
             VALUES ('test-id', 'test.pdf', 'REF-1', 'invalid_namespace', 'mechanic', 'Test', 'Test content', 0)",
            [],
        );
        assert!(result.is_err(), "Invalid namespace should be rejected by CHECK constraint");
    }
}
