import type { IChunkTextSplitter, RawChunk } from './interfaces.js';
import type { Namespace } from '../../shared/types/index.js';

export interface ChunkTextSplitterOptions {
  readonly targetChars: number;
  readonly overlapChars: number;
}

/**
 * ChunkTextSplitter — splits long text into overlapping fixed-size chunks.
 *
 * Splits preferentially at paragraph boundaries (\n\n), then sentence
 * boundaries (. ! ?), then word boundaries. Falls back to hard character
 * split only for pathologically long tokens (e.g., base64 blobs or very
 * long words with no whitespace).
 *
 * Overlap guarantee: overlap is applied only when the trailing overlap +
 * next segment fits within targetChars. If it does not fit, the overlap
 * is discarded so forward progress is always guaranteed (no infinite loops).
 */
export class ChunkTextSplitter implements IChunkTextSplitter {
  private readonly targetChars: number;
  private readonly overlapChars: number;

  constructor(options: ChunkTextSplitterOptions) {
    this.targetChars = options.targetChars;
    this.overlapChars = options.overlapChars;
  }

  split(
    text: string,
    opts: {
      sourceFile: string;
      sourceRef: string;
      namespace: Namespace;
      contextType: 'mechanic' | 'lore';
      capabilityReq: string;
      sectionHeading: string;
      pageStart: number;
      pageEnd: number;
    }
  ): RawChunk[] {
    const trimmed = text.trim();
    if (trimmed.length === 0) {
      throw new Error('ChunkTextSplitter: text must not be empty');
    }

    if (trimmed.length <= this.targetChars) {
      return [{ ...opts, content: trimmed }];
    }

    const segments = this.splitIntoSegments(trimmed);
    const chunks: RawChunk[] = [];
    let current = '';

    for (let i = 0; i < segments.length; ) {
      const seg = segments[i]!;

      if ((current + seg).length <= this.targetChars) {
        // Segment fits in the current window — accumulate
        current += seg;
        i++;
      } else if (current.length > 0) {
        // Flush the current window
        chunks.push({ ...opts, content: current.trim() });

        const overlap = this.trailingOverlap(current);

        // Only carry the overlap forward if it leaves room for the next segment.
        // If overlap + seg would still overflow, discard the overlap so we
        // always make forward progress and never loop infinitely.
        current = (overlap + seg).length <= this.targetChars ? overlap : '';

        // Do NOT advance i — retry the same segment with the new current prefix.
      } else {
        // current is empty but seg alone exceeds targetChars — hard split it
        const hardChunks = this.hardSplit(seg);
        for (let h = 0; h < hardChunks.length - 1; h++) {
          chunks.push({ ...opts, content: hardChunks[h]! });
        }
        current = hardChunks.at(-1) ?? '';
        i++;
      }
    }

    if (current.trim().length > 0) {
      chunks.push({ ...opts, content: current.trim() });
    }

    return chunks;
  }

  /**
   * Splits text into semantic segments (paragraphs → sentences → words).
   */
  private splitIntoSegments(text: string): string[] {
    // Prefer paragraph splits
    const paras = text.split(/\n\n+/);
    if (paras.length > 1) {
      return paras.map((p, i) => (i < paras.length - 1 ? p + '\n\n' : p));
    }

    // Fall back to sentence splits
    const sentences = text.match(/[^.!?]+[.!?]+\s*/g);
    if (sentences && sentences.length > 1) {
      return sentences;
    }

    // Fall back to word splits
    return text.split(/(\s+)/).filter(Boolean);
  }

  /**
   * Returns the trailing `overlapChars` of a chunk, aligned to a word boundary.
   */
  private trailingOverlap(text: string): string {
    if (text.length <= this.overlapChars) return text;
    const tail = text.slice(-this.overlapChars);
    const wordBoundary = tail.indexOf(' ');
    return wordBoundary === -1 ? tail : tail.slice(wordBoundary + 1);
  }

  /**
   * Hard-splits a single over-length segment into targetChars pieces.
   * Used only when a segment has no usable word boundaries.
   */
  private hardSplit(text: string): string[] {
    const result: string[] = [];
    const step = Math.max(1, this.targetChars - this.overlapChars);
    let offset = 0;
    while (offset < text.length) {
      result.push(text.slice(offset, offset + this.targetChars));
      offset += step;
    }
    return result;
  }
}
