/**
 * src/core/onboarding-controller.ts
 *
 * OnboardingController — Phase 5.3: Character Creation Interview
 *
 * Manages a single character-creation interview session for a Cyberpunk RED
 * player. The session is driven by a state machine that progresses through:
 *
 *   INITIAL → VIBE_CHECK → LIFEPATH → STATS → REVIEW → FINALIZED
 *
 * Each LIFEPATH roll calls Node A (nitro-logic) for deterministic 1d10 results,
 * passes the roll context to Node B (Mistral-Nemo via SovereignNarrativeClient) for
 * interview dialogue, and persists discovered NPCs/gangs into the
 * player_friends_enemies table via UnifiedOracleClient.
 *
 * Architecture:
 *   - nitro-logic (Node A): oracleRoll("1d10") for all table rolls
 *   - Mistral-Nemo (Node B): dialogue generation via ISovereignNarrativeClient
 *   - UnifiedOracleClient: RKG writes (npcs + player_friends_enemies)
 */

import { randomUUID } from 'node:crypto';
import type { INitroLogicClient, ISovereignNarrativeClient } from './interfaces.js';
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';
import type { BaseStatBlock } from '../types/stats.js';

// ── State Machine ──────────────────────────────────────────────────────────────

export enum InterviewState {
  INITIAL    = 'INITIAL',
  VIBE_CHECK = 'VIBE_CHECK',
  LIFEPATH   = 'LIFEPATH',
  STATS      = 'STATS',
  REVIEW     = 'REVIEW',
  FINALIZED  = 'FINALIZED',
}

// ── Build Types ────────────────────────────────────────────────────────────────

export type BuildType = 'Standard' | 'Major League';

/** Standard: 62-point spread. Major League: 80-point spread. */
const STAT_POINTS: Record<BuildType, number> = {
  'Standard':     62,
  'Major League': 80,
};

// ── Lifepath tables (Cyberpunk RED core rules, simplified) ─────────────────────

function mapFamilyBackground(roll: number): string {
  if (roll <= 2)  return 'Corporate (parents worked for a Megacorp)';
  if (roll <= 4)  return 'Nomad (family was a road clan)';
  if (roll <= 6)  return 'Street (raised on the streets of Night City)';
  if (roll <= 8)  return 'Boostergang (family ran with a gang)';
  return 'Combat Zone Survivor (family lost everything)';
}

function mapFamilyTragedy(roll: number): string {
  if (roll <= 2)  return 'Parents killed (now an enemy out there)';
  if (roll <= 4)  return 'Parent imprisoned (contact in trouble)';
  if (roll <= 6)  return 'Family scattered (friend somewhere out there)';
  if (roll <= 8)  return 'Sibling rivalry (an enemy close to home)';
  return 'Abandoned (no family — one ally met on the streets)';
}

/** Night City name pool — deterministic flavor, seeded by roll result. */
const NIGHT_CITY_NAMES = [
  'Jacinda Mox',   'Reno Vance',     'Sable "Hex" Park',  'Dmitri Volkov',
  'Lyra Chen',     'Tomás Reyes',    'Yuki Tanaka',        'Brick Nakamura',
  'Nadia Okafor',  'Slate Morrison',
];

function generateNightCityName(roll: number): string {
  const idx = (roll - 1) % NIGHT_CITY_NAMES.length;
  const name = NIGHT_CITY_NAMES[idx];
  return name ?? NIGHT_CITY_NAMES[0] ?? 'Unknown Edgerunner';
}

// ── Interview NPC Selection ────────────────────────────────────────────────────

function selectInterviewNPC(background: string): string {
  if (/corporate/i.test(background)) {
    return 'Rogue (high-tier fixer contact, Chrome Aces, All Foods Market)';
  }
  return 'Viktor Vector (district Fixer, Watson clinic)';
}

// ── Result types ───────────────────────────────────────────────────────────────

export interface LifepathResult {
  readonly familyBackground: string;
  readonly familyTragedy:    string;
  readonly friend:           string;
  readonly enemy:            string;
  readonly interviewNPC:     string;
  readonly dialogue:         string;
}

export interface StatBlock extends BaseStatBlock {}

export interface StatsResult {
  readonly buildType: BuildType;
  readonly stats:     StatBlock;
}

