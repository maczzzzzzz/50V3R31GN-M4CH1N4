import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectPassService } from '../../src/core/architect-pass-service.js';
import type { VisualMonitorService } from '../../src/core/visual-monitor-service.js';

describe('ArchitectPassService', () => {
  let architect: ArchitectPassService;
  let mockVisualMonitor: any;
  let mockRuntime: any;

  beforeEach(() => {
    mockRuntime = {
      evaluate: vi.fn().mockResolvedValue({
        result: { value: { success: true, count: 1 } }
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

  it('should call Runtime.evaluate with correct spawn script', async () => {
    await architect.spawnToken('scene123', 500, 500, 'actor456');

    expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      expression: expect.stringContaining('game.scenes.get("scene123")'),
      awaitPromise: true,
      returnByValue: true
    }));

    expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      expression: expect.stringContaining('actorId = "actor456"')
    }));

    expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      expression: expect.stringContaining('x: 500')
    }));

    expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      expression: expect.stringContaining('y: 500')
    }));
  });

  it('should use canvas.scene if sceneId is null', async () => {
    await architect.spawnToken(null, 500, 500);

    expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
      expression: expect.stringContaining('scene = canvas.scene')
    }));
  });

  it('should throw error if manifestation fails in renderer', async () => {
    mockRuntime.evaluate.mockResolvedValue({
      result: { value: { success: false, error: 'Actor not found' } }
    });

    await expect(architect.spawnToken(null, 500, 500))
      .rejects.toThrow('Foundry Architect Manifestation Failed: Actor not found');
  });

  it('should throw error if CDP client is not connected', async () => {
    mockVisualMonitor.getClient.mockReturnValue(null);

    await expect(architect.spawnToken(null, 500, 500))
      .rejects.toThrow('ArchitectPassService: Neural Uplink (CDP) client not connected.');
  });

  describe('materializeWalls', () => {
    it('should call Runtime.evaluate with correct wall creation script', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 4 } }
      });

      const wallCoords: [number, number, number, number][] = [
        [100, 100, 200, 100],
        [200, 100, 200, 200],
        [200, 200, 100, 200],
        [100, 200, 100, 100]
      ];

      await architect.materializeWalls('scene123', wallCoords);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('game.scenes.get("scene123")'),
        awaitPromise: true,
        returnByValue: true
      }));

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('scene.createEmbeddedDocuments("Wall",')
      }));

      // Check for coordinates in the JSON-ified string
      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('[100,100,200,100]')
      }));
    });

    it('should use canvas.scene if sceneId is null', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      await architect.materializeWalls(null, [[0, 0, 10, 10]]);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('scene = canvas.scene')
      }));
    });

    it('should throw error if wall materialization fails in renderer', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: false, error: 'Scene not found' } }
      });

      await expect(architect.materializeWalls(null, [[0, 0, 10, 10]]))
        .rejects.toThrow('Foundry Architect Wall Materialization Failed: Scene not found');
    });
  });
});
