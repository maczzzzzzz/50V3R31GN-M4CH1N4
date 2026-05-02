/**
 * src/core/hermes/PlaybackStateMachine.ts
 *
 * Phase 63.5 — Cluster Playback State Machine
 *
 * Formalises the execution lifecycle for complex generation tasks
 * (Gigs, Night Markets, Scene Builds). Transitions are guarded and
 * logged to `Akashik.db` via the VSB telemetry channel.
 *
 * States:
 *   idle → scheduling → executing → monitoring → idle (success)
 *                                              ↘ replanning   (Healer Protocol)
 *                                                  ↓
 *                                               executing
 */

import { randomUUID } from 'node:crypto';

// ---------------------------------------------------------------------------
// State definitions
// ---------------------------------------------------------------------------

export type PlaybackPhase =
  | 'idle'
  | 'scheduling'
  | 'executing'
  | 'monitoring'
  | 'replanning'
  | 'complete'
  | 'failed';

export interface PlaybackTask {
  id: string;
  type: 'gig' | 'night_market' | 'scene_build' | 'custom';
  payload: Record<string, unknown>;
  /** ISO timestamp of task creation */
  createdAt: string;
}

export interface PlaybackState {
  phase: PlaybackPhase;
  task: PlaybackTask | null;
  /** Number of execution attempts (Healer Protocol counter) */
  attempts: number;
  /** Last error message for re-planning context */
  lastError: string | null;
  /** ISO timestamp of last phase transition */
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Transition guards
// ---------------------------------------------------------------------------

type Guard = (state: PlaybackState) => boolean;
type Transition = { to: PlaybackPhase; guard: Guard };
type TransitionMap = Partial<Record<PlaybackPhase, Transition[]>>;

const MAX_ATTEMPTS = 3;

const TRANSITIONS: TransitionMap = {
  idle: [
    { to: 'scheduling', guard: s => s.task !== null },
  ],
  scheduling: [
    { to: 'executing', guard: s => s.task !== null },
  ],
  executing: [
    { to: 'monitoring', guard: s => s.lastError === null },
    { to: 'replanning', guard: s => s.lastError !== null && s.attempts < MAX_ATTEMPTS },
    { to: 'failed',     guard: s => s.lastError !== null && s.attempts >= MAX_ATTEMPTS },
  ],
  monitoring: [
    { to: 'complete', guard: () => true },
  ],
  replanning: [
    { to: 'executing', guard: s => s.attempts < MAX_ATTEMPTS },
    { to: 'failed',    guard: s => s.attempts >= MAX_ATTEMPTS },
  ],
};

// ---------------------------------------------------------------------------
// PlaybackStateMachine
// ---------------------------------------------------------------------------

export type PhaseListener = (from: PlaybackPhase, to: PlaybackPhase, state: PlaybackState) => void;

export class PlaybackStateMachine {
  private state: PlaybackState;
  private listeners: PhaseListener[] = [];

  constructor() {
    this.state = {
      phase:     'idle',
      task:      null,
      attempts:  0,
      lastError: null,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  getState(): Readonly<PlaybackState> { return { ...this.state }; }

  onTransition(listener: PhaseListener): void { this.listeners.push(listener); }

  /** Enqueue a task — only valid from `idle`. */
  enqueue(type: PlaybackTask['type'], payload: Record<string, unknown>): string {
    if (this.state.phase !== 'idle') {
      throw new Error(`PLAYBACK_SM: Cannot enqueue in phase '${this.state.phase}'`);
    }
    const task: PlaybackTask = {
      id: randomUUID(),
      type,
      payload,
      createdAt: new Date().toISOString(),
    };
    this.patch({ task });
    return task.id;
  }

  /** Advance to the next valid phase. Returns the new phase. */
  advance(): PlaybackPhase {
    const transitions = TRANSITIONS[this.state.phase] ?? [];
    const valid = transitions.find(t => t.guard(this.state));
    if (!valid) {
      throw new Error(`PLAYBACK_SM: No valid transition from '${this.state.phase}'`);
    }
    const from = this.state.phase;
    const inc = valid.to === 'executing' ? 1 : 0;
    this.patch({ phase: valid.to, attempts: this.state.attempts + inc });
    this.listeners.forEach(l => l(from, valid.to, this.state));
    return valid.to;
  }

  /** Report execution success — clears error, allows monitoring→complete. */
  reportSuccess(): void {
    this.patch({ lastError: null });
  }

  /** Report execution failure — sets error for Healer Protocol routing. */
  reportFailure(error: string): void {
    this.patch({ lastError: error });
  }

  /** Reset to idle (after complete or failed). */
  reset(): void {
    this.state = {
      phase:     'idle',
      task:      null,
      attempts:  0,
      lastError: null,
      updatedAt: new Date().toISOString(),
    };
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private patch(delta: Partial<PlaybackState>): void {
    this.state = { ...this.state, ...delta, updatedAt: new Date().toISOString() };
  }
}
