# Phase 1: Data & RAG (nitro-db) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full data ingestion pipeline (PDF + JSON + TXT → embeddings → pgvector) and the `nitro-db` MCP server exposing vector similarity search with namespace isolation.

**Architecture:** Node B parses all seed data, computes 768-dimension embeddings via Ollama `nomic-embed-text`, and inserts chunks into Node A's PostgreSQL/pgvector. The `nitro-db` MCP server on Node B provides 3 query tools for downstream consumers. Direct `pg` connection — no ORM, no HTTP wrapper.

**Tech Stack:** Node.js 24, TypeScript ~5.8, pg ^8.x, pdf-parse ^1.x, @modelcontextprotocol/sdk ^1.x, Zod ^3.24, Vitest ^3.x

**Spec:** `docs/superpowers/specs/2026-03-28-phase1-data-rag-design.md`

---

## File Map

### Configuration (Task 1)
- Modify: `package.json`
- Create: `.env.example`

### Artery of Truth (Tasks 2-3)
- Create: `src/db/client.ts`
- Create: `src/db/migrate.ts`
- Modify: `src/db/index.ts`

### Ingestion Pipeline (Tasks 4-8)
- Create: `src/db/ingest/chunker.ts`
- Create: `src/db/ingest/embedder.ts`
- Create: `src/db/ingest/pdf-parser.ts`
- Create: `src/db/ingest/json-serializer.ts`
- Create: `src/db/ingest/index.ts`

### MCP Server (Tasks 9-10)
- Create: `src/mcp/nitro-db/server.ts`
- Create: `src/mcp/nitro-db/handlers.ts`
- Create: `src/mcp/nitro-db/index.ts`
- Modify: `src/mcp/index.ts`

### Tests (interleaved with implementation via TDD)
- Create: `tests/db/chunker.test.ts`
- Create: `tests/db/json-serializer.test.ts`
- Create: `tests/db/embedder.test.ts`
- Create: `tests/mcp/nitro-db.test.ts`

### Final (Task 11)
- Modify: `CHANGELOG.md`
- Modify: `README.md`

---

## Task 1: Dependencies + Environment Config

**Files:**
- Modify: `package.json`
- Create: `.env.example`

- [ ] **Step 1: Install production dependencies**

Run: `npm install pg pdf-parse`
Expected: Both packages added to `dependencies` in `package.json`.

- [ ] **Step 2: Install dev dependencies**

Run: `npm install -D @types/pg`
Expected: Package added to `devDependencies` in `package.json`.

- [ ] **Step 3: Add scripts to `package.json`**

Add these to the `"scripts"` section:

```json
"migrate": "tsx src/db/migrate.ts",
"ingest": "tsx src/db/ingest/index.ts",
"test:integration": "vitest run --testPathPattern=integration"
```

- [ ] **Step 4: Create `.env.example`**

```env
# Node A PostgreSQL (Phase 1)
PGHOST=192.168.0.50
PGPORT=5432
PGUSER=asp_gm
PGPASSWORD=changeme
PGDATABASE=asp_gm_agent

# Node B Ollama (Phase 0+)
NODE_B_LOCAL=http://localhost:11434/v1
MODEL_B_NAME=mistral-nemo:12b-instruct-v1-q8_0

# Ollama Embedding (Phase 1)
SOVEREIGN_INFERENCE_URL=http://localhost:11434
OLLAMA_EMBED_MODEL=nomic-embed-text
```

- [ ] **Step 5: Verify `.env.example` is NOT in `.gitignore` (it should be committed), but `.env` IS**

Run: `grep -q "^\.env$" .gitignore && echo "OK: .env is ignored" || echo "MISSING: add .env to .gitignore"`

If missing, add `.env` to `.gitignore`.

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json .env.example .gitignore
git commit -m "chore: add pg, pdf-parse dependencies and env config for Phase 1"
```

---

## Task 2: Artery of Truth Client (TDD)

**Files:**
- Create: `src/db/client.ts`
- Modify: `src/db/index.ts`

- [ ] **Step 1: Write `src/db/client.ts`**

```typescript
import pg from 'pg';

const { Pool } = pg;

export class Artery of TruthClient {
  private pool: pg.Pool;

  constructor(connectionConfig?: pg.PoolConfig) {
    this.pool = new Pool(connectionConfig ?? {
      host: process.env['PGHOST'] ?? '192.168.0.50',
      port: Number(process.env['PGPORT'] ?? 5432),
      user: process.env['PGUSER'] ?? 'asp_gm',
      password: process.env['PGPASSWORD'] ?? '',
      database: process.env['PGDATABASE'] ?? 'asp_gm_agent',
      max: 10,
    });
  }

