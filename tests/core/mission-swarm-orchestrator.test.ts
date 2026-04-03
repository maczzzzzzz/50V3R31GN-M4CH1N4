import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MissionSwarmOrchestrator } from '../../src/core/mission-swarm-orchestrator.js';

// ── Mock helpers ──────────────────────────────────────────────────────────────

function makeMockClawlink() {
  return {
    executeRpc: vi.fn().mockResolvedValue({ dvTable: [{ dv: 15 }], encounters: ['MaxTac patrol'] }),
  } as any;
}

function makeMockOracle(rows: { content: string }[] = [{ content: 'V met Rogue in Watson' }]) {
  return {
    isConnected: vi.fn().mockReturnValue(true),
    query: vi.fn().mockReturnValue(rows),
    execute: vi.fn().mockReturnValue({ changes: 1 }),
  } as any;
}

const TACTICS_URL = 'http://localhost:11434';

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('MissionSwarmOrchestrator', () => {
  let mockFetch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ response: 'High-cover zone, MaxTac presence.' }),
    } as any);
    vi.stubGlobal('fetch', mockFetch);
  });

  it('generateMission() calls rules_intel RPC and tactical fetch for a given district', async () => {
    const clawlink = makeMockClawlink();
    const oracle = makeMockOracle();
    const orchestrator = new MissionSwarmOrchestrator({ clawlink, oracle, tacticsUrl: TACTICS_URL });

    await orchestrator.generateMission('Watson');

    expect(clawlink.executeRpc).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledOnce();
  });

  it('generateMission() returns correct district in blueprint', async () => {
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle: makeMockOracle(),
      tacticsUrl: TACTICS_URL,
    });

    const blueprint = await orchestrator.generateMission('Heywood');

    expect(blueprint.district).toBe('Heywood');
  });

  it('generateMission() returns rulesIntel from ClawLink result', async () => {
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle: makeMockOracle(),
      tacticsUrl: TACTICS_URL,
    });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(blueprint.rulesIntel).toEqual({ dvTable: [{ dv: 15 }], encounters: ['MaxTac patrol'] });
  });

  it('generateMission() returns tacticalAnalysis from Ollama response', async () => {
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle: makeMockOracle(),
      tacticsUrl: TACTICS_URL,
    });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(blueprint.tacticalAnalysis).toBe('High-cover zone, MaxTac presence.');
  });

  it('generateMission() returns loreAnchors from oracle query', async () => {
    const oracle = makeMockOracle([
      { content: 'V met Rogue in Watson near the market' },
      { content: 'Johnny warned about Maxtac in Watson district' },
    ]);
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle,
      tacticsUrl: TACTICS_URL,
    });

    const blueprint = await orchestrator.generateMission('Watson');

    expect(blueprint.loreAnchors).toHaveLength(2);
    expect(blueprint.loreAnchors[0]).toBe('V met Rogue in Watson near the market');
    expect(blueprint.loreAnchors[1]).toBe('Johnny warned about Maxtac in Watson district');
  });

  it('generateMission() returns "[Tactical analysis unavailable]" when fetch throws', async () => {
    mockFetch.mockRejectedValue(new Error('Network failure'));
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle: makeMockOracle(),
      tacticsUrl: TACTICS_URL,
    });

    const blueprint = await orchestrator.generateMission('Pacifica');

    expect(blueprint.tacticalAnalysis).toBe('[Tactical analysis unavailable]');
  });

  it('getLoreAnchors() returns empty array when oracle throws', async () => {
    const oracle = {
      query: vi.fn().mockImplementation(() => { throw new Error('DB error'); }),
    } as any;
    const orchestrator = new MissionSwarmOrchestrator({
      clawlink: makeMockClawlink(),
      oracle,
      tacticsUrl: TACTICS_URL,
    });

    const anchors = await orchestrator.getLoreAnchors('Watson');

    expect(anchors).toEqual([]);
  });
});
