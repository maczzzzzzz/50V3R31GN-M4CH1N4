/**
 * src/main.ts
 *
 * ◈ SOVEREIGN OS — Clean BASE Entry Point
 *
 * This script wires the core Zero-Trust Quaternary Mesh:
 *   - Initialises the Unified Oracle (Clean BASE SQLite RKG).
 *   - Connects to Zero-Trust Security Arteries (SPIFFE/V2F).
 *   - Configures the Sovereign Director (Node B) and Oracle (Node C).
 */

import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Console } from 'node:console';
import { randomUUID } from 'node:crypto';

const logDir = './data/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logStream = fs.createWriteStream(path.join(logDir, 'orchestrator.log'), { flags: 'a' });
const fileLogger = new Console({ stdout: logStream, stderr: logStream });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;

console.log = (...args) => {
  fileLogger.log(...args);
  originalConsoleLog(...args);
};
console.error = (...args) => {
  fileLogger.error(...args);
  originalConsoleError(...args);
};

import { ClawLinkClient } from './api/clawlink-client.js';
import { NitroLogicClient } from './core/nitro-logic-client.js';
import { SovereignNarrativeClient } from './core/sovereign-narrative-client.js';
import { SovereignController } from './core/sovereign-controller.js';
import { UnifiedOracleClient } from './db/unified-oracle-client.js';
import { VisualMonitorService } from './core/visual-monitor-service.js';
import { SentinelMonitorService } from './core/sentinel-monitor-service.js';
import { BrowserBridge } from './api/browser-bridge.js';
import { SovereignDashboardService } from './core/memory/SovereignDashboardService.js';

import { RootsInjector } from './core/roots-injector.js';
import { HermesSingularity } from './core/hermes/HermesSingularity.js';
import { logger } from './shared/logger.js';

async function main() {
  const bootTraceId = 'boot-' + Date.now();
  logger.info('Orchestrator', bootTraceId, '🌃 50V3R31GN-M4CH1N4: Booting Sovereign OS (Clean BASE)...');

  // 1. Initialise Oracle (RKG)
  const oracle = new UnifiedOracleClient({
    worldDbPath: process.env.AKASHIK_DB_PATH ?? './data/Akashik.db',
    crushDbPath: process.env.CRUSH_DB_PATH ?? './data/crush.db',
  }, logger);
  await oracle.connect();

  // 2. Initialise Hardware Clients
  const nitroLogic = new NitroLogicClient({
    baseUrl: process.env.ORACLE_URL || 'http://127.0.0.1:7339/v1',
    model: process.env.NODE_C_MODEL || 'qwen-oracle',
    timeoutMs: 30000,
    seed: 42,
  }, logger);

  const rootsInjector = new RootsInjector(oracle.getRawDatabase(), process.cwd());

  const sovereignNarrative = new SovereignNarrativeClient({
    baseUrl: process.env.SOVEREIGN_INFERENCE_URL || 'http://127.0.0.1:8080/v1',
    model: process.env.NARRATIVE_MODEL || 'mistral-nemo:latest',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
  }, rootsInjector);

  const clawlinkClient = new ClawLinkClient({
    socketPath: process.env.CLAWLINK_SOCK || '/home/nixos/50V3R31GN-M4CH1N4/.crush/clawlink.sock',
    timeoutMs: parseInt(process.env.CLAWLINK_TIMEOUT || '15000', 10),
  });

  // Phase 93/97: Hermes Singularity — Native Orchestration
  const orchestrator = new HermesSingularity();

  // 3. Assemble Orchestration Loop
  const controller = new SovereignController({
    nitroLogicClient: nitroLogic,
    sovereignNarrativeClient: sovereignNarrative,
    unifiedOracle: oracle,
    logger: logger,
  });

  // 4. Neural Uplink — CDP handshake
  const neuralUplink = new VisualMonitorService({
    debugHost: '127.0.0.1',
    debugPort: 9222,
    oracle,
  });
  
  try {
    await neuralUplink.connect();
    logger.info('Orchestrator', bootTraceId, '📡 Neural Uplink Active.');
  } catch (err) {
    logger.warn('Orchestrator', bootTraceId, `⚠️  Neural Uplink OFFLINE.`);
  }

  // 5. Wire Proxy Intents (crush-cli)
  clawlinkClient.onIntent(async (intent) => {
    try {
      await controller.handleProxyIntent(intent);
    } catch (err) {
      logger.error('Orchestrator', randomUUID(), '[Main] Proxy intent error:', { error: (err as Error).message });
    }
  });

  // 6. Start Services
  await Promise.all([
    clawlinkClient.connect(),
  ]);

  // Phase 87: Vivaldi Ingress — Browser Bridge
  const browserBridge = new BrowserBridge(logger);
  browserBridge.onContext(async (frame, traceId) => {
    const prompt = `[BROWSER_CONTEXT] URL: ${frame.url} | Title: ${frame.title}`;
    try {
      await orchestrator.invoke({ prompt, tokens: 80, thread_id: traceId });
    } catch (e) {
      logger.warn('BrowserBridge', traceId, `Orchestrator ingest failed.`);
    }
  });
  browserBridge.start(3012);

  // 7. Sentinel Monitor
  const sentinel = new SentinelMonitorService(logger);
  sentinel.start();

  // Phase 90: Sovereign Dashboard
  const sovereignDashboard = new SovereignDashboardService({
    dbPath: process.env['SOVEREIGN_INTELLIGENCE_DB'] ?? 'data/SovereignIntelligence.db',
    vaultRoot: process.env['SOVEREIGN_OS_VAULT'] ?? 'data/vault/Sovereign_OS',
    refreshIntervalMs: 60000,
  }, logger);
  sovereignDashboard.start();

  logger.info('Orchestrator', bootTraceId, '🚀 Sovereign OS READY.');

  const shutdown = async (signal: string) => {
    logger.info('Orchestrator', randomUUID(), `\n[Main] Received ${signal}. Shutting down...`);
    try {
      sentinel.stop();
      await neuralUplink.disconnect().catch(() => {});
      await sovereignNarrative.stop();
      await nitroLogic.stop();
      browserBridge.stop();
      sovereignDashboard.stop();
      await clawlinkClient.disconnect().catch(() => {});
      await oracle.disconnect();
      process.exit(0);
    } catch (err) {
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch(err => {
  console.error('❌ FATAL BOOT ERROR:', err);
  process.exit(1);
});
