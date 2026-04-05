const fs = require('fs');
const pdf = require('pdf-parse');

async function getPdfText(filePath) {
    const dataBuffer = fs.readFileSync(filePath);
    let data;
    if (typeof pdf === 'function') {
        data = await pdf(dataBuffer);
    } else if (typeof pdf.default === 'function') {
        data = await pdf.default(dataBuffer);
    } else if (pdf.PDFParse) {
        data = await new pdf.PDFParse().parse(dataBuffer);
    } else {
        throw new Error("No parse method found in pdf-parse");
    }
    return data.text;
}

const files = [
    'docs/raw_data/narrative_seed_data/jobs_rumors_sidequest.pdf',
    'docs/raw_data/narrative_seed_data/mob_generator.pdf',
    'docs/raw_data/narrative_seed_data/overhead_chatter.pdf',
    'docs/raw_data/narrative_seed_data/street_scenes.pdf'
];

async function run() {
    for (const f of files) {
        if (!fs.existsSync(f)) continue;
        console.log(`\n=== FILE: ${f} ===\n`);
        try {
            const text = await getPdfText(f);
            console.log(text.substring(0, 5000));
        } catch (e) {
            console.error(`Error parsing ${f}:`, e.message);
        }
    }
}

run();
