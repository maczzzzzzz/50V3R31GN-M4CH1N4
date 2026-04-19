// :/ECONOMY // — Night Market terminal (mirroring shadow-dashboard MarketTerminal)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED    = 0xff003c;
const GREEN  = 0x20ff60;
const WHITE  = 0xeeeeee;
const GOLD   = 0xffaa00;

export const EconomyPanel = {
  init(c: Container, w: number, h: number) {
    const header = new BitmapText({
      text: '◈ MARKET_G3N3R470R // ACCESS: GRANTED',
      style: { fontFamily: 'SovereignMono', fontSize: 10, fill: WHITE },
    });
    header.x = 8;
    header.y = 30;
    c.addChild(header);

    // Grid for recent markets
    const list = new Container();
    list.label = 'marketList';
    list.x = 8;
    list.y = 50;
    c.addChild(list);

    // Roll button (Visual only, functional via overlay or command)
    const btn = new Graphics();
    btn.rect(8, h - 60, w - 16, 24).fill({ color: RED, alpha: 0.2 }).stroke({ width: 1, color: RED });
    c.addChild(btn);

    const btnText = new BitmapText({
      text: '[ R0LL_N1GH7_M4RK37 ]',
      style: { fontFamily: 'SovereignMonoRed', fontSize: 11, fill: RED },
    });
    btnText.anchor.set(0.5, 0.5);
    btnText.x = w / 2;
    btnText.y = h - 48;
    c.addChild(btnText);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c || !state) return;
    const list = c.getChildByName('marketList') as Container | null;
    if (!list) return;

    list.removeChildren();
    if (state.recentMarkets) {
      state.recentMarkets.forEach((m, i) => {
        const item = new BitmapText({
          text: `[${m.districtId.toUpperCase()}] ${m.vendorName.slice(0, 12)}… (${m.itemCount} itm)`,
          style: { fontFamily: 'SovereignMono', fontSize: 10, fill: i === 0 ? GREEN : 0xbbbbbb },
        });
        item.y = i * 18;
        list.addChild(item);
      });
    }
  },
};
