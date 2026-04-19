import { useEffect, useRef } from 'react';
import { NucleusDropdown } from './components/NucleusDropdown';
import { CommandDeck } from './components/CommandDeck';
import { ChatInput } from './components/ChatInput';
import { useNucleusWS } from './hooks/useNucleusWS';
import { useFlushGate } from './hooks/useFlushGate';

export function App() {
  const { state, send } = useNucleusWS('ws://localhost:3030/ws');
  const { onProposal, onVerdict } = useFlushGate();
  const prevProposalRef = useRef<number | null>(null);

  // Trigger dial-up audio when a new pending proposal arrives
  useEffect(() => {
    const proposal = state?.proposal;
    if (!proposal) return;
    const id = proposal.id ?? null;
    if (proposal.status === 0 && id !== prevProposalRef.current) {
      prevProposalRef.current = id;
      onProposal();
    } else if (proposal.status !== 0) {
      onVerdict();
    }
  }, [state?.proposal, onProposal, onVerdict]);

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CommandDeck state={state} />
      <ChatInput send={send} />
      <NucleusDropdown send={send} />
    </div>
  );
}
