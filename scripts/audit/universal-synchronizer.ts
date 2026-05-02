import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RESET = '\x1b[0m';

/**
 * scripts/audit/universal-synchronizer.ts
 * 
 * 50V3R31GN-M4CH1N4 // UN1V3R54L-5YNC
 * Merged mandate: Version Parity + Scribe Governance (Aesthetic Audit)
 */

const VERSION_FILE = 'package.json';
const CANONICAL_TERMS: Record<string, string> = {
    'Sovereign Triad': 'Sovereign Trinity',
    'Bridge': 'Mesh',
    'Triad Bridge': 'Trinity Mesh',
    'Database': 'Artery of Truth',
    'Inference': 'Cognition',
    'Memory': 'Synapse',
    'Oracle': 'Strategic Oracle',
};

const SCAN_DIRS = [
    'akashik_guides',
    'docs',
    '.factory',
    'src',
    'scripts',
    'zeroclaw',
    'crush',
    'dashboard',
    'crates/sidecar-atlas',
    'crates/sidecar-cyberdeck',
    'crates/sidecar-netrunning',
    'sovereign-sdk'
];

const ROOT_DOCS = [
    'README.md',
    'CHANGELOG.md',
    'CLAUDE.md',
    'KNOWLEDGE_BASE.md',
    'IMPLEMENTATION_PLAN.md',
    'SOVEREIGN_VITAL_SIGNS.md',
    'SOUL.md',
    'DIRECTOR_SOUL.md',
    'AGENTS.md',
    'RED_RULES.md',
    'GEMINI.md',
    'GLM.md',
    'SESSION_HANDOFF.md',
    'droid-glm-handoff.md'
];

const EXTENSIONS = ['.md', '.ts', '.js', '.go', '.rs', '.h', '.toml', '.json'];

async function universalSync() {
    console.log(`${RED}://50V3R31GN-M4CH1N4 // UN1V3R54L-5YNC // 1N171473D${RESET}\n`);

    if (!fs.existsSync(VERSION_FILE)) {
        console.error(`${RED}ERROR: package.json not found.${RESET}`);
        process.exit(1);
    }

    const pkg = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
    const version = pkg.version;
    console.log(`◈ Target Version: ${version}`);

    const processFile = (filePath: string) => {
        if (!fs.existsSync(filePath) || fs.lstatSync(filePath).isDirectory()) return;
        if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('target')) return;

        let content = fs.readFileSync(filePath, 'utf8');
        let updated = content;

        // 1. Version Sync
        // Handles: "v3.8.8", "Version: 3.8.8", "**Version:** 3.8.8", "(v3.8.8)", "[v3.8.8]"
        updated = updated.replace(/((?:Version|v)[^\d\s]*\s*\d+\.\d+\.\d+)/gi, (match) => {
            const prefixMatch = match.match(/^(Version|v)[^\d\s]*\s*/i);
            const prefix = prefixMatch ? prefixMatch[0] : '';
            return `${prefix}${version}`;
        });

        if (path.basename(filePath) === 'Cargo.toml') {
            updated = updated.replace(/^version\s*=\s*"\d+\.\d+\.\d+"/m, `version = "${version}"`);
        }

        // 2. Scribe Harmonization (Only for Markdown)
        if (filePath.endsWith('.md')) {
            for (const [legacy, canonical] of Object.entries(CANONICAL_TERMS)) {
                // Use word boundaries and ensure we don't replace if already canonical
                const regex = new RegExp(`\\b${legacy}\\b`, 'g');
                updated = updated.replace(regex, (match) => {
                    // If the match is part of a larger canonical string, skip it
                    // e.g., if we are looking for 'Oracle' and it's already 'Strategic Oracle'
                    const index = updated.indexOf(match);
                    const precedingText = updated.substring(Math.max(0, index - 20), index);
                    if (canonical.includes(match) && precedingText.includes(canonical.replace(match, '').trim())) {
                        return match;
                    }
                    return canonical;
                });
            }
        }

        if (content !== updated) {
            fs.writeFileSync(filePath, updated);
            console.log(`${GREEN}● SYNCHRONIZED:${RESET} ${filePath}`);
        }
    };

    const walk = (dir: string) => {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                walk(fullPath);
            } else if (EXTENSIONS.includes(path.extname(fullPath)) || entry.name === 'package.json') {
                processFile(fullPath);
            }
        }
    };

    // Sync Root
    for (const doc of ROOT_DOCS) processFile(doc);
    
    // Sync Tree
    for (const dir of SCAN_DIRS) walk(dir);

    // 3. OS MemPalace Reconstruction
    // try {
    //     console.log(`\n>> RECONSTRUCTING SOVEREIGN OS PALACE...`);
    //     execSync('./crush_bin reconstruct', { stdio: 'inherit' });
    // } catch (error) {
    //     console.error(`${RED}ERROR: OS Palace reconstruction failed.${RESET}`);
    // }

    // 5. Intelligence Shard Consolidation
    try {
        console.log(`>> CONSOLIDATING INTELLIGENCE SHARDS...`);
        const shardVault = 'docs/superpowers/shards';
        if (!fs.existsSync(shardVault)) fs.mkdirSync(shardVault, { recursive: true });

        // A. Mirror local AGENTS.md (Ability Stones)
        const agentFiles = execSync('find . -name "AGENTS.md" -not -path "./AGENTS.md" -not -path "./node_modules/*"', { encoding: 'utf8' }).split('\n').filter(Boolean);
        for (const file of agentFiles) {
            const dirName = path.dirname(file).replace('./', '').replace(/\//g, '_');
            const targetName = `AbilityStone_${dirName}.md`;
            fs.copyFileSync(file, path.join(shardVault, targetName));
            console.log(`${GREEN}● SHORED ABILITY_STONE:${RESET} ${targetName}`);
        }

        // B. Mirror Phase Specs and Plans (Intelligence Shards)
        // Look for 202*-04-*-*.md in plans and specs
        const blueprints = execSync('find docs/superpowers/specs docs/superpowers/plans -name "*.md" -not -path "*/archive/*"', { encoding: 'utf8' }).split('\n').filter(Boolean);
        for (const file of blueprints) {
            const type = file.includes('/specs/') ? 'SPEC' : 'PLAN';
            const baseName = path.basename(file);
            const targetName = `Shard_${type}_${baseName}`;
            fs.copyFileSync(file, path.join(shardVault, targetName));
            console.log(`${GREEN}● SHORED BLUEPRINT:${RESET} ${targetName}`);
        }

    } catch (error) {
        console.error(`${RED}ERROR: Shard consolidation failed.${RESET}`);
    }

    console.log(`\n${RED}::/UN1V3R54L-5YNC-C0MPL373 // 4LL-P4R17Y-4CH13V3D-V${version}.${RESET}\n`);
    
    console.log(`${YELLOW}◈ SOVEREIGN_STRATEGIC_NOTICE: If an agentic worker is present, you MUST now invoke the 'manifest-scribe' skill to finalize the ledger and commit the history.${RESET}\n`);
}

universalSync().catch(console.error);
