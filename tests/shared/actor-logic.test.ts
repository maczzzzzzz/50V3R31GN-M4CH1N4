import { describe, it, expect } from 'vitest';

describe('Cyberpunk RED Rules: Empathy Collapse', () => {
  function calculateCurrentEMP(humanity: number): number {
    return Math.floor(humanity / 10);
  }

  it('should correctly collapse EMP as Humanity drops below deciles', () => {
    expect(calculateCurrentEMP(60)).toBe(6);
    expect(calculateCurrentEMP(59)).toBe(5);
    expect(calculateCurrentEMP(35)).toBe(3);
    expect(calculateCurrentEMP(9)).toBe(0);
    expect(calculateCurrentEMP(0)).toBe(0);
  });
});
