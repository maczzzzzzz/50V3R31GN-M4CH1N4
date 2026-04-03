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

// Black-Ice palette — intentional theme values that are NOT violations.
// Includes the inactive-state colors the theme sets deliberately on tabs/buttons.

const ALLOWED_BG_SET = new Set([
  'rgb(0, 0, 0)',       // #000000 — primary bg
  'rgba(0, 0, 0, 0)',   // transparent
  'transparent',
  '',
  'rgb(5, 5, 5)',       // #050505 — --cpr-bg-dark-grey (inactive tab/button bg)
  'rgb(13, 11, 12)',    // near-black — CPR system header bg (acceptable dark)
  'rgb(68, 68, 68)',    // #444 — window resize handle
]);

// Allow any semi-transparent black (rgba(0, 0, 0, *)) — scene controls etc.
function isAllowedBg(value: string): boolean {
  if (ALLOWED_BG_SET.has(value)) return true;
  return /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*[\d.]+\s*\)$/.test(value);
}

const ALLOWED_TEXT_SET = new Set([
  'rgb(255, 255, 255)', // #ffffff — primary text
  'rgb(238, 238, 238)', // #eeeeee — --cpr-text-main
  'rgb(0, 243, 255)',   // #00f3ff — --cpr-cyan
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
  'rgb(136, 136, 136)', // #888 — intentional inactive tab/button text
]);

function isAllowedText(value: string): boolean {
  return ALLOWED_TEXT_SET.has(value);
}

const ALLOWED_BORDER_SET = new Set([
  'rgb(0, 243, 255)',   // #00f3ff — --cpr-cyan
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
  'rgb(34, 34, 34)',    // #222 — intentional inactive tab/button border
  'rgb(0, 0, 0)',       // #000 — pure black border (invisible/neutral)
  'rgb(17, 17, 17)',    // very dark grey — window resize handle border
  'rgb(68, 68, 68)',    // #444 — dark grey border (directory footer)
]);

function isAllowedBorder(value: string): boolean {
  if (ALLOWED_BORDER_SET.has(value)) return true;
  return /^rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*[\d.]+\s*\)$/.test(value);
}

export function detectViolations(elements: ElementInput[]): ElementViolation[] {
  const seen = new Map<string, ElementViolation>();

  for (const { selector, styles } of elements) {
    const violation: ElementViolation = { selector };
    let hasViolation = false;

    if (!isAllowedBg(styles.backgroundColor)) {
      violation.backgroundColor = styles.backgroundColor;
      hasViolation = true;
    }
    if (!isAllowedText(styles.color)) {
      violation.color = styles.color;
      hasViolation = true;
    }
    // borderColor is '' when the element has no visible border (borderTopWidth === '0px')
    if (styles.borderColor !== '' && !isAllowedBorder(styles.borderColor)) {
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
