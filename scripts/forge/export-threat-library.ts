/**
 * export-threat-library.ts
 * 
 * Part of Atlas Forge (Phase 43)
 * Converts raw Foundry VTT mook JSON into structured Obsidian notes
 * with physicalization hooks.
 */

import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const MOOK_DIR = 'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks';
const OUTPUT_DIR = '/mnt/d/Obsidian_RKG/Actors/NC_GANGS_CORPS';

interface MookData {
  name: string;
  type: string;
  img: string;
  system: {
    stats: Record<string, { value: number }>;
    derivedStats: Record<string, { value: number }>;
  };
  items: any[];
}

function parseMook(filePath: string): void {
  const raw = fs.readFileSync(filePath, 'utf8');
  const data = JSON.parse(raw) as MookData;

  const gangName = path.basename(path.dirname(filePath)).replace(/-/g, ' ').toUpperCase();
  const targetDir = path.join(OUTPUT_DIR, gangName);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

  const stats = data.system.stats || {};
  const derived = data.system.derivedStats || {};

  const frontmatter = {
    subject: data.name,
    type: 'Mook',
    faction: gangName,
    tags: ['rkg/threat', `rkg/faction/${gangName.toLowerCase().replace(/\s+/g, '_')}`],
    hp: derived.hp?.value || 0,
    armor: derived.armor?.value || 0,
    ref: stats.ref?.value || 0,
    dex: stats.dex?.value || 0,
    body: stats.body?.value || 0,
    sovereign: true,
    source: 'Foundry_Mook_Pack'
  };

  const itemsList = data.items
    .filter(i => ['weapon', 'armor', 'cyberware', 'gear'].includes(i.type))
    .map(i => `- **${i.name}** (${i.type})`)
    .join('\n');

  const skillsList = data.items
    .filter(i => i.type === 'skill')
    .map(i => `- ${i.name}: Level ${i.system.level || 0}`)
    .join('\n');

  const content = `---
${yaml.dump(frontmatter)}---

# ${data.name}

![Portrait](${data.img})

### ◈ TACTICAL INTEL
- **Faction:** ${gangName}
- **Role:** ${data.type.toUpperCase()}

### ◈ EQUIPMENT
${itemsList || '_No equipment listed._'}

### ◈ SKILLS
${skillsList || '_No skills listed._'}

---

### ◈ SOVEREIGN COMMAND
<button onclick="window.SOVEREIGN_BRIDGE.sendRequest('create_actor', ${JSON.stringify(data)})">[ MATERIALIZE TOKEN ]</button>

_Original ID: ${data.name.replace(/\s+/g, '_').toLowerCase()}_
`;

  const fileName = data.name.replace(/\s+/g, '_') + '.md';
  fs.writeFileSync(path.join(targetDir, fileName), content, 'utf8');
}

function walkDir(dir: string): void {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (file.endsWith('.json') && file.includes('Actor')) {
      parseMook(fullPath);
    }
  }
}

console.log(`◈ NC_GANGS_CORPS: Exporting library to ${OUTPUT_DIR}...`);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
walkDir(MOOK_DIR);
console.log('✅ EXPORT COMPLETE.');