  async query<T extends pg.QueryResultRow = pg.QueryResultRow>(
    text: string,
    params?: unknown[],
  ): Promise<pg.QueryResult<T>> {
    return this.pool.query<T>(text, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
```

- [ ] **Step 2: Update `src/db/index.ts` barrel**

```typescript
export { Artery of TruthClient } from './client.js';
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 4: Commit**

```bash
git add src/db/client.ts src/db/index.ts
git commit -m "feat: add PostgreSQL client wrapper for Node A connection"
```

---

## Task 3: Migration Script

**Files:**
- Create: `src/db/migrate.ts`

- [ ] **Step 1: Write `src/db/migrate.ts`**

```typescript
import { Artery of TruthClient } from './client.js';

const MIGRATION_SQL = `
CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS chunks;

CREATE TABLE chunks (
  id              SERIAL PRIMARY KEY,
  namespace       TEXT NOT NULL,
  source_file     TEXT NOT NULL,
  source_type     TEXT NOT NULL,
  section_heading TEXT NOT NULL,
  page_start      INTEGER,
  page_end        INTEGER,
  content         TEXT NOT NULL,
  chunk_index     INTEGER NOT NULL DEFAULT 0,
  token_estimate  INTEGER NOT NULL DEFAULT 0,
  embedding       vector(768) NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chunks_namespace ON chunks (namespace);

CREATE INDEX idx_chunks_embedding ON chunks
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
`;

async function main(): Promise<void> {
  const db = new Artery of TruthClient();
  try {
    console.log('[migrate] Connecting to Node A PostgreSQL...');
    await db.query(MIGRATION_SQL);
    console.log('[migrate] Schema created successfully.');

    const result = await db.query<{ count: string }>(
      "SELECT count(*) FROM information_schema.tables WHERE table_name = 'chunks'",
    );
    const count = result.rows[0]?.count;
    if (count === '1') {
      console.log('[migrate] Verified: chunks table exists.');
    } else {
      throw new Error('Migration verification failed: chunks table not found.');
    }
  } catch (err) {
    console.error('[migrate] FATAL:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/migrate.ts
git commit -m "feat: add database migration script for pgvector chunks table"
```

Note: Actually running `npm run migrate` requires Node A's PostgreSQL to be accessible. This will be tested during integration.

---

## Task 4: Chunker (TDD)

**Files:**
- Create: `src/db/ingest/chunker.ts`
- Create: `tests/db/chunker.test.ts`

- [ ] **Step 1: Write the failing chunker test**

`tests/db/chunker.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { chunkText } from '../../src/db/ingest/chunker.js';

describe('chunkText', () => {
  it('returns a single chunk for short text', () => {
    const result = chunkText('Hello world', 'Test Section', 500);
    expect(result).toHaveLength(1);
    expect(result[0]!.content).toBe('Hello world');
    expect(result[0]!.sectionHeading).toBe('Test Section');
    expect(result[0]!.chunkIndex).toBe(0);
  });

  it('splits long text into multiple chunks near target size', () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const longText = words.join(' ');
    const result = chunkText(longText, 'Long Section', 500);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.tokenEstimate).toBeLessThanOrEqual(600);
    }
  });

  it('applies overlap between consecutive chunks', () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const longText = words.join(' ');
    const result = chunkText(longText, 'Overlap Section', 500, 50);
    expect(result.length).toBeGreaterThan(1);
    const firstEnd = result[0]!.content;
    const secondStart = result[1]!.content;
    const firstWords = firstEnd.split(' ');
    const secondWords = secondStart.split(' ');
    const lastWordsOfFirst = firstWords.slice(-10);
    const firstWordsOfSecond = secondWords.slice(0, 10);
    const overlap = lastWordsOfFirst.filter((w) => firstWordsOfSecond.includes(w));
    expect(overlap.length).toBeGreaterThan(0);
  });

  it('assigns sequential chunk indices', () => {
    const words = Array.from({ length: 600 }, (_, i) => `word${i}`);
    const longText = words.join(' ');
    const result = chunkText(longText, 'Index Section', 500);
    for (let i = 0; i < result.length; i++) {
      expect(result[i]!.chunkIndex).toBe(i);
    }
  });

  it('estimates tokens as content.length / 4', () => {
    const text = 'This is a test string for token estimation';
    const result = chunkText(text, 'Token Section', 500);
    expect(result[0]!.tokenEstimate).toBe(Math.ceil(text.length / 4));
  });

  it('returns empty array for empty string', () => {
    const result = chunkText('', 'Empty Section', 500);
    expect(result).toHaveLength(0);
  });

  it('returns empty array for whitespace-only string', () => {
    const result = chunkText('   \n\n  ', 'Whitespace Section', 500);
    expect(result).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/chunker.test.ts`
Expected: FAIL — module `chunker.js` does not exist.

- [ ] **Step 3: Write `src/db/ingest/chunker.ts`**

```typescript
export interface ChunkOutput {
  content: string;
  sectionHeading: string;
  chunkIndex: number;
  tokenEstimate: number;
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function chunkText(
  text: string,
  sectionHeading: string,
  targetTokens: number = 500,
  overlapTokens: number = 50,
): ChunkOutput[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }

  const targetChars = targetTokens * 4;
  const overlapChars = overlapTokens * 4;

  if (trimmed.length <= targetChars) {
    return [
      {
        content: trimmed,
        sectionHeading,
        chunkIndex: 0,
        tokenEstimate: estimateTokens(trimmed),
      },
    ];
  }

  const chunks: ChunkOutput[] = [];
  let start = 0;
  let chunkIndex = 0;

  while (start < trimmed.length) {
    let end = start + targetChars;

    if (end >= trimmed.length) {
      end = trimmed.length;
    } else {
      const sentenceBreak = trimmed.lastIndexOf('. ', end);
      const newlineBreak = trimmed.lastIndexOf('\n', end);
      const bestBreak = Math.max(sentenceBreak, newlineBreak);

      if (bestBreak > start + targetChars * 0.5) {
        end = bestBreak + 1;
      } else {
        const spaceBreak = trimmed.lastIndexOf(' ', end);
        if (spaceBreak > start) {
          end = spaceBreak;
        }
      }
    }

    const content = trimmed.slice(start, end).trim();
    if (content.length > 0) {
      chunks.push({
        content,
        sectionHeading,
        chunkIndex,
        tokenEstimate: estimateTokens(content),
      });
      chunkIndex++;
    }

    const nextStart = end - overlapChars;
    start = nextStart > start ? nextStart : end;
  }

  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/chunker.test.ts`
Expected: 7 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/ingest/chunker.ts tests/db/chunker.test.ts
git commit -m "feat: add text chunker with overlap and token estimation"
```

---

## Task 5: Embedder

**Files:**
- Create: `src/db/ingest/embedder.ts`
- Create: `tests/db/embedder.test.ts`

- [ ] **Step 1: Write `src/db/ingest/embedder.ts`**

```typescript
export interface EmbeddingResult {
  text: string;
  embedding: number[];
}

export class Embedder {
  private baseUrl: string;
  private model: string;
  private batchSize: number;

  constructor(
    baseUrl: string = process.env['SOVEREIGN_INFERENCE_URL'] ?? 'http://localhost:11434',
    model: string = process.env['OLLAMA_EMBED_MODEL'] ?? 'nomic-embed-text',
    batchSize: number = 50,
  ) {
    this.baseUrl = baseUrl;
    this.model = model;
    this.batchSize = batchSize;
  }

  async embedSingle(text: string): Promise<number[]> {
    const response = await fetch(`${this.baseUrl}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: this.model, input: text }),
    });

    if (!response.ok) {
      throw new Error(
        `[embedder] Ollama embed failed (${response.status}): ${await response.text()}`,
      );
    }

    const data = (await response.json()) as { embeddings: number[][] };
    const embedding = data.embeddings[0];
    if (!embedding) {
      throw new Error('[embedder] No embedding returned from Ollama');
    }
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<EmbeddingResult[]> {
    const results: EmbeddingResult[] = [];

    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);

      const response = await fetch(`${this.baseUrl}/api/embed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: this.model, input: batch }),
      });

      if (!response.ok) {
        throw new Error(
          `[embedder] Ollama embed batch failed (${response.status}): ${await response.text()}`,
        );
      }

      const data = (await response.json()) as { embeddings: number[][] };

      for (let j = 0; j < batch.length; j++) {
        const embedding = data.embeddings[j];
        if (!embedding) {
          throw new Error(`[embedder] Missing embedding at batch index ${j}`);
        }
        results.push({ text: batch[j]!, embedding });
      }
    }

    return results;
  }
}
```

- [ ] **Step 2: Write the embedder unit test (mocked fetch)**

`tests/db/embedder.test.ts`:
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Embedder } from '../../src/db/ingest/embedder.js';

describe('Embedder', () => {
  const mockFetch = vi.fn();
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = mockFetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.restoreAllMocks();
  });

  it('embedSingle returns a 768-dimension vector', async () => {
    const fakeEmbedding = Array.from({ length: 768 }, () => Math.random());
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embeddings: [fakeEmbedding] }),
    });

    const embedder = new Embedder('http://localhost:11434', 'nomic-embed-text');
    const result = await embedder.embedSingle('test text');

    expect(result).toHaveLength(768);
    expect(mockFetch).toHaveBeenCalledOnce();
    const callBody = JSON.parse(mockFetch.mock.calls[0]![1]!.body as string);
    expect(callBody.model).toBe('nomic-embed-text');
    expect(callBody.input).toBe('test text');
  });

  it('embedBatch processes texts in batches of batchSize', async () => {
    const fakeEmbedding = Array.from({ length: 768 }, () => Math.random());
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ embeddings: [fakeEmbedding, fakeEmbedding, fakeEmbedding] }),
    });

    const embedder = new Embedder('http://localhost:11434', 'nomic-embed-text', 3);
    const texts = ['a', 'b', 'c', 'd', 'e'];
    const results = await embedder.embedBatch(texts);

    expect(results).toHaveLength(5);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('embedSingle throws on non-OK response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const embedder = new Embedder('http://localhost:11434', 'nomic-embed-text');
    await expect(embedder.embedSingle('test')).rejects.toThrow('Ollama embed failed (500)');
  });

  it('embedBatch returns text paired with embedding', async () => {
    const fakeEmbedding = Array.from({ length: 768 }, () => 0.5);
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ embeddings: [fakeEmbedding] }),
    });

    const embedder = new Embedder('http://localhost:11434', 'nomic-embed-text', 50);
    const results = await embedder.embedBatch(['hello']);

    expect(results[0]!.text).toBe('hello');
    expect(results[0]!.embedding).toHaveLength(768);
  });
});
```