export interface OnboardingSession {
  readonly sessionId:    string;
  state:                 InterviewState;
  lifepath:              LifepathResult | null;
  buildType:             BuildType | null;
  stats:                 StatBlock | null;
}

// ── Constructor options ────────────────────────────────────────────────────────

export interface OnboardingControllerOptions {
  readonly nitroLogicClient: INitroLogicClient;
  readonly sovereignNarrativeClient:     ISovereignNarrativeClient;
  readonly unifiedOracle:    UnifiedOracleClient;
}

// ── Implementation ─────────────────────────────────────────────────────────────

export class OnboardingController {
  private readonly nitroLogic: INitroLogicClient;
  private readonly sovereignNarrative:      ISovereignNarrativeClient;
  private readonly oracle:      UnifiedOracleClient;

  private readonly session: OnboardingSession;

  constructor({ nitroLogicClient, sovereignNarrativeClient, unifiedOracle }: OnboardingControllerOptions) {
    this.nitroLogic = nitroLogicClient;
    this.sovereignNarrative     = sovereignNarrativeClient;
    this.oracle     = unifiedOracle;

    this.session = {
      sessionId: randomUUID(),
      state:     InterviewState.INITIAL,
      lifepath:  null,
      buildType: null,
      stats:     null,
    };
  }

  // ── Public state accessors ──────────────────────────────────────────────────

  getState(): InterviewState {
    return this.session.state;
  }

  getSession(): OnboardingSession {
    return this.session;
  }

  // ── State machine transitions ───────────────────────────────────────────────

  /**
   * Begin the interview. Transitions INITIAL → VIBE_CHECK.
   */
  async startInterview(): Promise<void> {
    this.assertState(InterviewState.INITIAL, 'startInterview');

    // Phase 28: Visual Immersion — Neural Handshake
    // We assume the storyEngine has the adapter (Task 1 Remediation)
    if (this.session.state === InterviewState.INITIAL) {
       process.stdout.write('📡 50V3R31GN-M4CH1N4: N3UR4L H4ND5H4K3 1N1714L1Z3D\n');
    }

    this.session.state = InterviewState.VIBE_CHECK;
  }

  /**
   * Advance to the Lifepath section. Transitions VIBE_CHECK → LIFEPATH.
   */
  async advanceToLifepath(): Promise<void> {
    this.assertState(InterviewState.VIBE_CHECK, 'advanceToLifepath');
    this.session.state = InterviewState.LIFEPATH;
  }

  /**
   * Execute all Lifepath rolls and generate interview dialogue.
   * Transitions LIFEPATH → STATS.
   *
   * Rolls (all via nitro-logic oracleRoll "1d10"):
   *   1. Family Background table
   *   2. Family Tragedy table
   *   3. Friends table (NPC name)
   *   4. Enemies table (NPC name)
   *
   * Node B (Mistral-Nemo) weaves results into character interview dialogue.
   * Discovered NPCs are persisted into world.db (npcs + player_friends_enemies).
   */
  async rollLifepath(): Promise<LifepathResult> {
    this.assertState(InterviewState.LIFEPATH, 'rollLifepath');

    // ── Step 1: Roll all tables via Node A ────────────────────────────────────
    const rollParams = { expression: '1d10', applyLuck: false, luckPoints: 0 } as const;

    const [bgRoll, tragedyRoll, friendRoll, enemyRoll] = await Promise.all([
      this.nitroLogic.oracleRoll(rollParams),
      this.nitroLogic.oracleRoll(rollParams),
      this.nitroLogic.oracleRoll(rollParams),
      this.nitroLogic.oracleRoll(rollParams),
    ]);

    // ── Step 2: Map rolls to Lifepath flavour ─────────────────────────────────
    const familyBackground = mapFamilyBackground(bgRoll.result);
    const familyTragedy    = mapFamilyTragedy(tragedyRoll.result);
    const friendName       = generateNightCityName(friendRoll.result);
    const enemyName        = generateNightCityName(enemyRoll.result);

    const interviewNPC = selectInterviewNPC(familyBackground);

    // ── Step 3: Node B dialogue generation ───────────────────────────────────
    const context = [
      `Family Background: ${familyBackground}`,
      `Family Tragedy: ${familyTragedy}`,
      `Friend: ${friendName}`,
      `Enemy: ${enemyName}`,
      `Interview NPC: ${interviewNPC}`,
    ].join('\n');

    const prompt =
      'You are a Cyberpunk RED GM. Generate 2-3 sentences of in-character interview dialogue ' +
      'from the interviewing Fixer/contact to the new player character, referencing their ' +
      'Lifepath history naturally. Keep it atmospheric and terse — Night City style.';

    let dialogue: string;
    try {
      dialogue = await this.sovereignNarrative.generateNarrative(prompt, context, 'Cyberpunk RED character creation interview.');
    } catch {
      // Immersion-safe fallback — never leave the interview silent
      dialogue = `${interviewNPC.split('(')[0]?.trim() ?? 'The fixer'} nods slowly, absorbing your history. "Rough start. This city chews up kids like you — unless they're smart." The chrome eyes linger. "Let's see if you're smart."`;
    }

    // ── Step 4: Persist to RKG ────────────────────────────────────────────────
    const friendId = `npc-friend-${randomUUID()}`;
    const enemyId  = `npc-enemy-${randomUUID()}`;

    if (this.oracle.isConnected()) {
      this.persistNpcAndRelationship(friendId, friendName, 'friend');
      this.persistNpcAndRelationship(enemyId, enemyName, 'enemy');
    }

    // ── Step 5: Store result and advance state ────────────────────────────────
    const result: LifepathResult = {
      familyBackground,
      familyTragedy,
      friend:       friendName,
      enemy:        enemyName,
      interviewNPC,
      dialogue,
    };

    this.session.lifepath = result;
    this.session.state    = InterviewState.STATS;

    return result;
  }

