// tests/core/story-engine.test.ts
import { describe, it, expect } from 'vitest';
import { StoryEngine } from '../../src/core/story-engine.js';
import type { StoryState } from '../../src/shared/schemas/story.schema.js';

describe('StoryEngine', () => {
  it('transitions to a new beat when a condition is met', () => {
    const initialState: StoryState = {
      currentArc: 'Arc 1',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: { flag: false },
      eagleBalance: 0,
    };

    const engine = new StoryEngine(initialState);
    
    engine.registerBeat({
      id: 'Beat 1',
      transitions: [
        {
          to: 'Beat 2',
          condition: (state, event) => event.type === 'trigger' && state.worldState.flag === true,
        }
      ]
    });

    // Event without condition met
    let result = engine.evaluateEvent({ type: 'trigger' });
    expect(result.transitioned).toBe(false);
    expect(engine.getState().currentBeat).toBe('Beat 1');

    // Meet condition in state
    initialState.worldState.flag = true;

    // Event with condition met
    result = engine.evaluateEvent({ type: 'trigger' });
    expect(result.transitioned).toBe(true);
    expect(result.oldBeat).toBe('Beat 1');
    expect(result.newBeat).toBe('Beat 2');
    expect(engine.getState().currentBeat).toBe('Beat 2');
    expect(engine.getState().completedBeats).toContain('Beat 1');
  });

  it('handles multiple transitions and picks the first matching one', () => {
    const initialState: StoryState = {
      currentArc: 'Arc 1',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: 0,
    };

    const engine = new StoryEngine(initialState);
    
    engine.registerBeat({
      id: 'Beat 1',
      transitions: [
        {
          to: 'Beat A',
          condition: (state, event) => event.val === 'A',
        },
        {
          to: 'Beat B',
          condition: (state, event) => event.val === 'B',
        }
      ]
    });

    const result = engine.evaluateEvent({ val: 'B' });
    expect(result.transitioned).toBe(true);
    expect(result.newBeat).toBe('Beat B');
  });
});
