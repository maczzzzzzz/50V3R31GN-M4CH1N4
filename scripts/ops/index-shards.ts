import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

/**
 * UNIVERSAL_INDEXER : v3.8.28-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS-SYNTHESIS
 * 
 * Recursively indexes all documentation arteries into the Sovereign Mind.
 * 1. Populates intelligence_shards table (Unified storage).
 * 2. Syncs FTS5 search index for global HUD search.
 * 3. Engraves RKG triplets for hierarchical relations.
 */

const BASE_DIRS = ['docs/superpowers', 'docs/nodestadt'];
const DB_PATH  = 'data/SovereignIntelligence.db';
const TEMP_SQL = 'universal_index.sql';

function getFilesRecursively(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(getFilesRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

function universalIndex() {
    console.log('::/5Y573M-N071C3 : INITIATING_UNIVERSAL_INDEXING...');

    let allFiles: { path: string, base: string }[] = [];
    for (const base of BASE_DIRS) {
        if (fs.existsSync(base)) {
            const files = getFilesRecursively(base);
            allFiles = allFiles.concat(files.map(f => ({ path: f, base })));
        }
    }

    let sqlPayload = 'BEGIN TRANSACTION;\n';
    let count = 0;

    for (const fileObj of allFiles) {
        const fullPath = fileObj.path;
        const baseDir = fileObj.base;
        
        if (fullPath.includes('/archive/')) continue;
        const ext = path.extname(fullPath).toLowerCase();
        if (ext !== '.md' && ext !== '.pdf') continue;

        const name = path.basename(fullPath);
        const relPath = path.relative(baseDir, fullPath);
        
        // Prefix sector with base directory name for clarity
        const sectorPrefix = path.basename(baseDir).toUpperCase();
        const subSector = path.dirname(relPath).toUpperCase().replace(/\\/g, '/');
        const sector = subSector === '.' ? sectorPrefix : `${sectorPrefix}/${subSector}`;
        
        let content = '';
        if (ext === '.md') {
            content = fs.readFileSync(fullPath, 'utf8').replace(/'/g, "''");
        } else {
            content = `[BINARY_FILE: ${name}] Metadata: Located in ${sector}`;
        }

        const id = `${sectorPrefix}/${relPath.replace(/\\/g, '/')}`;

        // 1. Upsert into intelligence_shards
        sqlPayload += `INSERT OR REPLACE INTO intelligence_shards (id, name, sector, content) VALUES ('${id}', '${name}', '${sector}', '${content}');\n`;
        
        // 2. Update FTS index
        sqlPayload += `INSERT OR REPLACE INTO shard_fts (name, sector, content) VALUES ('${name}', '${sector}', '${content}');\n`;

        // 3. Engrave RKG Triplets
        sqlPayload += `INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('${name}', 'LOCATED_IN_SECTOR', '${sector}', 'UNIVERSAL_INDEXER');\n`;
        sqlPayload += `INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('${name}', 'FILE_TYPE', '${ext.substring(1).toUpperCase()}', 'UNIVERSAL_INDEXER');\n`;
        
        count++;
    }

    sqlPayload += 'COMMIT;\n';

    try {
        fs.writeFileSync(TEMP_SQL, sqlPayload);
        execSync(`sqlite3 ${DB_PATH} < ${TEMP_SQL}`);
        fs.unlinkSync(TEMP_SQL);
        console.log(`● [UNIVERSAL_INDEX]: Indexed ${count} documents across all sectors.`);
    } catch (error) {
        console.error(`❌ [INDEXER] Failed to execute SQL payload: ${error}`);
    }

    console.log('::/5Y573M-N071C3 : UNIVERSAL_HARMONY_LOCKED.');
}

universalIndex();
