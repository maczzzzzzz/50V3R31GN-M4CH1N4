import { describe, it, expect } from 'vitest';
import { foundryToMachine, machineToFoundry, normalizedToMachine } from '../../../src/shared/utils/coords.js';

describe('Coordinate Normalization', () => {
  it('should convert foundry pixels to machine units (0-1000)', () => {
    // Assuming 100px grid, 2000px scene
    expect(foundryToMachine(1000, 2000)).toBe(500);
  });
  it('should convert machine units back to foundry pixels', () => {
    expect(machineToFoundry(500, 2000)).toBe(1000);
  });
  it('should convert 0.0-1.0 normalized to 0-1000 machine units', () => {
    expect(normalizedToMachine(0.5)).toBe(500);
  });
});
