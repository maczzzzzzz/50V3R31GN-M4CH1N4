/**
 * scripts/forge/token-forge.ts
 *
 * Phase 55.1: Sovereign Asset Forge — Content-Aware Token Forge
 *
 * Reads legacy JSON actor files from docs/raw_data/, extracts their loadout
 * (weapons, gear, faction), and uses Nano Banana 2 to generate high-fidelity
 * Top-Down sprites matching the Aesthetic Anchors in Akashik.db.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { NanoBananaService } from '../../src/core/nano-banana-service.js';
import { SteganographyService } from '../../src/core/steganography-service.js';
import 'dotenv/config';

const execAsync = promisify(exec);
const TOKENS_DIR = './data/assets/tokens';
const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';
const LEGACY_DIR = './docs/raw_data/entities_mooks/night city gang corp mook pack - mooks';

interface AnchorRow {
  file_path: string;
}

export class TokenForge {
  private readonly nanoBanana: NanoBananaService;
  private readonly st3gg: SteganographyService;
  private readonly db: Database.Database;

  constructor(dbPath = AKASHIK_DB) {
    this.nanoBanana = new NanoBananaService();
    this.st3gg = new SteganographyService();
    this.db = new Database(dbPath);
  }

  private findAnchor(faction: string): string | undefined {
    // Map directory names to database factions
    let mappedFaction = faction;
    if (faction.toLowerCase().includes('6th street')) mappedFaction = 'Militant';
    else if (faction.toLowerCase().includes('ncpd')) mappedFaction = 'NCPD';
    else if (faction.toLowerCase().includes('corp')) mappedFaction = 'Corporate';
    else if (faction.toLowerCase().includes('trauma')) mappedFaction = 'MedTech';
    
    const row = this.db.prepare(
      `SELECT file_path FROM assets WHERE anchor = 1 AND faction = ? AND file_path LIKE '%.png' LIMIT 1`
    ).get(mappedFaction) as AnchorRow | undefined;
    
    if (row) return row.file_path;
    
    const fallback = this.db.prepare(
      `SELECT file_path FROM assets WHERE anchor = 1 AND file_path LIKE '%.png' LIMIT 1`
    ).get() as AnchorRow | undefined;
    return fallback?.file_path;
  }

  async forgeToken(jsonPath: string, faction: string): Promise<string | null> {
    const raw = await fs.readFile(jsonPath, 'utf-8');
    const actor = JSON.parse(raw);
    const name = actor.name;
    const id = actor._id || path.basename(jsonPath, '.json');
    
    // Extract and prioritize weapons
    const weaponItems = actor.items?.filter((i: any) => i.type === 'weapon').map((w: any) => w.name) || [];
    let primaryWeapon = 'Sidearm';
    let holsteredWeapons: string[] = [];

    if (weaponItems.length > 0) {
      // Very basic categorization: if it sounds big, it's primary
      const heavyKeywords = ['rifle', 'shotgun', 'smg', 'rpg', 'launcher', 'turret', 'heavy', 'bow'];
      const isHeavy = (w: string) => heavyKeywords.some(k => w.toLowerCase().includes(k));
      
      const heavies = weaponItems.filter(isHeavy);
      const lights = weaponItems.filter((w: string) => !isHeavy(w));

      if (heavies.length > 0) {
        primaryWeapon = heavies[0];
        holsteredWeapons = [...heavies.slice(1), ...lights];
      } else {
        primaryWeapon = lights[0];
        holsteredWeapons = lights.slice(1);
      }
    }

    const gear = actor.items?.filter((i: any) => i.type === 'armor').map((a: any) => a.name).join(', ') || 'Street clothes';
    
    // Limit holstered to max 2 to prevent clutter
    const holsteredStr = holsteredWeapons.length > 0 ? `, Holstered: ${holsteredWeapons.slice(0, 2).join(', ')}` : '';
    const loadoutStr = `Primary weapon in hands: ${primaryWeapon}${holsteredStr}`;

    const anchorPath = this.findAnchor(faction);
    if (!anchorPath) {
      console.warn(`[TokenForge] No anchor found for ${name}.`);
      return null;
    }

    const webpOutPath = path.join(TOKENS_DIR, `mook_${faction.replace(/\s+/g, '')}_${id}.webp`);

    const stylePrompt = 
      `ACT AS A MASTER CYBERPUNK MINIATURE ARTIST. ` +
      `IMAGE 1 IS THE STYLE REFERENCE. MATCH ITS AESTHETIC, LIGHTING, AND PERSPECTIVE (STRICTLY TOP-DOWN 90 DEGREES). ` +
      `MISSION: Generate a Top-Down battlemap token for a Cyberpunk character. ` +
      `CONTENT REQUIREMENTS: The character is a "${name}" from the "${faction}" faction. ` +
      `They are equipped with: [${loadoutStr}] and [Gear: ${gear}]. ` +
      `Ensure the primary weapon is visible in their hands from the top-down perspective. ` +
      `COMPOSITION: STRICTLY ISOLATED CHARACTER ON A PURE WHITE OR TRANSPARENT BACKGROUND. ` +
      `DO NOT generate a circular token frame. DO NOT generate drop shadows. DO NOT generate terrain or ground underneath the character. ` +
      `The character must be completely isolated so the background can be removed.`;

    console.log(`[TokenForge] Generating ${name} (${faction}) using anchor ${path.basename(anchorPath)}...`);
    console.log(`  -> Loadout: ${loadoutStr} | ${gear}`);

    const generatedPath = await this.nanoBanana.generateTile({
      skeletonPath: anchorPath, // Using skeletonPath as the Anchor Image input
      stylePrompt,
      outputPath: webpOutPath,
    });

    try {
      console.log(`[TokenForge] Removing white background for ${name}...`);
      await execAsync(`nix shell nixpkgs#imagemagick -c magick convert "${generatedPath}" -fuzz 5% -transparent white "${generatedPath}"`);
    } catch (err) {
      console.warn(`[TokenForge] Failed to remove background: ${(err as Error).message}`);
    }

    const biometrics = JSON.stringify({ id, name, faction, weapons: primaryWeapon });

    let finalPath = generatedPath;
    if (generatedPath.endsWith('.png')) {
      const pngOut = path.join(TOKENS_DIR, `mook_${faction.replace(/\s+/g, '')}_${id}.png`);
      await this.st3gg.encodeSecret(generatedPath, pngOut, biometrics);
      finalPath = pngOut;
      console.log(`[TokenForge] ST3GG embedded: ${name}`);
    }

    this.db.prepare(`
      INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, weight, anchor, legacy_target, st3gg_path)
      VALUES (?, ?, ?, ?, 1.0, 0, 0, ?)
    `).run(`token-${id}`, path.basename(finalPath), finalPath, faction, finalPath);

    return finalPath;
  }

  close(): void {
    try { this.db.close(); } catch { /* already closed */ }
  }

  async forgeAllMooks(limit?: number, limitPerFaction?: number): Promise<void> {
    await fs.mkdir(TOKENS_DIR, { recursive: true });
    let globalCount = 0;

    const dirs = await fs.readdir(LEGACY_DIR, { withFileTypes: true });
    for (const dir of dirs) {
      if (!dir.isDirectory() || dir.name.startsWith('-')) continue;
      
      const faction = dir.name;
      const files = await fs.readdir(path.join(LEGACY_DIR, faction));
      
      let factionCount = 0;
      for (const file of files) {
        if (!file.endsWith('.json')) continue;
        if (limit && globalCount >= limit) break;
        if (limitPerFaction && factionCount >= limitPerFaction) break;
        
        try {
          await this.forgeToken(path.join(LEGACY_DIR, faction, file), faction);
          globalCount++;
          factionCount++;
        } catch (err) {
          console.error(`[TokenForge] Failed on ${file}:`, err);
        }
      }
      if (limit && globalCount >= limit) break;
    }
    
    console.log(`[TokenForge] Complete — Generated ${globalCount} tokens.`);
    this.db.close();
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]!, 10) : undefined;
  
  const limitPerFactionArg = process.argv.find(a => a.startsWith('--limitPerFaction='));
  const limitPerFaction = limitPerFactionArg ? parseInt(limitPerFactionArg.split('=')[1]!, 10) : undefined;

  const forge = new TokenForge();
  forge.forgeAllMooks(limit, limitPerFaction).catch(err => { console.error('[TokenForge] Fatal:', err); process.exit(1); });
}
