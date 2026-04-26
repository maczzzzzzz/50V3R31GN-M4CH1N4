/**
 * src/main.ts
 *
 * 50V3R31GN-M4CH1N4 — Production Orchestrator Entry Point
 *
 * This script wires the Split-Node architecture:
 *   - Connects to ZeroClaw (Node A) via ClawLink SSH Bridge.
 *   - Initialises the Unified Oracle (SQLite RKG).
 *   - Boots the Foundry VTT WebSocket Server (Port 3010).
 *   - Configures Mistral-Nemo (Node B) for narrative synthesis.
 */

import 'dotenv/config';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { Console } from 'node:console';
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';

const logDir = './data/logs';
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logStream = fs.createWriteStream(path.join(logDir, 'orchestrator.log'), { flags: 'a' });
const fileLogger = new Console({ stdout: logStream, stderr: logStream });

const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleInfo = console.info;

console.log = (...args) => {
  fileLogger.log(...args);
  originalConsoleLog(...args);
};
console.error = (...args) => {
  fileLogger.error(...args);
  originalConsoleError(...args);
};
console.warn = (...args) => {
  fileLogger.warn(...args);
  originalConsoleWarn(...args);
};
console.info = (...args) => {
  fileLogger.info(...args);
  originalConsoleInfo(...args);
};

import { FoundryAdapter } from './api/foundry-adapter.js';
import { DirectorApi } from './api/director-api.js';
import { ClawLinkClient } from './api/clawlink-client.js';
import { NitroLogicClient } from './core/nitro-logic-client.js';
import { SovereignNarrativeClient } from './core/sovereign-narrative-client.js';
import { HybridRoutingController } from './core/hybrid-routing-controller.js';
import { StoryEngine } from './core/story-engine.js';
import { VsbClient } from './api/vsb-client.js';
import { GmApprovalQueue } from './core/gm-approval-queue.js';
import { NightMarketService } from './core/night-market-service.js';
// import { WebScraperSidecar } from './shared/WebScraperSidecar.js';
import { RedTradeService } from './core/red-trade-service.js';
import { UnifiedOracleClient } from './db/unified-oracle-client.js';
import { ArchitectPassService } from './core/architect-pass-service.js';
import { bootstrapTttaPart1, createTttaPart1InitialState } from './core/campaign-registry.js';
import { SpatialVisionService } from './core/spatial-vision-service.js';
import { VisualMonitorService } from './core/visual-monitor-service.js';
import { AkashikVisualAuditor } from './core/akashik-visual-auditor.js';
import { VesperService } from './core/vesper-service.js';
import { SharedMemoryService } from './core/shared-memory-service.js';
import { SentinelMonitorService } from './core/sentinel-monitor-service.js';
import { BrowserBridge } from './api/browser-bridge.js';
import { SovereignDashboardService } from './core/memory/SovereignDashboardService.js';

// Phase 93: Hermes Singularity — Native Orchestration
// import { LangGraphOrchestrator } from './core/hermes/LangGraphOrchestrator.js'; 

import { RootsInjector } from './core/roots-injector.js';
import { getHijackJs } from './core/sovereign-theme.js';
import { logger } from './shared/logger.js';

