// :/LOGISTICS // — Monitor / Igniter panel (replaces shadow-dashboard and deck-igniter TUI)
import { Container, Graphics, Text, TextStyle } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED   = 0xff003c;
const GREEN = 0x20ff60;
const WHITE = 0xeeeeee;

const COMPONENTS = ['ATLAS', 'CYBERDECK', 'PROXY', 'ORACLE'] as const;

export const LogisticsPanel = {
  init(c: Container, w: number, h: number) {
    const barsLayer = new Container();
    barsLayer.label = 'bars';

    COMPONENTS.forEach((name, i) => {
      const y = 32 + i * 30;

      const label = new Text({
        text: name,
        style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: WHITE }),
      });
      label.x = 8;
      label.y = y;
      barsLayer.addChild(label);

      // Health bar background
      const bg = new Graphics();
      bg.rect(90, y + 2, w - 110, 14).fill({ color: 0x222222 });
      barsLayer.addChild(bg);

      // Health bar fill (placeholder: 100%)
      const fill = new Graphics();
      fill.label = `bar_${name}`;
      fill.rect(90, y + 2, w - 110, 14).fill({ color: GREEN });
      barsLayer.addChild(fill);
    });

    c.addChild(barsLayer);

    // VSB waveform placeholder
    const wave = new Graphics();
    wave.label = 'waveform';
    const mid = h - 60;
    wave.setStrokeStyle({ width: 1, color: RED, alpha: 0.8 });
    for (let x = 0; x < w - 4; x += 4) {
      const y1 = mid + Math.sin(x * 0.1) * 15;
      const y2 = mid + Math.sin((x + 4) * 0.1) * 15;
      wave.moveTo(x + 2, y1).lineTo(x + 6, y2);
    }
    wave.stroke();
    c.addChild(wave);

    const status = new Text({
      text: 'VSB: ONLINE',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 11, fill: GREEN }),
    });
    status.label = 'vsbStatus';
    status.x = 8;
    status.y = h - 28;
    c.addChild(status);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c) return;
    const status = c.getChildByName('vsbStatus') as Text | null;
    if (status) {
      const lag = Date.now() - (state.timestamp ?? 0);
      status.text = lag < 500 ? '✓ VSB: ONLINE' : '! VSB: LAG';
      status.style.fill = lag < 500 ? GREEN : RED;
    }
  },
};
