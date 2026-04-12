// :/COMMAND // — Terminal REPL panel (replaces crush-cli terminal TUI)
import { BitmapText } from 'pixi.js';
const RED = 0xff003c;
const WHITE = 0xeeeeee;
export const CommandPanel = {
    init(c, w, _h) {
        const log = new BitmapText({
            text: '◈ COMMAND // READY\n> _',
            style: { fontFamily: 'SovereignMono', fontSize: 12, fill: WHITE, wordWrap: true, wordWrapWidth: w - 24 },
        });
        log.label = 'log';
        log.x = 8;
        log.y = 30;
        c.addChild(log);
        const cursor = new BitmapText({
            text: '> _',
            style: { fontFamily: 'SovereignMonoRed', fontSize: 12, fill: RED },
        });
        cursor.label = 'cursor';
        cursor.x = 8;
        cursor.y = _h - 30;
        c.addChild(cursor);
    },
    update(c, _state) {
        if (!c)
            return;
        // Live log updates pushed here when narrative stream is wired
    },
};
