# Black-Ice Theme Auditor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reusable TypeScript script that connects to Foundry VTT Electron via CDP on port 9222, scans live character sheets / item sheets / journals for Black-Ice theme violations, and writes corrective CSS rules directly into `foundry-module/styles/black-ice-theme.css`.

**Architecture:** Pure logic (violation detection, selector building, CSS patching) is separated into focused modules under `scripts/lib/` so it can be unit tested in isolation. I/O (CDP connection, DOM walking, file writing) lives in `scripts/theme-auditor.ts` which orchestrates the full pipeline. DOM walking happens inside `page.evaluate()` and returns serialized data — no Playwright types bleed into pure logic.

**Tech Stack:** TypeScript (ESM, Node16 module resolution), `playwright-core` (already installed), `vitest` for unit tests, `tsx` for running the script.

---

## File Map

| Action | Path | Responsibility |
|---|---|---|
| Create | `scripts/lib/violation-detector.ts` | Pure palette check — given computed styles, return violation list |
| Create | `scripts/lib/selector-builder.ts` | Build stable `body.vtt .classA.classB` selectors from classList arrays |
| Create | `scripts/lib/css-patcher.ts` | Read/patch/write `black-ice-theme.css` — pure string logic + fs write |
| Create | `scripts/theme-auditor.ts` | CDP connect, sheet navigation, DOM walk, orchestration, CLI flags |
| Create | `tests/scripts/violation-detector.test.ts` | Unit tests for palette checker |
| Create | `tests/scripts/selector-builder.test.ts` | Unit tests for selector builder |
| Create | `tests/scripts/css-patcher.test.ts` | Unit tests for CSS patch block logic |

---

## Task 1: Violation Detector

**Files:**
- Create: `scripts/lib/violation-detector.ts`
- Create: `tests/scripts/violation-detector.test.ts`

### Shared types used across all modules

```typescript
// scripts/lib/violation-detector.ts

export type ComputedStyles = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

export type ElementViolation = {
  selector: string;
  backgroundColor?: string; // actual value if violating
  color?: string;
  borderColor?: string;
};
```

### Palette constants

```typescript
const ALLOWED_BG = new Set([
  'rgb(0, 0, 0)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

const ALLOWED_TEXT = new Set([
  'rgb(255, 255, 255)',
  'rgb(238, 238, 238)',
  'rgb(255, 0, 60)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

const ALLOWED_BORDER = new Set([
  'rgb(255, 0, 60)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);
```

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/violation-detector.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { detectViolations } from '../../scripts/lib/violation-detector.js';

describe('detectViolations', () => {
  it('returns empty array when all styles are compliant', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .some-class',
        styles: {
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(255, 255, 255)',
          borderColor: 'rgb(255, 0, 60)',
        },
      },
    ]);
    expect(result).toEqual([]);
  });

  it('flags non-black background', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .cpr-red',
        styles: {
          backgroundColor: 'rgb(185, 2, 2)',
          color: 'rgb(255, 255, 255)',
          borderColor: 'rgb(255, 0, 60)',
        },
      },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0]?.selector).toBe('body.vtt .cpr-red');
    expect(result[0]?.backgroundColor).toBe('rgb(185, 2, 2)');
    expect(result[0]?.color).toBeUndefined();
    expect(result[0]?.borderColor).toBeUndefined();
  });

  it('flags non-white/red text', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .grey-text',
        styles: {
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(128, 128, 128)',
          borderColor: 'transparent',
        },
      },
    ]);
    expect(result[0]?.color).toBe('rgb(128, 128, 128)');
  });

  it('flags non-red border', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .red-border',
        styles: {
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(255, 255, 255)',
          borderColor: 'rgb(185, 2, 2)',
        },
      },
    ]);
    expect(result[0]?.borderColor).toBe('rgb(185, 2, 2)');
  });

  it('allows transparent/empty border', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .no-border',
        styles: {
          backgroundColor: 'rgb(0, 0, 0)',
          color: 'rgb(255, 255, 255)',
          borderColor: 'rgba(0, 0, 0, 0)',
        },
      },
    ]);
    expect(result).toEqual([]);
  });

  it('deduplicates identical selector violations', () => {
    const result = detectViolations([
      {
        selector: 'body.vtt .same-class',
        styles: { backgroundColor: 'rgb(185, 2, 2)', color: 'rgb(0, 0, 0)', borderColor: 'rgb(255, 0, 60)' },
      },
      {
        selector: 'body.vtt .same-class',
        styles: { backgroundColor: 'rgb(185, 2, 2)', color: 'rgb(0, 0, 0)', borderColor: 'rgb(255, 0, 60)' },
      },
    ]);
    expect(result).toHaveLength(1);
  });
});
```

- [ ] **Step 2: Implement `violation-detector.ts`**

```typescript
// scripts/lib/violation-detector.ts

