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

/**
 * Parse the existing AUTO-PATCH block out of `css` and return its entries
 * as ElementViolation objects.  Returns [] when no block exists.
 */
export function extractExistingViolations(css: string): ElementViolation[] {
  const startMatch = PATCH_START_RE.exec(css);
  if (!startMatch) return [];

  const contentStart = startMatch.index + startMatch[0].length;
  const endIdx = css.indexOf(PATCH_END, contentStart);
  if (endIdx === -1) return [];

  const patchContent = css.slice(contentStart, endIdx);
  const violations: ElementViolation[] = [];

  // Match each `selector { rules }` block inside the patch
  const ruleRe = /\s*(body\.vtt\s+[^{]+?)\s*\{([^}]+)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(patchContent)) !== null) {
    const selector = m[1].trim();
    const ruleLines = m[2].split('\n').map((l) => l.trim());
    const v: ElementViolation = { selector };
    if (ruleLines.some((l) => l.startsWith('background-color'))) v.backgroundColor = '#000000';
    if (ruleLines.some((l) => l.startsWith('color:')))           v.color = '#ffffff';
    if (ruleLines.some((l) => l.startsWith('border-color')))     v.borderColor = 'red';
    violations.push(v);
  }

  return violations;
}

/**
 * Merge two violation lists.  `incoming` (fresh live-DOM scan) wins on
 * selector conflicts; `existing` (prior AUTO-PATCH entries) fills in
 * selectors not present in `incoming`.
 */
export function mergeViolations(
  existing: ElementViolation[],
  incoming: ElementViolation[],
): ElementViolation[] {
  const map = new Map<string, ElementViolation>();
  for (const v of existing) map.set(v.selector, v);
  for (const v of incoming) map.set(v.selector, v);   // incoming overrides
  return Array.from(map.values());
}

export function applyPatch(css: string, patchBlock: string): string {
  // Remove existing AUTO-PATCH block if present
  const startMatch = PATCH_START_RE.exec(css);
  if (startMatch) {
    const startIdx = startMatch.index;
    const endIdx = css.indexOf(PATCH_END, startIdx);
    if (endIdx === -1) {
      throw new Error(
        'Found AUTO-PATCH start marker but no END AUTO-PATCH marker. ' +
        'The CSS file may be corrupted. Remove the orphaned AUTO-PATCH comment manually and re-run.'
      );
    }
    css = css.slice(0, startIdx) + css.slice(endIdx + PATCH_END.length).replace(/^\n/, '');
  }

  // NOTE: Assumes @layer black-ice is the last block in the file (no rules follow it).
  const layerMatch = css.lastIndexOf('}');
  if (layerMatch === -1) throw new Error('Could not find closing } in CSS file');

  return css.slice(0, layerMatch) + patchBlock + css.slice(layerMatch);
}

export function patchFile(filePath: string, violations: ElementViolation[]): void {
  const date = new Date().toISOString().slice(0, 10);
  const css = readFileSync(filePath, 'utf-8');

  // Merge: preserve all previously patched selectors; incoming scan overrides on conflict.
  const existing = extractExistingViolations(css);
  const merged = mergeViolations(existing, violations);

  const patchBlock = buildPatchBlock(merged, date);
  const patched = applyPatch(css, patchBlock);
  writeFileSync(filePath, patched, 'utf-8');
}
