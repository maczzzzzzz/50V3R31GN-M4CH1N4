import { describe, it, expect, vi } from 'vitest';
import { OnboardingController, InterviewState } from '../../src/core/onboarding-controller.js';
import type { INitroLogicClient, ISovereignNarrativeClient } from '../../src/core/interfaces.js';
import type { UnifiedOracleClient } from '../../src/db/unified-oracle-client.js';

describe('Phase 5.3 Expert Stress Tests', () => {
  const mockNitro = {} as INitroLogicClient;
  const mockSovereignNarrative = {} as ISovereignNarrativeClient;
  const mockOracle = {
    isConnected: () => true,
    execute: vi.fn(),
  } as unknown as UnifiedOracleClient;

  it('BREAK TEST: Stat Distribution Cap (CP Red Creation Rules)', async () => {
    const controller = new OnboardingController({
      nitroLogicClient: mockNitro,
      sovereignNarrativeClient: mockSovereignNarrative,
      unifiedOracle: mockOracle
    });

    // Manually force state to STATS to skip async network rolls
    (controller as any).session.state = InterviewState.STATS;

    // Major League: 80 points. 10 stats.
    // Logic: 80 / 10 = 8. Base = 8. Remainder = 0.
    const result = await controller.setStats('Major League');
    
    // VERIFICATION: In CP Red, stats cannot exceed 8 at character creation (usually).
    // Our logic is simple distribution. Let's see if any stat hit 9+.
    const stats = result.stats;
    Object.values(stats).forEach(val => {
      expect(val).toBeLessThanOrEqual(8);
    });
  });

  it('BREAK TEST: LUCK Overflow Remainder Logic', async () => {
    const controller = new OnboardingController({
      nitroLogicClient: mockNitro,
      sovereignNarrativeClient: mockSovereignNarrative,
      unifiedOracle: mockOracle
    });

    (controller as any).session.state = InterviewState.STATS;

    // Test a custom point total if we ever supported it (e.g. 85 points)
    // Currently STAT_POINTS is private/constant. Let's check the Remainder allocation.
    const result = await controller.setStats('Major League');
    
    // Remainder calculation: totalPoints - (base * count)
    // 80 - (8 * 10) = 0.
    expect(result.stats.LUCK).toBe(8);
  });

  it('BREAK TEST: Parallel Session Race Condition', async () => {
    const controller1 = new OnboardingController({ nitroLogicClient: mockNitro, sovereignNarrativeClient: mockSovereignNarrative, unifiedOracle: mockOracle });
    const controller2 = new OnboardingController({ nitroLogicClient: mockNitro, sovereignNarrativeClient: mockSovereignNarrative, unifiedOracle: mockOracle });

    expect(controller1.getSession().sessionId).not.toBe(controller2.getSession().sessionId);
  });
});
