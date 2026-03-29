import fs from 'node:fs/promises';
import path from 'node:path';
import type { IDocumentParser, RawChunk } from './interfaces.js';
import { ChunkTextSplitter, type ChunkTextSplitterOptions } from './chunk-text-splitter.js';
import { TARGET_CHUNK_CHARS, CHUNK_OVERLAP_CHARS } from './interfaces.js';
import type { Namespace } from '../../shared/types/index.js';

/**
 * TxtFileParser — ingests plain-text scene descriptions and narrative prompts.
 *
 * These files live under campaign_ttta/Journals/ and contain GM-facing
 * narration scripts, environment descriptions, and faction primers.
 * The filename (without extension) is used as the section heading.
 */
export class TxtFileParser implements IDocumentParser {
  private readonly splitter: ChunkTextSplitter;

  constructor(splitterOptions: ChunkTextSplitterOptions = {
    targetChars: TARGET_CHUNK_CHARS,
    overlapChars: CHUNK_OVERLAP_CHARS,
  }) {
    this.splitter = new ChunkTextSplitter(splitterOptions);
  }

  canParse(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.txt';
  }

  async parse(filePath: string, namespace: Namespace): Promise<RawChunk[]> {
    let content: string;
    try {
      content = await fs.readFile(filePath, 'utf-8');
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`TxtFileParser: failed to read file "${filePath}": ${msg}`);
    }

    const trimmed = content.trim();
    if (trimmed.length === 0) {
      return []; // Skip empty files silently
    }

    const sectionHeading = path.basename(filePath, '.txt');
    const relPath = this.toRelativePath(filePath);

    // Inferred metadata
    const sourceRef = sectionHeading.replace(/\s+/g, '-').toUpperCase();
    const contextType = namespace === 'core_rules' ? 'mechanic' : 'lore';
    const capabilityReq = 'none';

    return this.splitter.split(trimmed, {
      sourceFile: relPath,
      sourceRef,
      namespace,
      contextType,
      capabilityReq,
      sectionHeading,
      pageStart: 0,
      pageEnd: 0,
    });
  }

  private toRelativePath(filePath: string): string {
    const marker = 'raw_data';
    const idx = filePath.replace(/\\/g, '/').lastIndexOf(marker);
    return idx === -1 ? path.basename(filePath) : filePath.slice(idx + marker.length + 1).replace(/\\/g, '/');
  }
}
