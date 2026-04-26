import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * SHARD_INDEXER : v3.8.0
 * 
 * Indexes consolidated shards in docs/superpowers/shards/ into the OS DB.
 * Integrates modular intelligence fragments into the Memory Palace.
 */

const SHARD_DIR = 'docs/superpowers/shards';
const DB_PATH  = 'data/SovereignIntelligence.db';

function indexShards() {
    console.log('::/5Y573M-N071C3 : INDEXING_INTELLIGENCE_SHARDS...');

    if (!fs.existsSync(SHARD_DIR)) {
        console.error(`❌ [INDEXER] Shard directory not found: ${SHARD_DIR}`);
        return;
    }

    const shards = fs.readdirSync(SHARD_DIR).filter(f => f.endsWith('.md'));

    for (const shard of shards) {
        const shardName = shard.replace('.md', '');
        const fullPath = path.join(SHARD_DIR, shard);
        
        // Engrave triplet into SovereignIntelligence.db
        // Triplet: [SHARD_VAULT] -- [CONTAINS_AUTHORITY] -- [shardName]
        try {
            const cmd = `sqlite3 ${DB_PATH} "INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('SHARD_VAULT', 'CONTAINS_AUTHORITY', '${shardName}', 'SHARD_INDEXER');"`;
            execSync(cmd);
            console.log(`● [INDEXED]: ${shardName}`);
        } catch (error) {
            console.error(`⚠️ [INDEXER] Failed to index ${shardName}: ${error}`);
        }
    }

    console.log('::/5Y573M-N071C3 : SHARD_INDEXING_COMPLETE.');
}

indexShards();
