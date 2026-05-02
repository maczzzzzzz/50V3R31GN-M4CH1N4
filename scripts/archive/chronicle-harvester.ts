import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import 'dotenv/config';
import { UnifiedOracleClient } from '../packages/hermes-core/src/db/unified-oracle-client.js';
import { AkashikVisualAuditor } from '../packages/hermes-core/src/core/akashik-visual-auditor.js';
import { MemoryPalaceService } from '../packages/hermes-core/src/core/memory-palace-service.js';
import { SovereignInferenceClient } from '../packages/hermes-core/src/core/sovereign-inference-client.js';

const require = createRequire(import.meta.url);
const pdf = require('pdf-parse');

const CATEGORIES = [
  '#Lore', '#Gear', '#Combat', '#Netrunning', '#Character', 
  '#World', '#Mission', '#Rules', '#Economy', '#DLC'
];

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
  private llm: SovereignInferenceClient;

  constructor(oracle: UnifiedOracleClient) {
    this.oracle = oracle;
    this.auditor = new AkashikVisualAuditor(oracle);
    this.palace = new MemoryPalaceService(oracle);
    this.llm = new SovereignInferenceClient({
      baseUrl: process.env.SOVEREIGN_INFERENCE_URL || 'http://172.26.208.1:8080/v1',
      model: process.env.NARRATIVE_MODEL || 'mistral-nemo:latest',
      timeoutMs: 30000,
    });
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

  /**
   * Categorizes a chunk based on heuristics or LLM second pass.
   */
  async categorizeChunk(file: string, chunk: string): Promise<string> {
    const content = chunk.toLowerCase();
    const fileName = file.toLowerCase();
    
    // 1. Heuristics (Fast Path)
    
    // #Gear & #Economy
    if (content.includes('price') || content.includes('eurobuck') || content.includes('eb') || content.includes('market') || content.includes('cost')) {
      return '#Economy';
    }
    if (content.includes('weapon') || content.includes('armor') || content.includes('gear') || content.includes('item') || content.includes('ammo')) {
      return '#Gear';
    }

    // #Combat & #Rules
    if (content.includes('damage') || content.includes('initiative') || content.includes('hit point') || content.includes('wound') || content.includes('death save')) {
      return '#Combat';
    }
    if (content.includes('check') || content.includes('difficulty value') || content.includes('dv') || content.includes('modifier') || content.includes('roll')) {
      return '#Rules';
    }

    // #Netrunning
    if (content.includes('cyberdeck') || content.includes('program') || content.includes('netrun') || content.includes('black ice') || content.includes('interface')) {
      return '#Netrunning';
    }

    // #Character
    if (content.includes('skill') || content.includes('stat') || content.includes('role') || content.includes('lifepath') || content.includes('humanity')) {
      return '#Character';
    }

    // #Mission & #Lore
    if (content.includes('street story') || content.includes('screamsheet') || content.includes('mission') || content.includes('hook') || content.includes('encounter')) {
      return '#Mission';
    }
    if (content.includes('history') || content.includes('night city') || content.includes('corporation') || content.includes('faction') || content.includes('background')) {
      return '#Lore';
    }

    // File-based fallbacks
    if (fileName.includes('blackchrome')) return '#Gear';
    if (fileName.includes('tales-of-the-red')) return '#Mission';
    if (fileName.includes('noplacelikehome')) return '#Housing';

    // 2. LLM Second Pass (Deep Path) - Only if heuristics fail or are generic
    try {
      const prompt = `Categorize this Cyberpunk RED rulebook excerpt into exactly one of these tags: ${CATEGORIES.join(', ')}. 
      Respond ONLY with the tag.
      
      Excerpt: ${chunk.substring(0, 500)}`;
      
      const tag = await this.llm.generateNarrative(prompt, '', 'You are a classification engine.');
      const matched = CATEGORIES.find(c => tag.includes(c));
      return matched || '#Technical';
    } catch {
      return '#Technical';
    }
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
      embeddingBaseUrl: process.env.SOVEREIGN_INFERENCE_URL || 'http://172.26.208.1:8080/v1',
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
            // Apply refined categorization
            const category = await this.categorizeChunk(file, chunk);

            // Graft to chronicle_seeds (Legacy random access)
            this.oracle.execute(
              `INSERT INTO chronicle_seeds (id, title, content, source, category, era_grounding, status) VALUES (?, ?, ?, ?, ?, ?, 'approved')`,
              [hashId, title, chunk, 'LOCAL_PDF', category, '2045']
            );
            
            // Graft to Memory Palace Drawer (Semantic lookup)
            await this.palace.mineExchange(`Source: ${file} (Category: ${category})`, chunk);
            
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

  /**
   * Re-categorizes existing records in the database.
   */
  async reScan() {
    console.log('[ChronicleHarvester] Starting re-scan of existing seeds...');
    const seeds = this.oracle.query<{ id: string, title: string, content: string, source: string }>("SELECT id, title, content, source FROM chronicle_seeds WHERE category = '#Technical' OR category = 'LOCAL_PDF'");
    
    console.log(`[ChronicleHarvester] Found ${seeds.length} seeds to refine`);
    
    for (const seed of seeds) {
      const category = await this.categorizeChunk(seed.title, seed.content);
      if (category !== '#Technical') {
        this.oracle.execute('UPDATE chronicle_seeds SET category = ? WHERE id = ?', [category, seed.id]);
        console.log(`[ChronicleHarvester] Updated [${seed.title}] -> ${category}`);
      }
    }
    console.log('[ChronicleHarvester] Re-scan complete.');
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

    if (process.argv.includes('--rescan')) {
      await harvester.reScan();
    } else {
      await harvester.runHarvest();
    }

    await oracle.disconnect();
    console.log('[ChronicleHarvester] Cycle complete.');
  };

  run().catch(err => {
    console.error('[ChronicleHarvester] FATAL ERROR:', err);
    process.exit(1);
  });
}
