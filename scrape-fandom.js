import fs from 'node:fs';
import { JSDOM } from 'jsdom';
import Database from 'better-sqlite3';

const DB_PATH = './data/Akashik.db';

// Helper to fetch parsed HTML from MediaWiki API
async function fetchWikiPage(pageName) {
    const url = `https://cyberpunk.fandom.com/api.php?action=parse&page=${encodeURIComponent(pageName)}&format=json`;
    console.log(`  [Fetching] ${url}`);
    try {
        const res = await fetch(url);
        const data = await res.json();
        if (data.error) {
            console.error(`  [API Error] ${data.error.info}`);
            return null;
        }
        return data.parse.text['*'];
    } catch (e) {
        console.error(`  [Fetch Error] ${e.message}`);
        return null;
    }
}

async function run() {
    console.log(`::/5Y573M-N071C3 : INITIATING CYBERPUNK RED LORE SCRAPE...`);
    
    // 1. Get the main Night City page
    console.log(`>> Fetching main Night City overview...`);
    const mainHtml = await fetchWikiPage('Night_City');
    if (!mainHtml) {
        console.error("❌ Failed to fetch Night City overview.");
        process.exit(1);
    }

    const dom = new JSDOM(mainHtml);
    const doc = dom.window.document;

    // Find the 2030s - 2040s Distribution section
    const heading = doc.getElementById('2030s_-_2040s_Distribution');
    if (!heading) {
        console.error("❌ Could not find the '2030s_-_2040s_Distribution' heading.");
        process.exit(1);
    }

    // Traverse siblings to find all list items with links
    const districtLinks = new Map();
    let currentEl = heading.parentElement.nextElementSibling;
    
    // Stop at the next major heading (usually <h2> or <h3> depending on the wiki structure)
    while (currentEl && !['H2', 'H3'].includes(currentEl.tagName)) {
        if (currentEl.tagName === 'TABLE') {
            // Find all anchor links inside the table
            const links = currentEl.querySelectorAll('a');
            for (const a of links) {
                const title = a.getAttribute('title');
                // Exclude edit links, citations, or irrelevant wiki pages
                if (title && !title.includes('edit') && !title.includes('Night City') && !title.includes('Cyberpunk')) {
                    districtLinks.set(title, title);
                }
            }
        }
        currentEl = currentEl.nextElementSibling;
    }

    console.log(`>> Found ${districtLinks.size} district links for the 2045 era.`);

    console.log(`>> Connecting to Oracle at ${DB_PATH}...`);
    const db = new Database(DB_PATH);

    // Ensure table exists
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

    const stmt = db.prepare(`
        INSERT INTO district_dna (id, district_name, hostility_baseline, lore_fragments_json, persona_override)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(district_name) DO UPDATE SET 
            lore_fragments_json = excluded.lore_fragments_json,
            last_updated = CURRENT_TIMESTAMP
    `);

    // Scrape each district
    let totalFragments = 0;
    for (const [title, pageName] of districtLinks.entries()) {
        console.log(`>> Processing District: ${title}`);
        const pageHtml = await fetchWikiPage(pageName);
        if (!pageHtml) continue;

        const pDom = new JSDOM(pageHtml);
        const pDoc = pDom.window.document;
        
        // Extract paragraphs from the content, ignoring info boxes and tables
        const paragraphs = Array.from(pDoc.querySelectorAll('p'))
            .map(p => p.textContent.replace(/\[\d+\]/g, '').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(text => text.length > 50 && text.length < 1000); // Decent size narrative chunks

        if (paragraphs.length > 0) {
            db.transaction(() => {
                stmt.run(
                    `dna-${title.toLowerCase().replace(/\s+/g, '-')}`,
                    title,
                    0.7, // Cyberpunk RED districts are relatively dangerous
                    JSON.stringify(paragraphs),
                    `You are a Sovereign Reality Engine. Incorporate the physical details, gang presence, and atmosphere of ${title}.`
                );
            })();
            totalFragments += paragraphs.length;
            console.log(`  >> Grafted ${paragraphs.length} fragments into DNA of [${title}]`);
        } else {
            console.warn(`  >> Warning: No usable paragraphs found for ${title}`);
        }
        
        // Anti-rate limit delay
        await new Promise(r => setTimeout(r, 500));
    }

    db.close();
    console.log(`✅ SUCCESS: Scraped ${totalFragments} lore fragments across ${districtLinks.size} districts.`);
}

run().catch(err => {
    console.error('❌ FATAL ERROR DURING SCRAPING:', err);
    process.exit(1);
});
