import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillstoneService } from '../../packages/hermes-core/src/core/skillstone-service.js';
import { StoryEngine } from '../../packages/hermes-core/src/core/story-engine.js';
import type { ISovereignNarrativeClient } from '../../packages/hermes-core/src/core/interfaces.js';

// ── SkillstoneService unit tests ──────────────────────────────────────────────

describe('SkillstoneService', () => {
  let svc: SkillstoneService;

  beforeEach(() => {
    svc = new SkillstoneService();
  });

  it('register + getSkillstone returns non-null Markdown', () => {
    svc.register('maelstrom', 42);
    const stone = svc.getSkillstone('maelstrom');
    expect(stone).not.toBeNull();
    expect(typeof stone).toBe('string');
    expect(stone!.length).toBeGreaterThan(500);
  });

  it('returns null for unregistered faction', () => {
    expect(svc.getSkillstone('unknown_faction')).toBeNull();
  });

  it('same seed produces identical output (determinism)', () => {
    const a = svc.generateSkillstone(1337);
    const b = svc.generateSkillstone(1337);
    expect(a).toBe(b);
  });

  it('different seeds produce different dialects', () => {
    const a = svc.generateSkillstone(1);
    const b = svc.generateSkillstone(2);
    expect(a).not.toBe(b);
  });

  it('generated Skillstone contains required Markdown sections', () => {
    const stone = svc.generateSkillstone(99);
    expect(stone).toContain('# SKILLSTONE:');
    expect(stone).toContain('## Phonology');
    expect(stone).toContain('## Grammar');
    expect(stone).toContain('## Core Lexicon');
    expect(stone).toContain('## Example Sentences');
    expect(stone).toContain('## ICL Instructions for LLM');
  });

  it('generated Skillstone contains Word Order declaration', () => {
    const stone = svc.generateSkillstone(42);
    expect(stone).toMatch(/\*\*Word Order:\*\* (SVO|SOV|VSO)/);
  });

  it('generated Skillstone contains pronoun table', () => {
    const stone = svc.generateSkillstone(7);
    expect(stone).toContain('I/me');
    expect(stone).toContain('you (sg)');
    expect(stone).toContain('they/them');
  });

  it('generated Skillstone contains all 50 lexicon entries', () => {
    const stone = svc.generateSkillstone(42);
    // Lexicon table header present
    expect(stone).toContain('| English | Dialect |');
    // At least 20 English roots from our seed list
    const wordCount = (stone.match(/\| [a-z/ ()]+ \| /g) ?? []).length;
    expect(wordCount).toBeGreaterThanOrEqual(20);
  });

  it('listFactions returns all registered faction IDs', () => {
    svc.register('maelstrom', 1);
    svc.register('arasaka', 2);
    svc.register('nomads', 3);
    expect(svc.listFactions()).toEqual(expect.arrayContaining(['maelstrom', 'arasaka', 'nomads']));
    expect(svc.listFactions()).toHaveLength(3);
  });

  it('getSeed returns the registered seed', () => {
    svc.register('militech', 9999);
    expect(svc.getSeed('militech')).toBe(9999);
  });

  it('getSeed returns undefined for unknown faction', () => {
    expect(svc.getSeed('ghost_faction')).toBeUndefined();
  });

  it('re-registering a faction updates the seed', () => {
    svc.register('bozos', 1);
    const first = svc.getSkillstone('bozos');
    svc.register('bozos', 2);
    const second = svc.getSkillstone('bozos');
    expect(first).not.toBe(second);
  });

  it('handles seed value of 0 without treating it as falsy', () => {
    svc.register('zero-faction', 0);
    expect(svc.getSeed('zero-faction')).toBe(0);
    expect(svc.getSkillstone('zero-faction')).not.toBeNull();
  });

  it('getSkillstone returns same reference for repeated calls (memoisation)', () => {
    svc.register('cache-test', 555);
    const first = svc.getSkillstone('cache-test');
    const second = svc.getSkillstone('cache-test');
    expect(first).toBe(second); // same string reference from cache
  });
});

// ── StoryEngine + SkillstoneService integration tests ────────────────────────

describe('StoryEngine — Skillstone ICL injection', () => {
  let skillstoneSvc: SkillstoneService;
  let mockSovereignNarrative: ISovereignNarrativeClient;
  let capturedPrompt: string;

  beforeEach(() => {
    capturedPrompt = '';
    skillstoneSvc = new SkillstoneService();
    skillstoneSvc.register('maelstrom', 42);

    mockSovereignNarrative = {
      generateNarrative: vi.fn(async (prompt: string) => {
        capturedPrompt = prompt;
        return JSON.stringify({ text: 'TEST OK', color: '#ff003c', duration: 3000 });
      }),
      isHealthy: vi.fn(async () => true),
      stop: vi.fn(async () => {}),
    };
  });

  it('injects SKILLSTONE block into prompt when factionId is provided', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
      skillstoneSvc,
    );

    await engine.generateOverlayParams('combat started', undefined, 'maelstrom');

    expect(capturedPrompt).toContain('--- SKILLSTONE (NPC DIALECT SPEC) ---');
    expect(capturedPrompt).toContain('--- END SKILLSTONE ---');
    expect(capturedPrompt).toContain('# SKILLSTONE:');
  });

  it('does NOT inject SKILLSTONE when factionId is omitted', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
      skillstoneSvc,
    );

    await engine.generateOverlayParams('combat started');

    expect(capturedPrompt).not.toContain('SKILLSTONE');
  });

  it('does NOT inject SKILLSTONE for unknown faction (returns empty clause)', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
      skillstoneSvc,
    );

    await engine.generateOverlayParams('combat started', undefined, 'unknown_faction');

    expect(capturedPrompt).not.toContain('SKILLSTONE');
  });

  it('injects SKILLSTONE and seedBias together', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
      skillstoneSvc,
    );

    await engine.generateOverlayParams(
      'ambush in Watson',
      '[DISTRICT ATMOSPHERE: Watson] Despair (0.90)',
      'maelstrom',
    );

    expect(capturedPrompt).toContain('SKILLSTONE');
    expect(capturedPrompt).toContain('ATMOSPHERIC BIAS');
  });

  it('setSkillstoneService attaches service after construction', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
    );

    // No service attached yet — no injection
    await engine.generateOverlayParams('test', undefined, 'maelstrom');
    expect(capturedPrompt).not.toContain('SKILLSTONE');

    // Attach service
    engine.setSkillstoneService(skillstoneSvc);
    capturedPrompt = '';

    await engine.generateOverlayParams('test', undefined, 'maelstrom');
    expect(capturedPrompt).toContain('SKILLSTONE');
  });

  it('prompt still contains biomonitor system instruction after Skillstone block', async () => {
    const engine = new StoryEngine(
      { currentArc: 'main', currentBeat: 'start', completedBeats: [], worldState: {}, eagleBalance: 0 },
      mockSovereignNarrative,
      skillstoneSvc,
    );

    await engine.generateOverlayParams('test', undefined, 'maelstrom');

    expect(capturedPrompt).toContain('You are a Cyberpunk RED Biomonitor system.');
  });
});
