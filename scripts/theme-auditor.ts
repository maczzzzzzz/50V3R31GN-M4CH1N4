// scripts/theme-auditor.ts
// Run: tsx scripts/theme-auditor.ts [--dry-run] [--target=character|item|journal]

import { chromium } from 'playwright-core';
import type { Page, Browser, BrowserContext } from 'playwright-core';
import { detectViolations } from './lib/violation-detector.js';
import { buildSelector } from './lib/selector-builder.js';
import { patchFile, buildPatchBlock, applyPatch } from './lib/css-patcher.js';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

// applyPatch is imported for completeness of the patcher API surface; patchFile
// is the write path and buildPatchBlock is used for dry-run display.
void applyPatch;

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

async function openSheet(page: Page, target: SheetTarget): Promise<void> {
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

async function scanPage(page: Page): Promise<RawElement[]> {
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

async function main(): Promise<void> {
  console.log(`[theme-auditor] Connecting to Foundry at ${CDP_ENDPOINT}...`);
  const browser: Browser = await chromium.connectOverCDP(CDP_ENDPOINT);

  // Find the Foundry page (not the DevTools page)
  const contexts: BrowserContext[] = browser.contexts();
  let foundryPage: Page | undefined;

  for (const ctx of contexts) {
    for (const pg of ctx.pages()) {
      const url = pg.url();
      if (url.includes('localhost') && !url.includes('devtools')) {
        foundryPage = pg;
        break;
      }
    }
    if (foundryPage !== undefined) break;
  }

  if (foundryPage === undefined) {
    console.error('[theme-auditor] Could not find Foundry page. Is Foundry running?');
    await browser.close();
    process.exit(1);
  }

  // foundryPage is narrowed to Page from here on
  const page: Page = foundryPage;
  console.log(`[theme-auditor] Connected to: ${page.url()}`);

  const allRaw: RawElement[] = [];

  for (const target of TARGETS) {
    console.log(`[theme-auditor] Opening ${target} sheet...`);
    await openSheet(page, target);
    const raw = await scanPage(page);
    console.log(`[theme-auditor]   → ${raw.length} elements scanned`);
    allRaw.push(...raw);
  }

  await browser.close();

  // Build ElementInputs
  const inputs = allRaw
    .map((raw) => {
      const selector = buildSelector(raw.classes);
      if (selector === null) return null;
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
      v.backgroundColor !== undefined && `bg: ${v.backgroundColor}`,
      v.color !== undefined && `color: ${v.color}`,
      v.borderColor !== undefined && `border: ${v.borderColor}`,
    ].filter((f): f is string => typeof f === 'string').join(', ');
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

main().catch((err: unknown) => {
  console.error('[theme-auditor] Fatal:', err);
  process.exit(1);
});
