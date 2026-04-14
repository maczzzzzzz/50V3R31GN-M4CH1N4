/**
 * src/core/nano-banana-service.ts
 * 
 * Phase 54.3: Atlas Forge — Nano Banana (Gemini 2.5 Flash Image)
 * 
 * Official Implementation using the Google Generative AI SDK for 
 * high-fidelity battlemap generation from 1-bit skeletons.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

export interface GenerationOptions {
  skeletonPath: string;
  referenceImagePath?: string;
  stylePrompt?: string;
  outputPath?: string;
}

export class NanoBananaService {
  private readonly genAI: GoogleGenerativeAI;
  // Based on your AI Studio find, we'll use the 2.5 Flash Image model
  private readonly MODEL_NAME = 'gemini-3.1-flash-image-preview';

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.GOOGLE_API_KEY;
    if (!key) {
      throw new Error('[NanoBanana] Missing GOOGLE_API_KEY in environment.');
    }
    this.genAI = new GoogleGenerativeAI(key);
  }
  /**
   * Generates a high-fidelity WebP tile from a 1-bit skeleton.
   * Uses the skeleton as a structural constraint and a reference image for style.
   */
  async generateTile(options: GenerationOptions): Promise<string> {
    const { skeletonPath, referenceImagePath, stylePrompt, outputPath } = options;
    
    // SOVEREIGN MASTER DIRECTIVE:
    // Merges high-variety population with strict edge-to-edge architectural compliance.
    const finalPrompt = stylePrompt ?? 
      'ACT AS A MASTER CYBERPUNK BATTLEMAP ARTIST. ' +
      'IMAGE 1 IS THE MANDATORY BLUEPRINT (BLACK=WALLS, LIGHT GRAY GRID=FLOOR). ' +
      'IMAGE 2 IS THE STYLE REFERENCE. ' +
      'YOUR MISSION: GENERATE A HIGH-FIDELITY TOP-DOWN BATTLEMAP TILE. ' +
      '1. PERSPECTIVE (CRITICAL): STRICTLY 2D TOP-DOWN FLAT ORTHOGRAPHIC VIEW. Look directly down at the floor at a perfect 90-degree angle. DO NOT show the sides of walls. DO NOT show the sides or fronts of furniture or props. NO ISOMETRIC. NO 3D PERSPECTIVE. EVERYTHING MUST BE FLAT FROM ABOVE. ' +
      '2. ARCHITECTURE (CRITICAL): PAINT EDGE-TO-EDGE. Every black pixel in IMAGE 1 must become a deep, dark, ' +
      'textured architectural mass (concrete, rusted iron, or shadowed stone). ELIMINATE ALL WHITE BORDERS. ' +
      'The white gaps on the outer edges of IMAGE 1 are OPEN PATHWAYS. You MUST render these gaps as open doors, archways, or continuous hallways leading off the edge of the map. Do NOT seal them with walls. ' +
      '3. POPULATION (EXTREME DETAIL): FILL the interior floor space with rich variety: ' +
      'cluttered computer terminals, oily power cables, stacked industrial crates, tactical cover, ' +
      'scattered trash, and grimy metal floor plates that match the aesthetic of IMAGE 2. ' +
      '4. ATMOSPHERE: Match the lighting, color palette, and high-fidelity texture quality of IMAGE 2. ' +
      'USE THE GRID IN IMAGE 1 to guide the scale and placement of all furniture and props. ' +
      'The final result must be dark, atmospheric, densely detailed, and 100% structurally accurate.';

    const skeletonBuffer = await fs.readFile(skeletonPath);
    const skeletonBase64 = skeletonBuffer.toString('base64');

    const contents: any[] = [
      { text: finalPrompt },
      {
        // IMAGE 1: THE MASTER BLUEPRINT
        inlineData: {
          data: skeletonBase64,
          mimeType: 'image/png'
        }
      }
    ];

    if (referenceImagePath) {
      console.log(`[NanoBanana] Using aesthetic reference: ${path.basename(referenceImagePath)}`);
      const refBuffer = await fs.readFile(referenceImagePath);
      const refBase64 = refBuffer.toString('base64');
      const mimeType = referenceImagePath.endsWith('.webp') ? 'image/webp' : 'image/png';
      
      contents.push({
        // IMAGE 2: THE AESTHETIC PALETTE
        inlineData: {
          data: refBase64,
          mimeType
        }
      });
    }


    console.log(`[NanoBanana] Skinning skeleton: ${path.basename(skeletonPath)} via ${this.MODEL_NAME}...`);

    const model = this.genAI.getGenerativeModel({ 
      model: this.MODEL_NAME,
      generationConfig: {
        temperature: 0.2, // Locked-in style variance
      }
    });

    const maxRetries = 3;
    let attempt = 0;

    while (attempt <= maxRetries) {
      try {
        const result = await model.generateContent(contents);
        const response = await result.response;
        
        const outputDir = path.dirname(outputPath ?? './data/assets/tiles/generated.webp');
        await fs.mkdir(outputDir, { recursive: true });
        
        const finalOutputPath = outputPath ?? path.join(outputDir, `${path.basename(skeletonPath, '.png')}_skinned.webp`);
        
        let imageSaved = false;
        const parts = response.candidates?.[0]?.content?.parts ?? [];
        
        for (const part of parts) {
          if (part.inlineData) {
            const buffer = Buffer.from(part.inlineData.data, 'base64');
            await fs.writeFile(finalOutputPath, buffer);
            imageSaved = true;
            break;
          }
        }

        if (!imageSaved) {
          throw new Error('[NanoBanana] No image data found in the response.');
        }

        console.log(`[NanoBanana] Successfully generated and saved: ${finalOutputPath}`);
        return finalOutputPath;
      } catch (err: any) {
        attempt++;
        const isRetryable = err.status === 503 || err.message?.includes('Deadline expired') || err.message?.includes('high demand');
        
        if (isRetryable && attempt <= maxRetries) {
          const delay = Math.pow(2, attempt) * 2000;
          console.warn(`[NanoBanana] ${err.status || 'Error'}: ${err.message}. Retrying in ${delay}ms... (${attempt}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        console.error('[NanoBanana] Generation failed:', err);
        throw err;
      }
    }
    throw new Error('[NanoBanana] Max retries exceeded.');
  }
}
