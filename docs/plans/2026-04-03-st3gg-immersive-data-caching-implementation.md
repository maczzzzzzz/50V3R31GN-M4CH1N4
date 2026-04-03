# ST3GG Immersive Data Caching Implementation Plan

> **For Gemini:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement a dynamic, zero-VRAM steganography system that allows players to discover and decrypt LLM-generated secrets hidden inside image handouts.

**Architecture:** Node B intercepts "file extraction" events from Foundry. The Mistral-Nemo LLM generates a contextual secret. Node B's CPU uses an LSB (Least Significant Bit) encoding service to embed the secret into a "junk data" template image. A Foundry Macro decrypts the image by sending its path back to Node B for decoding.

**Tech Stack:** TypeScript (Node B), Foundry VTT Macros (JavaScript), `pngjs` or native `canvas` for pixel manipulation (Node B).

---

### Task 1: Create the Steganography Service

**Files:**
- Create: `src/core/steganography-service.ts`
- Create: `tests/core/steganography-service.test.ts`
- Modify: `package.json` (add `pngjs` if necessary for pixel manipulation)

**Step 1: Write the failing test**

```typescript
// tests/core/steganography-service.test.ts
import { SteganographyService } from '../../src/core/steganography-service';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('SteganographyService', () => {
  const service = new SteganographyService();
  const testImagePath = path.join(__dirname, '../fixtures/test_junk.png');
  const outputPath = path.join(__dirname, '../fixtures/test_encoded.png');
  const secretText = "Ouroboros is the key.";

  beforeAll(async () => {
    // Ensure test_junk.png exists (create a dummy 10x10 png for testing if needed)
  });

  afterAll(async () => {
    await fs.unlink(outputPath).catch(() => {});
  });

  it('encodes and decodes a secret string in an image', async () => {
    await service.encodeSecret(testImagePath, outputPath, secretText);
    const decoded = await service.decodeSecret(outputPath);
    expect(decoded).toBe(secretText);
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/steganography-service.test.ts`
Expected: FAIL (Cannot find module 'steganography-service')

**Step 3: Write minimal implementation**

```typescript
// src/core/steganography-service.ts
import * as fs from 'fs/promises';
import { PNG } from 'pngjs'; // Assuming pngjs is installed: npm install pngjs @types/pngjs

export class SteganographyService {
  /**
   * Encodes a string into the LSBs of a PNG image.
   * Simple implementation: 1 bit per channel (R, G, B, A).
   */
  async encodeSecret(inputPath: string, outputPath: string, secret: string): Promise<void> {
    const data = await fs.readFile(inputPath);
    const png = PNG.sync.read(data);
    
    // Add a terminator character so we know when to stop decoding
    const secretBuffer = Buffer.from(secret + '\0', 'utf8');
    let bitIndex = 0;

    for (let i = 0; i < png.data.length; i++) {
      if (bitIndex < secretBuffer.length * 8) {
        const byteIndex = Math.floor(bitIndex / 8);
        const bitOffset = 7 - (bitIndex % 8);
        const bit = (secretBuffer[byteIndex] >> bitOffset) & 1;
        
        // Clear the LSB and set it to our bit
        png.data[i] = (png.data[i] & 0xFE) | bit;
        bitIndex++;
      } else {
        break; // We've encoded the whole string
      }
    }

    if (bitIndex < secretBuffer.length * 8) {
        throw new Error("Image too small to hold secret");
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
    
    let decodedChars = [];
    let currentByte = 0;
    let bitIndex = 0;

    for (let i = 0; i < png.data.length; i++) {
      const bit = png.data[i] & 1;
      currentByte = (currentByte << 1) | bit;
      bitIndex++;

      if (bitIndex === 8) {
        if (currentByte === 0) {
            break; // Null terminator found
        }
        decodedChars.push(String.fromCharCode(currentByte));
        currentByte = 0;
        bitIndex = 0;
      }
    }

    return decodedChars.join('');
  }
}
```

*(Note: In a real run, `pngjs` must be installed. For Node, native Buffer manipulation or a lightweight dependency is required since there is no DOM `Canvas`)*

**Step 4: Run test to verify it passes**

Run: `npm install pngjs @types/pngjs && npm run test tests/core/steganography-service.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/steganography-service.ts tests/core/steganography-service.test.ts package.json package-lock.json
git commit -m "feat(core): implement LSB SteganographyService for zero-VRAM encoding"
```

---

