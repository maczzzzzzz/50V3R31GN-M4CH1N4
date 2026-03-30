// src/core/story-engine.ts
import type { StoryState } from '../shared/schemas/story.schema.js';

export interface BeatConfig {
  id: string;
  transitions: {
    to: string;
    condition: (state: StoryState, event: any) => boolean;
  }[];
}

export interface TransitionResult {
  transitioned: boolean;
  oldBeat?: string;
  newBeat?: string;
}

export class StoryEngine {
  private beats: Map<string, BeatConfig> = new Map();

  constructor(private state: StoryState) {}

  /**
   * Register a narrative beat with its transition guards.
   */
  registerBeat(config: BeatConfig): void {
    this.beats.set(config.id, config);
  }

  /**
   * Evaluate an event against the current beat's transition guards.
   */
  evaluateEvent(event: any): TransitionResult {
    const currentId = this.state.currentBeat;
    const currentConfig = this.beats.get(currentId);

    if (!currentConfig) {
      return { transitioned: false };
    }

    for (const transition of currentConfig.transitions) {
      if (transition.condition(this.state, event)) {
        this.state.currentBeat = transition.to;
        this.state.completedBeats.push(currentId);
        
        return {
          transitioned: true,
          oldBeat: currentId,
          newBeat: transition.to,
        };
      }
    }

    return { transitioned: false };
  }

  getState(): StoryState {
    return this.state;
  }
}
