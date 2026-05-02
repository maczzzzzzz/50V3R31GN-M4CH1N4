// src/core/night-market-service.ts
import type { UnifiedOracleClient } from '../db/unified-oracle-client.js';

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  costEb: number;
  costEagles: number;
  vendor: string;
}

export interface VendorInventory {
  items: MarketItem[];
  suggestedMap?: string | null;
}

export class NightMarketService {
  constructor(private oracle: UnifiedOracleClient) {}

  /**
   * Fetch inventory for a specific vendor using the Unified Oracle.
   */
  async getVendorInventory(vendorName: string, district: string = 'Watson'): Promise<VendorInventory> {
    const searchResult = await this.oracle.ragSearch({
      query: `items and gear sold by vendor ${vendorName} in Ticket to the Afterlife`,
      namespace: 'campaign_ttta', // Matches NamespaceEnum.CAMPAIGN_TTTA
      topK: 10,
      similarityThreshold: 0.5,
    });

    const items: MarketItem[] = searchResult.matches.map((match, index) => {
      const matchText = match.content;
      const ebMatch = matchText.match(/(\d+)eb/);
      const costEb = ebMatch && ebMatch[1] ? parseInt(ebMatch[1], 10) : 100;
      const name = matchText.split(/[():\n]/)[0]?.trim() || `Item ${index + 1}`;
      
      return {
        id: `ttta-item-${index}`,
        name,
        description: matchText.substring(0, 200),
        costEb,
        costEagles: this.calculateEaglePrice(costEb),
        vendor: vendorName,
      };
    });

    // Fetch a relevant map tile or map for this district
    const maps = this.oracle.query(
      `SELECT file_path FROM map_assets WHERE category IN ('tile', 'map') AND biome LIKE ? LIMIT 1`,
      [`%${district}%`]
    ) as Array<{ file_path: string }>;

    return {
      items,
      suggestedMap: maps[0]?.file_path ?? null
    };
  }

  calculateEaglePrice(eb: number): number {
    if (eb <= 100) return 0.5;
    if (eb <= 500) return 3;
    if (eb <= 1000) return 7.5;
    return Math.ceil(eb / 100);
  }
}
