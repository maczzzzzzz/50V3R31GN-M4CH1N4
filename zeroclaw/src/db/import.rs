// zeroclaw/src/db/import.rs
//
// Import a .zeroclaw.json export file into rules.db.
// Reads the JSON produced by Node B's PostgresExporter and inserts all chunks
// into the `chunks` metadata table and the `chunks_embedding` vec0 virtual table.

use anyhow::{Context, Result};
use base64::Engine as _;
use rusqlite::Connection;
use serde::Deserialize;
use std::fs;
use std::path::Path;

// ── Import file schema (mirrors ZerocrawlExportSchema in TypeScript) ──────────

#[derive(Debug, Deserialize)]
pub struct ImportFile {
    pub version: u32,
    pub exported_at: String,
    pub chunk_count: usize,
    pub vector_dimensions: u32,
    pub chunks: Vec<ImportChunk>,
}

#[derive(Debug, Deserialize)]
pub struct ImportChunk {
    pub id: String,
    pub source_file: String,
    pub source_ref: String,
    pub namespace: String,
    pub context_type: String,
    pub capability_req: String,
    pub section_heading: String,
    pub page_start: i64,
    pub page_end: i64,
    pub content: String,
    pub chunk_index: i64,
    pub token_estimate: i64,
    /// Little-endian float32 blob, base64-encoded (768 × 4 bytes).
    pub vector_b64: String,
}

// ── Implementation ────────────────────────────────────────────────────────────

