import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState } from 'react';
const BTN = {
    background: 'transparent',
    border: '1px solid #ff003c',
    color: '#ff003c',
    fontFamily: 'monospace',
    fontSize: 11,
    padding: '4px 10px',
    cursor: 'pointer',
    letterSpacing: '0.05em',
};
const MENU = {
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
export function NucleusDropdown({ send }) {
    const [open, setOpen] = useState(false);
    const dispatch = (action) => {
        send(action);
        setOpen(false);
    };
    return (_jsxs("div", { style: { position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', zIndex: 200 }, children: [_jsxs("button", { style: BTN, onClick: () => setOpen(o => !o), children: ["\u25C8 NUCLEUS // ", open ? '▲' : '▼'] }), open && (_jsxs("div", { style: MENU, children: [_jsx("strong", { style: { color: '#ff003c', fontFamily: 'monospace', fontSize: 10, marginBottom: 4 }, children: "\u2500\u2500 IGNITION \u2500\u2500" }), _jsx("button", { style: BTN, onClick: () => dispatch('GHOST_BOOT'), children: "  [GHOST_BOOT]" }), _jsx("button", { style: BTN, onClick: () => dispatch('FULL_ENGAGE'), children: "  [FULL_ENGAGE]" }), _jsx("button", { style: BTN, onClick: () => dispatch('LITE_MODE'), children: "   [LITE_MODE]" }), _jsx("strong", { style: { color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }, children: "\u2500\u2500 HARDWARE \u2500\u2500" }), _jsx("button", { style: BTN, onClick: () => dispatch('REBOOT_NODE_A'), children: "  REBOOT NODE_A" }), _jsx("button", { style: BTN, onClick: () => dispatch('SOVEREIGN_MODE_ON'), children: "  SOVEREIGN: ON" }), _jsx("button", { style: BTN, onClick: () => dispatch('SOVEREIGN_MODE_OFF'), children: "  SOVEREIGN: OFF" }), _jsx("strong", { style: { color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }, children: "\u2500\u2500 VAULT \u2500\u2500" }), _jsx("button", { style: BTN, onClick: () => dispatch('VAULT_OPEN'), children: "  UNSEAL 7H3-V4UL7" }), _jsx("strong", { style: { color: '#ff003c', fontFamily: 'monospace', fontSize: 10, margin: '8px 0 4px' }, children: "\u2500\u2500 FLUSH GATE \u2500\u2500" }), _jsx("button", { style: { ...BTN, color: '#20ff60', borderColor: '#20ff60' }, onClick: () => dispatch('FLUSH_ACKNOWLEDGE'), children: "[ACKNOWLEDGE]" }), _jsx("button", { style: { ...BTN, color: '#ff003c' }, onClick: () => dispatch('FLUSH_VETO'), children: "[VETO]" })] }))] }));
}
