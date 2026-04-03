import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectPassService } from '../../src/core/architect-pass-service.js';
import type { VisualMonitorService } from '../../src/core/visual-monitor-service.js';

describe('ArchitectPassService Stability Test', () => {
  let architect: ArchitectPassService;
  let mockVisualMonitor: any;
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {
      evaluate: vi.fn().mockImplementation(async ({ expression }) => {
        // Simulate some processing time
        await new Promise(resolve => setTimeout(resolve, 10));
        
        if (expression.includes('TokenDocument.createDocuments')) {
          // Extract the data array to count tokens
          const match = expression.match(/const data = (.*)\.map/);
          const count = match ? JSON.parse(match[1]).length : 0;
          return { result: { value: { success: true, count } } };
        }
        
        if (expression.includes('scene.createEmbeddedDocuments("Wall"')) {
          // Extract the data array to count walls
          const match = expression.match(/const data = (.*)\.map/);
          const count = match ? JSON.parse(match[1]).length : 0;
          return { result: { value: { success: true, count } } };
        }

        return { result: { value: { success: true } } };
      })
    };

    const mockClient = {
      Runtime: mockRuntime
    };

    mockVisualMonitor = {
      getClient: vi.fn().mockReturnValue(mockClient)
    };

    architect = new ArchitectPassService(mockVisualMonitor as unknown as VisualMonitorService);
  });

  it('should handle batch materialization of 50 tokens and 100 walls', async () => {
    const tokens = Array.from({ length: 50 }, (_, i) => ({
      x: i * 10,
      y: i * 10,
      actorId: `actor-${i}`
    }));

    const walls: [number, number, number, number][] = Array.from({ length: 100 }, (_, i) => [
      i * 10, 0, i * 10, 100
    ]);

    const start = Date.now();
    
    await architect.materializeTokens(null, tokens);
    await architect.materializeWalls(null, walls);
    
    const end = Date.now();
    const duration = end - start;

    console.log(`⏱️ Stability Test Duration: ${duration}ms`);

    expect(mockRuntime.evaluate).toHaveBeenCalledTimes(2);
    
    // Verify token evaluation
    expect(mockRuntime.evaluate).toHaveBeenNthCalledWith(1, expect.objectContaining({
      expression: expect.stringContaining('TokenDocument.createDocuments'),
      awaitPromise: true
    }));

    // Verify wall evaluation
    expect(mockRuntime.evaluate).toHaveBeenNthCalledWith(2, expect.objectContaining({
      expression: expect.stringContaining('scene.createEmbeddedDocuments("Wall"'),
      awaitPromise: true
    }));

    expect(duration).toBeLessThan(1000); // Should be very fast with mocks
  });
});
