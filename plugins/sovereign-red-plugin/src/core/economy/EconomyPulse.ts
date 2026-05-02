/**
 * src/core/economy/EconomyPulse.ts
 * Phase 60: Economy Pulse — tracks in-game time and applies Monthly Burn
 * (Lifestyle + Housing rent siphoning) from player_housing balances.
 *
 * In-game time is stored in system_state under 'ingame_day' (integer day counter).
 * Monthly burn fires every 30 in-game days.
 */

import Database from 'better-sqlite3';

const LIFESTYLE_COSTS: Record<string, number> = {
  street:    0,    // Scraping by
  coffin:    500,  // Coffin hotel
  apartment: 1000, // Kept apartment
  luxury:    3000, // High-end luxury
};

export interface BurnResult {
  actor_id: string;
  housing_tier: string;
  rent_charged: number;
  new_balance: number;
  in_debt: boolean;
}

export class EconomyPulse {
  constructor(private readonly db: Database.Database) {}

  // ---------------------------------------------------------------------------
  // In-game time
  // ---------------------------------------------------------------------------

  getCurrentDay(): number {
    const row = this.db.prepare(
      "SELECT value FROM system_state WHERE key = 'ingame_day'"
    ).get() as { value: string } | undefined;
    return row ? parseInt(row.value, 10) : 0;
  }

  advanceDay(days: number = 1): number {
    const current = this.getCurrentDay();
    const next = current + days;
    this.db.prepare(`
      INSERT OR REPLACE INTO system_state (key, value, updated_at)
      VALUES ('ingame_day', @value, CURRENT_TIMESTAMP)
    `).run({ value: String(next) });
    return next;
  }

  /** Returns true if a monthly burn should fire (every 30 in-game days). */
  isMonthEnd(day: number): boolean {
    return day > 0 && day % 30 === 0;
  }

  // ---------------------------------------------------------------------------
  // Monthly Burn
  // ---------------------------------------------------------------------------

  /**
   * Apply rent + lifestyle costs to all tracked actors.
   * Actors that go negative accumulate debt (balance may be negative).
   */
  applyMonthlyBurn(): BurnResult[] {
    const actors = this.db.prepare(
      'SELECT actor_id, housing_tier, monthly_rent_eb, eb_balance FROM player_housing'
    ).all() as { actor_id: string; housing_tier: string; monthly_rent_eb: number; eb_balance: number }[];

    const updateBalance = this.db.prepare(`
      UPDATE player_housing SET eb_balance = @balance WHERE actor_id = @actor_id
    `);

    const insertTriplet = this.db.prepare(`
      INSERT OR IGNORE INTO triplets (subject_id, predicate, object_literal, district_id)
      VALUES (@subject_id, @predicate, @object_literal, NULL)
    `);

    const results: BurnResult[] = [];

    const doburn = this.db.transaction(() => {
      for (const actor of actors) {
        const lifestyleCost = LIFESTYLE_COSTS[actor.housing_tier] ?? 0;
        const totalBurn = actor.monthly_rent_eb + lifestyleCost;
        const newBalance = actor.eb_balance - totalBurn;
        const inDebt = newBalance < 0;

        updateBalance.run({ balance: newBalance, actor_id: actor.actor_id });

        if (inDebt) {
          insertTriplet.run({
            subject_id: actor.actor_id,
            predicate: 'in_debt',
            object_literal: String(Math.abs(newBalance)),
          });
        }

        results.push({
          actor_id: actor.actor_id,
          housing_tier: actor.housing_tier,
          rent_charged: totalBurn,
          new_balance: newBalance,
          in_debt: inDebt,
        });
      }
    });

    doburn();
    return results;
  }

  /**
   * Tick — advance day, fire monthly burn if month boundary hit.
   * Call this once per in-game day passage.
   */
  tick(days: number = 1): { day: number; burnFired: boolean; burnResults: BurnResult[] } {
    const newDay = this.advanceDay(days);
    if (this.isMonthEnd(newDay)) {
      const burnResults = this.applyMonthlyBurn();
      console.log(`::/5Y573M-N071C3 : EconomyPulse — MONTHLY_BURN day=${newDay} actors=${burnResults.length}`);
      return { day: newDay, burnFired: true, burnResults };
    }
    return { day: newDay, burnFired: false, burnResults: [] };
  }
}
