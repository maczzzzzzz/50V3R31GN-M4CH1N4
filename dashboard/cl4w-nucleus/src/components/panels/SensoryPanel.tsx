// :/SENSORY // — Atlas Radar panel (mirroring sidecar-atlas high-fidelity sweep)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED   = 0xff003c;
const WHITE = 0xeeeeee;

export const SensoryPanel = {
  init(c: Container, w: number, h: number) {
    const radius = Math.min(w, h) * 0.45;
    const centerX = w / 2;
    const centerY = h / 2 - 20;

    // Static radar circles
    const bg = new Graphics();
    bg.label = 'radarBg';
    bg.setStrokeStyle({ width: 1, color: RED, alpha: 0.2 });
    for (let i = 1; i <= 3; i++) {
      bg.circle(centerX, centerY, (i / 3) * radius).stroke();
    }
    // Axes
    bg.moveTo(centerX - radius, centerY).lineTo(centerX + radius, centerY);
    bg.moveTo(centerX, centerY - radius).lineTo(centerX, centerY + radius);
    bg.stroke();
    c.addChild(bg);

    // Sweep animation layer
    const sweep = new Graphics();
    sweep.label = 'sweep';
    c.addChild(sweep);

    // Blip layer
    const blips = new Container();
    blips.label = 'blips';
    c.addChild(blips);

    // Status line
    const status = new BitmapText({
      text: '47L45: SCANNING // GRID_LOCKED',
      style: { fontFamily: 'SovereignMono', fontSize: 10, fill: WHITE },
    });
    status.label = 'status';
    status.x = 8;
    status.y = h - 28;
    c.addChild(status);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c) return;
    const sweep = c.getChildByName('sweep') as Graphics | null;
    const radius = Math.min(c.width || 400, c.height || 300) * 0.45;
    const centerX = (c.width || 400) / 2;
    const centerY = (c.height || 300) / 2 - 20;

    if (sweep) {
      sweep.clear();
      const angle = (Date.now() / 1000) % (Math.PI * 2);
      sweep.setStrokeStyle({ width: 2, color: RED, alpha: 0.6 });
      sweep.moveTo(centerX, centerY);
      sweep.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      sweep.stroke();
    }

    const blips = c.getChildByName('blips') as Container | null;
    if (!blips) return;
    blips.removeChildren();

    if (state.hoveredUnit?.active) {
      const u = state.hoveredUnit;
      // Normalize coordinate space (assuming 0-1 range from VSB)
      const bx = centerX + (u.x - 0.5) * 2 * radius;
      const by = centerY + (u.y - 0.5) * 2 * radius;

      const dot = new Graphics();
      dot.circle(bx, by, 4).fill({ color: 0xffffff });
      blips.addChild(dot);

      const lbl = new BitmapText({
        text: u.id.toUpperCase(),
        style: { fontFamily: 'SovereignMonoRed', fontSize: 9, fill: RED },
      });
      lbl.x = bx + 8;
      lbl.y = by - 4;
      blips.addChild(lbl);
    }
  },
};
