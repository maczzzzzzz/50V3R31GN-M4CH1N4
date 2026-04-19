import { useState } from 'react';

interface Props {
  send: (action: string, arg?: string) => void;
}

const BTN: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid #ff003c',
  color: '#ff003c',
  fontFamily: 'monospace',
  fontSize: 11,
  padding: '4px 10px',
  cursor: 'pointer',
  letterSpacing: '0.05em',
};

const MENU: React.CSSProperties = {
  position: 'absolute',
  top: 32,
  left: '50%',
  transform: 'translateX(-50%)',
  background: '#080810',
  border: '1px solid #ff003c',
  padding: 8,
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  zIndex: 100,
  minWidth: 200,
};

export function NucleusDropdown({ send }: Props) {
  const [open, setOpen] = useState(false);

  const dispatch = (action: string) => {
    send(action);
    setOpen(false);
  };

  return (
    <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 200 }}>
      <button style={BTN} onClick={() => setOpen(o => !o)}>
        ◈ NUCLEUS // {open ? '▲' : '▼'}
      </button>

      {open && (
        <div style={MENU}>
          <strong style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: 10, marginBottom: 4 }}>
            ── IGNITION ──
          </strong>
          <button style={BTN} onClick={() => dispatch('GHOST_BOOT')}>  [GHOST_BOOT]</button>
          <button style={BTN} onClick={() => dispatch('FULL_ENGAGE')}>  [FULL_ENGAGE]</button>
          <button style={BTN} onClick={() => dispatch('LITE_MODE')}>   [LITE_MODE]</button>

          <strong style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }}>
            ── VIEWPORT ──
          </strong>
          <button style={BTN} onClick={() => dispatch('VIEW_LEXICON')}>  TOGGLE LEXICON</button>
          <button style={BTN} onClick={() => dispatch('VIEW_ECONOMY')}>  TOGGLE ECONOMY</button>

          <strong style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }}>
            ── HARDWARE ──
          </strong>
          <button style={BTN} onClick={() => dispatch('REBOOT_NODE_A')}>  REBOOT NODE_A</button>
          <button style={BTN} onClick={() => dispatch('SOVEREIGN_MODE_ON')}>  SOVEREIGN: ON</button>
          <button style={BTN} onClick={() => dispatch('SOVEREIGN_MODE_OFF')}>  SOVEREIGN: OFF</button>

          <strong style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }}>
            ── VAULT ──
          </strong>
          <button style={BTN} onClick={() => dispatch('VAULT_OPEN')}>  UNSEAL 7H3-V4UL7</button>

          <strong style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }}>
            ── FLUSH GATE ──
          </strong>
          <button style={{ ...BTN, color: '#20ff60', borderColor: '#20ff60' }} onClick={() => dispatch('FLUSH_ACKNOWLEDGE')}>
            [ACKNOWLEDGE]
          </button>
          <button style={{ ...BTN, color: '#ff003c' }} onClick={() => dispatch('FLUSH_VETO')}>
            [VETO]
          </button>
        </div>
      )}
    </div>
  );
}
