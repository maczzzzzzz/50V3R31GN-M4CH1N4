import { describe, it, expect } from 'vitest';
import { buildPatchBlock, applyPatch } from '../../scripts/lib/css-patcher.js';
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
    expect(block).toContain('border-color: var(--cpr-cyan) !important;');
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
  const BASE_CSS = `@layer black-ice {\n    :root { --cpr-cyan: #00f3ff; }\n}`;

  it('inserts patch block before closing brace of @layer black-ice', () => {
    const patchBlock = '/* AUTO-PATCH: 2026-04-03 — theme-auditor */\nbody.vtt .x { color: #fff !important; }\n/* END AUTO-PATCH */\n';
    const result = applyPatch(BASE_CSS, patchBlock);
    expect(result).toContain('AUTO-PATCH');
    expect(result.indexOf('AUTO-PATCH')).toBeLessThan(result.lastIndexOf('}'));
  });

  it('replaces an existing AUTO-PATCH block on re-run', () => {
    const oldPatch = '/* AUTO-PATCH: 2026-04-01 — theme-auditor */\nbody.vtt .old { color: red; }\n/* END AUTO-PATCH */\n';
    const cssWithOld = `@layer black-ice {\n    :root {}\n    ${oldPatch}\n}`;
    const newPatch = '/* AUTO-PATCH: 2026-04-03 — theme-auditor */\nbody.vtt .new { color: #fff !important; }\n/* END AUTO-PATCH */\n';
    const result = applyPatch(cssWithOld, newPatch);
    expect(result).not.toContain('AUTO-PATCH: 2026-04-01');
    expect(result).toContain('AUTO-PATCH: 2026-04-03');
    expect(result).not.toContain('body.vtt .old');
    expect(result).toContain('body.vtt .new');
  });
});
