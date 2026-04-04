// tests/core/story-engine.test.ts
import { describe, it, expect, vi } from 'vitest';
import { StoryEngine } from '../../src/core/story-engine.js';
import { ParseltongueCodec } from '../../src/shared/parseltongue-codec.js';
import type { StoryState } from '../../src/shared/schemas/story.schema.js';
import type { WorldCommand } from '../../src/shared/schemas/world-commands.schema.js';
import type { IFoundryAdapter } from '../../src/api/foundry-adapter.js';

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

  // ── Phase 23: evaluateEvent triggers advancePhase ────────────────────────

  describe('evaluateEvent() phase shift integration', () => {
    function makeState(completedBeats: string[] = []): StoryState {
      return {
        currentArc: 'Night City',
        currentBeat: 'Beat A',
        completedBeats: [...completedBeats],
        worldState: {},
        eagleBalance: 0,
      };
    }

    function makeMockAdapter(connected = true): IFoundryAdapter {
      return {
        isConnected: vi.fn().mockReturnValue(connected),
        advancePhase: vi.fn().mockResolvedValue(undefined),
        start: vi.fn(),
        stop: vi.fn(),
        onEvent: vi.fn(),
        sendChatMessage: vi.fn(),
        readActor: vi.fn(),
        triggerSimplePhone: vi.fn(),
        rollDice: vi.fn(),
        activateScene: vi.fn(),
        updateActor: vi.fn(),
        queueApproval: vi.fn(),
        openNightMarket: vi.fn(),
        createActor: vi.fn(),
        show3dDice: vi.fn(),
        queryScenes: vi.fn(),
        pushDashboardUpdate: vi.fn(),
        triggerFxGlitch: vi.fn(),
        runSequence: vi.fn(),
        triggerPretextOverlay: vi.fn(),
        spawnSoloSafeNpc: vi.fn(),
      } as unknown as IFoundryAdapter;
    }

    it('calls foundryAdapter.advancePhase() with phaseIndex = completedBeats.length when a transition succeeds', async () => {
      const state = makeState(['Beat 0', 'Beat Z']); // 2 completed beats
      const mockAdapter = makeMockAdapter();
      const engine = new StoryEngine(state, undefined, undefined, mockAdapter);

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: (_s, e) => e.type === 'go' }],
      });

      const result = engine.evaluateEvent({ type: 'go' });
      expect(result.transitioned).toBe(true);

      // Fire-and-forget: allow the microtask to settle
      await new Promise(r => setTimeout(r, 10));
      expect(mockAdapter.advancePhase).toHaveBeenCalledOnce();
      expect(mockAdapter.advancePhase).toHaveBeenCalledWith(null, 2);
    });

    it('does NOT call advancePhase when transition does not occur', async () => {
      const state = makeState();
      const mockAdapter = makeMockAdapter();
      const engine = new StoryEngine(state, undefined, undefined, mockAdapter);

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: () => false }],
      });

      const result = engine.evaluateEvent({ type: 'nothing' });
      expect(result.transitioned).toBe(false);

      await new Promise(r => setTimeout(r, 10));
      expect(mockAdapter.advancePhase).not.toHaveBeenCalled();
    });

    it('does NOT call advancePhase when no foundryAdapter is set', async () => {
      const state = makeState();
      const engine = new StoryEngine(state);

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: () => true }],
      });

      // Should not throw even with no adapter
      expect(() => engine.evaluateEvent({ type: 'go' })).not.toThrow();
    });

    it('does NOT call advancePhase when adapter is not connected', async () => {
      const state = makeState();
      const mockAdapter = makeMockAdapter(false); // disconnected
      const engine = new StoryEngine(state, undefined, undefined, mockAdapter);

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: () => true }],
      });

      engine.evaluateEvent({ type: 'go' });

      await new Promise(r => setTimeout(r, 10));
      expect(mockAdapter.advancePhase).not.toHaveBeenCalled();
    });

    it('swallows advancePhase failure — evaluateEvent does not throw', async () => {
      const state = makeState();
      const mockAdapter = makeMockAdapter();
      (mockAdapter.advancePhase as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('bridge down'));
      const engine = new StoryEngine(state, undefined, undefined, mockAdapter);

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: () => true }],
      });

      // Must not throw synchronously
      expect(() => engine.evaluateEvent({ type: 'go' })).not.toThrow();

      // Must not surface as unhandled rejection after settling
      await new Promise(r => setTimeout(r, 20));
    });

    it('setFoundryAdapter() sets the adapter and subsequent transitions trigger it', async () => {
      const state = makeState();
      const engine = new StoryEngine(state); // no adapter initially

      engine.registerBeat({
        id: 'Beat A',
        transitions: [{ to: 'Beat B', condition: () => true }],
      });

      const mockAdapter = makeMockAdapter();
      engine.setFoundryAdapter(mockAdapter);

      engine.evaluateEvent({ type: 'go' });

      await new Promise(r => setTimeout(r, 10));
      expect(mockAdapter.advancePhase).toHaveBeenCalledOnce();
    });
  });

  // ── Phase 20: embedMutation (Parseltongue) ────────────────────────────────

  describe('embedMutation', () => {
    const baseState: StoryState = {
      currentArc: 'Night City',
      currentBeat: 'Intro',
      completedBeats: [],
      worldState: {},
      eagleBalance: 0,
    };

    it('returns a string that starts with the visible bark', () => {
      const engine = new StoryEngine(baseState);
      const bark = 'Koru-da vekh!';
      const cmd: WorldCommand = { action: 'UPDATE_NPC', target: 'npc_01', data: { hp: 10 } };
      const result = engine.embedMutation(bark, cmd);
      expect(result.startsWith(bark)).toBe(true);
    });

    it('embedded mutation is recoverable via ParseltongueCodec.scanForCommand', () => {
      const engine = new StoryEngine(baseState);
      const cmd: WorldCommand = {
        action: 'ADD_LORE',
        subject: 'V',
        predicate: 'arrived_at',
        object: 'Totentanz',
      };
      const cloaked = engine.embedMutation('Ghrut-da ra!', cmd);
      const recovered = ParseltongueCodec.scanForCommand(cloaked);
      expect(recovered).toEqual(cmd);
    });

    it('strip removes the mutation leaving only the bark', () => {
      const engine = new StoryEngine(baseState);
      const bark = 'Zheva tse.';
      const cmd: WorldCommand = {
        action: 'TRANSFER_ITEM',
        itemId: 'thermal_katana',
        fromId: 'npc_boss',
        toId: 'player_v',
      };
      const cloaked = engine.embedMutation(bark, cmd);
      expect(ParseltongueCodec.strip(cloaked)).toBe(bark);
    });
  });
});