- [ ] **Step 3: Run tests**

Run: `npx vitest run tests/db/embedder.test.ts`
Expected: 4 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add src/db/ingest/embedder.ts tests/db/embedder.test.ts
git commit -m "feat: add Ollama embedding client with batch support"
```

---

## Task 6: PDF Parser

**Files:**
- Create: `src/db/ingest/pdf-parser.ts`

- [ ] **Step 1: Write `src/db/ingest/pdf-parser.ts`**

```typescript
import { readFileSync } from 'node:fs';
import pdfParse from 'pdf-parse';
import { chunkText, type ChunkOutput } from './chunker.js';

export interface PdfPage {
  pageNumber: number;
  text: string;
}

export interface PdfChunkResult {
  sourceFile: string;
  chunks: (ChunkOutput & { pageStart: number; pageEnd: number })[];
  totalPages: number;
  coveredPages: Set<number>;
}

const HEADING_PATTERN = /^[A-Z][A-Z\s&:'\-—]{4,}$/m;

function detectSectionHeading(text: string, fallback: string): string {
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  for (const line of lines.slice(0, 5)) {
    if (HEADING_PATTERN.test(line) && line.length < 80) {
      return line;
    }
  }
  return fallback;
}

export async function parsePdf(
  filePath: string,
  namespace: string,
): Promise<PdfChunkResult> {
  const fileName = filePath.split('/').pop() ?? filePath;
  const buffer = readFileSync(filePath);

  let allPages: PdfPage[] = [];

  const pageTexts: string[] = [];
  await pdfParse(buffer, {
    pagerender: (pageData: { getTextContent: () => Promise<{ items: { str: string }[] }> }) => {
      return pageData.getTextContent().then((textContent) => {
        const text = textContent.items.map((item) => item.str).join(' ');
        pageTexts.push(text);
        return text;
      });
    },
  });

  allPages = pageTexts.map((text, index) => ({
    pageNumber: index + 1,
    text: text.trim(),
  }));

  const coveredPages = new Set<number>();
  const allChunks: (ChunkOutput & { pageStart: number; pageEnd: number })[] = [];

  let currentSection = fileName;
  let currentText = '';
  let sectionStartPage = 1;

  for (const page of allPages) {
    if (page.text.length === 0) {
      coveredPages.add(page.pageNumber);
      continue;
    }

    coveredPages.add(page.pageNumber);

    const heading = detectSectionHeading(page.text, '');
    if (heading && currentText.length > 0) {
      const chunks = chunkText(currentText, currentSection, 500, 50);
      for (const chunk of chunks) {
        allChunks.push({
          ...chunk,
          pageStart: sectionStartPage,
          pageEnd: page.pageNumber - 1,
        });
      }
      currentText = page.text;
      currentSection = heading;
      sectionStartPage = page.pageNumber;
    } else {
      currentText += '\n\n' + page.text;
    }
  }

  if (currentText.trim().length > 0) {
    const chunks = chunkText(currentText, currentSection, 500, 50);
    for (const chunk of chunks) {
      allChunks.push({
        ...chunk,
        pageStart: sectionStartPage,
        pageEnd: allPages.length,
      });
    }
  }

  return {
    sourceFile: fileName,
    chunks: allChunks,
    totalPages: allPages.length,
    coveredPages,
  };
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/ingest/pdf-parser.ts
git commit -m "feat: add PDF parser with section detection and chunking"
```

Note: PDF parsing is tested via integration (the full ingest pipeline against real PDFs). Unit testing `pdf-parse` output would require mocking the entire PDF library, which provides no value.

---

## Task 7: JSON Serializer (TDD)

**Files:**
- Create: `src/db/ingest/json-serializer.ts`
- Create: `tests/db/json-serializer.test.ts`

- [ ] **Step 1: Write the failing JSON serializer test**

`tests/db/json-serializer.test.ts`:
```typescript
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import {
  serializeActor,
  serializeItem,
  serializeJournal,
  serializeRollTable,
  serializeScene,
} from '../../src/db/ingest/json-serializer.js';

describe('serializeActor', () => {
  it('produces readable text from a real actor JSON', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/entities_mooks/night city gang corp mook pack - mooks/- edgerunner npcs -/fvtt-Actor-ariandel,-fleet-footed-AnbbyHGpme70qLSA.json',
        'utf-8',
      ),
    );
    const result = serializeActor(raw);
    expect(result).toContain('Ariandel, Fleet-Footed');
    expect(result).toContain('mook');
    expect(result.length).toBeGreaterThan(50);
  });
});

