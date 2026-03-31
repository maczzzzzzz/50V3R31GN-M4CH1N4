/**
 * src/core/pulse-engine.ts
 *
 * PulseEngine — Cryotank Skip / Capture Consequence (Phase 5 Red Trade)
 *
 * Implements the "Capture & Cryotank Skip" mechanic from the spec:
 *   1. Advance time by 1d6 months (caller provides the roll).
 *   2. Calculate rent debt: monthly_rent_eb × months.
 *   3. If eb_balance < debt → EVICTION: housing_tier = 'street', balance = 0.
 *   4. Else deduct rent from eb_balance.
 *   5. Dispatch two Punitive BD rolls to Node A (Humanity + Addiction checks).
 *   6. Return a validated TimeSkipResult.
 */

import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { INitroLogicClient } from './interfaces.js';
import { TimeSkipResultSchema, type TimeSkipResult } from '../shared/schemas/red-trade.schema.js';

export class PulseEngine {
  constructor(
    private readonly oracle: UnifiedOracleClient,
    private readonly nitroLogic: INitroLogicClient,
  ) {}

  /**
   * Execute a time-skip of `months` for the given actor.
   * Reads and writes housing state from world.db.
   * Calls Node A twice for Punitive BD rolls (Humanity + Addiction).
   */
  async timeSkip(actorId: string, months: number): Promise<TimeSkipResult> {
    // 1. Read current housing state (fallback to street if none)
    const housing = this.oracle.getPlayerHousing(actorId);
    const tier = housing?.housing_tier ?? 'street';
    const rentPerMonth = housing?.monthly_rent_eb ?? 0;
    const balance = housing?.eb_balance ?? 0;

    // 2. Calculate debt
    const rentDebt = rentPerMonth * months;

    // 3. Determine eviction or deduct
    const evicted = balance < rentDebt;

    if (housing) {
      if (evicted) {
        this.oracle.updatePlayerHousing(actorId, { housing_tier: 'street', eb_balance: 0 });
      } else {
        this.oracle.updatePlayerHousing(actorId, { eb_balance: balance - rentDebt });
      }
    }

    // 4. Punitive BD rolls via Node A (Humanity + Addiction checks)
    const [humanityResult, addictionResult] = await Promise.all([
      this.nitroLogic.oracleRoll({
        expression: '1d10',
        context: 'Punitive BD — Humanity check after Cryotank Skip',
        applyLuck: false,
        luckPoints: 0,
      }),
      this.nitroLogic.oracleRoll({
        expression: '1d10',
        context: 'Punitive BD — Addiction check after Cryotank Skip',
        applyLuck: false,
        luckPoints: 0,
      }),
    ]);

    // 5. Return validated result
    return TimeSkipResultSchema.parse({
      actorId,
      monthsSkipped: months,
      evicted,
      previousHousingTier: tier,
      rentDebt,
      bdHumanityRoll: humanityResult.result,
      bdAddictionRoll: addictionResult.result,
    });
  }
}
