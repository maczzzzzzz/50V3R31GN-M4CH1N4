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
import Database from 'better-sqlite3';

const MOOK_DIR = 'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks';
const OUTPUT_DIR = '/mnt/d/Obsidian_RKG/Actors/NC_GANGS_CORPS';
const DB_PATH = process.env['AKASHIK_DB_PATH'] ?? 'data/Akashik.db';

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

// ── Akashik.db NPC Export ─────────────────────────────────────────────────────

interface AkashikNpc {
  id: string;
  name: string;
  hp: number;
  sp: number;
  faction: string | null;
  district_id: string | null;
  disposition: 'friendly' | 'neutral' | 'hostile' | null;
  is_alive: number;
}

/**
 * Export all NPCs from Akashik.db as structured Obsidian threat profiles.
 * Writes to OUTPUT_DIR/Akashik/<faction>/<name>.md
 */
function exportAkashikNpcs(dbPath: string, outputDir: string): number {
  if (!fs.existsSync(dbPath)) {
    console.warn(`  [akashik] DB not found: ${dbPath} — skipping Akashik export`);
    return 0;
  }

  const db = new Database(dbPath, { readonly: true });
  let npcs: AkashikNpc[] = [];
  try {
    const tableExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='npcs'").get();
    if (!tableExists) {
      console.warn('  [akashik] npcs table not found in master — skipping');
      db.close();
      return 0;
    }

    npcs = db.prepare(
      'SELECT id, name, hp, sp, faction, district_id, disposition, is_alive FROM npcs'
    ).all() as AkashikNpc[];
  } catch (e) {
    console.warn('  [akashik] Export query failed:', (e as Error).message);
    db.close();
    return 0;
  }
  db.close();

  let written = 0;
  for (const npc of npcs) {
    const faction = npc.faction ?? 'Unknown';
    const targetDir = path.join(outputDir, 'Akashik', faction.replace(/[\\/]/g, '_'));
    fs.mkdirSync(targetDir, { recursive: true });

    const frontmatter = {
      subject:    npc.name,
      type:       'NPC',
      faction,
      district:   npc.district_id ?? null,
      disposition: npc.disposition ?? 'neutral',
      alive:      npc.is_alive === 1,
      tags:       [
        'rkg/threat',
        `rkg/faction/${faction.toLowerCase().replace(/\s+/g, '_')}`,
        ...(npc.district_id ? [`rkg/district/${npc.district_id.toLowerCase().replace(/\s+/g, '_')}`] : []),
      ],
      sovereign:  true,
      source:     'Akashik_DB',
    };

    const content = `---
${yaml.dump(frontmatter)}---

# ${npc.name}

### ◈ TACTICAL INTEL
- **Faction:** ${faction}
- **District:** ${npc.district_id ?? '_Unknown_'}
- **Disposition:** ${npc.disposition ?? 'neutral'}
- **Status:** ${npc.is_alive ? '🟢 Alive' : '🔴 Deceased'}

### ◈ STATS
| HP | SP |
|----|-----|
| ${npc.hp} | ${npc.sp} |

---
_Source: Akashik.db — ID: \`${npc.id}\`_
`;

    const fileName = npc.name.replace(/[\s/\\:*?"<>|]/g, '_').slice(0, 200) + '.md';
    fs.writeFileSync(path.join(targetDir, fileName), content, 'utf8');
    written++;
  }

  return written;
}

// ── Entry point ───────────────────────────────────────────────────────────────

const sourceArg = process.argv.find(a => a.startsWith('--source='))?.replace('--source=', '') ?? 'all';

if (sourceArg === 'foundry' || sourceArg === 'all') {
  if (fs.existsSync(MOOK_DIR)) {
    console.log(`◈ NC_GANGS_CORPS: Exporting Foundry mooks to ${OUTPUT_DIR}...`);
    if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    walkDir(MOOK_DIR);
    console.log('  ✓ Foundry mook export complete.');
  } else {
    console.warn(`  [foundry] MOOK_DIR not found: ${MOOK_DIR} — skipping`);
  }
}

if (sourceArg === 'akashik' || sourceArg === 'all') {
  console.log(`◈ AKASHIK: Exporting NPCs from ${DB_PATH} to ${OUTPUT_DIR}/Akashik/...`);
  const count = exportAkashikNpcs(DB_PATH, OUTPUT_DIR);
  console.log(`  ✓ Akashik NPC export complete: ${count} profiles written.`);
}

console.log('✅ EXPORT COMPLETE.');