describe('serializeItem', () => {
  it('produces readable text from a real gear item', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Items/fvtt-Item-afterlife-eagle_personal-background-point-ueTVClKghjJ4vxzN.json',
        'utf-8',
      ),
    );
    const result = serializeItem(raw);
    expect(result).toContain('Afterlife Eagle');
    expect(result).toContain('gear');
    expect(result.length).toBeGreaterThan(20);
  });
});

describe('serializeJournal', () => {
  it('produces readable text from a real journal with HTML pages', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Journals/Services Of The Afterlife/fvtt-JournalEntry-01.-entrance-fee-sanctuary-and-reputation-yt2ffG5B0uqTKi1z.json',
        'utf-8',
      ),
    );
    const result = serializeJournal(raw);
    expect(result).toContain('Entrance Fee');
    expect(result).not.toContain('<p>');
    expect(result).not.toContain('</p>');
    expect(result.length).toBeGreaterThan(100);
  });
});

describe('serializeRollTable', () => {
  it('produces readable text from a real roll table', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Roll Tables/ttta - bounty tables/fvtt-RollTable-ttta-bounties,-1-employers-KirLdfCtBGJiHb8S.json',
        'utf-8',
      ),
    );
    const result = serializeRollTable(raw);
    expect(result).toContain('TttA Bounties');
    expect(result).toContain('1d6');
    expect(result).toContain('Afterlife');
    expect(result.length).toBeGreaterThan(50);
  });
});

