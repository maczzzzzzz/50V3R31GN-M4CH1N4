import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { Application, BitmapFont, BitmapText, Container, Graphics } from 'pixi.js';
import { CommandPanel } from './panels/CommandPanel';
import { SensoryPanel } from './panels/SensoryPanel';
import { IntrusionPanel } from './panels/IntrusionPanel';
import { LogisticsPanel } from './panels/LogisticsPanel';
// ─── Palette ─────────────────────────────────────────────────────────────────
const RED = 0xff003c;
const BG = 0x080810;
const DIM = 0x1a1a2e;
export function CommandDeck({ state }) {
    const canvasRef = useRef(null);
    const appRef = useRef(null);
    // Bootstrap PIXI Application once
    useEffect(() => {
        if (!canvasRef.current || appRef.current)
            return;
        // Pre-install Sovereign BitmapFont — GPU-accelerated, zero-reflow text
        BitmapFont.install({
            name: 'SovereignMono',
            style: { fontFamily: 'monospace', fontSize: 12, fill: '#eeeeee' },
        });
        BitmapFont.install({
            name: 'SovereignMonoRed',
            style: { fontFamily: 'monospace', fontSize: 11, fill: '#ff003c' },
        });
        const app = new Application();
        app.init({
            canvas: canvasRef.current,
            width: window.innerWidth,
            height: window.innerHeight,
            background: BG,
            antialias: false,
            resolution: window.devicePixelRatio || 1,
        }).then(() => {
            appRef.current = app;
            buildLayout(app);
            // Sovereign Shroud: scanline overlay
            applySovereignShroud(app);
        });
        const onResize = () => {
            if (!appRef.current)
                return;
            appRef.current.renderer.resize(window.innerWidth, window.innerHeight);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            appRef.current?.destroy(true);
            appRef.current = null;
        };
    }, []);
    // Push live state into panels
    useEffect(() => {
        if (!appRef.current || !state)
            return;
        const app = appRef.current;
        const panels = app.stage.getChildByName('panels');
        if (!panels)
            return;
        CommandPanel.update(panels.getChildByName('COMMAND'), state);
        SensoryPanel.update(panels.getChildByName('SENSORY'), state);
        IntrusionPanel.update(panels.getChildByName('INTRUSION'), state);
        LogisticsPanel.update(panels.getChildByName('LOGISTICS'), state);
    }, [state]);
    return (_jsx("canvas", { ref: canvasRef, style: { position: 'absolute', inset: 0, width: '100%', height: '100%' } }));
}
// ─── Layout builders ─────────────────────────────────────────────────────────
function buildLayout(app) {
    const { width, height } = app.screen;
    const half_w = width / 2;
    const half_h = height / 2;
    const panels = new Container();
    panels.label = 'panels';
    app.stage.addChild(panels);
    // Grid dividers
    const grid = new Graphics();
    grid.setStrokeStyle({ width: 1, color: RED, alpha: 0.3 });
    grid.moveTo(half_w, 0).lineTo(half_w, height);
    grid.moveTo(0, half_h).lineTo(width, half_h);
    grid.stroke();
    app.stage.addChild(grid);
    // Four quadrant containers
    const quads = [
        ['COMMAND', 0, 0],
        ['SENSORY', half_w, 0],
        ['INTRUSION', 0, half_h],
        ['LOGISTICS', half_w, half_h],
    ];
    for (const [name, x, y] of quads) {
        const c = new Container();
        c.label = name;
        c.x = x;
        c.y = y;
        // Panel background
        const bg = new Graphics();
        bg.rect(2, 2, half_w - 4, half_h - 4).fill({ color: DIM, alpha: 0.6 });
        c.addChild(bg);
        // Panel label — BitmapText for zero-reflow GPU rendering
        const label = new BitmapText({
            text: `://${name} //`,
            style: { fontFamily: 'SovereignMonoRed', fontSize: 11, fill: RED },
        });
        label.x = 8;
        label.y = 8;
        c.addChild(label);
        panels.addChild(c);
    }
    // Init each panel's static elements
    CommandPanel.init(panels.getChildByName('COMMAND'), half_w, half_h);
    SensoryPanel.init(panels.getChildByName('SENSORY'), half_w, half_h);
    IntrusionPanel.init(panels.getChildByName('INTRUSION'), half_w, half_h);
    LogisticsPanel.init(panels.getChildByName('LOGISTICS'), half_w, half_h);
}
function applySovereignShroud(app) {
    // Scanline overlay — lightweight horizontal lines at ~4px intervals
    const shroud = new Graphics();
    const { width, height } = app.screen;
    shroud.setStrokeStyle({ width: 1, color: 0x000000, alpha: 0.18 });
    for (let y = 0; y < height; y += 4) {
        shroud.moveTo(0, y).lineTo(width, y);
    }
    shroud.stroke();
    app.stage.addChild(shroud);
}
