// :/INTRUSION // — Netrun panel (replaces sidecar-cyberdeck EGUI window)
import { BitmapText, Container, Graphics } from 'pixi.js';
const RED = 0xff003c;
const DIM = 0x1a3040;
const ICE_LABELS = ['FIREWALL', 'TRACE', 'GATE', 'CRYPTER'];
export const IntrusionPanel = {
    init(c, w, h) {
        const nodeLayer = new Container();
        nodeLayer.label = 'nodes';
        const cols = 4;
        const cellW = (w - 20) / cols;
        for (let i = 0; i < cols; i++) {
            const nx = 10 + i * cellW + cellW / 2;
            const ny = h / 2;
            const box = new Graphics();
            box.rect(nx - 30, ny - 20, 60, 40).fill({ color: DIM }).stroke({ width: 1, color: RED, alpha: 0.7 });
            nodeLayer.addChild(box);
            const lbl = new BitmapText({
                text: ICE_LABELS[i] ?? '???',
                style: { fontFamily: 'SovereignMonoRed', fontSize: 9, fill: RED },
            });
            lbl.anchor.set(0.5, 0.5);
            lbl.x = nx;
            lbl.y = ny;
            nodeLayer.addChild(lbl);
        }
        c.addChild(nodeLayer);
        // Depth meter — BitmapText for zero-reflow
        const depth = new BitmapText({
            text: 'DEPTH: 0.000',
            style: { fontFamily: 'SovereignMono', fontSize: 11, fill: 0xeeeeee },
        });
        depth.label = 'depth';
        depth.x = 8;
        depth.y = h - 28;
        c.addChild(depth);
    },
    update(c, _state) {
        if (!c)
            return;
        // Depth and ST3GG status wired here when intrusion metrics are streamed
    },
};
