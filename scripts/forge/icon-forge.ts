/**
 * scripts/forge/icon-forge.ts
 *
 * Use the Nano Banana 2 pipeline to generate a high-fidelity Sovereign app icon
 * with a cyberpunk eye background (Pure Black and White).
 */

import { NanoBananaService } from '../../packages/hermes-core/src/core/nano-banana-service.js';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

async function main() {
  const nano = new NanoBananaService();
  
  const prompt = 
    `ACT AS A MASTER GRAPHIC DESIGNER FOR A CYBERPUNK MEGACORP. ` +
    `MISSION: Generate a high-fidelity square app icon (1024x1024). ` +
    `CONTENT: The background is a mechanical, high-tech cyberpunk eye, heavily inspired by the structure in IMAGE 2. ` +
    `COLOR PALETTE: Strictly PURE BLACK (#000000) and PURE WHITE (#ffffff). No other colors. ` +
    `The text "50V3R31GN-M4CH1N4" is arranged in a perfect circular ring orbiting around the central eye. ` +
    `The text should be sharp, clean leetspeak (Space Grotesk/monospace style). ` +
    `OVERLAY: Apply a transparent CRT scanline filter over the entire image using white glow. ` +
    `Include a subtle chromatic aberration effect and a faint white glow emanating from the white text and eye elements. ` +
    `PERSPECTIVE: Perfectly flat 2D orthographic graphic. No 3D, no perspective, no tilt. ` +
    `The final output must be a clean, high-contrast, aggressive digital icon.`;

  const skeletonPath = path.join('terminal-app', 'assets', 'blank.png');
  const referenceImagePath = path.join('terminal-app', 'assets', 'eye_ref.jpg');
  const outputPath = path.join('terminal-app', 'assets', 'icon_nano.webp');

  console.log('◈ 50V3R31GN-M4CH1N4: Igniting Nano Banana 2 NEUTRAL icon pipeline...');
  
  const generatedPath = await nano.generateTile({
    skeletonPath,
    referenceImagePath,
    stylePrompt: prompt,
    outputPath
  });

  console.log(`◈ Icon generated at: ${generatedPath}`);

  // Convert to PNG for Flutter and Android launcher
  const pngPath = path.join('terminal-app', 'assets', 'icon.png');
  try {
    console.log('◈ Converting to PNG and applying final hardening...');
    await execAsync(`nix shell nixpkgs#imagemagick -c magick "${generatedPath}" -resize 1024x1024! "${pngPath}"`);
    console.log(`◈ Final icon materialized: ${pngPath}`);
    
    // Generate Android assets
    console.log('◈ Materializing icon mesh for Android...');
    const resPath = 'terminal-app/android/app/packages/hermes-core/src/main/res';
    const sizes = {
      'mipmap-mdpi': '48x48',
      'mipmap-hdpi': '72x72',
      'mipmap-xhdpi': '96x96',
      'mipmap-xxhdpi': '144x144',
      'mipmap-xxxhdpi': '192x192'
    };
    
    for (const [dir, size] of Object.entries(sizes)) {
      await execAsync(`mkdir -p ${resPath}/${dir}`);
      await execAsync(`nix shell nixpkgs#imagemagick -c magick "${pngPath}" -resize ${size} ${resPath}/${dir}/ic_launcher.png`);
    }
    console.log('◈ ICON_MESH_MATERIALIZED');
  } catch (err) {
    console.error(`◈ Conversion failed: ${(err as Error).message}`);
  }
}

main().catch(console.error);
