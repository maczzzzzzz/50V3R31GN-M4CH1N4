/**
 * tests/core/steganography-service.test.ts
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { SteganographyService } from '../../packages/hermes-core/src/core/steganography-service.js';
import * as fs from 'fs/promises';
import * as path from 'path';
import { PNG } from 'pngjs';

describe('SteganographyService', () => {
  const service = new SteganographyService();
  const fixturesDir = path.join(process.cwd(), 'tests/fixtures');
  const inputPath = path.join(fixturesDir, 'test_junk.png');
  const outputPath = path.join(fixturesDir, 'test_encoded.png');
  const secretText = "Ouroboros is the key.";

  beforeAll(async () => {
    // Ensure fixtures dir exists
    await fs.mkdir(fixturesDir, { recursive: true });

    // Create a dummy 10x10 PNG
    const png = new PNG({ width: 10, height: 10 });
    for (let y = 0; y < png.height; y++) {
      for (let x = 0; x < png.width; x++) {
        const idx = (png.width * y + x) << 2;
        png.data[idx] = 255;     // R
        png.data[idx + 1] = 0;   // G
        png.data[idx + 2] = 0;   // B
        png.data[idx + 3] = 255; // A
      }
    }
    const buffer = PNG.sync.write(png);
    await fs.writeFile(inputPath, buffer);
  });

  afterAll(async () => {
    await fs.unlink(inputPath).catch(() => {});
    await fs.unlink(outputPath).catch(() => {});
  });

  it('encodes and decodes a secret string in an image', async () => {
    await service.encodeSecret(inputPath, outputPath, secretText);
    const decoded = await service.decodeSecret(outputPath);
    expect(decoded).toBe(secretText);
  });

  it('throws error if image is too small', async () => {
    const hugeSecret = "A".repeat(1000);
    await expect(service.encodeSecret(inputPath, outputPath, hugeSecret))
      .rejects.toThrow(/Image too small/);
  });
});
