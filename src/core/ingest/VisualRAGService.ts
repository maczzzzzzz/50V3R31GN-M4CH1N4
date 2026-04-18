/**
 * src/core/ingest/VisualRAGService.ts
 * Phase 65: Visual RAG — ColPali embedding service for PDF page patches.
 *
 * Architecture:
 *   1. Reads PDF shards from data/ingest/pdf_shards/ (produced by docling-worker.py).
 *   2. Exports page images via poppler (pdfimages / pdftoppm) for visual patches.
 *   3. POSTs image patches to Node A ColPali HTTP endpoint.
 *   4. Stores embedding references in Akashik.db (visual_embeddings table).
 *
 * Node A ColPali endpoint:
 *   POST http://<NODE_A_HOST>:8082/embed_patch
 *   Body: { "page_id": "...", "image_b64": "..." }
 *   Response: { "embedding_id": "...", "vector_dim": 128, "stored": true }
 *
 * Truth Hierarchy (enforced by LoreHarmonizer):
 *   TIER 1 (Official Repo)  — canonical stats/DVs — DO NOT overwrite
 *   TIER 2 (PDF VLM)        — flavor text, lore, DLC rules — promote here
 *   TIER 3 (Community JSON) — homebrew — lowest priority
 */

import Database from 'better-sqlite3';
import fs from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const NODE_A_HOST = process.env['NODE_A_HOST'] ?? '192.168.0.51';
const COLPALI_PORT = process.env['COLPALI_PORT'] ?? '8082';
const COLPALI_ENDPOINT = `http://${NODE_A_HOST}:${COLPALI_PORT}/embed_patch`;

const PDF_SHARD_DIR = process.env['PDF_SHARD_DIR']
  ?? path.join(process.cwd(), 'data', 'ingest', 'pdf_shards');

// ---------------------------------------------------------------------------
// DB schema bootstrap (idempotent)
// ---------------------------------------------------------------------------

const CREATE_VISUAL_EMBEDDINGS = `
  CREATE TABLE IF NOT EXISTS visual_embeddings (
    id TEXT PRIMARY KEY,
    source_pdf TEXT NOT NULL,
    page_number INTEGER NOT NULL,
    embedding_id TEXT NOT NULL,
    vector_dim INTEGER NOT NULL,
    shard_heading TEXT,
    colpali_model TEXT DEFAULT 'colpali-v1.2',
    indexed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source_pdf, page_number)
  )
`;

// ---------------------------------------------------------------------------
// PDF shard manifest
// ---------------------------------------------------------------------------

interface PdfShard {
  shard_id: string;
  heading: string;
  content: string;
  word_count: number;
  page_hint: number | null;
}

interface ShardManifest {
  source: string;
  source_path: string;
  page_count: number;
  tier: string;
  shards: PdfShard[];
}

// ---------------------------------------------------------------------------
// VisualRAGService
// ---------------------------------------------------------------------------

