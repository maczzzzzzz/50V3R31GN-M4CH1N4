// :/COMMAND // — Terminal REPL panel (replaces crush-cli terminal TUI)
import { Container, Text, TextStyle } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED   = 0xff003c;
const WHITE = 0xeeeeee;

export const CommandPanel = {
  init(c: Container, _w: number, _h: number) {
    const log = new Text({
      text: '◈ COMMAND // READY\n> _',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: WHITE, wordWrap: true, wordWrapWidth: _w - 24 }),
    });
    log.label = 'log';
    log.x = 8;
    log.y = 30;
    c.addChild(log);

    const cursor = new Text({
      text: '> _',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 12, fill: RED }),
    });
    cursor.label = 'cursor';
    cursor.x = 8;
    cursor.y = _h - 30;
    c.addChild(cursor);
  },

  update(c: Container | null, _state: NucleusState) {
    if (!c) return;
    // Live log updates pushed here when narrative stream is wired
  },
};
