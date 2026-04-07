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

  it('flags non-white/cyan text', () => {
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

  it('flags non-cyan border', () => {
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
