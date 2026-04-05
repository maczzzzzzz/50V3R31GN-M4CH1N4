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

async function main() {
  console.log('🌃 ASP.GM-Agent: Booting Orchestrator (v0.8.3)...');

  // 1. Initialise Oracle (RKG)
  const oracle = new UnifiedOracleClient({
    worldDbPath: process.env.AKASHIK_DB_PATH ?? './data/Akashik.db',
    crushDbPath: process.env.CRUSH_DB_PATH ?? './data/crush.db',
  });
  await oracle.connect();
  console.log('✅ Unified Oracle ONLINE.');

  // 2. Initialise Bridge (ClawLink)
  const clawlink = new ClawLinkClient({
    host: process.env.CLAWLINK_HOST || '192.168.0.50',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
  });
  // Note: Connection handled as needed by consumers

  // 3. Initialise Hardware Clients
  const nitroLogic = new NitroLogicClient({
    baseUrl: process.env.NODE_A_LLAMA_URL || 'http://192.168.0.50:8080/v1',
    model: process.env.NODE_A_LLAMA_MODEL || 'local-llama',
    timeoutMs: 30000,
    seed: 42,
  });

  const ollama = new OllamaClient({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:8080/v1',
    model: process.env.NARRATIVE_MODEL || 'mistral-nemo:latest',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '60000', 10),
    num_gpu: process.env.OLLAMA_NUM_GPU ? parseInt(process.env.OLLAMA_NUM_GPU, 10) : undefined,
  });

  const chronicler = process.env.DISCORD_SCREAMSHEET_WEBHOOK 
    ? new DiscordChroniclerClient(process.env.DISCORD_SCREAMSHEET_WEBHOOK)
    : undefined;

  const vsbClient = new VsbClient({
    host: process.env.NODE_A_HOST || '192.168.0.50',
    port: parseInt(process.env.CLAWLINK_PORT || '7878', 10),
    timeoutMs: 2000,
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
  } catch (err) {
    console.warn(`⚠️  Neural Uplink OFFLINE (Foundry not detected): ${(err as Error).message}`);
  }

  const architect = new ArchitectPassService(neuralUplink);

  // 7. Assemble Orchestration Loop
  const controller = new HybridRoutingController({
    nitroLogicClient: nitroLogic,
    vsbClient: vsbClient,
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
    onboardingEnabled: true,
  });

  // 8. Wire Orchestrator to Bridge Events
  foundry.onEvent(async (event) => {
    try {
      await controller.handleFoundryEvent(event);
    } catch (err) {
      console.error('[Main] Orchestrator error:', err);
    }
  });

  // 9. Start the WS Server
  await foundry.start(3010);

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
