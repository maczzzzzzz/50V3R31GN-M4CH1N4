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
