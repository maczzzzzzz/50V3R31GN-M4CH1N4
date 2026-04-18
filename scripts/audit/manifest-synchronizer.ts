import fs from 'node:fs';
import path from 'node:path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const RESET = '\x1b[0m';

const VERSION_FILE = 'package.json';
const SOURCES_OF_TRUTH = [
  'README.md',
  'CHANGELOG.md',
  'CLAUDE.md',
  'KNOWLEDGE_BASE.md',
  'IMPLEMENTATION_PLAN.md',
  'quickprompt.md'
];

const GUIDES_DIR = 'akashik_guides';

async function syncManifest() {
  console.log(`${RED}://50V3R31GN-M4CH1N4 // M4N1F357-5YNC // 1N171473D${RESET}\n`);

  const pkg = JSON.parse(fs.readFileSync(VERSION_FILE, 'utf8'));
  const version = pkg.version;
  console.log(`◈ Target Version: ${version}`);

  // 1. Sync Root Manifests
  for (const file of SOURCES_OF_TRUTH) {
    if (fs.existsSync(file)) {
      let content = fs.readFileSync(file, 'utf8');
      
      // Update version headers (vX.X.X or Version: X.X.X)
      const updated = content.replace(/(v\d+\.\d+\.\d+|Version:\s*\d+\.\d+\.\d+)/gi, (match) => {
        return match.startsWith('Version') ? `Version: ${version}` : `v${version}`;
      });

      if (content !== updated) {
        fs.writeFileSync(file, updated);
        console.log(`${GREEN}● SYNCHRONIZED:${RESET} ${file}`);
      } else {
        console.log(`○ ALIGNED: ${file}`);
      }
    }
  }

  // 2. Sync Guides
  const walk = (dir: string) => {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else if (file.endsWith('.md')) {
        let content = fs.readFileSync(fullPath, 'utf8');
        const updated = content.replace(/(v\d+\.\d+\.\d+|Version:\s*\d+\.\d+\.\d+)/gi, (match) => {
          return match.startsWith('Version') ? `Version: ${version}` : `v${version}`;
        });
        
        if (content !== updated) {
          fs.writeFileSync(fullPath, updated);
          console.log(`${GREEN}● SYNCHRONIZED GUIDE:${RESET} ${fullPath}`);
        }
      }
    }
  };

  if (fs.existsSync(GUIDES_DIR)) {
    walk(GUIDES_DIR);
  }

  console.log(`\n${RED}::/5YNC-C0MPL373 // 4LL-D0C5-4L16N3D-70-V${version}.${RESET}\n`);
}

syncManifest().catch(console.error);
