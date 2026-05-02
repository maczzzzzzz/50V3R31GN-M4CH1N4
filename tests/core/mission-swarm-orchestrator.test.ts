import { describe, it, expect, vi } from 'vitest';
import { MissionSwarmOrchestrator } from '../../packages/hermes-core/src/core/mission-swarm-orchestrator.js';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeMockSovereignNarrative() {
  return {
    generateNarrative: vi.fn().mockImplementation(async (prompt: string, context: string) => {
      if (prompt.includes('Fixer in Night City')) {
        return 'Brief: Assault the Arasaka convoy.';
      }
      if (prompt.includes('suggest 3 tactical combat considerations')) {
        return 'Tactics: 1. High cover, 2. Sniper, 3. Flank.';
      }
      return 'Mocked response';
    }),
    setProfile: vi.fn(),
    isHealthy: vi.fn().mockResolvedValue(true),
    stop: vi.fn().mockResolvedValue(undefined),
  } as any;
}

function makeMockOracle(rows: { content: string }[] = [{ content: 'V met Rogue in Watson' }]) {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    query: vi.fn().mockImplementation((sql: string) => {
      if (sql.includes('map_assets')) {
        return [{ file_path: 'mock/path.png', category: 'map' }];
      }
      return rows;
    }),
    executeCommand: vi.fn().mockResolvedValue({ changes: 1 }),
  } as any;
}

function makeMockNitroLogic() {
  return {} as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MissionSwarmOrchestrator', () => {
  it('generateMission() uses sovereignNarrative to generate brief and tactical analysis', async () => {
    const sovereignNarrative = makeMockSovereignNarrative();
    const oracle = makeMockOracle();
    const nitroLogic = makeMockNitroLogic();
    const orchestrator = new MissionSwarmOrchestrator({ sovereignNarrative, oracle, nitroLogic });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(sovereignNarrative.generateNarrative).toHaveBeenCalledTimes(2);
    expect(blueprint.district).toBe('Watson');
    expect(blueprint.brief).toBe('Brief: Assault the Arasaka convoy.');
    expect(blueprint.tacticalAnalysis).toBe('Tactics: 1. High cover, 2. Sniper, 3. Flank.');
  });

  it('generateMission() returns loreAnchors from oracle query', async () => {
    const oracle = makeMockOracle([
      { content: 'V met Rogue in Watson near the market' },
      { content: 'Johnny warned about Maxtac in Watson district' },
    ]);
    const orchestrator = new MissionSwarmOrchestrator({
      sovereignNarrative: makeMockSovereignNarrative(),
      oracle,
      nitroLogic: makeMockNitroLogic(),
    });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(blueprint.loreAnchors).toHaveLength(2);
    expect(blueprint.loreAnchors[0]).toBe('V met Rogue in Watson near the market');
    expect(blueprint.loreAnchors[1]).toBe('Johnny warned about Maxtac in Watson district');
  });

  it('generateMission() includes rulesIntel hardcoded for now', async () => {
    const orchestrator = new MissionSwarmOrchestrator({
      sovereignNarrative: makeMockSovereignNarrative(),
      oracle: makeMockOracle(),
      nitroLogic: makeMockNitroLogic(),
    });

    const blueprint = await orchestrator.generateMission('Heywood');

    expect(blueprint.rulesIntel).toEqual({ 
      difficulty: 'professional',
      assets: {
        suggestedMaps: ['mock/path.png'],
        suggestedTokens: ['mock/path.png']
      }
    });
  });
});
