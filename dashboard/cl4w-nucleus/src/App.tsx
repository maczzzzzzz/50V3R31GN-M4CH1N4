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
  const deckRef = useRef<{ toggleView: (target: string) => void }>(null);

  // Handle incoming broadcast intents for UI toggles
  useEffect(() => {
    const logs = state?.logs || [];
    const lastLog = logs[logs.length - 1];
    if (lastLog?.includes('TOGGLE_VIEW')) {
       try {
         const payload = JSON.parse(lastLog);
         if (payload.action === 'TOGGLE_VIEW') {
           deckRef.current?.toggleView(payload.target);
         }
       } catch { /* not a JSON log */ }
    }
  }, [state?.logs]);

  // ... rest of useEffect ...
  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <CommandDeck ref={deckRef} state={state} />
      <ChatInput send={send} />
      <NucleusDropdown send={send} />
    </div>
  );
}
