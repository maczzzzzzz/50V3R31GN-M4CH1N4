import { describe, it, expect } from 'vitest';
import { buildPatchBlock, applyPatch, extractExistingViolations, mergeViolations } from '../../scripts/lib/css-patcher.js';
import type { ElementViolation } from '../../scripts/lib/violation-detector.js';

const SAMPLE_VIOLATIONS: ElementViolation[] = [
  {
    selector: 'body.vtt .cpr-actor',
    backgroundColor: 'rgb(185, 2, 2)',
    borderColor: 'rgb(185, 2, 2)',
  },
  {
    selector: 'body.vtt .bottom-pane',
    color: 'rgb(128, 128, 128)',
  },
];

describe('buildPatchBlock', () => {
  it('generates a patch block with correct markers', () => {
    const block = buildPatchBlock(SAMPLE_VIOLATIONS, '2026-04-03');
    expect(block).toContain('/* AUTO-PATCH: 2026-04-03 — theme-auditor */');
    expect(block).toContain('/* END AUTO-PATCH */');
  });

  it('generates background fix for bg violation', () => {
    const block = buildPatchBlock(SAMPLE_VIOLATIONS, '2026-04-03');
    expect(block).toContain('body.vtt .cpr-actor');
    expect(block).toContain('background-color: #000000 !important;');
  });

  it('generates border fix for border violation', () => {
    const block = buildPatchBlock(SAMPLE_VIOLATIONS, '2026-04-03');
    expect(block).toContain('border-color: var(--cpr-red) !important;');
  });

  it('generates text fix for color violation', () => {
    const block = buildPatchBlock(SAMPLE_VIOLATIONS, '2026-04-03');
    expect(block).toContain('body.vtt .bottom-pane');
    expect(block).toContain('color: #ffffff !important;');
  });

  it('groups multiple violations under one rule per selector', () => {
    const violations: ElementViolation[] = [
      { selector: 'body.vtt .multi', backgroundColor: 'rgb(185,2,2)', borderColor: 'rgb(185,2,2)' },
    ];
    const block = buildPatchBlock(violations, '2026-04-03');
    const ruleMatches = block.match(/body\.vtt \.multi/g);
    expect(ruleMatches).toHaveLength(1);
  });
});

describe('applyPatch', () => {
  const BASE_CSS = `@layer black-ice {\n    :root { --cpr-red: #ff003c; }\n}`;

  it('inserts patch block before closing brace of @layer black-ice', () => {
    const patchBlock = '/* AUTO-PATCH: 2026-04-03 — theme-auditor */\nbody.vtt .x { color: #fff !important; }\n/* END AUTO-PATCH */\n';
    const result = applyPatch(BASE_CSS, patchBlock);
    expect(result).toContain('AUTO-PATCH');
    expect(result.indexOf('AUTO-PATCH')).toBeLessThan(result.lastIndexOf('}'));
  });

  it('replaces the AUTO-PATCH block marker while preserving surrounding CSS', () => {
    const oldPatch = '/* AUTO-PATCH: 2026-04-01 — theme-auditor */\n    body.vtt .old { color: #fff !important; }\n/* END AUTO-PATCH */\n';
    const cssWithOld = `@layer black-ice {\n    :root {}\n${oldPatch}}`;
    const newPatch = '/* AUTO-PATCH: 2026-04-03 — theme-auditor */\n    body.vtt .new { color: #fff !important; }\n/* END AUTO-PATCH */\n';
    const result = applyPatch(cssWithOld, newPatch);
    expect(result).not.toContain('AUTO-PATCH: 2026-04-01');
    expect(result).toContain('AUTO-PATCH: 2026-04-03');
    expect(result).toContain('body.vtt .new');
    expect(result).toContain(':root {}'); // surrounding CSS preserved
  });

  it('throws when START marker is present but END marker is missing', () => {
    const corrupted = `@layer black-ice {\n    /* AUTO-PATCH: 2026-04-01 — theme-auditor */\n    body.vtt .x { color: red; }\n}`;
    const patch = '/* AUTO-PATCH: 2026-04-03 — theme-auditor */\n/* END AUTO-PATCH */\n';
    expect(() => applyPatch(corrupted, patch)).toThrow('Found AUTO-PATCH start marker but no END AUTO-PATCH marker');
  });
});

