/**
 * src/core/architect-pass-service.ts
 *
 * Phase 12: Architect Pass (Token Manifestation Engine)
 * Directly manipulates the Foundry VTT renderer state via CDP (Neural Uplink).
 */

import type { IArchitectService } from './interfaces.js';
import type { VisualMonitorService } from './visual-monitor-service.js';

export class ArchitectPassService implements IArchitectService {
  private readonly visualMonitor: VisualMonitorService;

  constructor(visualMonitor: VisualMonitorService) {
    this.visualMonitor = visualMonitor;
  }

  /**
   * Spawns a token in the Foundry renderer using TokenDocument.createDocuments.
   * This bypasses the bridge's standard message-passing and executes directly in the Electron/V8 context.
   */
  async spawnToken(sceneId: string | null, x: number, y: number, actorId?: string): Promise<void> {
    const client = this.visualMonitor.getClient();
    if (!client) {
      throw new Error('ArchitectPassService: Neural Uplink (CDP) client not connected.');
    }

    const { Runtime } = client;

    // Use default actor if none provided
    const actorIdStr = actorId ? `"${actorId}"` : 'game.actors.find(a => a.type === "npc")?.id';
    
    // In Foundry v12, we use the TokenDocument document type for instantiation.
    // The canvas.scene is used if no sceneId is specified.
    const expression = `
      (async function() {
        try {
          const scene = ${sceneId ? `game.scenes.get("${sceneId}")` : 'canvas.scene'};
          const actorId = ${actorIdStr};
          
          if (!scene) return { success: false, error: "Target scene not found." };
          if (!actorId) return { success: false, error: "No NPC actor found to manifest." };

          const data = [{
            actorId: actorId,
            x: ${x},
            y: ${y},
            hidden: false,
            texture: { src: "icons/svg/mystery-man.svg" }
          }];

          const tokens = await TokenDocument.createDocuments(data, { parent: scene });
          return { success: true, count: tokens.length };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `;

    console.log('📡 Architect: Manifesting token at', x, y);
    
    const response = await Runtime.evaluate({
      expression,
      awaitPromise: true,
      returnByValue: true
    });

    const result = response.result.value;
    if (!result || result.success === false) {
      throw new Error(`Foundry Architect Manifestation Failed: ${result?.error ?? 'Unknown renderer error'}`);
    }
    
    console.log(`✅ Architect: Token manifested successfully on scene.`);
  }

  /**
   * Batch creates tokens on the specified scene (or active scene if null).
   * Accepts an array of token data { x, y, actorId? }.
   */
  async materializeTokens(sceneId: string | null, tokens: { x: number, y: number, actorId?: string }[]): Promise<void> {
    const client = this.visualMonitor.getClient();
    if (!client) {
      throw new Error('ArchitectPassService: Neural Uplink (CDP) client not connected.');
    }

    const { Runtime } = client;

    // In Foundry v12, we use TokenDocument.createDocuments for batch creation.
    const expression = `
      (async function() {
        try {
          const scene = ${sceneId ? `game.scenes.get("${sceneId}")` : 'canvas.scene'};
          if (!scene) return { success: false, error: "Target scene not found." };

          const defaultActorId = game.actors.find(a => a.type === "npc")?.id;
          
          const data = ${JSON.stringify(tokens)}.map(t => ({
            actorId: t.actorId || defaultActorId,
            x: t.x,
            y: t.y,
            hidden: false,
            texture: { src: "icons/svg/mystery-man.svg" }
          }));

          const createdTokens = await TokenDocument.createDocuments(data, { parent: scene });
          return { success: true, count: createdTokens.length };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `;

    console.log('📡 Architect: Materializing', tokens.length, 'tokens.');

    const response = await Runtime.evaluate({
      expression,
      awaitPromise: true,
      returnByValue: true
    });

    const result = response.result.value;
    if (!result || result.success === false) {
      throw new Error(`Foundry Architect Token Materialization Failed: ${result?.error ?? 'Unknown renderer error'}`);
    }

    console.log(`✅ Architect: ${result.count} tokens materialized successfully.`);
  }

  /**
   * Batch creates walls on the specified scene (or active scene if null).
   * Accepts an array of [x0, y0, x1, y1] coordinates and injects
   * canvas.scene.createEmbeddedDocuments("Wall", ...).
   */
  async materializeWalls(sceneId: string | null, wallCoords: [number, number, number, number][]): Promise<void> {
    const client = this.visualMonitor.getClient();
    if (!client) {
      throw new Error('ArchitectPassService: Neural Uplink (CDP) client not connected.');
    }

    const { Runtime } = client;

    // In Foundry v12, walls are created as embedded documents in the Scene.
    const expression = `
      (async function() {
        try {
          const scene = ${sceneId ? `game.scenes.get("${sceneId}")` : 'canvas.scene'};
          if (!scene) return { success: false, error: "Target scene not found." };

          const data = ${JSON.stringify(wallCoords)}.map(coords => ({
            c: coords
          }));

          const walls = await scene.createEmbeddedDocuments("Wall", data);
          return { success: true, count: walls.length };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `;

    console.log('📡 Architect: Materializing', wallCoords.length, 'walls.');

    const response = await Runtime.evaluate({
      expression,
      awaitPromise: true,
      returnByValue: true
    });

    const result = response.result.value;
    if (!result || result.success === false) {
      throw new Error(`Foundry Architect Wall Materialization Failed: ${result?.error ?? 'Unknown renderer error'}`);
    }

    console.log(`✅ Architect: ${result.count} walls materialized successfully.`);
  }

  /**
   * Updates the lighting levels (darkness and global illumination)
   * on the specified scene (or active scene if null).
   */
  async setLighting(sceneId: string | null, darkness: number, globalLight: boolean): Promise<void> {
    const client = this.visualMonitor.getClient();
    if (!client) {
      throw new Error('ArchitectPassService: Neural Uplink (CDP) client not connected.');
    }

    const { Runtime } = client;

    // In Foundry v12, scene.update is the primary method for scene data modification.
    const expression = `
      (async function() {
        try {
          const scene = ${sceneId ? `game.scenes.get("${sceneId}")` : 'canvas.scene'};
          if (!scene) return { success: false, error: "Target scene not found." };

          await scene.update({
            "darkness": ${darkness},
            "globalLight": ${globalLight}
          });
          return { success: true };
        } catch (err) {
          return { success: false, error: err.message };
        }
      })()
    `;

    console.log('📡 Architect: Setting lighting - darkness:', darkness, 'globalLight:', globalLight);

    const response = await Runtime.evaluate({
      expression,
      awaitPromise: true,
      returnByValue: true
    });

    const result = response.result.value;
    if (!result || result.success === false) {
      throw new Error(`Foundry Architect Lighting Update Failed: ${result?.error ?? 'Unknown renderer error'}`);
    }

    console.log(`✅ Architect: Lighting updated successfully.`);
  }
}
