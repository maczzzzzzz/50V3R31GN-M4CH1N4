/**
 * scripts/forge/identity-forge.ts
 *
 * Phase 100.10: Node C - Direct Physical Crop
 */

import path from 'node:path';
import fs from 'node:fs/promises';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function main() {
  const outputDir = path.join('assets', 'brand-identity', 'materialized');
  const masterRef = path.join(outputDir, 'master.png');
  const nodeCPng = path.join(outputDir, 'node_c.png');
  const bg = "#1A1A1A";

  console.log(`◈ 50V3R31GN-M4CH1N4: Initiating Direct Physical Crop for Node C (v3.0)...`);

  // 1. Direct surgical crop of the eye assembly from master.png (derived from visual center)
  // Eye center is roughly at 512, 508.
  await execAsync(`nix shell nixpkgs#imagemagick -c magick "${masterRef}" -crop 170x170+427+423 -resize 800x800 -background "${bg}" -gravity center -extent 1024x1024 "${nodeCPng}"`);

  console.log(`\n◈ NODE_C DIRECT_CROP_COMPLETE: ${nodeCPng}`);
}

main().catch(console.error);
