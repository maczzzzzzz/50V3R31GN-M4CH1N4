import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { HybridRoutingController } from '../../packages/hermes-core/src/core/hybrid-routing-controller.js';
import { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';
import type { INitroLogicClient, ISovereignNarrativeClient, IFoundryAdapter } from '../../packages/hermes-core/src/core/interfaces.js';
import { StoryEngine } from '../../packages/hermes-core/src/core/story-engine.js';
import { GmApprovalQueue } from '../../packages/hermes-core/src/core/gm-approval-queue.js';
import { NightMarketService } from '../../packages/hermes-core/src/core/night-market-service.js';
import { RedTradeService } from '../../packages/hermes-core/src/core/red-trade-service.js';
import fs from 'node:fs';

describe('Global Logic Audit: State Synchronization Stress Test', () => {
  let controller: HybridRoutingController;
  let oracle: UnifiedOracleClient;
  let foundry: IFoundryAdapter;
  let logic: INitroLogicClient;

  // Use unique paths per test run to avoid EBUSY locks
  const timestamp = Date.now();
  const worldDbPath = `./data/test-audit-world-${timestamp}.db`;
  const crushDbPath = `./data/test-audit-crush-${timestamp}.db`;

  beforeEach(async () => {
    // 1. Setup clean Oracle
    oracle = new UnifiedOracleClient({ worldDbPath, crushDbPath });
    await oracle.connect();
    await oracle.initSchema();

    // Ensure triplets table exists for the test
    oracle.execute(`
      CREATE TABLE IF NOT EXISTS triplets (
        subject_id TEXT,
        predicate TEXT,
        object_literal TEXT
      )
    `);

    // 2. Mock hardware
    foundry = {
      readActor: vi.fn().mockResolvedValue({ system: { wealth: { eb: 1000 } } }),
      updateActor: vi.fn().mockResolvedValue(undefined),
      sendChatMessage: vi.fn().mockResolvedValue(undefined),
      show3dDice: vi.fn().mockResolvedValue(undefined),
      pushDashboardUpdate: vi.fn().mockResolvedValue(undefined),
      onEvent: vi.fn(),
      getHandshakeToken: vi.fn().mockReturnValue('token'),
    } as any;

    logic = {
      resolveAttack: vi.fn().mockResolvedValue({
        hit: true,
        rollTotal: 18,
        dvTarget: 13,
        rawDamage: 15,
        netDamage: 10,
        criticalInjury: false,
        reasoning: 'Calculated correctly.'
      }),
      isHealthy: vi.fn().mockResolvedValue(true),
      stop: vi.fn().mockResolvedValue(undefined),
    } as any;

    controller = new HybridRoutingController({
      nitroLogicClient: logic,
      sovereignNarrativeClient: { 
        generateNarrative: vi.fn().mockResolvedValue('prose'), 
        isHealthy: vi.fn().mockResolvedValue(true),
        setProfile: vi.fn(),
        stop: vi.fn().mockResolvedValue(undefined),
      } as any,
      foundryAdapter: foundry,
      storyEngine: { evaluateEvent: vi.fn().mockReturnValue({ transitioned: false }) } as any,
      gmApprovalQueue: {} as any,
      nightMarketService: {
        getVendorInventory: vi.fn().mockResolvedValue({ items: [] })
      } as any,
      unifiedOracle: oracle,
      redTradeService: {} as any,
    });
  });

  afterEach(async () => {
    await oracle.disconnect();
    if (fs.existsSync(worldDbPath)) fs.unlinkSync(worldDbPath);
    if (fs.existsSync(crushDbPath)) fs.unlinkSync(crushDbPath);
  });

  it('AUDIT: resolve_attack should synchronize damage to SQLite Oracle', async () => {
    const npcId = 'target-mook-001';
    oracle.execute('INSERT INTO npcs (id, name, hp, sp) VALUES (?, ?, ?, ?)', [npcId, 'Vido', 50, 11]);

    await controller.handleFoundryEvent({
      type: 'resolve_attack',
      payload: {
        targetId: npcId, // REQUIRED for reconciliation
        attackerSkill: 5, attackerRef: 6, weaponDamage: '3d6',
        weaponArmorPiercing: false, defenderRef: 4, defenderSP: 11,
        rangeBand: 'close', modifiers: 0,
      } as any
    });

    const state = oracle.query('SELECT hp FROM npcs WHERE id = ?', [npcId])[0] as any;
    // Verified: Should now be 40 (50 - 10 netDamage)
    expect(state.hp).toBe(40); 
  });

  it('AUDIT: buy_item should synchronize ownership to SQLite Oracle', async () => {
    const actorId = 'player-001';
    const itemId = 'heavy-pistol-001';

    await controller.handleFoundryEvent({
      type: 'buy_item',
      payload: {
        actorId,
        costEb: 100,
        itemId,
        vendor: 'Mr. Connors',
        costEagles: 0.5
      }
    });

    // Check lore fallback (ADD_LORE)
    const lore = oracle.query('SELECT object_literal FROM triplets WHERE subject_id = ? AND predicate = ?', [itemId, 'owned_by'])[0] as any;
    expect(lore.object_literal).toBe(actorId);
  });
});
