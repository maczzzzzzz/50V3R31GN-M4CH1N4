import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const DLC_DIR = 'docs/raw_data/core_rules/dlcs/';
const OUTPUT_FILE = 'docs/superpowers/research/2026-04-14-complete-dlc-inventory.md';

async function processBatch() {
    const files = fs.readdirSync(DLC_DIR).filter(f => f.endsWith('.pdf'));
    let masterCatalog = `# MASTER DLC CATALOG // 7H3-G0LD-M1N3\n**Version:** 3.8.6\n**Total PDFs Indexed:** ${files.length}\n\n| DLC Name | Category | Key Intel Summary |\n| :--- | :--- | :--- |\n`;

    console.log(`◈ Starting Batch Process: ${files.length} PDFs...`);

    for (const file of files) {
        const filePath = path.join(DLC_DIR, file);
        const dataBuffer = fs.readFileSync(filePath);
        try {
            const data = await pdf(dataBuffer);
            const text = data.text;

            // Heuristic Categorization
            let category = "Misc / Flavor";
            if (text.includes("Weapon") || text.includes("Ammo") || text.includes("Gear")) category = "Gear & Arsenals";
            if (text.includes("Cyberware") || text.includes("Cyber")) category = "Augmentations";
            if (text.includes("Apartment") || text.includes("Housing") || text.includes("Container")) category = "Housing & Real Estate";
            if (text.includes("District") || text.includes("Atlas") || text.includes("Map")) category = "Geography / Atlas";
            if (text.includes("Screamsheet") || text.includes("Mission")) category = "Missions / Hooks";

            // Extract high-signal snippets (First 200 chars of content after title)
            const summary = text.substring(0, 500).replace(/\n/g, ' ').trim();
            
            masterCatalog += `| **${file}** | ${category} | ${summary.substring(0, 150)}... |\n`;
            console.log(`  >> Processed: ${file}`);
        } catch (e) {
            console.error(`  !! Failed: ${file} - ${e.message}`);
            masterCatalog += `| **${file}** | ERROR | Failed to parse PDF. |\n`;
        }
    }

    fs.writeFileSync(OUTPUT_FILE, masterCatalog);
    console.log(`✅ Batch complete. Catalog saved to: ${OUTPUT_FILE}`);
}

processBatch();
