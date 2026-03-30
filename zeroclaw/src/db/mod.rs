// zeroclaw/src/db/mod.rs
//
// Database layer — rusqlite connection + sqlite-vec extension loading.

pub mod import;
pub mod schema;
pub mod search;

use anyhow::Result;
use rusqlite::Connection;
use std::path::Path;

/// Open (or create) the rules.db SQLite file and load the sqlite-vec extension.
pub fn open(path: &Path) -> Result<Connection> {
    let conn = Connection::open(path)?;

    // Enable WAL mode for concurrent read access from ClawLink
    conn.pragma_update(None, "journal_mode", "WAL")?;
    conn.pragma_update(None, "synchronous", "NORMAL")?;

    // Load the sqlite-vec extension (must be present as a shared library on Node A)
    // sqlite-vec provides the vec0 virtual table for float32 vector search.
    unsafe {
        sqlite_vec::load(&conn)?;
    }

    tracing::debug!(path = %path.display(), "rules.db opened with sqlite-vec");
    Ok(conn)
}
