/**
 * scripts/forge/master-forge.ts
 *
 * Phase 54.5: Atlas Forge — Master Orchestrator
 *
 * One-click command to plan, skin, audit, and manifest a battlemap.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import Database from 'better-sqlite3';
import { assemble, LAYOUT_PRESETS } from './blueprint-engine.js';
import { AtlasForge } from './atlas-forge.js';
import { NucleusAssembler } from './assembler.js';

export class MasterForge {
  private readonly forge: AtlasForge;
  private readonly assembler: NucleusAssembler;
  private readonly referencesDir = './data/assets/references';
  private readonly db: Database.Database;

  constructor(dbPath = './data/Akashik.db') {
    this.forge = new AtlasForge();
    this.assembler = new NucleusAssembler();
    this.db = new Database(dbPath, { readonly: true });
  }

  /**
   * Resolves a style name to a reference image path.
   */
  private async resolveStyle(styleName: string): Promise<string | undefined> {
    const files = await fs.readdir(this.referencesDir);
    // Find exact match or partial match (case-insensitive)
    const match = files.find(f => 
      f.toLowerCase().includes(styleName.toLowerCase()) && 
      (f.endsWith('.webp') || f.endsWith('.png')) &&
      !f.includes(':Zone.Identifier')
    );
    return match ? path.join(this.referencesDir, match) : undefined;
  }

  private getDistrictLore(districtName: string): string | undefined {
    try {
      const row = this.db.prepare(
        "SELECT lore_fragments_json FROM district_dna WHERE district_name LIKE ?"
      ).get(`%${districtName}%`) as { lore_fragments_json: string } | undefined;
      
      if (row && row.lore_fragments_json) {
        const loreArray = JSON.parse(row.lore_fragments_json);
        // Combine the first few fragments for context to avoid prompt size explosion
        const text = Array.isArray(loreArray) ? loreArray.slice(0, 3).join(' ') : String(loreArray);
        // Truncate to reasonable length
        return text.length > 800 ? text.substring(0, 800) + '...' : text;
      }
    } catch (err) {
      console.warn(`[MasterForge] Failed to fetch lore for district: ${districtName}`, err);
    }
    return undefined;
  }

  /**
   * Runs the full map-generation pipeline for a blueprint preset.
   */
  async forgeAndManifest(blueprintId: string, styleName?: string, districtName?: string, locationType?: string): Promise<void> {
    const preset = LAYOUT_PRESETS.find(p => p.id === blueprintId);
    if (!preset) throw new Error(`[MasterForge] Unknown blueprint: ${blueprintId}`);

    let referencePath: string | undefined;
    if (styleName) {
      referencePath = await this.resolveStyle(styleName);
      if (!referencePath) {
        console.warn(`[MasterForge] Style '${styleName}' not found in ${this.referencesDir}. Proceeding without reference.`);
      } else {
        console.log(`[MasterForge] Using style reference: ${path.basename(referencePath)}`);
      }
    }

    let loreContext: string | undefined;
    if (districtName) {
      loreContext = this.getDistrictLore(districtName);
      if (loreContext) {
        console.log(`[MasterForge] Loaded lore context for district: ${districtName}`);
      } else {
        console.warn(`[MasterForge] No lore found for district: ${districtName}`);
      }
    }

    console.log(`\n◈ ◈ ◈ SOVEREIGN MAP FORGE: ${preset.label} ◈ ◈ ◈`);

    // 1. Plan Assembly
    const blueprint = assemble(preset);
    if (!blueprint.valid) {
      console.warn('[MasterForge] Warning: Blueprint is invalid. Errors:', blueprint.errors);
    }

    // 2. Identify and Forge unique tiles
    const uniqueTiles = new Set<string>();
    for (const row of blueprint.grid) {
      for (const slot of row) {
        if (slot) uniqueTiles.add(slot.tile.id);
      }
    }

    console.log(`[MasterForge] Step 1: Skinning and Auditing ${uniqueTiles.size} unique tiles...`);
    for (const tileId of uniqueTiles) {
      await this.forge.forgeTile(tileId, referencePath, districtName, loreContext, locationType);
    }

    // 3. Manifest in Foundry
    console.log(`[MasterForge] Step 2: Manifesting in Foundry VTT...`);
    await this.assembler.manifestMap(blueprintId);

    console.log('\n[MasterForge] ◈ ◈ ◈ ASSEMBLY COMPLETE ◈ ◈ ◈');
    this.db.close();
  }
}

// ── CLI ───────────────────────────────────────────────────────────────────────

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'))) {
  const master = new MasterForge();
  
  // Filter out the tsx/script name and flags
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const bpId = args[0] ?? 'megabuilding-3x3';
  
  // Look for --style=Safehouse
  const styleArg = process.argv.find(a => a.startsWith('--style='));
  const styleName = styleArg ? styleArg.split('=')[1] : undefined;

  // Look for --district=Watson
  const distArg = process.argv.find(a => a.startsWith('--district='));
  const districtName = distArg ? distArg.split('=')[1] : undefined;

  // Look for --location="abandoned warehouse"
  const locArg = process.argv.find(a => a.startsWith('--location='));
  const locationType = locArg ? locArg.split('=')[1] : undefined;

  master.forgeAndManifest(bpId, styleName, districtName, locationType)
    .catch(err => console.error('[MasterForge] Fatal Error:', err));
}
