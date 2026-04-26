import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * SHARD_INDEXER : v3.8.0 (Hardened)
 * 
 * Materializes the SHARD_TREE.
 * 1. Populates intelligence_shards table.
 * 2. Syncs FTS5 search index.
 * 3. Engraves RKG triplets for shard relationships.
 */

const SHARD_DIR = 'docs/superpowers/shards';
const DB_PATH  = 'data/SovereignIntelligence.db';
const TEMP_SQL = 'shard_index.sql';

function indexShards() {
    console.log('::/5Y573M-N071C3 : MATERIALIZING_SHARD_TREE...');

    if (!fs.existsSync(SHARD_DIR)) {
        console.error(`❌ [INDEXER] Shard directory not found: ${SHARD_DIR}`);
        return;
    }

    const shards = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.md'));
    let sqlPayload = '';

    for (const shard of shards) {
        const name = shard.replace('.md', '');
        const fullPath = path.join(SHARD_DIR, shard);
        const content = fs.readFileSync(fullPath, 'utf8').replace(/'/g, "''");
        
        let sector = 'GLOBAL';
        if (name.startsWith('AbilityStone_')) {
            sector = name.replace('AbilityStone_', '').replace(/_/g, '/');
        } else if (name.startsWith('Shard_')) {
            sector = 'BLUEPRINTS';
        }

        // 1. Upsert into intelligence_shards
        sqlPayload += `INSERT OR REPLACE INTO intelligence_shards (id, name, sector, content) VALUES ('${name}', '${name}', '${sector}', '${content}');\n`;
        
        // 2. Update FTS index
        sqlPayload += `INSERT OR REPLACE INTO shard_fts (rowid, name, sector, content) SELECT rowid, name, sector, content FROM intelligence_shards WHERE id='${name}';\n`;

        // 3. Engrave RKG Triplets
        sqlPayload += `INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('${name}', 'LOCATED_IN_SECTOR', '${sector}', 'SHARD_INDEXER');\n`;
        sqlPayload += `INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('${name}', 'DECLARES_AUTHORITY', 'SOVEREIGN_TRINITY', 'SHARD_INDEXER');\n`;
    }

    try {
        fs.writeFileSync(TEMP_SQL, sqlPayload);
        execSync(`sqlite3 ${DB_PATH} < ${TEMP_SQL}`);
        fs.unlinkSync(TEMP_SQL);
        console.log(`● [SHARD_VAULT]: Indexed ${shards.length} fragments.`);
    } catch (error) {
        console.error(`❌ [INDEXER] Failed to execute SQL payload: ${error}`);
    }

    console.log('::/5Y573M-N071C3 : SHARD_TREE_SOCIOTOMY_LOCKED.');
}

indexShards();
