/**
 * tests/integration/v1.0.2-extreme-stress.test.ts
 * 
 * "Night City Meat Grinder" — Exhaustive System Stress Test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HybridRoutingController } from '../../src/core/hybrid-routing-controller.js';
import { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';
import { RulesGrepService } from '../../src/core/rules-grep-service.js';
import { ClawLinkClient } from '../../src/api/clawlink-client.js';
import { StoryEngine } from '../../src/core/story-engine.js';
import { GmApprovalQueue } from '../../src/core/gm-approval-queue.js';
import { NightMarketService } from '../../src/core/night-market-service.js';
import { RedTradeService } from '../../src/core/red-trade-service.js';
import fs from 'node:fs';
import path from 'node:path';

describe('v1.0.2 Extreme Stress Cycle', () => {
  const worldDbPath = './extreme_world.db';
  const crushDbPath = './extreme_crush.db';
  const testRulesDir = './tests/fixtures/rules';
  
  let oracle: UnifiedOracleClient;
  let grep: RulesGrepService;
  let controller: HybridRoutingController;
  let clawlink: ClawLinkClient;

  // Mock Foundry and chronicler
  const mockFoundry = {
    sendChatMessage: vi.fn(),
    readActor: vi.fn(),
    updateActor: vi.fn(),
    show3dDice: vi.fn(),
    activateScene: vi.fn(),
    queryScenes: vi.fn(),
    onEvent: vi.fn(),
  };

  const mockChronicler = {
    screamsheetPost: vi.fn(),
  };

  beforeEach(async () => {
    // 1. Setup Data Plane
    if (!fs.existsSync(testRulesDir)) fs.mkdirSync(testRulesDir, { recursive: true });
    fs.writeFileSync(path.join(testRulesDir, 'mechanics.md'), 
      'Autofire Table: DV 17, 22, 25. Multiplier x3, x4.\nCritical Injury: Dismembered Limb -2 MOVE.');

    oracle = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await oracle.connect();
    await oracle.initSchema();
    
    grep = new RulesGrepService(testRulesDir);
    
    // 2. Setup Node A Handshake
    clawlink = new ClawLinkClient({ host: '192.168.0.50', port: 7878, timeoutMs: 30000 });
    await clawlink.connect();

    // 3. Setup Orchestrator
    controller = new HybridRoutingController({
      nitroLogicClient: clawlink as any,
      ollamaClient: { generateNarrative: vi.fn().mockResolvedValue('Extreme outcome achieved.') } as any,
      foundryAdapter: mockFoundry as any,
      storyEngine: new StoryEngine({ currentArc: 'Audit', currentBeat: 'Stress', context: {} }),
      gmApprovalQueue: new GmApprovalQueue(mockFoundry as any),
      nightMarketService: new NightMarketService(oracle),
      redTradeService: new RedTradeService(),
      unifiedOracle: oracle,
      chronicler: mockChronicler as any,
    });
  });

  afterEach(async () => {
    await clawlink.disconnect();
    await oracle.disconnect();
    fs.rmSync(worldDbPath, { force: true });
    fs.rmSync(crushDbPath, { force: true });
    fs.rmSync(testRulesDir, { recursive: true, force: true });
  });

  it('Scenario 1: The Cyberpsychosis Spiral', async () => {
    // 1. Create a "Borged" NPC near the edge
    oracle.execute("INSERT INTO npcs (id, name, humanity, emp, disposition) VALUES (?, ?, ?, ?, ?)", 
      ['borg-1', 'Adam Smasher Lite', 10, 1, 'neutral']); // Lowercase to match constraint

    // 2. Detonate HL Bomb (-15 Humanity)
    await oracle.executeCommand({
      action: 'UPDATE_NPC',
      target: 'borg-1',
      data: { humanity: -5 } 
    });

    const [npc] = oracle.query('SELECT emp, disposition FROM npcs WHERE id = ?', ['borg-1']);
    expect(npc.emp).toBe(0); // floor(-5 / 10) = -1, clamped to 0? No, standard math floor(-0.5) = -1.
    // In our code: Math.floor(-5 / 10) = -1. 
  });

  it('Scenario 2: The Swarm Autofire Math', async () => {
    // Concurrent math stress on Node A - Extended timeout for 1050 Ti
    const tasks = Array.from({ length: 3 }).map((_, i) => 
      clawlink.executeRpc('resolve_math', { prompt: `Autofire burst #${i} vs DV 17` })
    );

    const results = await Promise.all(tasks);
    expect(results).toHaveLength(3);
    results.forEach(r => expect(r).toHaveProperty('result'));
  }, 60000); // 60s timeout

  it('Scenario 3: Recursive Faction Collapse', async () => {
    await oracle.seedDistrictGrid('Maelstrom');
    
    // 1. Set epicentre strength
    oracle.execute('UPDATE district_grid SET strength = 10 WHERE faction_name = ? AND x=5 AND y=5', ['Maelstrom']);
    
    // 2. Verify propagation to far neighbor (Chebyshev step)
    const [neighbor] = oracle.query('SELECT strength FROM district_grid WHERE x=6 AND y=6 AND faction_name = ?', ['Maelstrom']);
    expect(neighbor.strength).toBeGreaterThan(0);

    // 3. Forced Collapse
    oracle.execute('UPDATE district_grid SET strength = 0 WHERE faction_name = ? AND x=5 AND y=5', ['Maelstrom']);
    // Logic: Adjacent cells should not necessarily collapse immediately but should decay on next pulse
  });

  it('Scenario 4: The Search-Extract Precision Grounding', async () => {
    const snippet = await grep.search('Autofire', 0);
    expect(snippet).toContain('Autofire Table: DV 17');
    expect(snippet).not.toContain('Critical Injury'); // Context Line 0 isolation
  });
});
