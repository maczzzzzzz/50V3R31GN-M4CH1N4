/// zeroclaw/src/rules/dv_resolver.rs
/// Phase 59: DV Lookup Engine — queries dv_tables in Akashik.db.
///
/// Default DV table fallback (CPR Core p.413) is hardcoded for CPU-fallback
/// operation while the DB connection is unavailable.

use rusqlite::{Connection, OptionalExtension};
use std::collections::HashMap;

// ---------------------------------------------------------------------------
// Default DV table (hardcoded fallback, CPR Core p.413)
// ---------------------------------------------------------------------------

fn default_dv_table() -> HashMap<(&'static str, &'static str), i32> {
    let mut t = HashMap::new();
    // Pistol
    t.insert(("pistol", "close"), 13);
    t.insert(("pistol", "medium"), 15);
    t.insert(("pistol", "long"), 20);
    t.insert(("pistol", "extreme"), 25);
    // Shotgun
    t.insert(("shotgun", "close"), 13);
    t.insert(("shotgun", "medium"), 15);
    t.insert(("shotgun", "long"), 20);
    t.insert(("shotgun", "extreme"), 30);
    // Rifle
    t.insert(("rifle", "close"), 17);
    t.insert(("rifle", "medium"), 16);
    t.insert(("rifle", "long"), 15);
    t.insert(("rifle", "extreme"), 13);
    // SMG
    t.insert(("smg", "close"), 15);
    t.insert(("smg", "medium"), 13);
    t.insert(("smg", "long"), 20);
    t.insert(("smg", "extreme"), 25);
    // Melee
    t.insert(("melee", "close"), 15);
    // Thrown
    t.insert(("thrown", "close"), 15);
    t.insert(("thrown", "medium"), 20);
    t.insert(("thrown", "long"), 25);
    t
}

// ---------------------------------------------------------------------------
// DvResolver
// ---------------------------------------------------------------------------

pub struct DvResolver {
    db_path: String,
    fallback: HashMap<(&'static str, &'static str), i32>,
}

impl DvResolver {
    pub fn new(db_path: impl Into<String>) -> Self {
        Self {
            db_path: db_path.into(),
            fallback: default_dv_table(),
        }
    }

    /// Look up the DV for a weapon category and range bracket.
    /// Tries the SQLite DB first; falls back to the hardcoded table on error.
    pub fn resolve(&self, weapon_category: &str, range_bracket: &str) -> i32 {
        if let Ok(dv) = self.resolve_from_db(weapon_category, range_bracket) {
            if let Some(v) = dv {
                return v;
            }
        }
        self.resolve_fallback(weapon_category, range_bracket)
    }

    fn resolve_from_db(&self, weapon_category: &str, range_bracket: &str) -> rusqlite::Result<Option<i32>> {
        let conn = Connection::open(&self.db_path)?;
        let result: Option<i32> = conn
            .query_row(
                "SELECT dv FROM dv_tables WHERE weapon_category = ?1 AND range_bracket = ?2",
                rusqlite::params![weapon_category, range_bracket],
                |row| row.get(0),
            )
            .optional()?;
        Ok(result)
    }

    fn resolve_fallback(&self, weapon_category: &str, range_bracket: &str) -> i32 {
        self.fallback
            .get(&(weapon_category, range_bracket))
            .copied()
            .unwrap_or(15) // CPR default DV for unknown combinations
    }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn fallback_returns_known_dv() {
        let r = DvResolver::new("/nonexistent/Akashik.db");
        assert_eq!(r.resolve("pistol", "medium"), 15);
        assert_eq!(r.resolve("rifle", "long"), 15);
    }

    #[test]
    fn fallback_unknown_returns_default_15() {
        let r = DvResolver::new("/nonexistent/Akashik.db");
        assert_eq!(r.resolve("unknown_weapon", "extreme"), 15);
    }
}
