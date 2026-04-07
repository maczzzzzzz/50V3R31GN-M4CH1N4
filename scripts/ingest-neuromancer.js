import fs from 'node:fs';
import { createRequire } from 'node:module';
import Database from 'better-sqlite3';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const DB_PATH = './data/Akashik.db';
const PDF_PATH = './neuromancer.pdf';

async function run() {
    console.log(`::/5Y573M-N071C3 : INITIATING NEUROMANCER DNA INGESTION...`);
    
    if (!fs.existsSync(PDF_PATH)) {
        console.error(`❌ PDF not found: ${PDF_PATH}`);
        process.exit(1);
    }

    console.log(`>> Parsing ${PDF_PATH}...`);
    const dataBuffer = fs.readFileSync(PDF_PATH);
    const data = await pdf(dataBuffer);
    
    const text = data.text;
    console.log(`>> Extracted ${text.length} characters.`);

    // Clean up all the weird PDF newlines and extra spaces
    const cleanText = text.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // Extract sentences
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [];
    
    // Group into fragments of ~2-3 sentences (for maximum Cyberpunk grit without context bloat)
    let chunks = [];
    for (let i = 0; i < sentences.length; i += 3) {
        const chunk = sentences.slice(i, i + 3).join(' ').trim();
        if (chunk.length > 80 && chunk.length < 500) {
            chunks.push(chunk);
        }
    }
        
    console.log(`>> Generated ${chunks.length} high-quality narrative fragments.`);

    console.log(`>> Connecting to Oracle at ${DB_PATH}...`);
    const db = new Database(DB_PATH);

    // Ensure the table exists
    db.exec(`
        CREATE TABLE IF NOT EXISTS district_dna (
            id TEXT PRIMARY KEY,
            district_name TEXT NOT NULL UNIQUE,
            hostility_baseline REAL DEFAULT 0.5,
            lore_fragments_json TEXT NOT NULL DEFAULT '[]',
            persona_override TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // We will inject these chunks into a "Global" district, as well as specific major Night City districts.
    const targets = ['Night City', 'The Sprawl', 'Global', 'Afterlife'];
    
    const stmt = db.prepare(`
        INSERT INTO district_dna (id, district_name, hostility_baseline, lore_fragments_json, persona_override)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(district_name) DO UPDATE SET 
            lore_fragments_json = excluded.lore_fragments_json,
            last_updated = CURRENT_TIMESTAMP
    `);

    db.transaction(() => {
        for (const target of targets) {
            // For Neuromancer, we want maximum grit
            stmt.run(
                `dna-${target.toLowerCase().replace(/\s+/g, '-')}`,
                target,
                0.8, // High hostility
                JSON.stringify(chunks),
                `You are a Sovereign Reality Engine. Your prose must mirror the cadence of William Gibson's Neuromancer.`
            );
            console.log(`  >> Grafted ${chunks.length} fragments into DNA of [${target}]`);
        }
    })();

    db.close();
    console.log(`✅ SUCCESS: Neuromancer is now part of the Black-Ice Reality Engine's DNA.`);
}

run().catch(err => {
    console.error('❌ FATAL ERROR DURING INGESTION:', err);
    process.exit(1);
});