describe('serializeScene', () => {
  it('produces readable text from a real scene', () => {
    const raw = JSON.parse(
      readFileSync(
        'docs/raw_data/campaign_ttta/Maps/Part 1 - Grand Opening/fvtt-Scene-6th-street-shootout-XcdL7EiMCNgtQHHt.json',
        'utf-8',
      ),
    );
    const result = serializeScene(raw);
    expect(result).toContain('6th');
    expect(result).toContain('wall');
    expect(result.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/db/json-serializer.test.ts`
Expected: FAIL — module `json-serializer.js` does not exist.

- [ ] **Step 3: Write `src/db/ingest/json-serializer.ts`**

```typescript
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

export function serializeActor(actor: Record<string, unknown>): string {
  const name = actor['name'] as string;
  const type = actor['type'] as string;
  const system = actor['system'] as Record<string, unknown> | undefined;

  const lines: string[] = [`Name: ${name}`, `Type: ${type}`];

  if (system) {
    const info = system['information'] as Record<string, string> | undefined;
    if (info) {
      if (info['alias']) lines.push(`Alias: ${info['alias']}`);
      if (info['description']) lines.push(`Description: ${stripHtml(info['description'])}`);
    }

    const stats = system['stats'] as Record<string, { value: number }> | undefined;
    if (stats) {
      const statLine = Object.entries(stats)
        .map(([key, val]) => `${key.toUpperCase()}: ${val.value}`)
        .join(', ');
      lines.push(`Stats: ${statLine}`);
    }

    const derived = system['derivedStats'] as Record<string, unknown> | undefined;
    if (derived) {
      const hp = derived['hp'] as { value: number; max: number } | undefined;
      if (hp) lines.push(`HP: ${hp.value}/${hp.max}`);
    }

    const roleInfo = system['roleInfo'] as Record<string, string> | undefined;
    if (roleInfo?.['activeRole']) {
      lines.push(`Role: ${roleInfo['activeRole']}`);
    }
  }

  const items = actor['items'] as Record<string, unknown>[] | undefined;
  if (items && items.length > 0) {
    const skills = items
      .filter((i) => i['type'] === 'skill')
      .map((i) => {
        const s = i['system'] as Record<string, unknown> | undefined;
        const level = s?.['level'] as number | undefined;
        return `${i['name']}${level ? ` (${level})` : ''}`;
      });
    if (skills.length > 0) {
      lines.push(`Skills: ${skills.join(', ')}`);
    }

    const gear = items
      .filter((i) => i['type'] !== 'skill')
      .map((i) => `${i['name']} [${i['type']}]`);
    if (gear.length > 0) {
      lines.push(`Gear: ${gear.join(', ')}`);
    }
  }

  return lines.join('\n');
}

export function serializeItem(item: Record<string, unknown>): string {
  const name = item['name'] as string;
  const type = item['type'] as string;
  const system = item['system'] as Record<string, unknown> | undefined;

  const lines: string[] = [`Name: ${name}`, `Type: ${type}`];

  if (system) {
    const desc = system['description'] as { value: string } | undefined;
    if (desc?.value) lines.push(`Description: ${stripHtml(desc.value)}`);

    const price = system['price'] as { market: number } | undefined;
    if (price) lines.push(`Price: ${price.market}eb`);
  }

  return lines.join('\n');
}

export function serializeJournal(journal: Record<string, unknown>): string {
  const name = journal['name'] as string;
  const pages = journal['pages'] as Record<string, unknown>[] | undefined;

  const lines: string[] = [`Journal: ${name}`];

  if (pages) {
    for (const page of pages) {
      const pageName = page['name'] as string;
      lines.push(`\n## ${pageName}`);
      const text = page['text'] as { content: string } | undefined;
      if (text?.content) {
        lines.push(stripHtml(text.content));
      }
    }
  }

  return lines.join('\n');
}

export function serializeRollTable(table: Record<string, unknown>): string {
  const name = table['name'] as string;
  const formula = table['formula'] as string;
  const description = table['description'] as string | undefined;
  const results = table['results'] as Record<string, unknown>[] | undefined;

  const lines: string[] = [`Roll Table: ${name}`, `Formula: ${formula}`];

  if (description) lines.push(`Description: ${stripHtml(description)}`);

  if (results) {
    lines.push('Results:');
    for (const result of results) {
      const range = result['range'] as [number, number];
      const text = result['text'] as string;
      if (range[0] === range[1]) {
        lines.push(`  ${range[0]}: ${text}`);
      } else {
        lines.push(`  ${range[0]}-${range[1]}: ${text}`);
      }
    }
  }

  return lines.join('\n');
}

export function serializeScene(scene: Record<string, unknown>): string {
  const name = scene['name'] as string;
  const walls = scene['walls'] as unknown[] | undefined;
  const lights = scene['lights'] as unknown[] | undefined;
  const tokens = scene['tokens'] as Record<string, unknown>[] | undefined;

  const lines: string[] = [`Scene: ${name}`];

  if (walls) lines.push(`Walls: ${walls.length} wall segments`);
  if (lights) lines.push(`Lights: ${lights.length} light sources`);

  if (tokens && tokens.length > 0) {
    const tokenNames = tokens.map((t) => t['name'] as string).filter(Boolean);
    if (tokenNames.length > 0) {
      lines.push(`Tokens: ${tokenNames.join(', ')}`);
    }
  }

  return lines.join('\n');
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/db/json-serializer.test.ts`
Expected: 5 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/db/ingest/json-serializer.ts tests/db/json-serializer.test.ts
git commit -m "feat: add JSON serializers for all Foundry VTT document types"
```

---

## Task 8: Ingestion Orchestrator

**Files:**
- Create: `src/db/ingest/index.ts`

- [ ] **Step 1: Write `src/db/ingest/index.ts`**

```typescript
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname, basename } from 'node:path';
import { Artery of TruthClient } from '../client.js';
import { Embedder } from './embedder.js';
import { parsePdf } from './pdf-parser.js';
import { chunkText } from './chunker.js';
import {
  serializeActor,
  serializeItem,
  serializeJournal,
  serializeRollTable,
  serializeScene,
} from './json-serializer.js';

interface IngestChunk {
  namespace: string;
  sourceFile: string;
  sourceType: string;
  sectionHeading: string;
  pageStart: number | null;
  pageEnd: number | null;
  content: string;
  chunkIndex: number;
  tokenEstimate: number;
}

function walkDir(dir: string, ext: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);
    if (stat.isDirectory()) {
      results.push(...walkDir(fullPath, ext));
    } else if (extname(entry).toLowerCase() === ext) {
      results.push(fullPath);
    }
  }
  return results;
}

async function ingestPdfs(baseDir: string): Promise<IngestChunk[]> {
  const pdfDir = join(baseDir, 'core_rules');
  const pdfFiles = walkDir(pdfDir, '.pdf');
  const chunks: IngestChunk[] = [];

  console.log(`[ingest] Found ${pdfFiles.length} PDFs in core_rules/`);

  for (const pdfPath of pdfFiles) {
    console.log(`[ingest] Parsing: ${basename(pdfPath)}...`);
    const result = await parsePdf(pdfPath, 'core_rules');
    console.log(
      `[ingest]   → ${result.chunks.length} chunks, ${result.coveredPages.size}/${result.totalPages} pages covered`,
    );

    for (const chunk of result.chunks) {
      chunks.push({
        namespace: 'core_rules',
        sourceFile: result.sourceFile,
        sourceType: 'pdf',
        sectionHeading: chunk.sectionHeading,
        pageStart: chunk.pageStart,
        pageEnd: chunk.pageEnd,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        tokenEstimate: chunk.tokenEstimate,
      });
    }
  }

  return chunks;
}

function ingestJsonDir(
  dir: string,
  namespace: string,
  sourceType: string,
  serializer: (data: Record<string, unknown>) => string,
): IngestChunk[] {
  const jsonFiles = walkDir(dir, '.json');
  const chunks: IngestChunk[] = [];

  for (const filePath of jsonFiles) {
    try {
      const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
      const text = serializer(raw);
      if (text.trim().length === 0) continue;

      const textChunks = chunkText(text, (raw['name'] as string) ?? basename(filePath), 500, 50);
      for (const chunk of textChunks) {
        chunks.push({
          namespace,
          sourceFile: basename(filePath),
          sourceType,
          sectionHeading: chunk.sectionHeading,
          pageStart: null,
          pageEnd: null,
          content: chunk.content,
          chunkIndex: chunk.chunkIndex,
          tokenEstimate: chunk.tokenEstimate,
        });
      }
    } catch (err) {
      console.warn(`[ingest] Warning: failed to process ${filePath}:`, err);
    }
  }

  return chunks;
}

function ingestTextFiles(dir: string, namespace: string): IngestChunk[] {
  const txtFiles = walkDir(dir, '.txt');
  const chunks: IngestChunk[] = [];

  for (const filePath of txtFiles) {
    const text = readFileSync(filePath, 'utf-8').trim();
    if (text.length === 0) continue;

    const heading = basename(filePath, '.txt');
    const textChunks = chunkText(text, heading, 500, 50);
    for (const chunk of textChunks) {
      chunks.push({
        namespace,
        sourceFile: basename(filePath),
        sourceType: 'text',
        sectionHeading: chunk.sectionHeading,
        pageStart: null,
        pageEnd: null,
        content: chunk.content,
        chunkIndex: chunk.chunkIndex,
        tokenEstimate: chunk.tokenEstimate,
      });
    }
  }

  return chunks;
}

async function embedAndInsert(
  chunks: IngestChunk[],
  embedder: Embedder,
  db: Artery of TruthClient,
  namespace: string,
): Promise<void> {
  const nsChunks = chunks.filter((c) => c.namespace === namespace);
  if (nsChunks.length === 0) return;

  console.log(`[ingest] Truncating namespace: ${namespace}`);
  await db.query('DELETE FROM chunks WHERE namespace = $1', [namespace]);

  console.log(`[ingest] Embedding ${nsChunks.length} chunks for namespace: ${namespace}`);
  const texts = nsChunks.map((c) => c.content);
  const embedResults = await embedder.embedBatch(texts);

  console.log(`[ingest] Inserting ${nsChunks.length} chunks into database...`);
  for (let i = 0; i < nsChunks.length; i++) {
    const chunk = nsChunks[i]!;
    const embedding = embedResults[i]!.embedding;
    const vectorStr = `[${embedding.join(',')}]`;

    await db.query(
      `INSERT INTO chunks (namespace, source_file, source_type, section_heading, page_start, page_end, content, chunk_index, token_estimate, embedding)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        chunk.namespace,
        chunk.sourceFile,
        chunk.sourceType,
        chunk.sectionHeading,
        chunk.pageStart,
        chunk.pageEnd,
        chunk.content,
        chunk.chunkIndex,
        chunk.tokenEstimate,
        vectorStr,
      ],
    );

    if ((i + 1) % 50 === 0 || i === nsChunks.length - 1) {
      console.log(`[ingest]   [${namespace}] Inserted ${i + 1}/${nsChunks.length} chunks`);
    }
  }
}

async function main(): Promise<void> {
  const baseDir = 'docs/raw_data';
  const db = new Artery of TruthClient();
  const embedder = new Embedder();

  try {
    console.log('[ingest] === Stage 1: PDF Ingestion ===');
    const pdfChunks = await ingestPdfs(baseDir);
    console.log(`[ingest] Total PDF chunks: ${pdfChunks.length}`);

    console.log('\n[ingest] === Stage 2: JSON/TXT Document Ingestion ===');
    const campaignDir = join(baseDir, 'campaign_ttta');
    const mooksDir = join(baseDir, 'entities_mooks');

    const journalChunks = ingestJsonDir(
      join(campaignDir, 'Journals'),
      'campaign_ttta',
      'journal',
      serializeJournal,
    );
    console.log(`[ingest] Journal chunks: ${journalChunks.length}`);

    const itemChunks = ingestJsonDir(
      join(campaignDir, 'Items'),
      'campaign_ttta',
      'item',
      serializeItem,
    );
    console.log(`[ingest] Item chunks: ${itemChunks.length}`);

    const sceneChunks = ingestJsonDir(
      campaignDir,
      'campaign_ttta',
      'scene',
      serializeScene,
    ).filter((c) => c.sourceType === 'scene');
    const sceneJsonFiles = walkDir(join(campaignDir, 'Maps'), '.json');
    const sceneChunksFromMaps: IngestChunk[] = [];
    for (const filePath of sceneJsonFiles) {
      try {
        const raw = JSON.parse(readFileSync(filePath, 'utf-8')) as Record<string, unknown>;
        const text = serializeScene(raw);
        if (text.trim().length === 0) continue;
        const chunks = chunkText(text, (raw['name'] as string) ?? basename(filePath), 500, 50);
        for (const chunk of chunks) {
          sceneChunksFromMaps.push({
            namespace: 'campaign_ttta',
            sourceFile: basename(filePath),
            sourceType: 'scene',
            sectionHeading: chunk.sectionHeading,
            pageStart: null,
            pageEnd: null,
            content: chunk.content,
            chunkIndex: chunk.chunkIndex,
            tokenEstimate: chunk.tokenEstimate,
          });
        }
      } catch (err) {
        console.warn(`[ingest] Warning: failed to process scene ${filePath}:`, err);
      }
    }
    console.log(`[ingest] Scene chunks: ${sceneChunksFromMaps.length}`);

    const rollTableChunks = ingestJsonDir(
      join(campaignDir, 'Roll Tables'),
      'campaign_ttta',
      'roll_table',
      serializeRollTable,
    );
    console.log(`[ingest] Roll table chunks: ${rollTableChunks.length}`);

    const textChunks = ingestTextFiles(campaignDir, 'campaign_ttta');
    console.log(`[ingest] Text file chunks: ${textChunks.length}`);

    const actorChunks = ingestJsonDir(mooksDir, 'entities_mooks', 'actor', serializeActor);
    console.log(`[ingest] Actor/mook chunks: ${actorChunks.length}`);

    const allChunks = [
      ...pdfChunks,
      ...journalChunks,
      ...itemChunks,
      ...sceneChunksFromMaps,
      ...rollTableChunks,
      ...textChunks,
      ...actorChunks,
    ];
    console.log(`\n[ingest] Total chunks to embed: ${allChunks.length}`);

    console.log('\n[ingest] === Stage 3: Embedding + Insert ===');
    await embedAndInsert(allChunks, embedder, db, 'core_rules');
    await embedAndInsert(allChunks, embedder, db, 'campaign_ttta');
    await embedAndInsert(allChunks, embedder, db, 'entities_mooks');

    const result = await db.query<{ count: string }>('SELECT count(*) FROM chunks');
    console.log(`\n[ingest] Done. Total rows in database: ${result.rows[0]?.count}`);
  } catch (err) {
    console.error('[ingest] FATAL:', err);
    process.exit(1);
  } finally {
    await db.close();
  }
}

main();
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Commit**

```bash
git add src/db/ingest/index.ts
git commit -m "feat: add ingestion orchestrator (PDF + JSON + TXT pipeline)"
```

---

## Task 9: nitro-db MCP Server

**Files:**
- Create: `src/mcp/nitro-db/handlers.ts`
- Create: `src/mcp/nitro-db/server.ts`
- Create: `src/mcp/nitro-db/index.ts`
- Modify: `src/mcp/index.ts`

- [ ] **Step 1: Write `src/mcp/nitro-db/handlers.ts`**

```typescript
import { z } from 'zod';
import { Artery of TruthClient } from '../../db/client.js';
import { Embedder } from '../../db/ingest/embedder.js';
import { NamespaceEnum, RagMatchSchema, RagQueryResultSchema } from '../../shared/schemas/index.js';

interface ChunkRow {
  id: number;
  namespace: string;
  source_file: string;
  source_type: string;
  section_heading: string;
  page_start: number | null;
  page_end: number | null;
  content: string;
  chunk_index: number;
  token_estimate: number;
  score: number;
}

function rowToMatch(row: ChunkRow): z.infer<typeof RagMatchSchema> {
  return RagMatchSchema.parse({
    content: row.content,
    namespace: row.namespace,
    sourceFile: row.source_file,
    sectionHeading: row.section_heading,
    score: parseFloat(String(row.score)),
    pageStart: row.page_start ?? 0,
    pageEnd: row.page_end ?? 0,
  });
}

export async function handleQueryLore(
  params: { query: string; namespace: string; limit?: number; threshold?: number },
  db: Artery of TruthClient,
  embedder: Embedder,
): Promise<z.infer<typeof RagQueryResultSchema>> {
  const limit = params.limit ?? 5;
  const threshold = params.threshold ?? 0.7;

  const queryEmbedding = await embedder.embedSingle(params.query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  const result = await db.query<ChunkRow>(
    `SELECT *, 1 - (embedding <=> $1::vector) AS score
     FROM chunks
     WHERE namespace = $2
       AND 1 - (embedding <=> $1::vector) >= $3
     ORDER BY embedding <=> $1::vector
     LIMIT $4`,
    [vectorStr, params.namespace, threshold, limit],
  );

  const matches = result.rows.map(rowToMatch);
  return RagQueryResultSchema.parse({ matches, query: params.query });
}

export async function handleQueryMultiNamespace(
  params: { query: string; namespaces: string[]; limit?: number },
  db: Artery of TruthClient,
  embedder: Embedder,
): Promise<z.infer<typeof RagQueryResultSchema>> {
  const limit = params.limit ?? 5;

  const queryEmbedding = await embedder.embedSingle(params.query);
  const vectorStr = `[${queryEmbedding.join(',')}]`;

  const placeholders = params.namespaces.map((_, i) => `$${i + 3}`).join(', ');
  const result = await db.query<ChunkRow>(
    `SELECT *, 1 - (embedding <=> $1::vector) AS score
     FROM chunks
     WHERE namespace IN (${placeholders})
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorStr, limit, ...params.namespaces],
  );

  const matches = result.rows.map(rowToMatch);
  return RagQueryResultSchema.parse({ matches, query: params.query });
}