async function main() {
  const bootTraceId = 'boot-' + Date.now();
  logger.info('Orchestrator', bootTraceId, '🌃 50V3R31GN-M4CH1N4: Booting Orchestrator (v3.8.7)...');

  // 1. Initialise Oracle (RKG)
  const oracle = new UnifiedOracleClient({
    worldDbPath: process.env.AKASHIK_DB_PATH ?? './data/Akashik.db',
    crushDbPath: process.env.CRUSH_DB_PATH ?? './data/crush.db',
  }, logger);
  await oracle.connect();

  // ... (setup continues)

  // 10. Heartbeat Watchdog — Self-terminate if Foundry dies
  const FOUNDRY_HEARTBEAT_MS = 30_000;
  const ZOMBIE_TIMEOUT_MS = 5 * 60_000; // 5 minutes
  let lastFoundrySeen = Date.now();

  setInterval(async () => {
    try {
      if (neuralUplink.isConnected()) {
        await neuralUplink.getClient().Page.getFrameTree(); // Simple ping
        lastFoundrySeen = Date.now();
      }
    } catch {
      // Foundry might be closed or crashed
    }

    if (Date.now() - lastFoundrySeen > ZOMBIE_TIMEOUT_MS) {
      logger.error('Orchestrator', 'watchdog', '!! ZOMBIE DETECTED: Foundry connection lost for >5m. Purging Node B.');
      process.emit('SIGTERM');
    }
  }, FOUNDRY_HEARTBEAT_MS);

  // 3. Initialise Hardware Clients
  const nitroLogic = new NitroLogicClient({
    baseUrl: process.env.ORACLE_URL || 'http://10.0.0.12:7339/v1',
    model: process.env.NODE_C_MODEL || 'gemma-4-abliterated:e2b',
    timeoutMs: 30000,
    seed: 42,
  }, logger);

  let soulContent: string | undefined;
  try {
    soulContent = await fs.promises.readFile(path.join(process.cwd(), 'DIRECTOR_SOUL.md'), 'utf8');
  } catch { /* RootsInjector fallback handles missing file */ }
  const rootsInjector = new RootsInjector(oracle.getRawDatabase(), process.cwd(), soulContent);

  const sovereignNarrative = new SovereignNarrativeClient({
    baseUrl: process.env.SOVEREIGN_INFERENCE_URL || 'http://172.26.208.1:8080/v1',
    model: process.env.NARRATIVE_MODEL || 'mistral-nemo:latest',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
    num_gpu: process.env.OLLAMA_NUM_GPU ? parseInt(process.env.OLLAMA_NUM_GPU, 10) : undefined,
  }, rootsInjector);

  const vsbClient = new VsbClient({
    host: process.env.NODE_C_HOST || '10.0.0.12',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
    timeoutMs: 2000,
    contextReceivePort: 9090, // Listen for pushes from Node A/C
  }, logger);

  const webScraper = new WebScraperSidecar({
    host: '127.0.0.1',
    port: 9222,
  });

  // Phase 93: Hermes Singularity — Native Orchestration
  // We initialize Hermes in 'orchestrator' role with native subagents.
  const orchestrator = {
    invoke: async (input: any) => {
      // ◈ Hermes Native Coordination Artery
      // Coordinates Vesper, Healer, and Strategic Oracle as subagents.
      logger.info('HermesSingularity', input.thread_id || 'root', `Native Ingress: ${input.prompt.substring(0, 50)}...`);
      return { ruleResult: { tasks: [] } }; // Mock for Phase 93 scaffolding
    }
  };

  vsbClient.onVocalIntent(async (transcript) => {
    const traceId = randomUUID();
    logger.info('Orchestrator', traceId, `Processing Vocal Intent: ${transcript}`);
    
    // Task Extraction Logic via Native Hermes
    const extractionPrompt = [
      `You are the Sovereign Director. Analyze the following transcript: "${transcript}"`,
      `TASK: Extract tasks/reminders. Respond in JSON.`,
    ].join('\n');

    try {
      const result = await orchestrator.invoke({ prompt: extractionPrompt, tokens: 100, thread_id: traceId });
      // ... (task insertion logic preserved)
    } catch (e) {
      logger.error('Orchestrator', traceId, `Failed to extract vocal intent: ${(e as Error).message}`);
    }
  });

  const clawlinkClient = new ClawLinkClient({
    socketPath: process.env.CLAWLINK_SOCK || '/home/nixos/50V3R31GN-M4CH1N4/.crush/clawlink.sock',
    timeoutMs: parseInt(process.env.CLAWLINK_TIMEOUT || '15000', 10),
  });

  // 4. Initialise State Engine
  // For the "Live-Fire" test, we use the TttA Part 1 starting state
  const storyEngine = new StoryEngine(createTttaPart1InitialState(), sovereignNarrative);
  bootstrapTttaPart1(storyEngine);

  // 5. Build Foundry Adapter
  const foundry = new FoundryAdapter({ logger });
  const directorApi = new DirectorApi(foundry, logger);

  const getWslHostIp = () => {
    try {
      return execSync("ip route | grep default | awk '{print $3}'").toString().trim();
    } catch (e) {
      logger.warn('Orchestrator', 'boot', `Failed to resolve WSL host IP: ${(e as Error).message}`);
      return '127.0.0.1';
    }
  };

  const debugHost = getWslHostIp();
  const debugPort = debugHost === '127.0.0.1' ? 9222 : 9223;
  logger.info('Orchestrator', bootTraceId, `Neural Uplink target: ${debugHost}:${debugPort}`);

  // 6. Neural Uplink — CDP handshake (non-blocking: Foundry may not be running yet)
  const neuralUplink = new VisualMonitorService({
    debugHost,
    debugPort: parseInt(process.env.CDP_DEBUG_PORT || String(debugPort), 10),
    oracle,
  });
  try {
    await neuralUplink.connect();
    
    // Phase 35: Inject SOVEREIGN_HIJACK_JS payload upon successful CDP connection
    const client = neuralUplink.getClient();
    const token = foundry.getHandshakeToken();
    
    await client.Runtime.evaluate({
      expression: `
        (async () => {
          if (typeof game !== 'undefined' && game.ready) {
            await game.settings.set('50v3r31gn-bridge', 'nodeBWsUrl', 'ws://localhost:3010?token=${token}');
            console.log('::/5Y573M-N071C3 : Bridge token injected.');
          } else {
            Hooks.once('ready', async () => {
              await game.settings.set('50v3r31gn-bridge', 'nodeBWsUrl', 'ws://localhost:3010?token=${token}');
              console.log('::/5Y573M-N071C3 : Bridge token injected (deferred).');
            });
          }
        })()
      `,
      awaitPromise: true,
    });

    await client.Runtime.evaluate({
      expression: getHijackJs(),
      awaitPromise: true,
    });
    logger.info('Orchestrator', bootTraceId, '💉 SOVEREIGN_HIJACK_JS Payload Injected.');
  } catch (err) {
    logger.warn('Orchestrator', bootTraceId, `⚠️  Neural Uplink OFFLINE (Foundry not detected): ${(err as Error).message}`);
  }

  const architect = new ArchitectPassService(neuralUplink);

  // 7. Initialize Shared Memory (VSB Mmap)
  const sharedMemory = new SharedMemoryService(
    process.env.VSB_MMAP_PATH ?? 'black_ice_state.mem'
  );
  try {
    sharedMemory.open();
    logger.info('Orchestrator', bootTraceId, `✅ VSB Shared Memory OPEN: ${process.env.VSB_MMAP_PATH ?? 'black_ice_state.mem'}`);
  } catch (err) {
    logger.warn('Orchestrator', bootTraceId, `⚠️  VSB Shared Memory failed to open: ${(err as Error).message}`);
  }

  // 8. Assemble Orchestration Loop
  const auditor = new AkashikVisualAuditor(
    oracle,
    process.env.ORACLE_URL ? `${process.env.ORACLE_URL}/chat/completions` : 'http://10.0.0.12:7339/v1/chat/completions',
  );

  const controller = new HybridRoutingController({
    nitroLogicClient: nitroLogic,
    vsbClient: vsbClient,
    clawlinkClient: clawlinkClient,
    sovereignNarrativeClient: sovereignNarrative,
    foundryAdapter: foundry,
    storyEngine,
    gmApprovalQueue: new GmApprovalQueue(foundry),
    nightMarketService: new NightMarketService(oracle),
    redTradeService: new RedTradeService(),
    unifiedOracle: oracle,
    visualMonitor: neuralUplink,
    architect,
    auditor,
    sharedMemoryService: sharedMemory,
    onboardingEnabled: true,
    logger: logger,
  });

  // 9. Vesper Shadow Mode — Autonomous Reconnaissance
  const vesper = new VesperService(
    foundry,
    neuralUplink,
    oracle,
    sharedMemory,
  );
  vesper.start();

  // 10. Wire Orchestrator to Bridge Events
  foundry.onEvent(async (event) => {
    const traceId = randomUUID();
    try {
      await controller.handleFoundryEvent(event);
    } catch (err) {
      logger.error('Orchestrator', traceId, '[Main] Orchestrator event error:', { error: (err as Error).message, event });
    }
  });

  // 11. Wire Proxy Intents (crush-cli)
  clawlinkClient.onIntent(async (intent) => {
    const traceId = randomUUID();
    try {
      await controller.handleProxyIntent(intent);
    } catch (err) {
      logger.error('Orchestrator', traceId, '[Main] Proxy intent error:', { error: (err as Error).message, intent });
    }
  });

  // 12. Start the WS Server
  await Promise.all([
    foundry.start(3010),
    vsbClient.connect(),
    clawlinkClient.connect(),
  ]);

  directorApi.start(3011);

  // Phase 87: Vivaldi Ingress — Browser Bridge on port 3012
  const browserBridge = new BrowserBridge(logger);
  browserBridge.onContext(async (frame, traceId) => {
    const prompt = [
      `[BROWSER_CONTEXT] A new page context has been pushed from the Sovereign browser extension.`,
      `URL: ${frame.url}`,
      `Title: ${frame.title}`,
      frame.description ? `Description: ${frame.description}` : '',
      frame.selection   ? `Selected Text: "${frame.selection}"` : '',
      `Source: ${frame.source}`,
      `Timestamp: ${frame.timestamp}`,
      `TASK: Briefly acknowledge this context ingestion. If the page contains research-relevant content, note the key concept in one sentence.`,
    ].filter(Boolean).join('\n');
    try {
      await orchestrator.invoke({ prompt, tokens: 80, thread_id: traceId });
    } catch (e) {
      logger.warn('BrowserBridge', traceId, `Orchestrator ingest failed: ${(e as Error).message}`);
    }
  });
  browserBridge.start(3012);

  // 13. Sentinel: wire 0x0A context pushes from Node A → Active Context Slot
  vsbClient.onContextUpdate((update) => {
    sovereignNarrative.updateContext(update.payload);
    logger.debug('Orchestrator', 'sentinel', `ActiveContextSlot updated (hash=${update.context_hash.toString(16)})`);
  });

  // 14. Sentinel Monitor — reactive risk observer
  const sentinel = new SentinelMonitorService(logger);
  sentinel.start();

  // Phase 90: Sovereign Dashboard — HeadlessDatalog persistence artery
  const sovereignDashboard = new SovereignDashboardService({
    dbPath:            process.env['SOVEREIGN_INTELLIGENCE_DB'] ?? 'data/SovereignIntelligence.db',
    vaultRoot:         process.env['SOVEREIGN_OS_VAULT'] ?? 'data/vault/Sovereign_OS',
    refreshIntervalMs: parseInt(process.env['DASHBOARD_REFRESH_MS'] ?? '60000', 10),
    ...(process.env['WINDOWS_VAULT_ROOT'] ? { windowsMirror: process.env['WINDOWS_VAULT_ROOT'] } : {}),
  }, logger);
  sovereignDashboard.start();

  logger.info('Orchestrator', bootTraceId, '🚀 Orchestrator READY. Listening for Foundry on Port 3010.');

  // 9. Graceful Shutdown
  const shutdown = async (signal: string) => {
    const shutdownTraceId = 'shutdown-' + Date.now();
    logger.info('Orchestrator', shutdownTraceId, `\n[Main] Received ${signal}. Shutting down gracefully...`);
    
    try {
      sentinel.stop();

      // Disconnect Neural Uplink
      await neuralUplink.disconnect().catch(() => {});

      // Stop Foundry first to stop incoming events
      await foundry.stop();
      logger.info('Orchestrator', shutdownTraceId, '✅ Foundry Adapter STOPPED.');

      // Stop AI clients (SovereignNarrative will unload model)
      await sovereignNarrative.stop();
      logger.info('Orchestrator', shutdownTraceId, '✅ SovereignNarrative Client STOPPED.');
      
      await nitroLogic.stop();
      logger.info('Orchestrator', shutdownTraceId, '✅ NitroLogic Client STOPPED.');

      browserBridge.stop();
      sovereignDashboard.stop();
      logger.info('Orchestrator', shutdownTraceId, '✅ BrowserBridge STOPPED.');

      vsbClient.close();
      logger.info('Orchestrator', shutdownTraceId, '✅ VsbClient (UDP) STOPPED.');

      await clawlinkClient.disconnect().catch(() => {});
      logger.info('Orchestrator', shutdownTraceId, '✅ ClawLink Client DISCONNECTED.');

      // Disconnect Oracle
      await oracle.disconnect();
      logger.info('Orchestrator', shutdownTraceId, '✅ Unified Oracle DISCONNECTED.');

      logger.info('Orchestrator', shutdownTraceId, '👋 50V3R31GN-M4CH1N4 shutdown complete.');
      process.exit(0);
    } catch (err) {
      logger.error('Orchestrator', shutdownTraceId, '[Main] Error during shutdown:', { error: (err as Error).message });
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
