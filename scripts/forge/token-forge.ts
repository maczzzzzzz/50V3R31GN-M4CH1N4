/**
 * scripts/forge/token-forge.ts
 *
 * Phase 55.1 (Task 1): Sovereign Asset Forge — ST3GG Transfusion (Token Forge)
 *
 * Reads actor metadata from Akashik.db, generates high-fidelity Top-Down
 * sprites via Nano Banana 2 using faction-matched Aesthetic Anchors as style
 * references, then embeds biometric ST3GG data into the final PNGs.
 * Every generated token is persisted to the assets table in Akashik.db.
 *
 * Usage: npm run forge:tokens [--limit=N] [--npc=<npc-id>]
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { NanoBananaService } from '../../src/core/nano-banana-service.js';
import { SteganographyService } from '../../src/core/steganography-service.js';
import 'dotenv/config';

const TOKENS_DIR = './data/assets/tokens';
const AKASHIK_DB = process.env['AKASHIK_DB_PATH'] ?? './data/Akashik.db';

// Top-down token generation directive
const TOKEN_PROMPT =
  'ACT AS A MASTER CYBERPUNK MINIATURE ARTIST. ' +
  'IMAGE 1 IS THE CHARACTER STYLE REFERENCE — a high-quality cyberpunk figure. ' +
  'MISSION: Generate a high-fidelity TOP-DOWN TOKEN SPRITE for a Cyberpunk RED tabletop RPG battle map. ' +
  '1. PERSPECTIVE: Strict top-down view. The figure is viewed from directly above at 90°. ' +
  '2. STYLE: Match the gritty, high-contrast aesthetic, color palette, and texture of IMAGE 1. ' +
  '3. SILHOUETTE: Clear, readable character outline — visible weapon, faction gear, and clothing. ' +
  '4. COMPOSITION: Circular token frame, soft drop shadow, no text overlays. ' +
  '5. DENSITY: 256×256px equivalent detail. Dark outlines on all limbs for readability at map scale.';

interface NpcRow {
  id: string;
  name: string;
  faction: string | null;
  disposition: string | null;
  hp: number;
  sp: number;
  is_alive: number;
  district_id: string | null;
}

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

  /**
   * Finds the best faction-matched aesthetic anchor PNG.
   * Falls back to any anchor if no faction match exists.
   */
  private findAnchor(faction: string | null): string | undefined {
    if (faction) {
      const row = this.db.prepare(
        `SELECT file_path FROM assets WHERE anchor = 1 AND faction = ? AND file_path LIKE '%.png' LIMIT 1`
      ).get(faction) as AnchorRow | undefined;
      if (row) return row.file_path;
    }
    const fallback = this.db.prepare(
      `SELECT file_path FROM assets WHERE anchor = 1 AND file_path LIKE '%.png' LIMIT 1`
    ).get() as AnchorRow | undefined;
    return fallback?.file_path;
  }

  /**
   * Generates a single token sprite and embeds biometrics.
   */
  async forgeToken(npc: NpcRow): Promise<string | null> {
    const anchorPath = this.findAnchor(npc.faction);
    if (!anchorPath) {
      console.warn(`[TokenForge] No anchor found for ${npc.name}. Run forge:ingest first.`);
      return null;
    }

    const webpOutPath = path.join(TOKENS_DIR, `${npc.id}.webp`);

    const generatedPath = await this.nanoBanana.generateTile({
      skeletonPath: anchorPath,
      stylePrompt: TOKEN_PROMPT,
      outputPath: webpOutPath,
    });

    const biometrics = JSON.stringify({
      id: npc.id,
      name: npc.name,
      faction: npc.faction,
      hp: npc.hp,
      sp: npc.sp,
    });

    // ST3GG embedding only works on PNG; WebP output is stored as-is
    let finalPath = generatedPath;
    if (generatedPath.endsWith('.png')) {
      const pngOut = path.join(TOKENS_DIR, `${npc.id}.png`);
      await this.st3gg.encodeSecret(generatedPath, pngOut, biometrics);
      finalPath = pngOut;
      console.log(`[TokenForge] ST3GG embedded: ${npc.name}`);
    } else {
      console.log(`[TokenForge] WebP output — biometrics logged, no LSB embed: ${npc.name}`);
    }

    // Persist to assets table
    this.db.prepare(`
      INSERT OR REPLACE INTO assets (id, file_name, file_path, faction, weight, anchor, st3gg_path)
      VALUES (?, ?, ?, ?, 1.0, 0, ?)
    `).run(
      `token-${npc.id}`,
      path.basename(finalPath),
      finalPath,
      npc.faction,
      finalPath,
    );

    return finalPath;
  }

  /**
   * Runs the token forge pass for alive NPCs.
   */
  async forgeAll(limit?: number): Promise<{ generated: number; skipped: number }> {
    await fs.mkdir(TOKENS_DIR, { recursive: true });

    const sql = limit
      ? `SELECT * FROM npcs WHERE is_alive = 1 ORDER BY name LIMIT ${limit}`
      : `SELECT * FROM npcs WHERE is_alive = 1 ORDER BY name`;

    const npcs = this.db.prepare(sql).all() as NpcRow[];
    console.log(`[TokenForge] Processing ${npcs.length} NPCs...`);

    let generated = 0;
    let skipped = 0;

    for (const npc of npcs) {
      try {
        const result = await this.forgeToken(npc);
        if (result) generated++;
        else skipped++;
      } catch (err) {
        console.warn(`[TokenForge] Error on ${npc.name}: ${(err as Error).message}`);
        skipped++;
      }
    }

    this.db.close();
    console.log(`[TokenForge] Complete — ${generated} generated, ${skipped} skipped`);
    return { generated, skipped };
  }

  close(): void {
    try { this.db.close(); } catch { /* already closed */ }
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const limitArg = process.argv.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]!, 10) : undefined;
  const forge = new TokenForge();
  forge.forgeAll(limit).catch(err => { console.error('[TokenForge] Fatal:', err); process.exit(1); });
}
