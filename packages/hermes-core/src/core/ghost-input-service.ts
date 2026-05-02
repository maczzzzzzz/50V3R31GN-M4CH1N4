/**
 * src/core/ghost-input-service.ts
 *
 * GhostInputService — Phase 28 Ghost Protocol
 *
 * Grants the machine physical sovereignty over the Foundry VTT
 * renderer via the CDP Input domain.
 *
 * Capabilities:
 *   - dispatchClick: Physical mouse clicks at coordinates.
 *   - dispatchKey: Physical keyboard strokes.
 *   - dragToken: Multi-stage mouse sequence (Move -> Press -> Move -> Release).
 */

import type { VisualMonitorService } from './visual-monitor-service.js';

export interface GhostCoordinates {
  x: number;
  y: number;
}

export class GhostInputService {
  constructor(private readonly visualMonitor: VisualMonitorService) {}

  /**
   * Physically click at the specified screen coordinates.
   */
  async dispatchClick(coords: GhostCoordinates): Promise<void> {
    const client = this.visualMonitor.getClient();
    
    // 1. Move to location
    await client.Input.dispatchMouseEvent({
      type: 'mouseMoved',
      x: coords.x,
      y: coords.y,
    });

    // 2. Press
    await client.Input.dispatchMouseEvent({
      type: 'mousePressed',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1,
    });

    // 3. Release
    await client.Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x: coords.x,
      y: coords.y,
      button: 'left',
      clickCount: 1,
    });

    console.log(`📡 GhostInput: Physical CLICK dispatched at (${coords.x}, ${coords.y})`);
  }

  /**
   * Physically type a string of text.
   */
  async dispatchString(text: string): Promise<void> {
    const client = this.visualMonitor.getClient();
    for (const char of text) {
      await client.Input.dispatchKeyEvent({
        type: 'keyDown',
        text: char,
      });
      await client.Input.dispatchKeyEvent({
        type: 'keyUp',
        text: char,
      });
      // Small jitter to simulate human input
      await new Promise(r => setTimeout(r, 20 + Math.random() * 30));
    }
  }

  /**
   * Dispatch a single key press (keyDown + keyUp).
   * Handles printable characters and named keys (e.g. 'Enter', 'Escape', 'Tab').
   */
  async dispatchKey(key: string): Promise<void> {
    const client = this.visualMonitor.getClient();
    // Named keys map to their DOM key identifiers; single chars use their value as text.
    const isPrintable = key.length === 1;
    await client.Input.dispatchKeyEvent({
      type: 'keyDown',
      key,
      text: isPrintable ? key : undefined,
    });
    await client.Input.dispatchKeyEvent({
      type: 'keyUp',
      key,
      text: isPrintable ? key : undefined,
    });
    console.log(`📡 GhostInput: Physical KEY dispatched: ${key}`);
  }

  /**
   * Move a Foundry token to new canvas coordinates using a physical drag sequence.
   * Resolves the token's current screen position via CDP Runtime, then calls dragGesture.
   */
  async dragToken(tokenId: string, targetCanvasX: number, targetCanvasY: number): Promise<void> {
    const client = this.visualMonitor.getClient();

    // Resolve the token's current screen coordinates from Foundry canvas state.
    const { result, exceptionDetails } = await client.Runtime.evaluate({
      expression: `(function() {
        const token = canvas.tokens.get(${JSON.stringify(tokenId)});
        if (!token) throw new Error('Token not found: ' + ${JSON.stringify(tokenId)});
        const stage = canvas.app.stage;
        // Convert canvas coordinates to screen coordinates via the PIXI stage transform.
        const screenFrom = stage.toGlobal({ x: token.x, y: token.y });
        const screenTo   = stage.toGlobal({ x: ${targetCanvasX}, y: ${targetCanvasY} });
        return { fromX: screenFrom.x, fromY: screenFrom.y, toX: screenTo.x, toY: screenTo.y };
      })()`,
      returnByValue: true,
    });

    if (exceptionDetails) {
      throw new Error(
        `[GhostInputService] dragToken coordinate resolution failed: ${exceptionDetails.text ?? exceptionDetails.exception?.description ?? 'unknown'}`
      );
    }

    const coords = result.value as { fromX: number; fromY: number; toX: number; toY: number };
    await this.dragGesture(
      { x: coords.fromX, y: coords.fromY },
      { x: coords.toX,   y: coords.toY },
    );
    console.log(`📡 GhostInput: Token ${tokenId} dragged to canvas (${targetCanvasX}, ${targetCanvasY})`);
  }

  /**
   * Perform a physical drag-and-drop operation.
   * Useful for moving tokens or dragging items from sidebar.
   */
  async dragGesture(from: GhostCoordinates, to: GhostCoordinates, durationMs: number = 500): Promise<void> {
    const client = this.visualMonitor.getClient();
    
    // 1. Move to start
    await client.Input.dispatchMouseEvent({ type: 'mouseMoved', x: from.x, y: from.y });
    
    // 2. Mouse Down
    await client.Input.dispatchMouseEvent({
      type: 'mousePressed',
      x: from.x,
      y: from.y,
      button: 'left',
      clickCount: 1
    });

    // 3. Interpolated Move
    const steps = 10;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const curX = from.x + (to.x - from.x) * t;
      const curY = from.y + (to.y - from.y) * t;
      
      await client.Input.dispatchMouseEvent({
        type: 'mouseMoved',
        x: curX,
        y: curY,
      });
      
      await new Promise(r => setTimeout(r, durationMs / steps));
    }

    // 4. Mouse Up
    await client.Input.dispatchMouseEvent({
      type: 'mouseReleased',
      x: to.x,
      y: to.y,
      button: 'left',
      clickCount: 1
    });

    console.log(`📡 GhostInput: Physical DRAG completed from (${from.x}, ${from.y}) to (${to.x}, ${to.y})`);
  }
}
