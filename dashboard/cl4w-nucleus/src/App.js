import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useRef } from 'react';
import { NucleusDropdown } from './components/NucleusDropdown';
import { CommandDeck } from './components/CommandDeck';
import { useNucleusWS } from './hooks/useNucleusWS';
import { useFlushGate } from './hooks/useFlushGate';
export function App() {
    const { state, send } = useNucleusWS('ws://localhost:3030/ws');
    const { onProposal, onVerdict } = useFlushGate();
    const prevProposalRef = useRef(null);
    // Trigger dial-up audio when a new pending proposal arrives
    useEffect(() => {
        const proposal = state?.proposal;
        if (!proposal)
            return;
        const id = proposal.id ?? null;
        if (proposal.status === 0 && id !== prevProposalRef.current) {
            prevProposalRef.current = id;
            onProposal();
        }
        else if (proposal.status !== 0) {
            onVerdict();
        }
    }, [state?.proposal, onProposal, onVerdict]);
    return (_jsxs("div", { style: { position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }, children: [_jsx(CommandDeck, { state: state }), _jsx(NucleusDropdown, { send: send })] }));
}
