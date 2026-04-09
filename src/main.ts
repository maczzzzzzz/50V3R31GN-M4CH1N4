/**
 * src/main.ts
 *
 * ASP.GM-Agent — Production Orchestrator Entry Point
 *
 * This script wires the Split-Node architecture:
 *   - Connects to ZeroClaw (Node A) via ClawLink SSH Bridge.
 *   - Initialises the Unified Oracle (SQLite RKG).
 *   - Boots the Foundry VTT WebSocket Server (Port 3010).
 *   - Configures Mistral-Nemo (Node B) for narrative synthesis.
 */

import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { Console } from 'node:console';

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
import { ClawLinkClient } from './api/clawlink-client.js';
import { NitroLogicClient } from './core/nitro-logic-client.js';
import { OllamaClient } from './core/ollama-client.js';
import { HybridRoutingController } from './core/hybrid-routing-controller.js';
import { StoryEngine } from './core/story-engine.js';
import { VsbClient } from './api/vsb-client.js';
import { GmApprovalQueue } from './core/gm-approval-queue.js';
import { NightMarketService } from './core/night-market-service.js';
import { RedTradeService } from './core/red-trade-service.js';
import { UnifiedOracleClient } from './db/unified-oracle-client.js';
import { ArchitectPassService } from './core/architect-pass-service.js';
import { bootstrapTttaPart1, createTttaPart1InitialState } from './core/campaign-registry.js';
import { DiscordChroniclerClient } from './core/discord-chronicler-client.js';
import { SpatialVisionService } from './core/spatial-vision-service.js';
import { VisualMonitorService } from './core/visual-monitor-service.js';
import { AkashikVisualAuditor } from './core/akashik-visual-auditor.js';
import { VesperService } from './core/vesper-service.js';
import { SharedMemoryService } from './core/shared-memory-service.js';

import { RootsInjector } from './core/roots-injector.js';
import { SOVEREIGN_HIJACK_JS } from '../scripts/theme-sync.js';

