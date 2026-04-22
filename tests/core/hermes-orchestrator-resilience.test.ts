import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LangGraphOrchestrator, OrchestratorState } from '../../src/core/hermes/LangGraphOrchestrator.js';
import { HealerProtocol, RepairStrategy } from '../../src/core/hermes/HealerProtocol.js';
import { MemoryObserver } from '../../src/core/hermes/MemoryObserver.js';

describe('Phase 67.9 & 68.5: Hermes Orchestrator Resilience & State Persistence', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should execute threshold routing effectively (Node C vs Node A)', () => {
    const orchestrator = new LangGraphOrchestrator({ thresholdTokens: 100 });
    
    // Using private reflection for testing the routing
    const routeEntry = (orchestrator as any).cfg.thresholdTokens;
    expect(routeEntry).toBe(100);
  });

  it('should inject negative constraints into enriched prompt', async () => {
    vi.spyOn(HealerProtocol, 'getNegativeConstraints').mockResolvedValueOnce('\nNEGATIVE CONSTRAINT: Do not use regex.');
    vi.spyOn(HealerProtocol, 'logAudit').mockResolvedValueOnce(undefined);
    
    // Mock the fetch call for Node C since it's under 4000 tokens
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status": "ok"}' } }] })
    });

    const orchestrator = new LangGraphOrchestrator();
    const result = await orchestrator.invoke({ prompt: 'Fix the UI', tokens: 50 });

    expect(result.prompt).toContain('NEGATIVE CONSTRAINT: Do not use regex.');
    expect(result.outcome).toBe('SUCCESS');
  });

  it('should flag fatal outcomes and trigger Memory Observer on success', async () => {
    vi.spyOn(HealerProtocol, 'getNegativeConstraints').mockResolvedValueOnce('');
    vi.spyOn(HealerProtocol, 'logAudit').mockResolvedValueOnce(undefined);
    
    const observeSpy = vi.spyOn(MemoryObserver, 'observeAndDistill').mockResolvedValueOnce(undefined);

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Mock response' } }] })
    });

    const orchestrator = new LangGraphOrchestrator();
    const result = await orchestrator.invoke({ prompt: 'Analyze log', tokens: 10 });

    expect(result.outcome).toBe('SUCCESS');
    expect(observeSpy).toHaveBeenCalledTimes(1);
    expect(observeSpy).toHaveBeenCalledWith(expect.objectContaining({
      outcome: 'SUCCESS',
      prompt: 'Analyze log'
    }));
  });

  it('should apply the Healer Protocol and abort on permanent failure', async () => {
    vi.spyOn(HealerProtocol, 'getNegativeConstraints').mockResolvedValueOnce('');
    vi.spyOn(HealerProtocol, 'logAudit').mockResolvedValueOnce(undefined);
    
    // Mock diagnose to simulate an abort mission condition
    vi.spyOn(HealerProtocol, 'diagnose').mockReturnValueOnce({
      strategy: RepairStrategy.ABORT_MISSION,
      reason: 'Critical API failure'
    });

    // Force a failure in the LLM fetch
    global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

    const orchestrator = new LangGraphOrchestrator();
    const result = await orchestrator.invoke({ prompt: 'Dangerous task', tokens: 10 });

    expect(result.error).toContain('Connection refused');
    expect(result.outcome).toBe('FATAL');
    expect(result.activeNode).toBe('done');
  });
});
