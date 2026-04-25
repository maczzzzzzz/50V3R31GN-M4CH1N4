use anyhow::Result;
use rusqlite::Connection;
use serde::{Deserialize, Serialize};

/**
 * SOVEREIGN-FLOWY CORE
 * 
 * Port of AppFlowy block-storage logic targeting the Sovereign SQLite stack.
 */

#[derive(Debug, Serialize, Deserialize)]
pub struct Block {
    pub id: String,
    pub page_id: String,
    pub block_type: String,
    pub data: serde_json::Value,
    pub sort_order: f64,
}

pub struct FlowyEngine {
    db: Connection,
}

impl FlowyEngine {
    pub fn new(db_path: &str) -> Result<Self> {
        let db = Connection::open(db_path)?;
        Ok(Self { db })
    }

    /// Creates a new workspace entry.
    pub fn create_workspace(&self, name: &str) -> Result<String> {
        let id = uuid::Uuid::new_v4().to_string();
        self.db.execute(
            "INSERT INTO flowy_workspaces (id, name) VALUES (?1, ?2)",
            [&id, name],
        )?;
        Ok(id)
    }

    /// Appends a block to a page.
    pub fn append_block(&self, block: &Block) -> Result<()> {
        let data_json = serde_json::to_string(&block.data)?;
        self.db.execute(
            "INSERT INTO flowy_blocks (id, page_id, type, data, sort_order) VALUES (?1, ?2, ?3, ?4, ?5)",
            (
                &block.id,
                &block.page_id,
                &block.block_type,
                data_json,
                block.sort_order,
            ),
        )?;
        Ok(())
    }

    /// Retrieves all blocks for a given page, ordered by sort_order.
    pub fn get_page_content(&self, page_id: &str) -> Result<Vec<Block>> {
        let mut stmt = self.db.prepare(
            "SELECT id, page_id, type, data, sort_order FROM flowy_blocks WHERE page_id = ?1 ORDER BY sort_order ASC"
        )?;
        
        let blocks = stmt.query_map([page_id], |row| {
            let data_str: String = row.get(3)?;
            Ok(Block {
                id: row.get(0)?,
                page_id: row.get(1)?,
                block_type: row.get(2)?,
                data: serde_json::from_str(&data_str).unwrap_or(serde_json::Value::Null),
                sort_order: row.get(4)?,
            })
        })?.collect::<std::result::Result<Vec<_>, _>>()?;

        Ok(blocks)
    }
}