async function main() {
  console.log('🌃 50V3R31GN-M4CH1N4: Booting Orchestrator (v1.14.0)...');

  // 1. Initialise Oracle (RKG)
  const oracle = new UnifiedOracleClient({
    worldDbPath: process.env.AKASHIK_DB_PATH ?? './data/Akashik.db',
    crushDbPath: process.env.CRUSH_DB_PATH ?? './data/crush.db',
  });
  await oracle.connect();
  console.log('✅ Unified Oracle ONLINE.');

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
      console.error('!! ZOMBIE DETECTED: Foundry connection lost for >5m. Purging Node B.');
      process.emit('SIGTERM');
    }
  }, FOUNDRY_HEARTBEAT_MS);

  // 3. Initialise Hardware Clients
  const nitroLogic = new NitroLogicClient({
    baseUrl: process.env.NODE_A_LLAMA_URL || 'http://192.168.0.50:8080/v1',
    model: process.env.NODE_A_LLAMA_MODEL || 'local-llama',
    timeoutMs: 30000,
    seed: 42,
  });

  const rootsInjector = new RootsInjector(oracle.getRawDatabase());

  const ollama = new OllamaClient({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://172.26.208.1:8080/v1',
    model: process.env.NARRATIVE_MODEL || 'mistral-nemo:latest',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
    num_gpu: process.env.OLLAMA_NUM_GPU ? parseInt(process.env.OLLAMA_NUM_GPU, 10) : undefined,
  }, rootsInjector);

  const chronicler = process.env.DISCORD_SCREAMSHEET_WEBHOOK 
    ? new DiscordChroniclerClient(process.env.DISCORD_SCREAMSHEET_WEBHOOK)
    : undefined;

  const vsbClient = new VsbClient({
    host: process.env.NODE_A_HOST || '192.168.0.50',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
    timeoutMs: 2000,
  });

  const clawlinkClient = new ClawLinkClient({
    socketPath: process.env.CLAWLINK_SOCK || '/run/crush/clawlink.sock',
    timeoutMs: parseInt(process.env.CLAWLINK_TIMEOUT || '5000', 10),
  });

  // 4. Initialise State Engine
  // For the "Live-Fire" test, we use the TttA Part 1 starting state
  const storyEngine = new StoryEngine(createTttaPart1InitialState(), ollama);
  bootstrapTttaPart1(storyEngine);

  // 5. Build Foundry Adapter
  const foundry = new FoundryAdapter();

  // 6. Neural Uplink — CDP handshake (non-blocking: Foundry may not be running yet)
  const neuralUplink = new VisualMonitorService({
    debugPort: parseInt(process.env.CDP_DEBUG_PORT || '9222', 10),
    oracle,
  });
  try {
    await neuralUplink.connect();
    
    // Phase 35: Inject SOVEREIGN_HIJACK_JS payload upon successful CDP connection
    const client = neuralUplink.getClient();
    await client.Runtime.evaluate({
      expression: SOVEREIGN_HIJACK_JS,
      awaitPromise: true,
    });
    console.log('💉 SOVEREIGN_HIJACK_JS Payload Injected.');
  } catch (err) {
    console.warn(`⚠️  Neural Uplink OFFLINE (Foundry not detected): ${(err as Error).message}`);
  }

  const architect = new ArchitectPassService(neuralUplink);

  // 7. Initialize Shared Memory (VSB Mmap)
  const sharedMemory = new SharedMemoryService(
    process.env.VSB_MMAP_PATH ?? 'black_ice_state.mem'
  );
  try {
    sharedMemory.open();
    console.log(`✅ VSB Shared Memory OPEN: ${process.env.VSB_MMAP_PATH ?? 'black_ice_state.mem'}`);
  } catch (err) {
    console.warn(`⚠️  VSB Shared Memory failed to open: ${(err as Error).message}`);
  }

  // 8. Assemble Orchestration Loop
  const auditor = new AkashikVisualAuditor(
    oracle,
    process.env.VLM_ENDPOINT,
  );

  const controller = new HybridRoutingController({
    nitroLogicClient: nitroLogic,
    vsbClient: vsbClient,
    clawlinkClient: clawlinkClient,
    ollamaClient: ollama,
    foundryAdapter: foundry,
    storyEngine,
    gmApprovalQueue: new GmApprovalQueue(foundry),
    nightMarketService: new NightMarketService(oracle),
    redTradeService: new RedTradeService(),
    unifiedOracle: oracle,
    chronicler,
    visualMonitor: neuralUplink,
    architect,
    auditor,
    sharedMemoryService: sharedMemory,
    onboardingEnabled: true,
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
    try {
      await controller.handleFoundryEvent(event);
    } catch (err) {
      console.error('[Main] Orchestrator event error:', err);
    }
  });

  // 11. Wire Proxy Intents (crush-cli)
  clawlinkClient.onIntent(async (intent) => {
    try {
      await controller.handleProxyIntent(intent);
    } catch (err) {
      console.error('[Main] Proxy intent error:', err);
    }
  });

  // 12. Start the WS Server
  await Promise.all([
    foundry.start(3010),
    vsbClient.connect(),
    clawlinkClient.connect(),
  ]);

  console.log('🚀 Orchestrator READY. Listening for Foundry on Port 3010.');

  // 9. Graceful Shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Main] Received ${signal}. Shutting down gracefully...`);
    
    try {
      // Disconnect Neural Uplink
      await neuralUplink.disconnect().catch(() => {});

      // Stop Foundry first to stop incoming events
      await foundry.stop();
      console.log('✅ Foundry Adapter STOPPED.');

      // Stop AI clients (Ollama will unload model)
      await ollama.stop();
      console.log('✅ Ollama Client STOPPED.');
      
      await nitroLogic.stop();
      console.log('✅ NitroLogic Client STOPPED.');

      vsbClient.close();
      console.log('✅ VsbClient (UDP) STOPPED.');

      await clawlinkClient.disconnect().catch(() => {});
      console.log('✅ ClawLink Client DISCONNECTED.');

      // Disconnect Oracle
      await oracle.disconnect();
      console.log('✅ Unified Oracle DISCONNECTED.');

      console.log('👋 ASP.GM-Agent shutdown complete.');
      process.exit(0);
    } catch (err) {
      console.error('[Main] Error during shutdown:', err);
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
