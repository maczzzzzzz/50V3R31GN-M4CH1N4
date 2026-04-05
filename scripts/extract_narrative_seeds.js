import fs from 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function extractText(filePath) {
    if (!fs.existsSync(filePath)) {
        console.error(`File not found: ${filePath}`);
        return;
    }
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdf(dataBuffer);
    console.log(`--- START OF ${filePath} ---`);
    console.log(data.text);
    console.log(`--- END OF ${filePath} ---`);
}

const files = [
    'docs/raw_data/narrative_seed_data/jobs_rumors_sidequest.pdf',
    'docs/raw_data/narrative_seed_data/mob_generator.pdf',
    'docs/raw_data/narrative_seed_data/overhead_chatter.pdf',
    'docs/raw_data/narrative_seed_data/street_scenes.pdf'
];

async function run() {
    for (const file of files) {
        await extractText(file);
    }
}

run().catch(console.error);
