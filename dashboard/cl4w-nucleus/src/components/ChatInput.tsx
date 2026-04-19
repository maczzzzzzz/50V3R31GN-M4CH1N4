import { useState, KeyboardEvent } from 'react';

interface Props {
  send: (action: string, arg?: string) => void;
}

export function ChatInput({ send }: Props) {
  const [input, setInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && input.trim()) {
      send('CHAT_INPUT', input.trim());
      setInput('');
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: '12px',
      top: 'calc(50vh - 36px)', // Positioned at the bottom of the COMMAND quadrant (top-left)
      width: 'calc(50vw - 24px)',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
    }}>
      <span style={{ color: '#ff003c', fontFamily: 'monospace', fontSize: '12px', marginRight: '4px' }}>&gt;</span>
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="ENTER COMMAND OR QUERY..."
        style={{
          flex: 1,
          background: 'transparent',
          border: 'none',
          color: '#eeeeee',
          fontFamily: 'monospace',
          fontSize: '12px',
          outline: 'none',
          caretColor: '#ff003c',
        }}
        autoFocus
      />
    </div>
  );
}
