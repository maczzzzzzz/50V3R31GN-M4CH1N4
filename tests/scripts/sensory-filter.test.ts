import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SensoryFilter } from '../../50v3r31gn-bridge/scripts/sensory-filter.js';

describe('SensoryFilter', () => {
  beforeEach(() => {
    // Mock Foundry VTT canvas global
    global.canvas = {
      tokens: {
        get: vi.fn(),
        placeables: []
      },
      walls: {
        computePolygon: vi.fn()
      }
    };
  });

  it('filters entities outside of the computed LOS polygon', () => {
    // Mock polygon that only contains points within x: 0-10, y: 0-10
    const mockPolygon = {
      contains: vi.fn((x, y) => x >= 0 && x <= 10 && y >= 0 && y <= 10)
    };

    global.canvas.walls.computePolygon.mockReturnValue(mockPolygon);

    global.canvas.tokens.get.mockReturnValue({
      center: { x: 5, y: 5 },
      vision: { radius: 10 }
    });

    global.canvas.tokens.placeables = [
      { id: 'self', name: 'Self Token', center: { x: 5, y: 5 }, x: 5, y: 5, document: { disposition: 1 } },
      { id: 'visible1', name: 'Visible Enemy', center: { x: 8, y: 8 }, x: 8, y: 8, document: { disposition: -1 } },
      { id: 'hidden1', name: 'Hidden Enemy', center: { x: 15, y: 15 }, x: 15, y: 15, document: { disposition: -1 } }
    ];

    const result = SensoryFilter.getVisibleEntities('self');

    expect(global.canvas.tokens.get).toHaveBeenCalledWith('self');
    expect(global.canvas.walls.computePolygon).toHaveBeenCalledWith({
      x: 5,
      y: 5,
      type: "sight",
      radius: 10
    });

    // Should not include 'self' and 'hidden1'
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 'visible1',
      name: 'Visible Enemy',
      x: 8,
      y: 8,
      disposition: -1
    });
  });

  it('returns empty array if token is not found', () => {
    global.canvas.tokens.get.mockReturnValue(undefined);
    
    const result = SensoryFilter.getVisibleEntities('nonexistent');
    
    expect(result).toEqual([]);
    expect(global.canvas.walls.computePolygon).not.toHaveBeenCalled();
  });
});