### Task 2: Integrate Steganography with HybridRoutingController

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
describe('HybridRoutingController - Steganography', () => {
  it('handles a file extraction event by encoding an image and sending it to Foundry', async () => {
    // Mock SteganographyService, StoryEngine, and FoundryAdapter
    // Trigger handleFileExtraction({ targetActorId: 'netrunner1', context: 'Arasaka Subnet' })
    // Verify FoundryAdapter.sendPayload is called with a 'st3gg_drop' event containing the image path
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts
import { SteganographyService } from './steganography-service.js';
import * as path from 'path';

// ... inside class ...
private steganographyService = new SteganographyService();

public async handleFileExtraction(payload: { targetActorId: string, context: string }): Promise<void> {
    // 1. Generate Contextual Secret (Node B GPU)
    const prompt = `Generate a short (1 sentence) secret password or clue found in a file related to: ${payload.context}`;
    const secret = await this.storyEngine.generateFlavorText(prompt); // Mocked LLM call

    // 2. Select Template & Encode (Node B CPU)
    // Assume we have a folder `data/assets/st3gg_templates/`
    const templatePath = path.join(process.cwd(), 'data/assets/st3gg_templates/corrupted_file_01.png');
    const outputPath = path.join(process.cwd(), `data/assets/st3gg_drops/encoded_${Date.now()}.png`);
    
    await this.steganographyService.encodeSecret(templatePath, outputPath, secret);

    // 3. Send Drop to Foundry
    const publicUrl = outputPath.replace(process.cwd(), ''); // Make relative for Foundry
    await this.foundry.sendPayload({
        type: 'st3gg_drop',
        payload: {
            actorId: payload.targetActorId,
            imageUrl: publicUrl,
            message: "A corrupted data file was extracted."
        }
    });
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts
git commit -m "feat(core): route file extraction events through SteganographyService"
```

---

### Task 3: Handle Decryption RPC from Foundry

**Files:**
- Modify: `src/core/hybrid-routing-controller.ts`

**Step 1: Write the failing test**

```typescript
// tests/core/hybrid-routing-controller.test.ts
describe('HybridRoutingController - Decryption', () => {
  it('decodes an image path and returns the secret', async () => {
    // Trigger handleDecryptRequest({ imagePath: 'path/to/encoded.png' })
    // Verify it returns the secret string
  });
});
```

**Step 2: Run test to verify it fails**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: FAIL

**Step 3: Write minimal implementation**

```typescript
// src/core/hybrid-routing-controller.ts

public async handleDecryptRequest(payload: { imagePath: string }): Promise<{ secret: string }> {
    // Convert Foundry's relative URL back to an absolute local path on Node B
    const absolutePath = path.join(process.cwd(), payload.imagePath);
    
    try {
        const secret = await this.steganographyService.decodeSecret(absolutePath);
        return { secret };
    } catch (err) {
        console.error("Decryption failed:", err);
        return { secret: "ERROR: Data corruption. Decryption failed." };
    }
}
```

**Step 4: Run test to verify it passes**

Run: `npm run test tests/core/hybrid-routing-controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add src/core/hybrid-routing-controller.ts
git commit -m "feat(core): add handleDecryptRequest RPC endpoint"
```

---

### Task 4: Create the Foundry Decryption Macro

**Files:**
- Create: `foundry-module/scripts/macros/decrypt-st3gg.js`

**Step 1: Implement Macro Logic**

```javascript
// foundry-module/scripts/macros/decrypt-st3gg.js
/**
 * Macro: Run Decryption Daemon
 * Usage: Select a journal entry or chat message containing an ST3GG image, 
 * or provide the URL via a dialog prompt.
 */

async function runDecryption() {
    // Simplest implementation: Prompt the user for the image URL they want to decrypt
    new Dialog({
        title: "Decryption Daemon v1.0",
        content: `
            <p>Enter the URL of the corrupted file to decrypt:</p>
            <input type="text" id="st3gg-url" name="st3gg-url" />
        `,
        buttons: {
            decrypt: {
                icon: '<i class="fas fa-unlock"></i>',
                label: "Decrypt",
                callback: async (html) => {
                    const imageUrl = html.find("#st3gg-url").val();
                    if (!imageUrl) return;

                    // Send RPC to Node B Bridge
                    const response = await window.ASP_BRIDGE.sendRequest('decrypt_st3gg', { imagePath: imageUrl });
                    
                    // Whisper result to the player
                    ChatMessage.create({
                        user: game.user.id,
                        whisper: [game.user.id],
                        content: `<strong>Decryption Result:</strong><br/>${response.secret}`,
                        flavor: "Decryption Daemon"
                    });
                }
            }
        },
        default: "decrypt"
    }).render(true);
}

runDecryption();
```

**Step 2: Commit**

```bash
git add foundry-module/scripts/macros/decrypt-st3gg.js
git commit -m "feat(foundry): add client macro for ST3GG decryption"
```