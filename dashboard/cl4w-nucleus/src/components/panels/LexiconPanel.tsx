// :/LEXICON // — Akashik Item/Actor browser (mirroring shadow-dashboard ItemBrowser)
import { BitmapText, Container, Graphics } from 'pixi.js';
import type { NucleusState } from '../../hooks/useNucleusWS';

const RED    = 0xff003c;
const WHITE  = 0xeeeeee;

export const LexiconPanel = {
  init(c: Container, w: number, h: number) {
    const search = new Graphics();
    search.rect(8, 30, w - 16, 24).fill({ color: 0x000000, alpha: 0.3 }).stroke({ width: 1, color: RED, alpha: 0.5 });
    c.addChild(search);

    const searchText = new BitmapText({
      text: 'S34RCH: _',
      style: { fontFamily: 'SovereignMono', fontSize: 10, fill: WHITE },
    });
    searchText.x = 14;
    searchText.y = 36;
    c.addChild(searchText);

    const list = new Container();
    list.label = 'itemList';
    list.x = 8;
    list.y = 64;
    c.addChild(list);

    // Placeholder items
    for (let i = 0; i < 5; i++) {
      const item = new BitmapText({
        text: `⬡ ITEM_${1000 + i} // SOURCE: CORE`,
        style: { fontFamily: 'SovereignMono', fontSize: 11, fill: 0x888888 },
      });
      item.y = i * 20;
      list.addChild(item);
    }

    const total = new BitmapText({
      text: 'TOTAL_ENTITIES: 1000+',
      style: { fontFamily: 'SovereignMonoRed', fontSize: 9, fill: RED },
    });
    total.x = 8;
    total.y = h - 24;
    c.addChild(total);
  },

  update(c: Container | null, state: NucleusState) {
    if (!c || !state) return;
    const list = c.getChildByName('itemList') as Container | null;
    if (!list) return;

    list.removeChildren();
    if (state.lexiconItems) {
      state.lexiconItems.slice(0, 8).forEach((item, i) => {
        const text = new BitmapText({
          text: `⬡ ${item.name.slice(0, 20).toUpperCase()} // ${item.cost}eb`,
          style: { fontFamily: 'SovereignMono', fontSize: 11, fill: 0x888888 },
        });
        text.y = i * 20;
        list.addChild(text);
      });
    }
  },
};
