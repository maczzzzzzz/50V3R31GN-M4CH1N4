import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');
const Database = require('better-sqlite3');

const ROOT_RULES_DIR = 'docs/raw_data/core_rules/';
const AKASHIK_DB = 'data/Akashik.db';

class RulebookHarvester {
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

    categorizeChunk(chunk: string): string {
        const content = chunk.toLowerCase();
        if (content.includes('price') || content.includes('eurobuck') || content.includes('eb')) return '#Economy';
        if (content.includes('weapon') || content.includes('armor') || content.includes('gear')) return '#Gear';
        if (content.includes('cyberware') || content.includes('cyber')) return '#Technical';
        if (content.includes('district') || content.includes('atlas') || content.includes('map')) return '#World';
        if (content.includes('screamsheet') || content.includes('mission')) return '#Mission';
        return '#Lore';
    }

    /**
     * Recursive scan of the core_rules directory.
     */
    getFiles(dir: string, allFiles: string[] = []): string[] {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const name = path.join(dir, file);
            if (fs.statSync(name).isDirectory()) {
                this.getFiles(name, allFiles);
            } else if (name.endsWith('.pdf')) {
                allFiles.push(name);
            }
        }
        return allFiles;
    }

    async run() {
        console.log("◈ STARTING MASTER RULEBOOK HARVESTER...");
        const files = this.getFiles(ROOT_RULES_DIR);

        const insertChronicle = this.db.prepare(`
            INSERT OR REPLACE INTO chronicle_seeds (id, title, content, source, category, status, last_updated)
            VALUES (?, ?, ?, ?, ?, 'approved', CURRENT_TIMESTAMP)
        `);

        for (const filePath of files) {
            const fileName = path.basename(filePath);
            const sourceTag = filePath.includes('/dlcs/') ? 'OFFICIAL-DLC' : 'CORE-RULEBOOK';
            
            console.log(`  >> Harvesting: ${fileName} [${sourceTag}]`);
            
            try {
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdf(dataBuffer);
                const cleanedText = this.cleanContent(data.text);
                const chunks = this.chunkText(cleanedText);

                for (let i = 0; i < chunks.length; i++) {
                    const chunk = chunks[i];
                    const category = this.categorizeChunk(chunk);
                    
                    // Generate a deterministic ID based on the content hash to prevent duplicates across filenames/versions
                    const hash = crypto.createHash('sha256').update(chunk).digest('hex').substring(0, 16);
                    const chunkId = `rule-chunk-${hash}`;
                    const title = `${fileName.replace('.pdf', '')} (Part ${i + 1})`;

                    // INSERT OR REPLACE handles the overwrite if chunkId (hash) exists
                    insertChronicle.run(
                        chunkId,
                        title,
                        chunk,
                        sourceTag,
                        category
                    );
                }
                console.log(`     + Processed ${chunks.length} chunks.`);
            } catch (e) {
                console.error(`  !! FAILED: ${fileName} - ${e.message}`);
            }
        }

        console.log("✅ MASTER HARVEST COMPLETE. ALL DUPLICATES OVERWRITTEN.");
    }

    close() {
        this.db.close();
    }
}

const harvester = new RulebookHarvester();
harvester.run().then(() => harvester.close());
