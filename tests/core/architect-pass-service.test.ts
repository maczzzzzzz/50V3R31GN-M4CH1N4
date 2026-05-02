import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArchitectPassService } from '../../packages/hermes-core/src/core/architect-pass-service.js';
import type { VisualMonitorService } from '../../packages/hermes-core/src/core/visual-monitor-service.js';
import type { GhostBlip } from '../../packages/hermes-core/src/shared/vsb_protocol.js';

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

  describe('setLighting', () => {
    it('should call Runtime.evaluate with correct lighting update script', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true } }
      });

      await architect.setLighting('scene123', 0.5, true);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('game.scenes.get("scene123")'),
        awaitPromise: true,
        returnByValue: true
      }));

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('await scene.update({')
      }));

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('"darkness": 0.5')
      }));

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('"globalLight": true')
      }));
    });

    it('should use canvas.scene if sceneId is null', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true } }
      });

      await architect.setLighting(null, 0.8, false);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('scene = canvas.scene')
      }));
    });

    it('should throw error if lighting update fails in renderer', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: false, error: 'Update failed' } }
      });

      await expect(architect.setLighting(null, 0.5, true))
        .rejects.toThrow('Foundry Architect Lighting Update Failed: Update failed');
    });
  });

  describe('seedGhostBlips()', () => {
    const sceneDimensions = { width: 1000, height: 800 };

    it('resolves immediately when blips array is empty (no CDP or bridge calls)', async () => {
      await architect.seedGhostBlips('scene123', [], sceneDimensions);
      expect(mockRuntime.evaluate).not.toHaveBeenCalled();
    });

    it('delegates to Bridge runSequence when foundryAdapter is connected', async () => {
      const mockFoundryAdapter = {
        isConnected: vi.fn().mockReturnValue(true),
        runSequence: vi.fn().mockResolvedValue(undefined),
      };
      const architectWithBridge = new ArchitectPassService(
        mockVisualMonitor as unknown as VisualMonitorService,
        mockFoundryAdapter as any,
      );

      const blips: GhostBlip[] = [
        { x: 0.5, y: 0.5, blipType: 0x01 },
        { x: 0.25, y: 0.75, blipType: 0x02 },
      ];

      await architectWithBridge.seedGhostBlips('scene123', blips, sceneDimensions);

      expect(mockFoundryAdapter.runSequence).toHaveBeenCalledOnce();
      const seqArgs = mockFoundryAdapter.runSequence.mock.calls[0][0];
      expect(seqArgs).toHaveLength(2);
      expect(seqArgs[0]).toMatchObject({ type: 'effect', location: { x: 500, y: 400 } });
      expect(seqArgs[1]).toMatchObject({ type: 'effect', location: { x: 250, y: 600 } });
      // CDP must NOT be called when bridge succeeds
      expect(mockRuntime.evaluate).not.toHaveBeenCalled();
    });

    it('falls back to CDP when bridge throws', async () => {
      const mockFoundryAdapter = {
        isConnected: vi.fn().mockReturnValue(true),
        runSequence: vi.fn().mockRejectedValue(new Error('Bridge down')),
      };
      const architectWithBridge = new ArchitectPassService(
        mockVisualMonitor as unknown as VisualMonitorService,
        mockFoundryAdapter as any,
      );

      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.5, y: 0.5, blipType: 0x01 }];
      await architectWithBridge.seedGhostBlips('scene123', blips, sceneDimensions);

      expect(mockFoundryAdapter.runSequence).toHaveBeenCalledOnce();
      expect(mockRuntime.evaluate).toHaveBeenCalledOnce();
    });

    it('throws when blip count > 0 but neither CDP nor bridge is available', async () => {
      mockVisualMonitor.getClient.mockReturnValue(null);

      const blips: GhostBlip[] = [{ x: 0.5, y: 0.5, blipType: 0x01 }];
      await expect(
        architect.seedGhostBlips('scene123', blips, sceneDimensions)
      ).rejects.toThrow('ArchitectPassService.seedGhostBlips: Neural Uplink not connected.');
    });

    it('maps blipType 0x01 to color #00ff88 (cover)', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.1, y: 0.2, blipType: 0x01 }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('#00ff88'),
      }));
    });

    it('maps blipType 0x02 to color #ff4400 (hazard)', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.1, y: 0.2, blipType: 0x02 }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('#ff4400'),
      }));
    });

    it('maps unknown blipType to color #00aaff (objective)', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.1, y: 0.2, blipType: 0x03 }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('#00aaff'),
      }));
    });

    it('correctly converts normalised coordinates to pixel coordinates', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      // x=0.4 * 1000 = 400, y=0.5 * 800 = 400
      const blips: GhostBlip[] = [{ x: 0.4, y: 0.5, blipType: 0x01 }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      const call = mockRuntime.evaluate.mock.calls[0][0];
      // The expression should contain the serialized regionData with px=400, py=400
      expect(call.expression).toContain('"px":400');
      expect(call.expression).toContain('"py":400');
    });

    it('uses optional label when provided in blip', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.5, y: 0.5, blipType: 0x01, label: 'Alpha-1' }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('Alpha-1'),
      }));
    });

    it('uses auto-generated label when blip has no label', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: true, count: 1 } }
      });

      const blips: GhostBlip[] = [{ x: 0.5, y: 0.5, blipType: 0x01 }];
      await architect.seedGhostBlips(null, blips, sceneDimensions);

      expect(mockRuntime.evaluate).toHaveBeenCalledWith(expect.objectContaining({
        expression: expect.stringContaining('Ghost-1'),
      }));
    });

    it('throws when CDP returns a failure result', async () => {
      mockRuntime.evaluate.mockResolvedValue({
        result: { value: { success: false, error: 'Region creation failed' } }
      });

      const blips: GhostBlip[] = [{ x: 0.5, y: 0.5, blipType: 0x02 }];
      await expect(
        architect.seedGhostBlips(null, blips, sceneDimensions)
      ).rejects.toThrow('Ghost Blip seeding failed: Region creation failed');
    });
  });
});
