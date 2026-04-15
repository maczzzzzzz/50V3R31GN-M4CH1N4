import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

async function run() {
    const file = process.argv[2];
    if (!file) {
        console.log("Usage: tsx inspect_dlc.ts <file>");
        return;
    }
    const dataBuffer = fs.readFileSync(file);
    try {
        const data = await pdf(dataBuffer);
        console.log(`--- ${file} ---`);
        console.log(data.text);
    } catch (e) {
        console.log(`--- ${file} FAILED ---`, e.message);
    }
}

run();