  /**
   * Assign the character build type and distribute stat points.
   * Transitions STATS → REVIEW.
   *
   * Standard:     62 points
   * Major League: 80 points
   *
   * Points are distributed evenly (floor), with remainder allocated to LUCK.
   */
  async setStats(buildType: BuildType): Promise<StatsResult> {
    this.assertState(InterviewState.STATS, 'setStats');

    const totalPoints = STAT_POINTS[buildType];
    const statKeys: (keyof StatBlock)[] = ['INT', 'REF', 'DEX', 'TECH', 'COOL', 'WILL', 'LUCK', 'MOVE', 'BODY', 'EMP'];
    const count   = statKeys.length;
    const base    = Math.floor(totalPoints / count);
    const remainder = totalPoints - (base * count);

    const stats: StatBlock = {
      INT:  base,
      REF:  base,
      DEX:  base,
      TECH: base,
      COOL: base,
      WILL: base,
      LUCK: base + remainder,   // Remainder goes to LUCK
      MOVE: base,
      BODY: base,
      EMP:  base,
    };

    this.session.buildType = buildType;
    this.session.stats     = stats;
    this.session.state     = InterviewState.REVIEW;

    return { buildType, stats };
  }

  /**
   * Finalize the character. Transitions REVIEW → FINALIZED.
   */
  async finalizeCharacter(): Promise<OnboardingSession> {
    this.assertState(InterviewState.REVIEW, 'finalizeCharacter');
    this.session.state = InterviewState.FINALIZED;
    return this.session;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Guard: ensure the controller is in the expected state before a transition.
   * Throws a descriptive error if not — preventing out-of-order calls.
   */
  private assertState(expected: InterviewState, method: string): void {
    if (this.session.state !== expected) {
      throw new Error(
        `OnboardingController.${method}(): invalid state transition — ` +
        `expected ${expected}, got ${this.session.state}.`
      );
    }
  }

  /**
   * Insert an NPC into the npcs table and link them into player_friends_enemies.
   * The FK constraint requires the npcs insert to happen first.
   */
  private persistNpcAndRelationship(
    npcId: string,
    name: string,
    relationship: 'friend' | 'enemy',
  ): void {
    // 1. Insert NPC (required for FK)
    this.oracle.execute(
      `INSERT OR IGNORE INTO npcs (id, name, disposition) VALUES (?, ?, ?)`,
      [npcId, name, relationship === 'friend' ? 'friendly' : 'hostile'],
    );

    // 2. Link into player_friends_enemies
    this.oracle.execute(
      `INSERT OR REPLACE INTO player_friends_enemies (entity_id, type) VALUES (?, ?)`,
      [npcId, relationship],
    );
  }
}
