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
  'rgb(0, 243, 255)',
  'rgba(0, 0, 0, 0)',
  'transparent',
  '',
]);

const ALLOWED_BORDER = new Set([
  'rgb(0, 243, 255)',
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