describe('extractExistingViolations', () => {
  const CSS_WITH_PATCH = `@layer black-ice {
    :root {}
/* AUTO-PATCH: 2026-04-03 — theme-auditor */
    body.vtt .blackice-sheet {
        background-color: #000000 !important;
    }
    body.vtt .mook-sheet {
        background-color: #000000 !important;
        border-color: var(--cpr-red) !important;
    }
    body.vtt .some-text {
        color: #ffffff !important;
    }
/* END AUTO-PATCH */
}`;

  it('returns empty array when no AUTO-PATCH block exists', () => {
    const result = extractExistingViolations('@layer black-ice { :root {} }');
    expect(result).toEqual([]);
  });

  it('parses background-color violations', () => {
    const result = extractExistingViolations(CSS_WITH_PATCH);
    const v = result.find((x) => x.selector === 'body.vtt .blackice-sheet');
    expect(v).toBeDefined();
    expect(v!.backgroundColor).toBe('#000000');
    expect(v!.color).toBeUndefined();
    expect(v!.borderColor).toBeUndefined();
  });

  it('parses border-color violations', () => {
    const result = extractExistingViolations(CSS_WITH_PATCH);
    const v = result.find((x) => x.selector === 'body.vtt .mook-sheet');
    expect(v).toBeDefined();
    expect(v!.backgroundColor).toBe('#000000');
    expect(v!.borderColor).toBe('red');
  });

  it('parses color violations', () => {
    const result = extractExistingViolations(CSS_WITH_PATCH);
    const v = result.find((x) => x.selector === 'body.vtt .some-text');
    expect(v).toBeDefined();
    expect(v!.color).toBe('#ffffff');
  });

  it('returns all selectors from the patch block', () => {
    const result = extractExistingViolations(CSS_WITH_PATCH);
    expect(result).toHaveLength(3);
  });
});

describe('mergeViolations', () => {
  it('preserves existing selectors not in incoming', () => {
    const existing: ElementViolation[] = [
      { selector: 'body.vtt .blackice-sheet', backgroundColor: '#000000' },
      { selector: 'body.vtt .old-selector', color: '#ffffff' },
    ];
    const incoming: ElementViolation[] = [
      { selector: 'body.vtt .new-selector', backgroundColor: '#000000' },
    ];
    const merged = mergeViolations(existing, incoming);
    const selectors = merged.map((v) => v.selector);
    expect(selectors).toContain('body.vtt .blackice-sheet');
    expect(selectors).toContain('body.vtt .old-selector');
    expect(selectors).toContain('body.vtt .new-selector');
  });

  it('incoming overrides existing for same selector', () => {
    const existing: ElementViolation[] = [
      { selector: 'body.vtt .sheet', backgroundColor: '#000000' },
    ];
    const incoming: ElementViolation[] = [
      { selector: 'body.vtt .sheet', backgroundColor: '#000000', borderColor: 'red' },
    ];
    const merged = mergeViolations(existing, incoming);
    const v = merged.find((x) => x.selector === 'body.vtt .sheet');
    expect(v!.borderColor).toBe('red');
  });

  it('produces no duplicates', () => {
    const existing: ElementViolation[] = [
      { selector: 'body.vtt .a', backgroundColor: '#000000' },
      { selector: 'body.vtt .b', color: '#ffffff' },
    ];
    const incoming: ElementViolation[] = [
      { selector: 'body.vtt .a', backgroundColor: '#000000' },
      { selector: 'body.vtt .c', borderColor: 'red' },
    ];
    const merged = mergeViolations(existing, incoming);
    expect(merged).toHaveLength(3);
  });

  it('targeted blackIce audit does not erase previous full-sweep selectors', () => {
    // Simulates: full audit patched .mook-sheet, then --target=blackIce runs
    const afterFullSweep: ElementViolation[] = [
      { selector: 'body.vtt .mook-sheet', backgroundColor: '#000000' },
      { selector: 'body.vtt .right-content-section', backgroundColor: '#000000', borderColor: 'red' },
    ];
    const blackIceScan: ElementViolation[] = [
      { selector: 'body.vtt .blackice-sheet', backgroundColor: '#000000' },
      { selector: 'body.vtt .blackice-stats.text-normal', backgroundColor: '#000000' },
    ];
    const merged = mergeViolations(afterFullSweep, blackIceScan);
    const selectors = merged.map((v) => v.selector);
    // Full-sweep selectors survive
    expect(selectors).toContain('body.vtt .mook-sheet');
    expect(selectors).toContain('body.vtt .right-content-section');
    // blackIce selectors added
    expect(selectors).toContain('body.vtt .blackice-sheet');
    expect(selectors).toContain('body.vtt .blackice-stats.text-normal');
    expect(merged).toHaveLength(4);
  });
});

