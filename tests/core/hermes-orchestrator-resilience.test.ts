import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HermesSingularity } from '../../src/core/hermes/HermesSingularity.js';
import { HealerProtocol, RepairStrategy } from '../../src/core/hermes/HealerProtocol.js';
import { MemoryObserver } from '../../src/core/hermes/MemoryObserver.js';

describe('Phase 93 & 97: Hermes Singularity Resilience & Context-DAG', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should instantiate HermesSingularity and maintain a Context-DAG', async () => {
    vi.spyOn(HealerProtocol, 'getNegativeConstraints').mockResolvedValueOnce('');
    vi.spyOn(HealerProtocol, 'logAudit').mockResolvedValueOnce(undefined);
    vi.spyOn(MemoryObserver, 'observeAndDistill').mockResolvedValueOnce(undefined);
    
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: 'Mock' } }] })
    });

    const orchestrator = new HermesSingularity();
    expect(orchestrator.getDAG()).toBeDefined();
    
    const input = { prompt: 'Test reasoning', thread_id: 'test-thread' };
    await orchestrator.invoke(input);
    
    const nodeCount = orchestrator.getDAG().getAllNodes().length;
    expect(nodeCount).toBeGreaterThan(0);
  });

  it('should inject negative constraints into enriched prompt', async () => {
    vi.spyOn(HealerProtocol, 'getNegativeConstraints').mockResolvedValueOnce('\nNEGATIVE CONSTRAINT: Do not use regex.');
    vi.spyOn(HealerProtocol, 'logAudit').mockResolvedValueOnce(undefined);
    
    // Mock the fetch call for Node C since it's under 4000 tokens
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ choices: [{ message: { content: '{"status": "ok"}' } }] })
    });

    const orchestrator = new HermesSingularity();
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

    const orchestrator = new HermesSingularity();
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

    const orchestrator = new HermesSingularity();
    const result = await orchestrator.invoke({ prompt: 'Dangerous task', tokens: 10 });

    expect(result.error).toContain('Connection refused');
    expect(result.outcome).toBe('FATAL');
    expect(result.activeNode).toBe('done');
  });
});