export async function handleGetChunkById(
  params: { id: number },
  db: Artery of TruthClient,
): Promise<z.infer<typeof RagMatchSchema> | null> {
  const result = await db.query<ChunkRow & { score: number }>(
    `SELECT *, 1.0 AS score FROM chunks WHERE id = $1`,
    [params.id],
  );

  const row = result.rows[0];
  if (!row) return null;
  return rowToMatch(row);
}
```

- [ ] **Step 2: Write `src/mcp/nitro-db/server.ts`**

```typescript
import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Artery of TruthClient } from '../../db/client.js';
import { Embedder } from '../../db/ingest/embedder.js';
import {
  handleQueryLore,
  handleQueryMultiNamespace,
  handleGetChunkById,
} from './handlers.js';

export function createNitroDbServer(
  db: Artery of TruthClient,
  embedder: Embedder,
): McpServer {
  const server = new McpServer({
    name: 'nitro-db',
    version: '1.0.0',
  });

  server.registerTool(
    'query_lore',
    {
      description:
        'Search the vector database for lore, rules, or entity data by semantic similarity within a single namespace.',
      inputSchema: {
        query: z.string().describe('Natural language search query'),
        namespace: z
          .enum(['core_rules', 'campaign_ttta', 'entities_mooks'])
          .describe('Namespace to search within'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Max results (default 5)'),
        threshold: z
          .number()
          .min(0)
          .max(1)
          .optional()
          .describe('Minimum cosine similarity score (default 0.7)'),
      },
    },
    async ({ query, namespace, limit, threshold }) => {
      const result = await handleQueryLore(
        { query, namespace, limit, threshold },
        db,
        embedder,
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'query_multi_namespace',
    {
      description:
        'Search the vector database across multiple namespaces simultaneously.',
      inputSchema: {
        query: z.string().describe('Natural language search query'),
        namespaces: z
          .array(z.enum(['core_rules', 'campaign_ttta', 'entities_mooks']))
          .min(1)
          .describe('Namespaces to search within'),
        limit: z
          .number()
          .int()
          .min(1)
          .max(20)
          .optional()
          .describe('Max results (default 5)'),
      },
    },
    async ({ query, namespaces, limit }) => {
      const result = await handleQueryMultiNamespace(
        { query, namespaces, limit },
        db,
        embedder,
      );
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  server.registerTool(
    'get_chunk_by_id',
    {
      description: 'Retrieve a specific chunk by its database ID for full context.',
      inputSchema: {
        id: z.number().int().positive().describe('Chunk database ID'),
      },
    },
    async ({ id }) => {
      const result = await handleGetChunkById({ id }, db);
      if (!result) {
        return {
          content: [{ type: 'text' as const, text: `No chunk found with id ${id}` }],
          isError: true,
        };
      }
      return {
        content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }],
      };
    },
  );

  return server;
}
```

- [ ] **Step 3: Write `src/mcp/nitro-db/index.ts`**

```typescript
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { Artery of TruthClient } from '../../db/client.js';
import { Embedder } from '../../db/ingest/embedder.js';
import { createNitroDbServer } from './server.js';

async function main(): Promise<void> {
  const db = new Artery of TruthClient();
  const embedder = new Embedder();
  const server = createNitroDbServer(db, embedder);

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('[nitro-db] FATAL:', err);
  process.exit(1);
});
```

- [ ] **Step 4: Update `src/mcp/index.ts` barrel**

```typescript
export { createNitroDbServer } from './nitro-db/server.js';
```

- [ ] **Step 5: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 6: Commit**

```bash
git add src/mcp/nitro-db/handlers.ts src/mcp/nitro-db/server.ts src/mcp/nitro-db/index.ts src/mcp/index.ts
git commit -m "feat: add nitro-db MCP server with query_lore, query_multi_namespace, get_chunk_by_id"
```

---

## Task 10: Integration Tests

**Files:**
- Create: `tests/mcp/nitro-db.test.ts`

These tests require both Ollama and PostgreSQL running. They are tagged for `test:integration`.

- [ ] **Step 1: Write `tests/mcp/nitro-db.integration.test.ts`**

Note: File name includes `integration` so it is matched by `--testPathPattern=integration`.

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Artery of TruthClient } from '../../src/db/client.js';
import { Embedder } from '../../src/db/ingest/embedder.js';
import {
  handleQueryLore,
  handleQueryMultiNamespace,
  handleGetChunkById,
} from '../../src/mcp/nitro-db/handlers.js';

describe('nitro-db integration', () => {
  let db: Artery of TruthClient;
  let embedder: Embedder;

  beforeAll(async () => {
    db = new Artery of TruthClient();
    embedder = new Embedder();

    await db.query(`
      CREATE EXTENSION IF NOT EXISTS vector;
      DROP TABLE IF EXISTS chunks;
      CREATE TABLE chunks (
        id              SERIAL PRIMARY KEY,
        namespace       TEXT NOT NULL,
        source_file     TEXT NOT NULL,
        source_type     TEXT NOT NULL,
        section_heading TEXT NOT NULL,
        page_start      INTEGER,
        page_end        INTEGER,
        content         TEXT NOT NULL,
        chunk_index     INTEGER NOT NULL DEFAULT 0,
        token_estimate  INTEGER NOT NULL DEFAULT 0,
        embedding       vector(768) NOT NULL,
        created_at      TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX idx_chunks_namespace ON chunks (namespace);
      CREATE INDEX idx_chunks_embedding ON chunks
        USING hnsw (embedding vector_cosine_ops)
        WITH (m = 16, ef_construction = 64);
    `);

    const testChunks = [
      { content: 'Friday Night Firefight combat rules for ranged attacks and cover mechanics', namespace: 'core_rules', sourceType: 'pdf', heading: 'Friday Night Firefight' },
      { content: 'The Afterlife bar serves as a hub for edgerunners seeking employment', namespace: 'campaign_ttta', sourceType: 'journal', heading: 'Afterlife Services' },
      { content: 'Ariandel Fleet-Footed is a dangerous edgerunner NPC with high REF and DEX stats', namespace: 'entities_mooks', sourceType: 'actor', heading: 'Ariandel' },
    ];

    for (const chunk of testChunks) {
      const [embResult] = await embedder.embedBatch([chunk.content]);
      const vectorStr = `[${embResult!.embedding.join(',')}]`;
      await db.query(
        `INSERT INTO chunks (namespace, source_file, source_type, section_heading, content, chunk_index, token_estimate, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [chunk.namespace, 'test.json', chunk.sourceType, chunk.heading, chunk.content, 0, Math.ceil(chunk.content.length / 4), vectorStr],
      );
    }
  });

  afterAll(async () => {
    await db.query('DROP TABLE IF EXISTS chunks');
    await db.close();
  });

  it('query_lore returns matches from the correct namespace', async () => {
    const result = await handleQueryLore(
      { query: 'combat rules ranged attacks', namespace: 'core_rules', limit: 5, threshold: 0.3 },
      db,
      embedder,
    );
    expect(result.matches.length).toBeGreaterThan(0);
    expect(result.matches[0]!.namespace).toBe('core_rules');
    expect(result.query).toBe('combat rules ranged attacks');
  });

  it('query_lore does not return results from other namespaces', async () => {
    const result = await handleQueryLore(
      { query: 'Afterlife bar edgerunners', namespace: 'core_rules', limit: 5, threshold: 0.5 },
      db,
      embedder,
    );
    for (const match of result.matches) {
      expect(match.namespace).toBe('core_rules');
    }
  });

  it('query_multi_namespace searches across namespaces', async () => {
    const result = await handleQueryMultiNamespace(
      { query: 'Afterlife edgerunner', namespaces: ['campaign_ttta', 'entities_mooks'], limit: 5 },
      db,
      embedder,
    );
    expect(result.matches.length).toBeGreaterThan(0);
    const namespaces = new Set(result.matches.map((m) => m.namespace));
    expect(
      namespaces.has('campaign_ttta') || namespaces.has('entities_mooks'),
    ).toBe(true);
  });

  it('get_chunk_by_id returns a specific chunk', async () => {
    const inserted = await db.query<{ id: number }>('SELECT id FROM chunks LIMIT 1');
    const id = inserted.rows[0]!.id;

    const result = await handleGetChunkById({ id }, db);
    expect(result).not.toBeNull();
    expect(result!.content.length).toBeGreaterThan(0);
  });

  it('get_chunk_by_id returns null for nonexistent id', async () => {
    const result = await handleGetChunkById({ id: 999999 }, db);
    expect(result).toBeNull();
  });

  it('all results pass RagQueryResultSchema validation', async () => {
    const result = await handleQueryLore(
      { query: 'test', namespace: 'core_rules', limit: 5, threshold: 0.1 },
      db,
      embedder,
    );
    expect(result.matches).toBeDefined();
    expect(result.query).toBe('test');
    for (const match of result.matches) {
      expect(typeof match.content).toBe('string');
      expect(typeof match.score).toBe('number');
      expect(typeof match.namespace).toBe('string');
    }
  });
});
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 3: Run unit tests only (should still pass)**

