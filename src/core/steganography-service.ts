/**
 * steganography-service.ts
 *
 * Phase 17: Immersive Data Caching (ST3GG Engine)
 * Implements Least Significant Bit (LSB) encoding/decoding for zero-VRAM
 * secure data drops in image assets.
 */

import * as fs from 'fs/promises';
import { PNG } from 'pngjs';

export class SteganographyService {
  /**
   * Encodes a secret string into the LSBs of a PNG image.
   * Uses 1 bit per channel (R, G, B, A) sequentially.
   * Adds a null terminator (\0) to signal end of data.
   */
  async encodeSecret(inputPath: string, outputPath: string, secret: string): Promise<void> {
    const data = await fs.readFile(inputPath);
    const png = PNG.sync.read(data);
    
    // Add null terminator to stop decoding at the right place
    const secretBuffer = Buffer.from(secret + '\0', 'utf8');
    let bitIndex = 0;

    // png.data is a Uint8Array: [R, G, B, A, R, G, B, A, ...]
    for (let i = 0; i < png.data.length; i++) {
      if (bitIndex < secretBuffer.length * 8) {
        const byteIndex = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8); // Start with most significant bit of the byte
        const byteVal = secretBuffer[byteIndex];
        const bit = byteVal !== undefined ? ((byteVal >> bitOffset) & 1) : 0;
        
        // Clear LSB and set to our bit
        const pngDataVal = png.data[i];
        if (pngDataVal !== undefined) {
          png.data[i] = (pngDataVal & 0xFE) | bit;
        }
        bitIndex++;
      } else {
        break;
      }
    }

    if (bitIndex < secretBuffer.length * 8) {
      throw new Error(`Image too small to hold secret. Required ${secretBuffer.length * 8} bits, available ${png.data.length}.`);
    }

    const outBuffer = PNG.sync.write(png);
    await fs.writeFile(outputPath, outBuffer);
  }

  /**
   * Decodes a string from the LSBs of a PNG image.
   */
  async decodeSecret(inputPath: string): Promise<string> {
    const data = await fs.readFile(inputPath);
    const png = PNG.sync.read(data);
    
    const decodedChars: string[] = [];
    let currentByte = 0;
    let bitCount = 0;

    for (let i = 0; i < png.data.length; i++) {
      const val = png.data[i];
      if (val === undefined) break;
      const bit = val & 1;
      currentByte = (currentByte << 1) | bit;
      bitCount++;

      if (bitCount === 8) {
        if (currentByte === 0) {
          break; // Null terminator found
        }
        decodedChars.push(String.fromCharCode(currentByte));
        currentByte = 0;
        bitCount = 0;
      }
    }

    return decodedChars.join('');
  }
}
