import { describe, it, expect, vi } from 'vitest';
import { NitroLogicClient } from '../../src/core/nitro-logic-client.js';

describe('NitroLogicClient: Arithmetic Stress Tests', () => {
  it('should pass high-complexity modifier stacks to Node A for calculation', async () => {
    // We mock the network call but verify the params we pass match the CP RED rule logic
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        choices: [{ 
          message: { 
            role: 'assistant',
            content: JSON.stringify({
              hit: true,
              rollTotal: 36,
              dvTarget: 15,
              rawDamage: 18,
              netDamage: 5,
              criticalInjury: true,
              reasoning: "Calculated correctly with +11 static mods."
            }) 
          } 
        }]
      })
    });
    global.fetch = fetchMock;

    const logicClient = new NitroLogicClient({
      baseUrl: 'http://localhost:8080/v1',
      model: 'test-model',
      timeoutMs: 1000,
      seed: 42
    });

    const result = await logicClient.resolveAttack({
      attackerRef: 8,
      attackerSkill: 6,
      weaponDamage: '5d6',
      weaponArmorPiercing: true,
      defenderRef: 6,
      defenderSP: 13,
      rangeBand: 'medium',
      modifiers: -3 // (+2 smartgun - 2 visibility - 4 wounded + 1 aim)
    });

    expect(result.hit).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        body: expect.stringContaining('-3')
      })
    );
  });
});