Run: `npx vitest run`
Expected: All 24 Phase 0 tests + 7 chunker tests + 4 embedder tests + 5 serializer tests PASS. Integration test file is skipped because it has no `integration` in path matching the default `tests/**/*.test.ts` pattern.

Wait — the integration test file IS matched by `tests/**/*.test.ts` because it's `tests/mcp/nitro-db.integration.test.ts`. We need to exclude it from the default run.

- [ ] **Step 4: Update `vitest.config.ts` to exclude integration tests from default run**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    exclude: ['tests/**/*.integration.test.ts'],
  },
});
```

- [ ] **Step 5: Run unit tests to verify exclusion works**

Run: `npx vitest run`
Expected: All unit tests pass, integration test is NOT included.

- [ ] **Step 6: Commit**

```bash
git add tests/mcp/nitro-db.integration.test.ts vitest.config.ts
git commit -m "feat: add nitro-db integration tests and exclude from default test run"
```

---

## Task 11: Final Validation + Version Bump

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step 1: Run full typecheck**

Run: `npx tsc --noEmit`
Expected: Zero errors.

- [ ] **Step 2: Run full unit test suite**

Run: `npx vitest run`
Expected: All unit tests pass (Phase 0: 24 + Phase 1: chunker 7 + embedder 4 + serializer 5 = **40 total**).

- [ ] **Step 3: Update `CHANGELOG.md`**

Add new entry above `[0.2.0]`:

```markdown
## [0.3.0] - 2026-03-28

