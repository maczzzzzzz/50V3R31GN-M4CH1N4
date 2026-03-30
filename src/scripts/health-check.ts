import { randomUUID } from 'node:crypto';
import { NitroDbClient } from '../db/nitro-db-client.js';
import { OllamaEmbeddingService } from '../db/ollama-embedding-service.js';
import type { ILogger } from '../db/interfaces.js';

/** Simple console logger for the health check script. */
const logger: ILogger = {
  debug: (ctx, tid, msg, data) => console.log(`[DEBUG] [${ctx}] [${tid}] ${msg}`, data || ''),
  info: (ctx, tid, msg, data) => console.log(`[INFO]  [${ctx}] [${tid}] ${msg}`, data || ''),
  warn: (ctx, tid, msg, data) => console.warn(`[WARN]  [${ctx}] [${tid}] ${msg}`, data || ''),
  error: (ctx, tid, msg, data) => console.error(`[ERROR] [${ctx}] [${tid}] ${msg}`, data || ''),
};

async function runHealthCheck() {
  const traceId = randomUUID();
  console.log('=== ASP.GM-Agent Node A Health Check ===');
  console.log(`Time: ${new Date().toISOString()}`);
  console.log(`Trace ID: ${traceId}`);
  console.log('------------------------------------------');

  // Node B -> Node A Configuration
  const config = {
    host: process.env.NODE_A_HOST || '192.168.0.50',
    port: parseInt(process.env.NODE_A_PORT || '5432', 10),
    database: process.env.NODE_A_DB || 'nitro_db',
    user: process.env.NODE_A_USER || 'nitro_admin',
    password: process.env.NODE_A_PASSWORD || '',
    connectionTimeoutMs: 5000,
    queryTimeoutMs: 10000,
    maxPoolSize: 5,
  };

  const embeddingConfig = {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: process.env.EMBEDDING_MODEL || 'nomic-embed-text',
    timeoutMs: 10000,
  };

  const embeddingService = new OllamaEmbeddingService(embeddingConfig, logger);
  const dbClient = new NitroDbClient(config, logger, embeddingService);

  try {
    console.log(`Connecting to Node A (${config.host}:${config.port})...`);
    await dbClient.connect();
    
    console.log('Executing health check query...');
    const result = await dbClient.healthCheck();
    
    console.log('------------------------------------------');
    console.log(`Connected: ${result.connected ? '✅ YES' : '❌ NO'}`);
    console.log(`Latency: ${result.latencyMs}ms`);
    console.log(`pgvector Installed: ${result.pgvectorInstalled ? '✅ YES' : '❌ NO'}`);
    console.log('------------------------------------------');

    if (result.connected && result.pgvectorInstalled) {
      console.log('RESULT: Health Check PASSED');
    } else {
      console.log('RESULT: Health Check FAILED');
      process.exitCode = 1;
    }

    await dbClient.disconnect();
  } catch (err) {
    console.error('CRITICAL FAILURE during health check:');
    console.error(err instanceof Error ? err.message : String(err));
    process.exitCode = 1;
  }
}

runHealthCheck().catch(err => {
  console.error('Unhandled Rejection:');
  console.error(err);
  process.exit(1);
});
