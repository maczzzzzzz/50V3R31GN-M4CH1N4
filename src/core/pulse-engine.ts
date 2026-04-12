/**
 * src/core/pulse-engine.ts
 *
 * PulseEngine — Cryotank Skip / Capture Consequence (Phase 5 Red Trade)
 *                + Phase 46 Pulse Propagation
 *
 * Phase 5: Implements the "Capture & Cryotank Skip" mechanic.
 * Phase 46: propagatePulse() scans duel_history to update sovereignty_depth
 *   and faction friction_pool based on Governance Duel outcomes.
 */

import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { INitroLogicClient } from './interfaces.js';
import { TimeSkipResultSchema, type TimeSkipResult } from '../shared/schemas/red-trade.schema.js';

interface DuelFactionSummary {
  faction: string | null;
  machina_wins: number; // VETO outcomes (Machina authority upheld)
  human_wins: number;   // DEFER + PASS outcomes (Human operator prevails)
}

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

  /**
   * Phase 46: Pulse Propagation — scan duel_history and apply weighting shifts.
   *
   * 1. Recalculate sovereignty_depth from global duel win/loss ratio.
   * 2. For each faction with losing Machina authority duels, increment friction_pool.
   *
   * Should be called on each Pulse tick or /pulse command invocation.
   */
  propagatePulse(): void {
    const db = this.oracle.getRawDatabase();

    // ── 1. Recalculate sovereignty_depth ──────────────────────────────────────
    const globalTotals = db.prepare(`
      SELECT
        SUM(CASE WHEN result = 'VETO' THEN 1 ELSE 0 END)           AS machina_wins,
        SUM(CASE WHEN result IN ('DEFER', 'PASS') THEN 1 ELSE 0 END) AS human_wins
      FROM duel_history
    `).get() as { machina_wins: number | null; human_wins: number | null };

    const mWins = globalTotals.machina_wins ?? 0;
    const hWins = globalTotals.human_wins ?? 0;
    const total = mWins + hWins;

    if (total > 0) {
      const depth = parseFloat((mWins / total).toFixed(4));
      db.prepare(`UPDATE system_state SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = 'sovereignty_depth'`)
        .run(String(depth));
    }

    // ── 2. Faction Ripple — increase friction for factions where Machina lost ──
    const factionSummaries = db.prepare(`
      SELECT
        faction,
        SUM(CASE WHEN result = 'VETO' THEN 1 ELSE 0 END)            AS machina_wins,
        SUM(CASE WHEN result IN ('DEFER', 'PASS') THEN 1 ELSE 0 END) AS human_wins
      FROM duel_history
      WHERE faction IS NOT NULL
      GROUP BY faction
    `).all() as DuelFactionSummary[];

    const frictionStmt = db.prepare(`
      UPDATE factions
      SET friction_pool = MIN(10, friction_pool + ?)
      WHERE name = ?
    `);

    const applyFriction = db.transaction((summaries: DuelFactionSummary[]) => {
      for (const row of summaries) {
        if (row.faction == null) continue;
        // Each human win against a Machina-authority duel for this faction adds +1 friction
        if (row.human_wins > 0) {
          frictionStmt.run(row.human_wins, row.faction);
        }
      }
    });

    applyFriction(factionSummaries);
  }
}
