import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const Database = require('better-sqlite3');

const TARGET_DIRS = [
    'docs/raw_data/core_rules/',
    'docs/raw_data/community_compendium/',
    'docs/raw_data/narrative_seed_data/'
];
const AKASHIK_DB = 'data/Akashik.db';

class MasterHarvester {
    private db: any;

    constructor() {
        this.db = new Database(AKASHIK_DB);
    }

    cleanContent(content: string): string {
        let cleaned = content.replace(/\n/g, ' '); 
        cleaned = cleaned.replace(/\s{2,}/g, ' '); 
        cleaned = cleaned.replace(/\[\d+\]/g, ''); 
        return cleaned.trim();
    }

    chunkText(text: string, maxLength: number = 1500): string[] {
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const chunks: string[] = [];
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmed = sentence.trim();
            if (!trimmed) continue;

            if ((currentChunk.length + trimmed.length) > maxLength && currentChunk.length > 0) {
                chunks.push(currentChunk.trim());
                currentChunk = '';
            }
            currentChunk += trimmed + ' ';
        }
        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim());
        }
        return chunks;
    }

    categorizeContent(text: string): string {
        const content = text.toLowerCase();
        if (content.includes('price') || content.includes('eurobuck') || content.includes('eb')) return '#Economy';
        if (content.includes('weapon') || content.includes('armor') || content.includes('gear')) return '#Gear';
        if (content.includes('cyberware') || content.includes('cyber')) return '#Technical';
        if (content.includes('district') || content.includes('atlas') || content.includes('map')) return '#World';
        if (content.includes('screamsheet') || content.includes('mission')) return '#Mission';
        return '#Lore';
    }

    getFiles(dir: string, allFiles: string[] = []): string[] {
        if (!fs.existsSync(dir)) return allFiles;
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                this.getFiles(name, allFiles);
            } else if (name.endsWith('.pdf') || name.endsWith('.db')) {
                allFiles.push(name);
            }
        }
        return allFiles;
    }

    async processPdf(filePath: string, sourceTag: string, insertStmt: any) {
        console.log(`  >> Harvesting PDF: ${path.basename(filePath)} [${sourceTag}]`);
        try {
            const dataBuffer = fs.readFileSync(filePath);
            const data = await pdf(dataBuffer);
            const cleanedText = this.cleanContent(data.text);
            const chunks = this.chunkText(cleanedText);

            for (let i = 0; i < chunks.length; i++) {
                const chunk = chunks[i];
                const category = this.categorizeContent(chunk);
                const hash = crypto.createHash('sha256').update(chunk).digest('hex').substring(0, 16);
                const chunkId = `rule-chunk-${hash}`;
                const title = `${path.basename(filePath).replace('.pdf', '')} (Part ${i + 1})`;

                insertStmt.run(chunkId, title, chunk, sourceTag, category);
            }
            console.log(`     + Processed ${chunks.length} chunks.`);
        } catch (e) {
            console.error(`  !! FAILED PDF: ${filePath} - ${e.message}`);
        }
    }

    async processJsonL(filePath: string, sourceTag: string, insertStmt: any) {
        console.log(`  >> Harvesting JSON-L: ${path.basename(filePath)} [${sourceTag}]`);
        try {
            const lines = fs.readFileSync(filePath, 'utf8').split('\n');
            let count = 0;
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const doc = JSON.parse(line);
                    const content = JSON.stringify(doc, null, 2);
                    const category = this.categorizeContent(content);
                    const name = doc.name || doc.title || path.basename(filePath);
                    const hash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
                    const chunkId = `comp-chunk-${hash}`;
                    
                    insertStmt.run(chunkId, `${name} (JSON)`, content, sourceTag, category);
                    count++;
                } catch { /* skip malformed lines */ }
            }
            console.log(`     + Processed ${count} entries.`);
        } catch (e) {
            console.error(`  !! FAILED JSON-L: ${filePath} - ${e.message}`);
        }
    }

    async run() {
        console.log("◈ STARTING UNIFIED MASTER HARVESTER...");
        const insertChronicle = this.db.prepare(`
            INSERT OR REPLACE INTO chronicle_seeds (id, title, content, source, category, status, last_updated)
            VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
        `);

        for (const dir of TARGET_DIRS) {
            const files = this.getFiles(dir);
            for (const filePath of files) {
                const sourceTag = filePath.includes('/core_rules/') ? 'CORE-RULEBOOK' : 
                                 filePath.includes('/community_compendium/') ? 'COMMUNITY-COMP' : 'NARRATIVE-SEED';
                
                if (filePath.endsWith('.pdf')) {
                    await this.processPdf(filePath, sourceTag, insertChronicle);
                } else if (filePath.endsWith('.db') && filePath.includes('community_compendium')) {
                    // Check if it's JSON-L (based on previous head check)
                    await this.processJsonL(filePath, sourceTag, insertChronicle);
                }
            }
        }

        console.log("✅ UNIFIED HARVEST COMPLETE.");
    }

    close() {
        this.db.close();
    }
}

const harvester = new MasterHarvester();
harvester.run().then(() => harvester.close());
