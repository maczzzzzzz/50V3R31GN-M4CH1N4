// :/SENSORY // — Atlas Radar panel (replaces sidecar-atlas EGUI window)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED   = 0xff003c;
const WHITE = 0xeeeeee;

export const SensoryPanel = {
  init(c: Container, w: number, h: number) {
    // Static grid
    const grid = new Graphics();
    grid.label = 'grid';
    grid.setStrokeStyle({ width: 0.5, color: RED, alpha: 0.25 });
    for (let i = 0; i <= 10; i++) {
      const x = (i / 10) * (w - 4);
      const y = (i / 10) * (h - 4);
      grid.moveTo(x + 2, 2).lineTo(x + 2, h - 2);
      grid.moveTo(2, y + 2).lineTo(w - 2, y + 2);
    }
    grid.stroke();
    c.addChild(grid);

    // Blip layer
    const blips = new Container();
    blips.label = 'blips';
    c.addChild(blips);

    // Status line — BitmapText for zero-reflow rendering
    const status = new BitmapText({
      text: '47L45: SCANNING...',
      style: { fontFamily: 'SovereignMono', fontSize: 11, fill: WHITE },
    });
    status.label = 'status';
    status.x = 8;
    status.y = h - 28;
    c.addChild(status);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c) return;
    const blips = c.getChildByName('blips') as Container | null;
    if (!blips) return;
    blips.removeChildren();

    if (state.hoveredUnit?.active) {
      const u = state.hoveredUnit;
      const dot = new Graphics();
      dot.circle(u.x * (c.width || 400), u.y * (c.height || 300), 6).fill({ color: 0xffffff });
      blips.addChild(dot);

      const lbl = new BitmapText({
        text: u.id,
        style: { fontFamily: 'SovereignMonoRed', fontSize: 9, fill: RED },
      });
      lbl.x = u.x * (c.width || 400) + 8;
      lbl.y = u.y * (c.height || 300) - 4;
      blips.addChild(lbl);
    }
  },
};
