// :/INTRUSION // — Netrun panel (mirroring sidecar-netrunning isometric grid)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED  = 0xff003c;
const DIM  = 0x1a3040;
const CYAN = 0x00f3ff;

export const IntrusionPanel = {
  init(c: Container, w: number, h: number) {
    const grid = new Container();
    grid.label = 'iceGrid';
    c.addChild(grid);

    // Build isometric grid
    const tileW = 40;
    const tileH = 20;
    const originX = w / 2;
    const originY = h / 2 - 40;

    const g = new Graphics();
    g.setStrokeStyle({ width: 0.5, color: CYAN, alpha: 0.3 });

    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 6; col++) {
        // Draw tile diamond
        const sx = originX + (col - row) * (tileW / 2);
        const sy = originY + (col + row) * (tileH / 2);

        g.moveTo(sx, sy);
        g.lineTo(sx + tileW / 2, sy + tileH / 2);
        g.lineTo(sx, sy + tileH);
        g.lineTo(sx - tileW / 2, sy + tileH / 2);
        g.lineTo(sx, sy);
      }
    }
    g.stroke();
    grid.addChild(g);

    // ICE Nodes (Placeholders)
    const nodes = [
      { col: 1, row: 1, type: 'FIREWALL' },
      { col: 3, row: 2, type: 'TRACE' },
      { col: 4, row: 4, type: 'GATE' },
    ];

    nodes.forEach(node => {
      const nx = originX + (node.col - node.row) * (tileW / 2);
      const ny = originY + (node.col + node.row) * (tileH / 2) + tileH / 2;
      
      const box = new Graphics();
      box.rect(nx - 5, ny - 5, 10, 10).fill({ color: node.type === 'TRACE' ? RED : 0xffffff });
      grid.addChild(box);
    });

    // Depth meter
    const depth = new BitmapText({
      text: 'DEPTH: 0.000 // ST3GG_LOCK: ACTIVE',
      style: { fontFamily: 'SovereignMono', fontSize: 10, fill: 0xeeeeee },
    });
    depth.label = 'depth';
    depth.x = 8;
    depth.y = h - 28;
    c.addChild(depth);
  },

  update(c: Container | null, _state: NucleusState) {
    if (!c) return;
    // Real-time grid pulsing or ICE state updates wired here
  },
};
