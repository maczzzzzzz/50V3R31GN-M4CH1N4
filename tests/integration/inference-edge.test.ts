import { describe, it, expect, vi } from 'vitest';
import { SpatialVisionService } from '../../src/core/spatial-vision-service.js';

describe('Inference API Edge Cases (Native llama-server)', () => {
  it('should not crash when VLM endpoint returns malformed JSON', async () => {
    // 1. Setup service
    const service = new SpatialVisionService({ chromeCdpUrl: 'http://localhost:9222' });
    
    // 2. Mock fetch to return broken JSON
    const mockFetch = vi.fn().mockResolvedValue(new Response('THIS IS GARBAGE <HTML>', { status: 200 }));
    vi.stubGlobal('fetch', mockFetch);

    // 3. Test tactical analysis (it should catch the JSON parse error and return an empty context)
    const result = await service.analyzeWithLlava('base64data');
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
    
    vi.unstubAllGlobals();
  });

  it('should not crash when VLM endpoint hangs (timeout simulation)', async () => {
    // 1. Setup service
    const service = new SpatialVisionService({ chromeCdpUrl: 'http://localhost:9222' });
    
    // 2. Mock fetch to simulate a hang that eventually throws (or aborts via signal)
    const mockFetch = vi.fn().mockRejectedValue(new Error('fetch failed: network timeout'));
    vi.stubGlobal('fetch', mockFetch);

    // 3. Test tactical analysis (it should catch the timeout error)
    const result = await service.analyzeWithLlava('base64data');
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
    
    vi.unstubAllGlobals();
  });

  it('should reject a 500 Internal Server Error cleanly', async () => {
    const service = new SpatialVisionService({ chromeCdpUrl: 'http://localhost:9222' });
    
    // Server crashes or VRAM runs out during generation
    const mockFetch = vi.fn().mockResolvedValue(new Response('Out of memory', { status: 500 }));
    vi.stubGlobal('fetch', mockFetch);

    const result = await service.analyzeWithLlava('base64data');
    expect(result.tokenClusters).toEqual([]);
    expect(result.environmentalFeatures).toEqual([]);
    
    vi.unstubAllGlobals();
  });
});

