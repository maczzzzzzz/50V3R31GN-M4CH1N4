/**
 * src/scripts/live-fire-orchestrator.ts
 *
 * Autonomous Live Fire Test Orchestrator for v1.0.0
 */

import 'dotenv/config';
import { FoundryAdapter } from '../api/foundry-adapter.js';
import { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import { HybridRoutingController } from '../core/hybrid-routing-controller.js';
import { NitroLogicClient } from '../core/nitro-logic-client.js';
import { OllamaClient } from '../core/ollama-client.js';
import { StoryEngine } from '../core/story-engine.js';
import { GmApprovalQueue } from '../core/gm-approval-queue.js';
import { NightMarketService } from '../core/night-market-service.js';
import { RedTradeService } from '../core/red-trade-service.js';
import { createTttaPart1InitialState } from '../core/campaign-registry.js';

async function runLiveFire() {
  console.log('🚀 INITIALIZING LIVE FIRE SEQUENCE...');

  const oracle = new UnifiedOracleClient({
    worldDbPath: process.env.WORLD_DB_PATH ?? './world.db',
    crushDbPath: process.env.CRUSH_DB_PATH ?? './.crush/crush.db',
  });
  await oracle.connect();

  const nitroLogic = new NitroLogicClient({
    baseUrl: process.env.NODE_A_LLAMA_URL || 'http://192.168.0.50:8080/v1',
    model: 'local-llama',
    timeoutMs: 30000,
    seed: 42,
  });

  const ollama = new OllamaClient({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    model: 'mistral-nemo',
    timeoutMs: 60000,
  });

  const foundry = new FoundryAdapter();
  await foundry.start(3010);

  // Wait for Foundry to connect
  console.log('⏳ Waiting for Foundry Bridge to connect...');
  while (!foundry.isConnected()) {
    await new Promise(r => setTimeout(r, 1000));
  }
  console.log('🟢 Foundry Connected.');
  
  const controller = new HybridRoutingController({
    nitroLogicClient: nitroLogic,
    ollamaClient: ollama,
    foundryAdapter: foundry,
    storyEngine: new StoryEngine(createTttaPart1InitialState()),
    gmApprovalQueue: new GmApprovalQueue(foundry),
    nightMarketService: new NightMarketService(oracle),
    redTradeService: new RedTradeService(),
    unifiedOracle: oracle,
    onboardingEnabled: true,
  });

  // 1. DISCOVERY (Bypassed due to legacy bridge)
  console.log('🔍 Skipping scene discovery (legacy bridge detected)...');
  const mapId = 'test-scene';

  // 2. MATERIALIZATION
  console.log('📋 Starting Onboarding...');
  await controller.handleOnboard('TestRunner', 'Solo', 'Standard');

  // 3. COMBAT STRESS
  console.log('⚔️ Triggering Attack Resolution...');
  await foundry.onEvent(async (evt) => {
    if (evt.type === 'resolve_attack') {
      console.log('✅ Received resolve_attack event from Foundry.');
    }
  });

  // Since we are autonomous, we trigger a mock attack to verify the loop
  // simulating a player clicking 'Attack' in Foundry.
  await controller.handleFoundryEvent({
    type: 'resolve_attack',
    payload: {
      attackerSkill: 6,
      attackerRef: 8,
      weaponDamage: '3d6',
      weaponArmorPiercing: false,
      defenderRef: 6,
      defenderSP: 11,
      rangeBand: 'close',
      modifiers: 0,
      spatial: { sceneId: mapId, x: 500, y: 500 }
    }
  });

  // 4. SPATIAL AWARENESS
  console.log('👁️ Running Tactical Scan...');
  await controller.handleScan();

  // 5. PULSE ENGINE
  console.log('💓 Advancing Pulse Engine...');
  await oracle.seedDistrictGrid('Maelstrom');
  // Trigger a friction update via nitro-dev tool logic
  await oracle.execute('UPDATE district_grid SET strength = 5 WHERE faction_name = ? AND x=0 AND y=0', ['Maelstrom']);

  console.log('🏁 LIVE FIRE SEQUENCE COMPLETE.');
  process.exit(0);
}

runLiveFire().catch(err => {
  console.error('❌ LIVE FIRE FAILURE:', err);
  process.exit(1);
});
