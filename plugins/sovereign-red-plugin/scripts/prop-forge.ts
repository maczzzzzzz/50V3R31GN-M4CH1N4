/**
 * scripts/forge/prop-forge.ts
 *
 * Phase 55.3: Sovereign Asset Forge — Modular Prop Library
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import Database from 'better-sqlite3';
import { NanoBananaService } from '../../packages/hermes-core/src/core/nano-banana-service.js';
import 'dotenv/config';

const execAsync = promisify(exec);
const PROPS_DIR = './data/assets/props';
const AKASHIK_DB = './data/Akashik.db';
// Using the vehicle as the anchor for painterly hand-drawn style
const STYLE_ANCHOR = './data/assets/anchors/anchor-vehicles-armored-1.png';

interface PropDefinition {
  id: string;
  name: string;
  prompt: string;
}

const PROP_QUEUE: PropDefinition[] = [
  {
    id: 'laser-trip-mine',
    name: 'Laser Trip Mine',
    prompt: 'A small hand-painted industrial device with a dull amber glowing lens. Rough hand-drawn textures, grimy metal, oil-paint aesthetic. Top-down 90-degree view.'
  },
  {
    id: 'netrunner-chair',
    name: 'Netrunner Chair',
    prompt: 'A hand-drawn top-down icon of a heavy industrial seat. Painterly textures, worn dark leather, bulky armrests, oil-paint style matching the vehicle assets.'
  }
];

export async function forgeProps() {
  await fs.mkdir(PROPS_DIR, { recursive: true });
  const nanoBanana = new NanoBananaService();
  const db = new Database(AKASHIK_DB);

  console.log(`◈ ◈ ◈ SOVEREIGN PROP FORGE: PAINTERLY STYLIZATION ◈ ◈ ◈`);

  for (const prop of PROP_QUEUE) {
    const outPath = path.join(PROPS_DIR, `${prop.id}.webp`);
    
    const stylePrompt = 
      `ACT AS THE MASTER CYBERPUNK BATTLEMAP ARTIST. ` +
      `IMAGE 1 IS THE STYLE REFERENCE. MATCH ITS HAND-PAINTED, PAINTERLY, OIL-PAINT TEXTURE QUALITY. ` +
      `MISSION: Generate a 2D TOP-DOWN map icon for a ${prop.name}. ` +
      `AESTHETIC: ${prop.prompt}. ` +
      `COMPOSITION: ISOLATED ON A PURE WHITE BACKGROUND. ` +
      `PERSPECTIVE: STRICTLY 2D TOP-DOWN FLAT ORTHOGRAPHIC. ` +
      `CRITICAL: NO clean digital lines. Use ROUGH BRUSHSTROKES and GRIMY INDUSTRIAL COLORS. ` +
      `The icon must look like it was hand-painted onto the map surface. NO SHADOWS.`;

    try {
      console.log(`[PropForge] Generating: ${prop.name}...`);
      const generatedPath = await nanoBanana.generateTile({
        skeletonPath: STYLE_ANCHOR,
        stylePrompt,
        outputPath: outPath
      });

      console.log(`[PropForge] Removing white background for ${prop.name}...`);
      await execAsync(`nix shell nixpkgs#imagemagick -c magick convert "${generatedPath}" -fuzz 5% -transparent white "${generatedPath}"`);

      db.prepare(`
        INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, category, weight, anchor, legacy_target, st3gg_path)
        VALUES (?, ?, ?, ?, 'prop', 1.0, 0, 0, ?)
      `).run(`prop-${prop.id}`, `${prop.id}.webp`, generatedPath, 'Misc', generatedPath);

      console.log(`[PropForge] SUCCESS: ${prop.id}`);
    } catch (err) {
      console.error(`[PropForge] FAILED on ${prop.id}:`, err);
    }
  }

  db.close();
  console.log(`\n◈ ◈ ◈ PROP FORGE COMPLETE ◈ ◈ ◈`);
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  forgeProps().catch(err => { console.error('[PropForge] Fatal:', err); process.exit(1); });
}