export class VisualRAGService {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
    this.db.exec(CREATE_VISUAL_EMBEDDINGS);
  }

  /**
   * Index all PDF shards in the shard directory.
   * Skips pages already indexed (UNIQUE constraint on source_pdf + page_number).
   */
  async indexAll(shardDir: string = PDF_SHARD_DIR): Promise<{ indexed: number; skipped: number; errors: number }> {
    const entries = await fs.readdir(shardDir).catch(() => [] as string[]);
    const manifests = entries.filter(e => e.endsWith('.json'));

    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    for (const manifestFile of manifests) {
      const manifestPath = path.join(shardDir, manifestFile);
      try {
        const raw = await fs.readFile(manifestPath, 'utf-8');
        const manifest: ShardManifest = JSON.parse(raw);
        const result = await this.indexManifest(manifest);
        indexed += result.indexed;
        skipped += result.skipped;
        errors += result.errors;
      } catch (e) {
        console.error(`[VisualRAGService] Failed to process manifest ${manifestFile}: ${(e as Error).message}`);
        errors++;
      }
    }

    return { indexed, skipped, errors };
  }

  /**
   * Index a single PDF manifest: extract page images and send to ColPali.
   */
  async indexManifest(manifest: ShardManifest): Promise<{ indexed: number; skipped: number; errors: number }> {
    const { source, source_path, page_count } = manifest;
    let indexed = 0;
    let skipped = 0;
    let errors = 0;

    // Export pages as images (poppler pdftoppm)
    const tmpDir = path.join(process.cwd(), 'data', 'ingest', '.tmp_patches', source.replace('.pdf', ''));
    await fs.mkdir(tmpDir, { recursive: true });

    try {
      await execFileAsync('pdftoppm', [
        '-r', '150',          // 150 DPI — sufficient for ColPali patch extraction
        '-jpeg',
        source_path,
        path.join(tmpDir, 'page'),
      ]);
    } catch (e) {
      console.warn(`[VisualRAGService] pdftoppm failed for ${source}: ${(e as Error).message}`);
      // Non-fatal: proceed without page images (text-only indexing)
    }

    const pageCount = page_count || 1;

    for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
      // Check if already indexed
      const existing = this.db.prepare(
        'SELECT id FROM visual_embeddings WHERE source_pdf = ? AND page_number = ?'
      ).get(source, pageNum);

      if (existing) {
        skipped++;
        continue;
      }

      // Find matching shard heading for this page
      const shardForPage = manifest.shards.find(s => s.page_hint === pageNum);
      const heading = shardForPage?.heading ?? null;

      // Load page image if available
      const imagePath = path.join(tmpDir, `page-${String(pageNum).padStart(3, '0')}.jpg`);
      let imageB64: string | null = null;
      try {
        const buf = await fs.readFile(imagePath);
        imageB64 = buf.toString('base64');
      } catch {
        // No image for this page — send text patch only
      }

      try {
        const embedResult = await this.sendToColPali({
          page_id: `${source}::page_${pageNum}`,
          source_pdf: source,
          page_number: pageNum,
          image_b64: imageB64,
          text_hint: shardForPage?.content?.slice(0, 512) ?? null,
        });

        this.db.prepare(`
          INSERT OR IGNORE INTO visual_embeddings
            (id, source_pdf, page_number, embedding_id, vector_dim, shard_heading)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(randomUUID(), source, pageNum, embedResult.embedding_id, embedResult.vector_dim, heading);

        indexed++;
      } catch (e) {
        console.error(`[VisualRAGService] Embed failed ${source} p${pageNum}: ${(e as Error).message}`);
        errors++;
      }
    }

    // Cleanup tmp images
    await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

    return { indexed, skipped, errors };
  }

  /**
   * POST a page patch to the Node A ColPali HTTP endpoint.
   * Fails with error if Node A is unreachable (caller decides whether to fatal).
   */
  private async sendToColPali(params: {
    page_id: string;
    source_pdf: string;
    page_number: number;
    image_b64: string | null;
    text_hint: string | null;
  }): Promise<{ embedding_id: string; vector_dim: number }> {
    const res = await fetch(COLPALI_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
      signal: AbortSignal.timeout(30_000),
    });

    if (!res.ok) {
      throw new Error(`ColPali HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json() as { embedding_id: string; vector_dim: number };
    return data;
  }

  /**
   * MaxSim search — delegates to ZeroClaw Rust kernel via HTTP.
   * Returns top-K source_pdf references for a given query embedding.
   */
  async maxSimSearch(queryEmbedding: number[], topK: number = 5): Promise<Array<{ source_pdf: string; page_number: number; score: number }>> {
    const ZEROCLAW_HOST = process.env['ZEROCLAW_HOST'] ?? 'localhost';
    const ZEROCLAW_PORT = process.env['ZEROCLAW_PORT'] ?? '8080';

    const res = await fetch(`http://${ZEROCLAW_HOST}:${ZEROCLAW_PORT}/colpali/maxsim`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query_embedding: queryEmbedding, top_k: topK }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) throw new Error(`MaxSim search failed: HTTP ${res.status}`);
    return res.json() as Promise<Array<{ source_pdf: string; page_number: number; score: number }>>;
  }
}
