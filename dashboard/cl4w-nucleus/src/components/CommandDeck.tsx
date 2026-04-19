import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Application, BitmapFont, BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../hooks/useNucleusWS';
import { CommandPanel } from './panels/CommandPanel';
import { SensoryPanel } from './panels/SensoryPanel';
import { IntrusionPanel } from './panels/IntrusionPanel';
import { LogisticsPanel } from './panels/LogisticsPanel';
import { EconomyPanel } from './panels/EconomyPanel';
import { LexiconPanel } from './panels/LexiconPanel';

interface Props {
  state: NucleusState | null;
}

// ─── Palette ─────────────────────────────────────────────────────────────────
const RED   = 0xff003c;
const BG    = 0x080810;
const DIM   = 0x1a1a2e;

export const CommandDeck = forwardRef(({ state }: Props, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef    = useRef<Application | null>(null);

  useImperativeHandle(ref, () => ({
    toggleView(target: string) {
      if (!appRef.current) return;
      const panels = appRef.current.stage.getChildByName('panels') as Container | null;
      if (!panels) return;

      if (target === 'LEXICON') {
        const lex = panels.getChildByName('LEXICON') as Container;
        const log = panels.getChildByName('LOGISTICS') as Container;
        lex.visible = !lex.visible;
        log.visible = !lex.visible;
      } else if (target === 'ECONOMY') {
        const eco = panels.getChildByName('ECONOMY') as Container;
        const int = panels.getChildByName('INTRUSION') as Container;
        eco.visible = !eco.visible;
        int.visible = !eco.visible;
      }
    }
  }));

  // Bootstrap PIXI Application once
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return;

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
      if (!appRef.current) return;
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
    if (!appRef.current || !state) return;
    const app = appRef.current;
    const panels = app.stage.getChildByName('panels') as Container | null;
    if (!panels) return;

    CommandPanel.update(panels.getChildByName('COMMAND') as Container, state);
    SensoryPanel.update(panels.getChildByName('SENSORY') as Container, state);
    EconomyPanel.update(panels.getChildByName('ECONOMY') as Container, state);
    LogisticsPanel.update(panels.getChildByName('LOGISTICS') as Container, state);
    LexiconPanel.update(panels.getChildByName('LEXICON') as Container, state);
  }, [state]);

  return (
    <canvas
      ref={canvasRef}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
    />
  );
}

// ─── Layout builders ─────────────────────────────────────────────────────────

function buildLayout(app: Application) {
  const { width, height } = app.screen;
  const half_w = width  / 2;
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

  // Quadrant containers
  const quads: [string, number, number][] = [
    ['COMMAND',   0,      0],
    ['SENSORY',   half_w, 0],
    ['ECONOMY',   0,      half_h], // Bottom-Left
    ['INTRUSION', 0,      half_h], // Bottom-Left Overlay
    ['LOGISTICS', half_w, half_h], // Bottom-Right
    ['LEXICON',   half_w, half_h], // Bottom-Right Overlay
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

    // Panel label
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
  CommandPanel.init(panels.getChildByName('COMMAND') as Container, half_w, half_h);
  SensoryPanel.init(panels.getChildByName('SENSORY') as Container, half_w, half_h);
  EconomyPanel.init(panels.getChildByName('ECONOMY') as Container, half_w, half_h);
  IntrusionPanel.init(panels.getChildByName('INTRUSION') as Container, half_w, half_h);
  LogisticsPanel.init(panels.getChildByName('LOGISTICS') as Container, half_w, half_h);
  LexiconPanel.init(panels.getChildByName('LEXICON') as Container, half_w, half_h);
  
  // Visibility defaults
  (panels.getChildByName('ECONOMY') as Container).visible = false;
  (panels.getChildByName('LEXICON') as Container).visible = false;
}

function applySovereignShroud(app: Application) {
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
