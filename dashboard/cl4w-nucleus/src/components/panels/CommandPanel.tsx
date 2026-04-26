// :/COMMAND // — Terminal / Narrative panel (Two-Window pattern)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

import { PretextLayout } from '../../hooks/PretextLayout';

const RED    = 0xff003c;
const GREEN  = 0x20ff60;
const WHITE  = 0xeeeeee;
const DIM    = 0x1a1a2e;

const layoutEngine = new PretextLayout('13px monospace');

export const CommandPanel = {
  init(c: Container, w: number, h: number) {
    const splitY = h * 0.4; // 40% Logs, 60% Narrative

    // 1. Log Window (Top)
    const logBg = new Graphics();
    logBg.rect(4, 30, w - 8, splitY - 34).fill({ color: 0x000000, alpha: 0.4 });
    c.addChild(logBg);

    const logText = new BitmapText({
      text: '◈ SYSTEM_LOG // READY\n',
      style: { fontFamily: 'SovereignMono', fontSize: 10, fill: GREEN, wordWrap: true, wordWrapWidth: w - 24 },
    });
    logText.label = 'logText';
    logText.x = 12;
    logText.y = 34;
    c.addChild(logText);

    // Divider
    const divider = new Graphics();
    divider.setStrokeStyle({ width: 1, color: RED, alpha: 0.5 });
    divider.moveTo(4, splitY).lineTo(w - 4, splitY);
    divider.stroke();
    c.addChild(divider);

    // 2. Narrative Window (Bottom)
    const narrLabel = new BitmapText({
      text: '://DIRECTOR_FEED //',
      style: { fontFamily: 'SovereignMonoRed', fontSize: 10, fill: RED },
    });
    narrLabel.x = 8;
    narrLabel.y = splitY + 8;
    c.addChild(narrLabel);

    const narrText = new BitmapText({
      text: 'Waiting for Director narrative pulse...\n',
      style: { fontFamily: 'SovereignMono', fontSize: 13, fill: WHITE, wordWrap: true, wordWrapWidth: w - 24 },
    });
    narrText.label = 'narrText';
    narrText.x = 12;
    narrText.y = splitY + 30;
    c.addChild(narrText);

    // Input Cursor
    const cursor = new BitmapText({
      text: '> _',
      style: { fontFamily: 'SovereignMonoRed', fontSize: 11, fill: RED },
    });
    cursor.label = 'cursor';
    cursor.x = 8;
    cursor.y = h - 24;
    c.addChild(cursor);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c || !state) return;

    const logText = c.getChildByName('logText') as BitmapText | null;
    if (logText && state.logs) {
      logText.text = state.logs.join('\n');
    }

    const narrText = c.getChildByName('narrText') as BitmapText | null;
    if (narrText && state.narrative) {
      const fullText = Array.isArray(state.narrative) ? state.narrative.join('\n\n') : state.narrative;
      const lines = layoutEngine.layout(fullText, (c.parent as Container).width / 2 - 24);
      narrText.text = lines.join('\n');
    }
  },
};
