import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import 'dotenv/config';
import { UnifiedOracleClient } from '../src/db/unified-oracle-client.js';
import { AkashikVisualAuditor } from '../src/core/akashik-visual-auditor.js';
import { MemoryPalaceService } from '../src/core/memory-palace-service.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

/**
 * Chronicle Harvester (Phase 33)
 * Ingests local PDF rulebooks, cleans text, chunks it, and grafts to Akashik.db.
 * Also triggers a visual audit pass via Pixtral-12B for tables and art.
 * Populates the M1ND P4L4C3 (Phase 34) for semantic retrieval.
 */
export class ChronicleHarvester {
  private oracle: UnifiedOracleClient;
  private auditor: AkashikVisualAuditor;
  private palace: MemoryPalaceService;

  constructor(oracle: UnifiedOracleClient) {
    this.oracle = oracle;
    this.auditor = new AkashikVisualAuditor(oracle);
    this.palace = new MemoryPalaceService(oracle);
  }

  /**
   * Cleans raw PDF text of weird formatting and line breaks.
   */
  cleanContent(content: string): string {
    let cleaned = content.replace(/\n/g, ' '); // Remove hard line breaks
    cleaned = cleaned.replace(/\s{2,}/g, ' '); // Collapse multiple spaces
    cleaned = cleaned.replace(/\[\d+\]/g, ''); // Strip stray citations
    return cleaned.trim();
  }

  /**
   * Splits a large block of text into manageable chunks of roughly `maxLength` characters,
   * trying to break on sentence boundaries.
   */
  chunkText(text: string, maxLength: number = 1000): string[] {
    const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      const trimmed = sentence.trim();
      if (!trimmed) continue;

      if ((currentChunk.length + trimmed.length) > maxLength && currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }
      currentChunk += trimmed + ' ';
    }
    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async runHarvest() {
    const rawDocsDir = 'docs/rulebooks_raw';
    if (!fs.existsSync(rawDocsDir)) {
      console.log(`[ChronicleHarvester] Directory ${rawDocsDir} not found.`);
      return;
    }

    // Initialize M1ND P4L4C3 Drawer
    await this.palace.initDrawer({
      chromaUrl: process.env.CHROMA_URL || 'http://localhost:8000',
      embeddingBaseUrl: process.env.OLLAMA_BASE_URL || 'http://172.26.208.1:8080/v1',
      embeddingModel: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
    });

    // Create a top-level Wing for all Rulebooks
    const rulebookWing = this.palace.upsertWing('RULEBOOKS', 'PLAYER', 'Official Cyberpunk RED Core and Supplement Library');

    const files = fs.readdirSync(rawDocsDir).filter(f => f.endsWith('.pdf'));
    if (files.length === 0) {
      console.log(`[ChronicleHarvester] No PDFs found in ${rawDocsDir}.`);
      return;
    }

    for (const file of files) {
      console.log(`\n[ChronicleHarvester] Processing: ${file}`);
      const filePath = path.join(rawDocsDir, file);
      const dataBuffer = fs.readFileSync(filePath);

      // Create a Room for this specific book
      const bookRoom = this.palace.upsertRoom(rulebookWing.id, file.replace('.pdf', ''), 'POI', `Content from ${file}`);
      this.palace.enterRoom(bookRoom.id);

      try {
        // 1. TEXT PASS
        const data = await pdf(dataBuffer);
        const cleanedText = this.cleanContent(data.text);
        const chunks = this.chunkText(cleanedText, 1200);

        console.log(`[ChronicleHarvester] Extracted ${chunks.length} text chunks`);

        let grafted = 0;
        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          if (!chunk || chunk.length < 50) continue;

          const title = `${file.replace('.pdf', '')} - Part ${i + 1}`;
          const hashId = crypto.createHash('sha256').update(file + title + chunk).digest('hex');

          // Check deduplication in chronicle_seeds
          const existing = this.oracle.query<{ id: string }>('SELECT id FROM chronicle_seeds WHERE id = ?', [hashId]);
          
          if (existing.length === 0) {
            // Graft to chronicle_seeds (Legacy random access)
            this.oracle.execute(
              `INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
              [hashId, title, chunk, 'LOCAL_PDF', '#Technical', '2045']
            );
            
            // Graft to Memory Palace Drawer (Semantic lookup)
            await this.palace.mineExchange(`Source: ${file}`, chunk);
            
            grafted++;
          }
        }
        console.log(`[ChronicleHarvester] Grafted ${grafted} seeds into the M1ND P4L4C3`);

        // 2. VISUAL PASS (Phase 33/35 Enhancement)
        console.log(`[ChronicleHarvester] Starting visual pass...`);
        const visualSeeds = await this.auditor.runPdfAudit(filePath);
        console.log(`[ChronicleHarvester] Grafted ${visualSeeds} visual seeds`);

      } catch (err) {
        console.error(`[ChronicleHarvester] Error processing ${file}:`, err);
      }
    }
  }
}

// CLI Execution Support
if (process.argv[1] && process.argv[1].endsWith('chronicle-harvester.ts')) {
  const run = async () => {
    // Force connection to the primary Akashik DB
    const worldDbPath = './data/Akashik.db';
    const crushDbPath = './data/crush.db';
    
    console.log(`[ChronicleHarvester] Connecting to core DB at: ${worldDbPath}`);

    const oracle = new UnifiedOracleClient({
      worldDbPath,
      crushDbPath,
    });
    
    try {
      await oracle.connect();
    } catch (err) {
      console.error(`[ChronicleHarvester] Connection failed: ${err}`);
      process.exit(1);
    }
    await oracle.initSchema(); // Idempotently applies Phase 33/34 tables
    const harvester = new ChronicleHarvester(oracle);
    await harvester.runHarvest();
    await oracle.disconnect();
    console.log('[ChronicleHarvester] Cycle complete.');
  };

  run().catch(err => {
    console.error('[ChronicleHarvester] FATAL ERROR:', err);
    process.exit(1);
  });
}