/// Load a .zeroclaw.json export and upsert all chunks into rules.db.
/// Returns the number of chunks successfully imported.
pub fn run(conn: &Connection, path: &Path) -> Result<usize> {
    let raw = fs::read_to_string(path)
        .with_context(|| format!("Failed to read import file: {}", path.display()))?;

    let import: ImportFile = serde_json::from_str(&raw)
        .with_context(|| "Failed to parse .zeroclaw.json")?;

    // Validate version
    if import.version != 1 {
        anyhow::bail!("Unsupported import file version: {}", import.version);
    }
    if import.vector_dimensions != 768 {
        anyhow::bail!("Expected vector_dimensions=768, got {}", import.vector_dimensions);
    }
    if import.chunks.len() != import.chunk_count {
        anyhow::bail!(
            "chunk_count mismatch: header says {} but found {} chunks",
            import.chunk_count,
            import.chunks.len()
        );
    }

    tracing::info!(
        file = %path.display(),
        count = import.chunk_count,
        exported_at = %import.exported_at,
        "Importing ZeroClaw export"
    );

    let mut imported = 0usize;

    for chunk in &import.chunks {
        // Decode the base64 float32 blob
        let vector_bytes = base64::engine::general_purpose::STANDARD
            .decode(&chunk.vector_b64)
            .with_context(|| format!("Failed to decode vector_b64 for chunk {}", chunk.id))?;

        if vector_bytes.len() != 768 * 4 {
            anyhow::bail!(
                "Chunk {}: expected {} vector bytes, got {}",
                chunk.id,
                768 * 4,
                vector_bytes.len()
            );
        }

        // Insert metadata — ON CONFLICT UPDATE for idempotency
        conn.execute(
            r#"INSERT INTO chunks
               (id, source_file, source_ref, namespace, context_type, capability_req,
                section_heading, page_start, page_end, content, chunk_index, token_estimate)
               VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)
               ON CONFLICT(id) DO UPDATE SET
                 source_file=excluded.source_file, source_ref=excluded.source_ref,
                 content=excluded.content, token_estimate=excluded.token_estimate"#,
            rusqlite::params![
                chunk.id,
                chunk.source_file,
                chunk.source_ref,
                chunk.namespace,
                chunk.context_type,
                chunk.capability_req,
                chunk.section_heading,
                chunk.page_start,
                chunk.page_end,
                chunk.content,
                chunk.chunk_index,
                chunk.token_estimate,
            ],
        )?;

        // Get the rowid just assigned (or updated) for this chunk.
        // On INSERT: last_insert_rowid() returns the new rowid.
        // On UPDATE (conflict): last_insert_rowid() returns the existing rowid
        // because SQLite updates last_insert_rowid on DO UPDATE SET as well.
        let rowid: i64 = conn.last_insert_rowid();

        // Upsert into the vec0 virtual table using the same rowid
        conn.execute(
            "INSERT OR REPLACE INTO chunks_embedding (rowid, embedding) VALUES (?1, ?2)",
            rusqlite::params![rowid, vector_bytes],
        )?;

        imported += 1;
    }

    tracing::info!(imported, "Import complete");
    Ok(imported)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema;
    use rusqlite::Connection;
    use tempfile::NamedTempFile;

    fn in_memory_conn() -> Connection {
        let conn = Connection::open_in_memory().expect("in-memory db");
        unsafe { sqlite_vec::load(&conn).expect("sqlite-vec"); }
        schema::init(&conn).expect("schema init");
        conn
    }

    fn make_import_file(chunks: Vec<ImportChunk>) -> ImportFile {
        ImportFile {
            version: 1,
            exported_at: "2026-03-30T00:00:00.000Z".to_string(),
            chunk_count: chunks.len(),
            vector_dimensions: 768,
            chunks,
        }
    }

    fn make_chunk(id: &str, chunk_index: i64) -> ImportChunk {
        // 768-dim zero vector, little-endian float32, base64-encoded
        let zeros = vec![0u8; 768 * 4];
        let vector_b64 = base64::engine::general_purpose::STANDARD.encode(&zeros);

        ImportChunk {
            id: id.to_string(),
            source_file: "core_rules/test.pdf".to_string(),
            source_ref: "TEST-REF".to_string(),
            namespace: "core_rules".to_string(),
            context_type: "mechanic".to_string(),
            capability_req: "none".to_string(),
            section_heading: "Test Section".to_string(),
            page_start: 0,
            page_end: 0,
            content: format!("Test content for chunk {chunk_index}"),
            chunk_index,
            token_estimate: 6,
            vector_b64,
        }
    }

    #[test]
    fn test_import_inserts_chunks_and_vectors() {
        let conn = in_memory_conn();
        let import = make_import_file(vec![
            make_chunk("550e8400-e29b-41d4-a716-446655440000", 0),
            make_chunk("550e8400-e29b-41d4-a716-446655440001", 1),
        ]);

        // Write to temp file and import
        let tmp = NamedTempFile::new().unwrap();
        fs::write(tmp.path(), serde_json::to_string(&import).unwrap()).unwrap();

        let count = run(&conn, tmp.path()).unwrap();
        assert_eq!(count, 2);

        let chunk_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chunks", [], |r| r.get(0))
            .unwrap();
        assert_eq!(chunk_count, 2);

        let vec_count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chunks_embedding", [], |r| r.get(0))
            .unwrap();
        assert_eq!(vec_count, 2);
    }

    #[test]
    fn test_import_is_idempotent() {
        let conn = in_memory_conn();
        let import = make_import_file(vec![make_chunk("550e8400-e29b-41d4-a716-446655440000", 0)]);
        let tmp = NamedTempFile::new().unwrap();
        let json = serde_json::to_string(&import).unwrap();
        fs::write(tmp.path(), &json).unwrap();

        run(&conn, tmp.path()).unwrap();
        run(&conn, tmp.path()).unwrap(); // second run — should not duplicate

        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM chunks", [], |r| r.get(0))
            .unwrap();
        assert_eq!(count, 1, "Idempotent import should not create duplicates");
    }

    #[test]
    fn test_import_rejects_wrong_version() {
        let conn = in_memory_conn();
        let mut import = make_import_file(vec![]);
        import.version = 2;
        let tmp = NamedTempFile::new().unwrap();
        fs::write(tmp.path(), serde_json::to_string(&import).unwrap()).unwrap();

        let result = run(&conn, tmp.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("Unsupported import file version"));
    }

    #[test]
    fn test_import_rejects_chunk_count_mismatch() {
        let conn = in_memory_conn();
        let mut import = make_import_file(vec![make_chunk("id-1", 0)]);
        import.chunk_count = 999; // Deliberate mismatch
        let tmp = NamedTempFile::new().unwrap();
        fs::write(tmp.path(), serde_json::to_string(&import).unwrap()).unwrap();

        let result = run(&conn, tmp.path());
        assert!(result.is_err());
        assert!(result.unwrap_err().to_string().contains("chunk_count mismatch"));
    }
}
