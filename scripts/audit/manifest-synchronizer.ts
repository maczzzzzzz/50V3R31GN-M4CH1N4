import fs from 'node:fs';
import path from 'node:path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const VERSION_FILE = 'package.json';
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
  'RED_RULES.md'
];

const SCAN_DIRS = [
  'akashik_guides',
  'docs',
  '.factory',
  'src',
  'scripts',
  'zeroclaw',
  'crush',
  'dashboard',
  'sidecar-atlas',
  'sidecar-cyberdeck',
  'sidecar-netrunning',
  'sovereign-sdk'
];

const FILE_EXTENSIONS = ['.md', '.ts', '.js', '.go', '.rs', '.h', '.toml', '.json'];

async function syncManifest() {
  console.log(`${RED}://50V3R31GN-M4CH1N4 // UN1V3R54L-5YNC // 1N171473D${RESET}\n`);

  if (!fs.existsSync(VERSION_FILE)) {
    console.error(`${RED}ERROR: package.json not found in root.${RESET}`);
    process.exit(1);
  }

  const pkg = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  const version = pkg.version;
  console.log(`◈ Target Version: ${version}`);

  const syncFile = (filePath: string) => {
    if (!fs.existsSync(filePath)) return;
    if (filePath.includes('node_modules') || filePath.includes('.git') || filePath.includes('target')) return;

    let content = fs.readFileSync(filePath, 'utf8');
    let updated = content;

    // 1. Documentation Headers (vX.X.X or Version: X.X.X)
    updated = updated.replace(/(v\d+\.\d+\.\d+|Version:\s*\d+\.\d+\.\d+)/gi, (match) => {
      // Preserve case and prefix
      if (match.toLowerCase().startsWith('version')) {
        const prefix = match.split(':')[0];
        return `${prefix}: ${version}`;
      }
      return `v${version}`;
    });

    // 2. Cargo.toml Versioning
    if (path.basename(filePath) === 'Cargo.toml') {
      updated = updated.replace(/^version\s*=\s*"\d+\.\d+\.\d+"/m, `version = "${version}"`);
    }

    // 3. package.json in subdirectories
    if (path.basename(filePath) === 'package.json' && filePath !== VERSION_FILE) {
      updated = updated.replace(/"version":\s*"\d+\.\d+\.\d+"/, `"version": "${version}"`);
    }

    if (content !== updated) {
      fs.writeFileSync(filePath, updated);
      console.log(`${GREEN}● SYNCHRONIZED:${RESET} ${filePath}`);
    }
  };

  // Sync Root Docs
  for (const doc of ROOT_DOCS) {
    syncFile(doc);
  }

  // Recursive Walk
  const walk = (dir: string) => {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (FILE_EXTENSIONS.includes(path.extname(fullPath)) || entry.name === 'package.json') {
        syncFile(fullPath);
      }
    }
  };

  for (const dir of SCAN_DIRS) {
    walk(dir);
  }

  console.log(`\n${RED}::/UN1V3R54L-5YNC-C0MPL373 // 4LL-P4R17Y-4CH13V3D-V${version}.${RESET}\n`);
}

syncManifest().catch(console.error);
