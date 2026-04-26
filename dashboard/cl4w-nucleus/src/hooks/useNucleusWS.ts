import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * useNucleusWS — Phase 80
 * 
 * Persistent WebSocket artery connecting the React HUD to the Go Nucleus bridge.
 * Implements auto-reconnect and packet serialization.
 */

export interface NucleusState {
  connected: boolean;
  activeProfile: string;
  energy: number;
  trace_id: string;
  logs: string[];
  narrative?: string;
  recentMarkets?: any[];
  lexiconItems?: any[];
  hoveredUnit?: any;
  timestamp?: string;
  last_vitals?: {
    cpu: number;
    mem: number;
    latency: number;
  };
}

export function useNucleusWS(url: string = 'ws://localhost:3010/ws') {
  const ws = useRef<WebSocket | null>(null);
  const [state, setState] = useState<NucleusState>({
    connected: false,
    activeProfile: 'UNKNOWN',
    energy: 1.0,
    trace_id: 'TR-000',
    logs: [],
  });

  const connect = useCallback(() => {
    try {
      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        console.log('◈ [HUD] Artery established.');
        setState(s => ({ ...s, connected: true }));
      };

      ws.current.onclose = () => {
        console.log('◈ [HUD] Artery severed. Re-routing...');
        setState(s => ({ ...s, connected: false }));
        setTimeout(connect, 3000);
      };

      ws.current.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);
          
          // Pattern: type: "UPDATE_STATE", payload: {...}
          if (packet.type === 'UPDATE_STATE') {
            setState(s => ({ ...s, ...packet.payload }));
          }
          
          if (packet.type === 'LOG_SIGNAL') {
             // Side-channel for ephemeral events
             console.log(`◈ [CORE] ${packet.payload.message}`);
          }
        } catch (e) {
          console.error('::/PARSE_ERROR : HUD_PACKET_CORRUPT', e);
        }
      };

      ws.current.onerror = (err) => {
        console.error('::/ARTERY_ERROR : HUD_WS_FAILED', err);
      };

    } catch (e) {
      console.error('::/IGNITION_ERROR : HUD_WS_INIT_FAILED', e);
    }
  }, [url]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
    };
  }, [connect]);

  const send = useCallback((action: string, arg?: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ action, arg }));
    } else {
      console.warn('::/TRANS_ERROR : ARTERY_OFFLINE - COMMAND_DROPPED');
    }
  }, []);

  return { state, send };
}
