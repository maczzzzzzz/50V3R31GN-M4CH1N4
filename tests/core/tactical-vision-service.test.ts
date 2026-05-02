/**
 * tests/core/tactical-vision-service.test.ts
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TacticalVisionService } from '../../packages/hermes-core/src/core/tactical-vision-service.js';
import fs from 'node:fs/promises';

vi.mock('node:fs/promises');

describe('TacticalVisionService', () => {
  const mockConfig = {
    baseUrl: 'http://localhost:8080/v1',
    model: 'mistral-nemo',
    timeoutMs: 5000,
  };

  let service: TacticalVisionService;

  beforeEach(() => {
    service = new TacticalVisionService(mockConfig);
    vi.clearAllMocks();
  });

  it('should successfully scan a map and return validated tactical regions', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('mock-binary-data'));

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                regions: [
                  {
                    category: 'cover_high',
                    box2d: [100, 200, 300, 400],
                    label: 'Reinforced Concrete Pillar'
                  },
                  {
                    category: 'hazard',
                    box2d: [500, 600, 550, 650],
                    label: 'Exposed Electrical Main'
                  }
                ]
              })
            }
          }
        ]
      })
    });

    const regions = await service.scanMap('test-map.png');

    expect(regions).toHaveLength(2);
    expect(regions[0].category).toBe('cover_high');
    expect(regions[0].label).toBe('Reinforced Concrete Pillar');
    
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/chat/completions'),
      expect.objectContaining({
        method: 'POST',
        body: expect.stringContaining('"model":"llava-v1.5-7b"')
      })
    );
  });

  it('should throw error on invalid model response JSON', async () => {
    vi.mocked(fs.readFile).mockResolvedValue(Buffer.from('data'));
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [{ message: { content: 'Garbage Text' } }]
      })
    });

    await expect(service.scanMap('map.png')).rejects.toThrow('model response is not valid JSON');
  });
});
