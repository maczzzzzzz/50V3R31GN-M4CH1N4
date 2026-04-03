import { test, expect, describe } from 'vitest';
import { ClawLinkClient } from '../../src/api/clawlink-client';

describe('Perception Live RPC (Phase 16 Audit)', () => {
  const host = '127.0.0.1';
  const port = 7878;

  test('should return PERCEPTION_STUB sentinel from live ZeroClaw', async () => {
    const client = new ClawLinkClient({ host, port });
    await client.connect();
    
    // Valid 1x1 red dot PNG
    const redDot = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

    const result = await client.executeRpc('ocr_analyze', { image: redDot });
    
    console.log('Live RPC Result:', JSON.stringify(result, null, 2));
    
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].text).toBe('PERCEPTION_STUB');
    
    await client.disconnect();
  }, 15000); // 15s timeout for model swap simulation
});
