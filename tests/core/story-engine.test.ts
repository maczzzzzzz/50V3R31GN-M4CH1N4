// tests/core/story-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
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

  // ── Phase 19: generateOverlayParams with Latent Seed bias ────────────────

  it('generateOverlayParams() includes seedBias in LLM prompt when provided', async () => {
    const state: StoryState = {
      currentArc: 'Watson',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: 0,
    };
    const mockOllama = {
      generateNarrative: vi.fn().mockResolvedValue('{"text":"NEURAL COLLAPSE","color":"#ff003c","duration":3000,"fxParams":{"shader":"chromatic_aberration","intensity":2.5}}'),
    } as any;
    const engine = new StoryEngine(state, mockOllama);

    await engine.generateOverlayParams('NPC sees runner', '[DISTRICT ATMOSPHERE: Watson] DOMINANT THEMES: Despair (0.90)');

    expect(mockOllama.generateNarrative).toHaveBeenCalledOnce();
    const promptArg: string = mockOllama.generateNarrative.mock.calls[0][0];
    expect(promptArg).toContain('ATMOSPHERIC BIAS');
    expect(promptArg).toContain('Watson');
    expect(promptArg).toContain('Despair');
  });

  it('generateOverlayParams() omits bias clause when seedBias is empty string', async () => {
    const state: StoryState = {
      currentArc: 'Heywood',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: 0,
    };
    const mockOllama = {
      generateNarrative: vi.fn().mockResolvedValue('{"text":"ALL CLEAR","color":"#00f3ff","duration":2000,"fxParams":{"shader":"none","intensity":0}}'),
    } as any;
    const engine = new StoryEngine(state, mockOllama);

    await engine.generateOverlayParams('Calm area', '');

    const promptArg: string = mockOllama.generateNarrative.mock.calls[0][0];
    expect(promptArg).not.toContain('ATMOSPHERIC BIAS');
  });

  it('generateOverlayParams() returns text-only overlay when no ollama client', async () => {
    const state: StoryState = {
      currentArc: 'Pacifica',
      currentBeat: 'Beat 1',
      completedBeats: [],
      worldState: {},
      eagleBalance: 0,
    };
    const engine = new StoryEngine(state);
    const result = await engine.generateOverlayParams('Combat zone', '[DISTRICT ATMOSPHERE: Pacifica] DOMINANT THEMES: Violence (1.00)');
    expect(result.text).toBe('Combat zone');
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
