/**
 * nitro-db MCP Server — The Knowledge Toolset
 *
 * Exposes namespace-isolated RAG query tools against Node A's pgvector database.
 * Runs as a stdio MCP server consumed by Crush CLI (Charmbracelet).
 *
 * Transport:  stdio (process.stdin / process.stdout)
 * Config:     .crush.json → mcp.nitro-db
 * Env vars:   NODE_A_HOST, NODE_A_PORT, NODE_A_DB, NODE_A_USER,
 *             NODE_A_PASSWORD, OLLAMA_BASE_URL, EMBEDDING_MODEL
 */

import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { NitroDbClient } from '../../db/nitro-db-client.js';
import { OllamaEmbeddingService } from '../../db/ollama-embedding-service.js';
import type { ILogger } from '../../db/interfaces.js';

// ── MCP-safe structured logger ────────────────────────────────────────────────
// Writes JSON to stderr so as not to contaminate the stdio MCP protocol stream.

const logger: ILogger = {
  debug(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'DEBUG', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  info(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'INFO', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  warn(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'WARN', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
  error(context, traceId, message, data) {
    process.stderr.write(
      JSON.stringify({ timestamp: new Date().toISOString(), severity: 'ERROR', context, traceId, message, ...(data ? { data } : {}) }) + '\n',
    );
  },
};

// ── Configuration ─────────────────────────────────────────────────────────────

const dbConfig = {
  host: process.env.NODE_A_HOST ?? '192.168.0.50',
  port: parseInt(process.env.NODE_A_PORT ?? '5432', 10),
  database: process.env.NODE_A_DB ?? 'nitro_db',
  user: process.env.NODE_A_USER ?? 'nitro_admin',
  password: process.env.NODE_A_PASSWORD ?? '',
  connectionTimeoutMs: 10_000,
  queryTimeoutMs: 30_000,
  maxPoolSize: 5,
};

const embeddingConfig = {
  baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434',
  model: process.env.EMBEDDING_MODEL ?? 'nomic-embed-text',
  timeoutMs: 30_000,
};

// ── Dependency setup ──────────────────────────────────────────────────────────

const embeddingService = new OllamaEmbeddingService(embeddingConfig, logger);
const dbClient = new NitroDbClient(dbConfig, logger, embeddingService);

// ── Markdown / ANSI result formatters ────────────────────────────────────────

/** ANSI escape helpers for Glamour/Crush rendering */
const ANSI = {
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

function scoreLabel(score: number): string {
  if (score >= 0.9) return ANSI.green(`✅ ${score.toFixed(3)}`);
  if (score >= 0.75) return ANSI.yellow(`⚡ ${score.toFixed(3)}`);
  return ANSI.dim(`🔍 ${score.toFixed(3)}`);
}

function formatRagResults(
  query: string,
  namespace: string,
  matches: Array<{
    content: string;
    sourceRef: string;
    sectionHeading: string;
    contextType: string;
    score: number;
    pageStart: number;
    pageEnd: number;
  }>,
): string {
  const header = [
    ANSI.bold(`## nitro-db · RAG Query`),
    ``,
    `**Query:** \`${query}\``,
    `**Namespace:** \`${namespace}\``,
    `**Matches:** ${matches.length}`,
    ``,
    `---`,
    ``,
  ].join('\n');

  if (matches.length === 0) {
    return header + ANSI.dim('_No matches found above the similarity threshold._');
  }

  const matchBlocks = matches.map((m, i) => {
    const pageInfo = m.pageStart > 0
      ? ` | **Pages:** ${m.pageStart}–${m.pageEnd}`
      : '';

    const excerpt = m.content.length > 600
      ? m.content.slice(0, 600).trimEnd() + '…'
      : m.content;

    return [
      `### Match ${i + 1} — Score: ${scoreLabel(m.score)}`,
      `${ANSI.cyan(`**Source:** \`${m.sourceRef}\``)} | **Type:** \`${m.contextType}\`${pageInfo}`,
      `**Section:** ${m.sectionHeading}`,
      ``,
      `> ${excerpt.replace(/\n/g, '\n> ')}`,
      ``,
      `---`,
      ``,
    ].join('\n');
  });

  return header + matchBlocks.join('\n');
}

// ── MCP Server ────────────────────────────────────────────────────────────────

const server = new McpServer({
  name: 'nitro-db',
  version: '0.7.1',
  }, {
// ── Tool: rag_query ───────────────────────────────────────────────────────────

server.tool(
  'rag_query',
  'Query Node A\'s pgvector knowledge base with namespace isolation. Returns ranked chunks from the specified namespace (core_rules, campaign_ttta, or entities_mooks) as styled Markdown.',
  {
    query: z.string().min(1).describe('Natural language query to search for'),
    namespace: z
      .enum(['core_rules', 'campaign_ttta', 'entities_mooks'])
      .describe('Namespace to search. core_rules=rulebook mechanics, campaign_ttta=campaign lore, entities_mooks=NPC stat blocks'),
    topK: z
      .number()
      .int()
      .min(1)
      .max(20)
      .default(5)
      .describe('Maximum number of results to return (1–20)'),
    similarityThreshold: z
      .number()
      .min(0)
      .max(1)
      .default(0.7)
      .describe('Minimum cosine similarity score (0.0–1.0). Higher = stricter relevance'),
  },
  async (args) => {
    const traceId = randomUUID();
    
    // Explicit manual validation because the SDK's server.tool might only use the schema for documentation
    const schema = z.object({
      query: z.string().min(1),
      namespace: z.enum(['core_rules', 'campaign_ttta', 'entities_mooks']),
      topK: z.number().int().min(1).max(20).default(5),
      similarityThreshold: z.number().min(0).max(1).default(0.7),
    });

    const parsed = schema.safeParse(args);
    if (!parsed.success) {
      const message = parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
      logger.error('nitro-db:rag_query', traceId, `Validation failed: ${message}`);
      return {
        content: [{
          type: 'text' as const,
          text: `\x1b[31m❌ nitro-db: Invalid arguments\x1b[0m\n\n**Error:** ${message}`,
        }],
        isError: true,
      };
    }

    const { query, namespace, topK, similarityThreshold } = parsed.data;

    logger.info('nitro-db:rag_query', traceId, `Tool called`, {
      namespace,
      topK,
      similarityThreshold,
      queryPreview: query.substring(0, 80),
    });

    // Ensure connected (lazy-connect on first call after startup failure)
    if (!dbClient.isConnected()) {
      try {
        logger.info('nitro-db:rag_query', traceId, 'Lazy-connecting to Node A');
        await dbClient.connect();
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        logger.error('nitro-db:rag_query', traceId, `Connection to Node A failed: ${message}`);
        return {
          content: [{
            type: 'text' as const,
            text: `\x1b[31m❌ nitro-db: Cannot reach Node A (${dbConfig.host}:${dbConfig.port})\x1b[0m\n\n**Error:** ${message}`,
          }],
          isError: true,
        };
      }
    }

    try {
      const result = await dbClient.ragSearch({ query, namespace, topK, similarityThreshold });

      const formatted = formatRagResults(
        query,
        namespace,
        result.matches.map(m => ({
          content: m.content,
          sourceRef: m.sourceRef,
          sectionHeading: m.sectionHeading,
          contextType: m.contextType,
          score: m.score,
          pageStart: m.pageStart,
          pageEnd: m.pageEnd,
        })),
      );

      logger.info('nitro-db:rag_query', traceId, `Returning ${result.matches.length} matches`, {
        namespace,
        matchCount: result.matches.length,
      });

      return {
        content: [{ type: 'text' as const, text: formatted }],
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      logger.error('nitro-db:rag_query', traceId, `rag_query failed: ${message}`, {
        stack: err instanceof Error ? err.stack : undefined,
      });
      return {
        content: [{
          type: 'text' as const,
          text: `\x1b[31m❌ nitro-db: RAG query failed\x1b[0m\n\n**Error:** ${message}`,
        }],
        isError: true,
      };
    }
  },
);

// ── Startup ───────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const traceId = randomUUID();
  logger.info('nitro-db', traceId, 'nitro-db MCP server starting', {
    nodeAHost: dbConfig.host,
    nodeAPort: dbConfig.port,
    ollamaBaseUrl: embeddingConfig.baseUrl,
  });

  // Eager connect — failures are non-fatal; rag_query will lazy-reconnect
  try {
    await dbClient.connect();
    logger.info('nitro-db', traceId, 'Connected to Node A successfully');
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('nitro-db', traceId, `Initial Node A connection failed — will retry on first tool call: ${message}`);
  }

  // Graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('nitro-db', traceId, 'SIGINT received — shutting down');
    if (dbClient.isConnected()) {
      await dbClient.disconnect().catch(() => { /* ignore */ });
    }
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('nitro-db', traceId, 'SIGTERM received — shutting down');
    if (dbClient.isConnected()) {
      await dbClient.disconnect().catch(() => { /* ignore */ });
    }
    process.exit(0);
  });

  const transport = new StdioServerTransport();
  await server.connect(transport);

  logger.info('nitro-db', traceId, 'nitro-db MCP server listening on stdio');
}

main().catch(err => {
  process.stderr.write(`[FATAL] nitro-db startup failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
