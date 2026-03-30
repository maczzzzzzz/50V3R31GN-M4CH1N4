/**
 * src/core/campaign-registry.ts
 *
 * Campaign Registry — TttA (Ticket to the Afterlife) Narrative Beat Definitions
 *
 * This module bootstraps the StoryEngine with the deterministic Transition Guards
 * for the "Ticket to the Afterlife Part 1" campaign arc. Each BeatConfig encodes
 * the narrative state conditions required to advance the session loop.
 *
 * Arc: "TttA Part 1 - The Afterlife Begins"
 *   Beat 1: beat-1-afterlife-meeting  → player proves competence (hit attack)
 *   Beat 2: beat-2-first-gig          → player gears up (night market purchase)
 *   Beat 3: beat-3-the-job            → terminal beat for Part 1 MVP
 *
 * Usage:
 *   const engine = new StoryEngine(createTttaPart1InitialState());
 *   bootstrapTttaPart1(engine);
 */

import type { StoryEngine, BeatConfig } from './story-engine.js';
import type { StoryState } from '../shared/schemas/story.schema.js';

// ── TttA Part 1 Beat Definitions ──────────────────────────────────────────────

/**
 * Beat 1: The Afterlife Meeting
 * The player must prove their worth to Rogue by resolving a combat encounter.
 * Transition Guard: `resolve_attack` event where the attack lands (hit=true).
 */
const beat1AfterlifeMeeting: BeatConfig = {
  id: 'beat-1-afterlife-meeting',
  transitions: [
    {
      to: 'beat-2-first-gig',
      condition: (_state: StoryState, event: any): boolean =>
        event.type === 'resolve_attack' && event.result?.hit === true,
    },
  ],
};

/**
 * Beat 2: The First Gig
 * Rogue drops the job. Player must acquire gear before heading out.
 * Transition Guard: any `buy_item` event (purchasing gear triggers the move).
 */
const beat2FirstGig: BeatConfig = {
  id: 'beat-2-first-gig',
  transitions: [
    {
      to: 'beat-3-the-job',
      condition: (_state: StoryState, event: any): boolean =>
        event.type === 'buy_item',
    },
  ],
};

/**
 * Beat 3: The Job
 * The run begins. Terminal beat for Part 1 MVP.
 * No automatic transitions — arc advancement requires GM Approval Queue.
 */
const beat3TheJob: BeatConfig = {
  id: 'beat-3-the-job',
  transitions: [],
};

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Register all TttA Part 1 narrative beats into the provided StoryEngine.
 * Must be called immediately after constructing the engine with
 * `createTttaPart1InitialState()`.
 */
export function bootstrapTttaPart1(engine: StoryEngine): void {
  engine.registerBeat(beat1AfterlifeMeeting);
  engine.registerBeat(beat2FirstGig);
  engine.registerBeat(beat3TheJob);
}

/**
 * Create the canonical initial StoryState for TttA Part 1.
 * Pass this to `new StoryEngine(state)` before calling `bootstrapTttaPart1`.
 */
export function createTttaPart1InitialState(): StoryState {
  return {
    currentArc: 'TttA Part 1 - The Afterlife Begins',
    currentBeat: 'beat-1-afterlife-meeting',
    completedBeats: [],
    worldState: {},
    eagleBalance: 0,
  };
}
