import fs from 'node:fs/promises';
import path from 'node:path';
import { PDFParse } from 'pdf-parse';
import type { IDocumentParser, RawChunk } from './interfaces.js';
import { ChunkTextSplitter, type ChunkTextSplitterOptions } from './chunk-text-splitter.js';
import { TARGET_CHUNK_CHARS, CHUNK_OVERLAP_CHARS } from './interfaces.js';
import type { Namespace } from '../../shared/types/index.js';

/**
 * PdfFileParser — ingests PDF rulebooks and source material.
 *
 * These files live under core_rules/ and contain the Cyberpunk RED rulebooks.
 * The full document text is extracted via pdf-parse and split into overlapping
 * chunks. The filename (without extension) is used as the section heading.
 */
export class PdfFileParser implements IDocumentParser {
  private readonly splitter: ChunkTextSplitter;

  constructor(splitterOptions: ChunkTextSplitterOptions = {
    targetChars: TARGET_CHUNK_CHARS,
    overlapChars: CHUNK_OVERLAP_CHARS,
  }) {
    this.splitter = new ChunkTextSplitter(splitterOptions);
  }

  canParse(filePath: string): boolean {
    return path.extname(filePath).toLowerCase() === '.pdf';
  }

  async parse(filePath: string, namespace: Namespace): Promise<RawChunk[]> {
    let buffer: Buffer;
    try {
      buffer = await fs.readFile(filePath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`PdfFileParser: failed to read file "${filePath}": ${msg}`);
    }

    const pdfParser = new PDFParse({ data: new Uint8Array(buffer) });
    const result = await pdfParser.getText();
    await pdfParser.destroy();

    const trimmed = result.text.trim();
    if (trimmed.length === 0) {
      return []; // Skip PDFs that produce no extractable text
    }

    const sectionHeading = path.basename(filePath, '.pdf');
    const relPath = this.toRelativePath(filePath);
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
