/**
 * src/core/ingest/markdown-chunker.ts
 * Phase 57: Inline TypeScript port of chunknorris MarkdownChunker logic.
 *
 * Splits a Markdown string at H1-H3 header boundaries.
 * Every chunk is prefixed with its parent breadcrumb trail.
 */

import type { SemanticChunk } from './types.js';

const HEADER_RE = /^(#{1,3})\s+(.+)$/;

interface ChunkerOptions {
  maxChunkWords?: number;      // default 200 — soft cap before forced split
  minChunkWords?: number;      // default 15  — chunks below this are merged up
  maxHeaderDepth?: number;     // 1-3, default 3
}

export function chunkMarkdown(
  markdown: string,
  options: ChunkerOptions = {},
): SemanticChunk[] {
  const { maxChunkWords = 200, minChunkWords = 15, maxHeaderDepth = 3 } = options;

  const lines = markdown.split('\n');
  const breadcrumbs: string[] = [];   // stack indexed by heading level (0-based = H1)
  const chunks: SemanticChunk[] = [];

  let currentHeading = '';
  let bodyLines: string[] = [];

  function flush(): void {
    const body = bodyLines.join('\n').trim();
    if (!body) return;
    const wordCount = body.split(/\s+/).filter(Boolean).length;
    if (wordCount < minChunkWords) return;

    const breadcrumb = breadcrumbs.filter(Boolean).join(' > ');
    chunks.push({ breadcrumb, heading: currentHeading, content: body, wordCount });
  }

  function maybeSplit(chunk: SemanticChunk): SemanticChunk[] {
    if (chunk.wordCount <= maxChunkWords) return [chunk];

    // Hard-split on blank lines to equalize sub-chunks
    const paragraphs = chunk.content.split(/\n{2,}/);
    const sub: SemanticChunk[] = [];
    let acc: string[] = [];
    let accWords = 0;

    for (const para of paragraphs) {
      const words = para.split(/\s+/).filter(Boolean).length;
      if (accWords + words > maxChunkWords && acc.length > 0) {
        const content = acc.join('\n\n').trim();
        sub.push({
          breadcrumb: chunk.breadcrumb,
          heading: chunk.heading,
          content,
          wordCount: accWords,
        });
        acc = [];
        accWords = 0;
      }
      acc.push(para);
      accWords += words;
    }
    if (acc.length > 0) {
      sub.push({
        breadcrumb: chunk.breadcrumb,
        heading: chunk.heading,
        content: acc.join('\n\n').trim(),
        wordCount: accWords,
      });
    }
    return sub.filter(s => s.wordCount >= minChunkWords);
  }

  for (const line of lines) {
    const m = HEADER_RE.exec(line);
    if (m) {
      const level = m[1]!.length; // 1, 2, or 3
      const text = m[2]!.trim();

      if (level > maxHeaderDepth) {
        bodyLines.push(line);
        continue;
      }

      flush();
      bodyLines = [];

      // Update breadcrumb stack
      breadcrumbs[level - 1] = text;
      // Clear deeper levels
      for (let i = level; i < 3; i++) breadcrumbs[i] = '';

      currentHeading = text;
    } else {
      bodyLines.push(line);
    }
  }
  flush();

  // Apply hard-split pass
  return chunks.flatMap(maybeSplit);
}

/**
 * Prepend breadcrumb context to chunk content (Context Injection per spec).
 */
export function injectContext(chunk: SemanticChunk): string {
  if (!chunk.breadcrumb) return `# ${chunk.heading}\n\n${chunk.content}`;
  return `[${chunk.breadcrumb}]\n\n# ${chunk.heading}\n\n${chunk.content}`;
}
