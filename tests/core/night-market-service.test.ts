// tests/core/night-market-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { NightMarketService } from '../../src/core/night-market-service.js';
import type { INitroDbClient } from '../../src/db/interfaces.js';

describe('NightMarketService', () => {
  it('fetches inventory and calculates prices correctly', async () => {
    const mockNitroDb = {
      ragSearch: vi.fn().mockResolvedValue({
        query: 'query',
        matches: [
          { content: 'Heavy Cyberdeck (500eb): High-end hacking rig.', namespace: 'campaign_ttta' },
          { content: 'Neural Link (100eb): Standard interface.', namespace: 'campaign_ttta' },
          { content: 'Cyberarm (1000eb): Reinforced limb.', namespace: 'campaign_ttta' },
        ]
      })
    } as unknown as INitroDbClient;

    const service = new NightMarketService(mockNitroDb);
    const items = await service.getVendorInventory('Mr. Connors');

    expect(items).toHaveLength(3);
    
    // Check prices
    expect(items[0].costEb).toBe(500);
    expect(items[0].costEagles).toBe(3);
    
    expect(items[1].costEb).toBe(100);
    expect(items[1].costEagles).toBe(0.5);
    
    expect(items[2].costEb).toBe(1000);
    expect(items[2].costEagles).toBe(7.5);
  });
});
