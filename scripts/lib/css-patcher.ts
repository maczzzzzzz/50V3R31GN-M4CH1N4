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
    if (v.borderColor)      lines.push(`        border-color: var(--cpr-cyan) !important;`);
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
    if (endIdx === -1) {
      throw new Error(
        'Found AUTO-PATCH start marker but no END AUTO-PATCH marker. ' +
        'The CSS file may be corrupted. Remove the orphaned AUTO-PATCH comment manually and re-run.'
      );
    }
    css = css.slice(0, startIdx) + css.slice(endIdx + PATCH_END.length).replace(/^\n/, '');
  }

  // NOTE: Assumes @layer black-ice is the last block in the file (no rules follow it).
  // This invariant holds for the current black-ice-theme.css structure.
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
