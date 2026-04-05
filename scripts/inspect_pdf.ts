import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function run() {
    const dataBuffer = fs.readFileSync('docs/raw_data/narrative_seed_data/overhead_chatter.pdf');
    try {
        const data = await pdf(dataBuffer);
        console.log("--- SUCCESS ---");
        console.log(data.text.substring(0, 3000));
    } catch (e) {
        console.log("--- FAILED ---", e.message);
    }
}

run();
