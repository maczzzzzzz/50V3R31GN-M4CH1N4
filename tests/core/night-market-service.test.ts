// tests/core/night-market-service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { NightMarketService } from '../../packages/hermes-core/src/core/night-market-service.js';
import type { UnifiedOracleClient } from '../../packages/hermes-core/src/db/unified-oracle-client.js';

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
      }),
      query: vi.fn().mockReturnValue([{ file_path: 'mock.png' }])
    } as unknown as UnifiedOracleClient;

    const service = new NightMarketService(mockNitroDb);
    const result = await service.getVendorInventory('Mr. Connors');

    expect(result.items).toHaveLength(3);
    
    // Check prices
    expect(result.items[0].costEb).toBe(500);
    expect(result.items[0].costEagles).toBe(3);
    
    expect(result.items[1].costEb).toBe(100);
    expect(result.items[1].costEagles).toBe(0.5);
    
    expect(result.items[2].costEb).toBe(1000);
    expect(result.items[2].costEagles).toBe(7.5);
  });
});
