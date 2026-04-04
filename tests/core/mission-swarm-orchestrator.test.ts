import { describe, it, expect, vi } from 'vitest';
import { MissionSwarmOrchestrator } from '../../src/core/mission-swarm-orchestrator.js';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeMockOllama() {
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
  } as any;
}

function makeMockOracle(rows: { content: string }[] = [{ content: 'V met Rogue in Watson' }]) {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    query: vi.fn().mockReturnValue(rows),
    execute: vi.fn().mockReturnValue({ changes: 1 }),
  } as any;
}

function makeMockNitroLogic() {
  return {} as any;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MissionSwarmOrchestrator', () => {
  it('generateMission() uses ollama to generate brief and tactical analysis', async () => {
    const ollama = makeMockOllama();
    const oracle = makeMockOracle();
    const nitroLogic = makeMockNitroLogic();
    const orchestrator = new MissionSwarmOrchestrator({ ollama, oracle, nitroLogic });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(ollama.generateNarrative).toHaveBeenCalledTimes(2);
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
      ollama: makeMockOllama(),
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
      ollama: makeMockOllama(),
      oracle: makeMockOracle(),
      nitroLogic: makeMockNitroLogic(),
    });

    const blueprint = await orchestrator.generateMission('Heywood');

    expect(blueprint.rulesIntel).toEqual({ difficulty: 'professional' });
  });
});