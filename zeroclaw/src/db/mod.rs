// zeroclaw/src/db/mod.rs
//
// Database layer — rusqlite connection + sqlite-vec extension loading.

pub mod import;
pub mod schema;
pub mod search;

use anyhow::Result;
use rusqlite::{ffi::sqlite3_auto_extension, Connection};
use std::path::Path;

/// Open (or create) the rules.db SQLite file and load the sqlite-vec extension.
pub fn open(path: &Path) -> Result<Connection> {
    // Register sqlite-vec extension before opening the connection.
    // This ensures vec0 virtual tables and vector functions are available.
    unsafe {
        sqlite3_auto_extension(Some(std::mem::transmute(
            sqlite_vec::sqlite3_vec_init as *const (),
        )));
    }

    let conn = Connection::open(path)?;

    tracing::debug!(path = %path.display(), "rules.db opened with sqlite-vec");
    Ok(conn)
}