export type ComputedStyles = {
  backgroundColor: string;
  color: string;
  borderColor: string;
};

export type ElementInput = {
  selector: string;
  styles: ComputedStyles;
};

export type ElementViolation = {
  selector: string;
  backgroundColor?: string;
  color?: string;
  borderColor?: string;
};

const ALLOWED_BG = new Set([
  'rgb(0, 0, 0)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

const ALLOWED_TEXT = new Set([
  'rgb(255, 255, 255)',
  'rgb(238, 238, 238)',
  'rgb(255, 0, 60)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

const ALLOWED_BORDER = new Set([
  'rgb(255, 0, 60)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

export function detectViolations(elements: ElementInput[]): ElementViolation[] {
  const seen = new Map<string, ElementViolation>();

  for (const { selector, styles } of elements) {
    const violation: ElementViolation = { selector };
    let hasViolation = false;

    if (!ALLOWED_BG.has(styles.backgroundColor)) {
      violation.backgroundColor = styles.backgroundColor;
      hasViolation = true;
    }
    if (!ALLOWED_TEXT.has(styles.color)) {
      violation.color = styles.color;
      hasViolation = true;
    }
    if (!ALLOWED_BORDER.has(styles.borderColor)) {
      violation.borderColor = styles.borderColor;
      hasViolation = true;
    }

    if (hasViolation) {
      // Merge with existing entry for same selector
      const existing = seen.get(selector);
      if (existing) {
        if (violation.backgroundColor) existing.backgroundColor = violation.backgroundColor;
        if (violation.color) existing.color = violation.color;
        if (violation.borderColor) existing.borderColor = violation.borderColor;
      } else {
        seen.set(selector, violation);
      }
    }
  }

  return Array.from(seen.values());
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/violation-detector.ts tests/scripts/violation-detector.test.ts
git commit -m "feat(auditor): violation detector with palette constants and dedup

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 2: Selector Builder

**Files:**
- Create: `scripts/lib/selector-builder.ts`
- Create: `tests/scripts/selector-builder.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/selector-builder.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { buildSelector } from '../../scripts/lib/selector-builder.js';

describe('buildSelector', () => {
  it('builds a selector from a single class', () => {
    expect(buildSelector(['cpr-actor'])).toBe('body.vtt .cpr-actor');
  });

  it('builds a selector from multiple classes', () => {
    expect(buildSelector(['actor-sheet', 'character'])).toBe('body.vtt .actor-sheet.character');
  });

  it('returns null for empty classList', () => {
    expect(buildSelector([])).toBeNull();
  });

  it('filters out empty string entries', () => {
    expect(buildSelector(['actor-sheet', '', 'character'])).toBe('body.vtt .actor-sheet.character');
  });

  it('filters out positional/dynamic class names (numbers, svelte hashes)', () => {
    // Classes that are pure numbers or svelte-style hashes should be excluded
    expect(buildSelector(['actor-sheet', 'svelte-abc123', 'character'])).toBe('body.vtt .actor-sheet.character');
  });
});
```

- [ ] **Step 2: Implement `selector-builder.ts`**

```typescript
// scripts/lib/selector-builder.ts

// Exclude dynamic/positional class names that cannot be relied upon across instances.
// Matches: pure numbers, svelte hashes (svelte-xxxxxxx), uuid-like strings.
const UNSTABLE_CLASS_RE = /^(svelte-[a-z0-9]+|\d+|[a-f0-9]{8,})$/i;

export function buildSelector(classList: string[]): string | null {
  const stable = classList.filter(
    (cls) => cls.length > 0 && !UNSTABLE_CLASS_RE.test(cls)
  );
  if (stable.length === 0) return null;
  return 'body.vtt .' + stable.join('.');
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/selector-builder.ts tests/scripts/selector-builder.test.ts
git commit -m "feat(auditor): selector builder with unstable class filtering

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 3: CSS Patcher

**Files:**
- Create: `scripts/lib/css-patcher.ts`
- Create: `tests/scripts/css-patcher.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `tests/scripts/css-patcher.test.ts`:

```typescript
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
```

- [ ] **Step 2: Implement `css-patcher.ts`**

```typescript
// scripts/lib/css-patcher.ts

import { readFileSync, writeFileSync } from 'fs';
import type { ElementViolation } from './violation-detector.js';

const PATCH_START_RE = /\/\* AUTO-PATCH:.*?— theme-auditor \*\//;
const PATCH_END = '/* END AUTO-PATCH */';

export function buildPatchBlock(violations: ElementViolation[], date: string): string {
  const lines: string[] = [
    `/* AUTO-PATCH: ${date} — theme-auditor */`,
  ];

  for (const v of violations) {
    lines.push(`    ${v.selector} {`);
    if (v.backgroundColor) lines.push(`        background-color: #000000 !important;`);
    if (v.color)            lines.push(`        color: #ffffff !important;`);
    if (v.borderColor)      lines.push(`        border-color: var(--cpr-red) !important;`);
    lines.push(`    }`);
  }

  lines.push(PATCH_END);
  return lines.join('\n') + '\n';
}

export function applyPatch(css: string, patchBlock: string): string {
  // Remove existing AUTO-PATCH block if present
  const startMatch = PATCH_START_RE.exec(css);
  if (startMatch) {
    const startIdx = startMatch.index;
    const endIdx = css.indexOf(PATCH_END, startIdx);
    if (endIdx !== -1) {
      css = css.slice(0, startIdx) + css.slice(endIdx + PATCH_END.length).replace(/^\n/, '');
    }
  }

  // Find closing brace of @layer black-ice block
  const layerMatch = css.lastIndexOf('}');
  if (layerMatch === -1) throw new Error('Could not find closing } in CSS file');

  return css.slice(0, layerMatch) + patchBlock + css.slice(layerMatch);
}

export function patchFile(filePath: string, violations: ElementViolation[]): void {
  const date = new Date().toISOString().slice(0, 10);
  const css = readFileSync(filePath, 'utf-8');
  const patchBlock = buildPatchBlock(violations, date);
  const patched = applyPatch(css, patchBlock);
  writeFileSync(filePath, patched, 'utf-8');
}
```

- [ ] **Step 3: Commit**

```bash
git add scripts/lib/css-patcher.ts tests/scripts/css-patcher.test.ts
git commit -m "feat(auditor): css patcher with AUTO-PATCH block insert/replace

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 4: Main Orchestrator + CDP Connector

**Files:**
- Create: `scripts/theme-auditor.ts`

No unit tests for this task — CDP connection and DOM walking are integration-level. The pure logic it calls is already tested.

- [ ] **Step 1: Implement `scripts/theme-auditor.ts`**

```typescript
// scripts/theme-auditor.ts
// Run: tsx scripts/theme-auditor.ts [--dry-run] [--target character|item|journal]

import { chromium } from 'playwright-core';
import { detectViolations } from './lib/violation-detector.js';
import { buildSelector } from './lib/selector-builder.js';
import { patchFile, buildPatchBlock, applyPatch } from './lib/css-patcher.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const CSS_PATH = resolve(__dirname, '../foundry-module/styles/black-ice-theme.css');
const CDP_ENDPOINT = 'http://localhost:9222';

type SheetTarget = 'character' | 'item' | 'journal';

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const targetArg = args.find((a) => a.startsWith('--target='))?.split('=')[1];
const TARGETS: SheetTarget[] = targetArg
  ? [targetArg as SheetTarget]
  : ['character', 'item', 'journal'];

// Serializable data returned from page.evaluate()
type RawElement = {
  classes: string[];
  backgroundColor: string;
  color: string;
  borderColor: string;
};

async function openSheet(page: import('playwright-core').Page, target: SheetTarget): Promise<void> {
  const script: Record<SheetTarget, string> = {
    character: `
      const actor = game.actors.find(a => a.type === 'character');
      if (actor) { actor.sheet.render(true); }
      else { ui.notifications.warn('No character actor found for theme audit.'); }
    `,
    item: `
      const item = game.items.contents[0];
      if (item) { item.sheet.render(true); }
      else { ui.notifications.warn('No items found for theme audit.'); }
    `,
    journal: `
      const journal = game.journal.contents[0];
      if (journal) { journal.sheet.render(true); }
      else { ui.notifications.warn('No journal entries found for theme audit.'); }
    `,
  };
  await page.evaluate(script[target]);
  // Wait for the sheet DOM to render
  await page.waitForTimeout(1500);
}

async function scanPage(page: import('playwright-core').Page): Promise<RawElement[]> {
  return page.evaluate(() => {
    const results: Array<{
      classes: string[];
      backgroundColor: string;
      color: string;
      borderColor: string;
    }> = [];

    const elements = document.querySelectorAll<HTMLElement>(
      '.window-app *, .app *, .sheet *, .journal-entry *'
    );

    for (const el of elements) {
      if (el.classList.length === 0) continue;
      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      results.push({
        classes: Array.from(el.classList),
        backgroundColor: style.backgroundColor,
        color: style.color,
        borderColor: style.borderColor,
      });
    }

    return results;
  });
}

async function main() {
  console.log(`[theme-auditor] Connecting to Foundry at ${CDP_ENDPOINT}...`);
  const browser = await chromium.connectOverCDP(CDP_ENDPOINT);

  // Find the Foundry page (not the DevTools page)
  const contexts = browser.contexts();
  let foundryPage: import('playwright-core').Page | undefined;
  for (const ctx of contexts) {
    for (const pg of ctx.pages()) {
      const url = pg.url();
      if (url.includes('localhost') && !url.includes('devtools')) {
        foundryPage = pg;
        break;
      }
    }
    if (foundryPage) break;
  }

  if (!foundryPage) {
    console.error('[theme-auditor] Could not find Foundry page. Is Foundry running?');
    await browser.close();
    process.exit(1);
  }

  console.log(`[theme-auditor] Connected to: ${foundryPage.url()}`);

  const allRaw: RawElement[] = [];

  for (const target of TARGETS) {
    console.log(`[theme-auditor] Opening ${target} sheet...`);
    await openSheet(foundryPage, target);
    const raw = await scanPage(foundryPage);
    console.log(`[theme-auditor]   → ${raw.length} elements scanned`);
    allRaw.push(...raw);
  }

  await browser.close();

  // Build ElementInputs
  const inputs = allRaw
    .map((raw) => {
      const selector = buildSelector(raw.classes);
      if (!selector) return null;
      return {
        selector,
        styles: {
          backgroundColor: raw.backgroundColor,
          color: raw.color,
          borderColor: raw.borderColor,
        },
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const violations = detectViolations(inputs);
  console.log(`[theme-auditor] ${violations.length} unique selector violations found.`);

  if (violations.length === 0) {
    console.log('[theme-auditor] Theme is clean. No patches needed.');
    process.exit(0);
  }

  // Report
  for (const v of violations) {
    const flags = [
      v.backgroundColor && `bg: ${v.backgroundColor}`,
      v.color && `color: ${v.color}`,
      v.borderColor && `border: ${v.borderColor}`,
    ].filter(Boolean).join(', ');
    console.log(`  [VIOLATION] ${v.selector} — ${flags}`);
  }

  if (DRY_RUN) {
    console.log('[theme-auditor] --dry-run: no file written.');
    const date = new Date().toISOString().slice(0, 10);
    console.log('\n--- Proposed patch ---');
    console.log(buildPatchBlock(violations, date));
    process.exit(0);
  }

  patchFile(CSS_PATH, violations);
  console.log(`[theme-auditor] Patched: ${CSS_PATH}`);
  console.log('[theme-auditor] Reload Foundry (F5) to apply changes.');
}

main().catch((err) => {
  console.error('[theme-auditor] Fatal:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Commit**

```bash
git add scripts/theme-auditor.ts
git commit -m "feat(auditor): main orchestrator — CDP connect, sheet nav, DOM walk, patch

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Task 5: Wire npm script

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add audit script to package.json**

In `package.json`, add to the `"scripts"` block:

```json
"audit:theme": "tsx scripts/theme-auditor.ts",
"audit:theme:dry": "tsx scripts/theme-auditor.ts --dry-run"
```

Result:
```json
"scripts": {
  "start": "tsx src/main.ts",
  "build": "tsc",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "audit:theme": "tsx scripts/theme-auditor.ts",
  "audit:theme:dry": "tsx scripts/theme-auditor.ts --dry-run"
},
```

- [ ] **Step 2: Commit**

```bash
git add package.json
git commit -m "chore: add audit:theme npm scripts

Co-Authored-By: Claude Sonnet <noreply@anthropic.com>
Co-Authored-By: Gemini CLI <gemini-cli@google.com>"
```

---

## Usage After Implementation

```bash
# Full scan + auto-patch
npm run audit:theme

# Report only, no file write
npm run audit:theme:dry

# Scope to character sheets only
tsx scripts/theme-auditor.ts --target=character

# After patching, reload Foundry (F5), then re-run to verify clean
npm run audit:theme:dry
```

---

## Hand-off Note (CLAUDE.md Protocol)

Per partnership protocol: after Tasks 1–5 are coded, **HALT and hand off to Gemini for Audit/Verification**. Gemini runs `vitest run` and `tsx scripts/theme-auditor.ts --dry-run` against the live Foundry window. Do not assume success until Gemini returns a passing audit report.