### Added

- PostgreSQL client wrapper for Node A connection (`src/db/client.ts`)
- Artery of Truth migration script with pgvector chunks table and HNSW index
- Text chunker with configurable target size and overlap
- Ollama embedding client with batch support (nomic-embed-text, 768d)
- PDF parser with section heading detection
- JSON serializers for all Foundry VTT document types (actor, item, journal, roll table, scene)
- Ingestion orchestrator: PDF + JSON + TXT → embeddings → pgvector pipeline
- nitro-db MCP server with 3 tools: query_lore, query_multi_namespace, get_chunk_by_id
- Integration test suite for nitro-db (requires Ollama + PostgreSQL)
- Environment configuration template (.env.example)
```

- [ ] **Step 4: Update `README.md` version**

Change:
```markdown
**Version:** 3.8.28-GOLD
```
To:
```markdown
**Version:** 3.8.28-GOLD
```

- [ ] **Step 5: Update `package.json` version**

Change `"version": "0.1.0"` to `"version": "0.3.0"`.

Note: package.json was left at 0.1.0 in Phase 0 while README/CHANGELOG were bumped to 0.2.0. Sync all three to 0.3.0 now.

- [ ] **Step 6: Commit**

```bash
git add CHANGELOG.md README.md package.json
git commit -m "chore: bump to v3.8.28-GOLD — Phase 1 Data & RAG complete"
```

- [ ] **Step 7: Verify Phase 1 gate**

Run: `npx tsc --noEmit && npx vitest run`
Expected: Zero errors, 40 tests PASS.

Phase 1 is complete. Ready for Lead Architect (user) approval before proceeding to Phase 2.

---

## Summary

| Task | Description | Unit Tests |
|------|-------------|------------|
| 1 | Dependencies + environment config | - |
| 2 | Artery of Truth client | - |
| 3 | Migration script | - |
| 4 | Chunker (TDD) | 7 |
| 5 | Embedder (TDD) | 4 |
| 6 | PDF parser | - |
| 7 | JSON serializer (TDD) | 5 |
| 8 | Ingestion orchestrator | - |
| 9 | nitro-db MCP server | - |
| 10 | Integration tests + vitest config | 6 (integration) |
| 11 | Final validation + version bump | - |
| **Total** | **11 tasks** | **16 unit + 6 integration** |


---
**LINKS:** [[OS_CORE]]
