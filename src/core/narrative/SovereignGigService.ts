/**
 * src/core/narrative/SovereignGigService.ts
 * Phase 60: Sovereign Gig Service — procedural mission / screamsheet generator.
 *
 * Generation logic:
 *   1. Query triplets for opposing factions in current district
 *   2. Select client + target NPCs from Akashik.db
 *   3. Calculate reward based on difficulty × target REZ/interface_level
 *   4. Persist to `gigs` table, return gig ID
 */

import Database from 'better-sqlite3';
import { randomUUID } from 'node:crypto';

export type GigDifficulty = 'low' | 'medium' | 'high';

export interface GeneratedGig {
  id: string;
  title: string;
  difficulty: GigDifficulty;
  client_npc_id: string | null;
  target_npc_id: string | null;
  district_id: string | null;
  reward_eb: number;
}

const GIG_VERBS = ['Extract', 'Neutralize', 'Steal from', 'Surveil', 'Protect', 'Frame', 'Rescue'];
const GIG_SUFFIXES = ['before dawn', 'without witnesses', 'clean', 'with extreme prejudice', 'quietly'];

const BASE_REWARD: Record<GigDifficulty, number> = {
  low:    500,
  medium: 1500,
  high:   4000,
};

export class SovereignGigService {
  constructor(private readonly db: Database.Database) {}

  generateGig(difficulty: GigDifficulty, districtId?: string): GeneratedGig {
    const gigId = randomUUID();

    // 1. Find opposing factions in district via triplets
    const factionRows = this.db.prepare(`
      SELECT DISTINCT t1.object_literal AS faction_a, t2.object_literal AS faction_b
      FROM triplets t1
      JOIN triplets t2 ON (t1.district_id IS t2.district_id OR t1.district_id = t2.district_id)
      WHERE t1.predicate = 'member_of' AND t2.predicate = 'member_of'
        AND t1.object_literal != t2.object_literal
        ${districtId ? 'AND t1.district_id = @district_id' : ''}
      ORDER BY RANDOM() LIMIT 1
    `).get(districtId ? { district_id: districtId } : {}) as
      { faction_a: string; faction_b: string } | undefined;

    // 2. Pick client NPC from faction_a, target from faction_b
    const clientNpc = factionRows
      ? this.db.prepare(
          'SELECT id, name FROM npcs WHERE faction = @faction AND is_alive = 1 ORDER BY RANDOM() LIMIT 1'
        ).get({ faction: factionRows.faction_a }) as { id: string; name: string } | undefined
      : undefined;

    const targetNpc = factionRows
      ? this.db.prepare(
          'SELECT id, name, interface_level, rez FROM npcs WHERE faction = @faction AND is_alive = 1 ORDER BY RANDOM() LIMIT 1'
        ).get({ faction: factionRows.faction_b }) as
          { id: string; name: string; interface_level: number; rez: number } | undefined
      : undefined;

    // 3. Calculate reward: base × difficulty multiplier + target tech premium
    const techPremium = targetNpc ? (targetNpc.interface_level + targetNpc.rez) * 50 : 0;
    const rewardEb = BASE_REWARD[difficulty] + techPremium + Math.floor(Math.random() * 200);

    // 4. Generate title
    const verb = GIG_VERBS[Math.floor(Math.random() * GIG_VERBS.length)]!;
    const suffix = GIG_SUFFIXES[Math.floor(Math.random() * GIG_SUFFIXES.length)]!;
    const title = targetNpc
      ? `${verb} ${targetNpc.name} ${suffix}`
      : `${verb} the mark ${suffix}`;

    // 5. Persist
    this.db.prepare(`
      INSERT INTO gigs (id, title, client_npc_id, target_npc_id, district_id, reward_eb, status)
      VALUES (@id, @title, @client_npc_id, @target_npc_id, @district_id, @reward_eb, 'available')
    `).run({
      id: gigId,
      title,
      client_npc_id: clientNpc?.id ?? null,
      target_npc_id: targetNpc?.id ?? null,
      district_id: districtId ?? null,
      reward_eb: rewardEb,
    });

    return {
      id: gigId,
      title,
      difficulty,
      client_npc_id: clientNpc?.id ?? null,
      target_npc_id: targetNpc?.id ?? null,
      district_id: districtId ?? null,
      reward_eb: rewardEb,
    };
  }

  /** Generate a screamsheet (batch of gigs for a district briefing). */
  generateScreamsheet(districtId: string, count: number = 3): GeneratedGig[] {
    const difficulties: GigDifficulty[] = ['low', 'medium', 'high'];
    const gigs: GeneratedGig[] = [];
    for (let i = 0; i < count; i++) {
      const diff = difficulties[i % difficulties.length]!;
      gigs.push(this.generateGig(diff, districtId));
    }
    return gigs;
  }
}
