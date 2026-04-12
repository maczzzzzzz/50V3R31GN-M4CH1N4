import { useEffect, useRef, useState, useCallback } from 'react';

export interface NucleusProposal {
  id: number;
  status: number;
  description?: string;
}

export interface NucleusHoveredUnit {
  active: boolean;
  id: string;
  unitType: string;
  imgPath: string;
  x: number;
  y: number;
}

export interface NucleusState {
  timestamp: number;
  proposal?: NucleusProposal;
  hoveredUnit?: NucleusHoveredUnit;
}

export function useNucleusWS(url: string) {
  const [state, setState] = useState<NucleusState | null>(null);
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const sock = new WebSocket(url);
      ws.current = sock;

      sock.onmessage = (e) => {
        try {
          setState(JSON.parse(e.data) as NucleusState);
        } catch {
          // malformed frame — ignore
        }
      };

      sock.onclose = () => {
        // Reconnect after 2s
        reconnectTimer = setTimeout(connect, 2000);
      };
    }

    connect();
    return () => {
      clearTimeout(reconnectTimer);
      ws.current?.close();
    };
  }, [url]);

  const send = useCallback((action: string, arg?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, arg }));
    }
  }, []);

  return { state, send };
}
