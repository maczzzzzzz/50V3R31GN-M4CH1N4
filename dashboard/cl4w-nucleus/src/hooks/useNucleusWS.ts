import { useEffect, useRef, useState, useCallback } from 'react';
import protobuf from 'protobufjs';

// ─── Proto schema (inline — mirrors crush/nucleuspb/state.proto) ─────────────
const PROTO_JSON = {
  nested: {
    nucleuspb: {
      nested: {
        Proposal: {
          fields: {
            id:          { id: 1, type: 'uint32' },
            status:      { id: 2, type: 'uint32' },
            description: { id: 3, type: 'string' },
          },
        },
        HoveredUnit: {
          fields: {
            active:   { id: 1, type: 'bool'   },
            id:       { id: 2, type: 'string' },
            unitType: { id: 3, type: 'string' },
            imgPath:  { id: 4, type: 'string' },
            x:        { id: 5, type: 'float'  },
            y:        { id: 6, type: 'float'  },
          },
        },
        NucleusState: {
          fields: {
            timestamp:   { id: 1, type: 'int64'       },
            proposal:    { id: 2, type: 'Proposal'    },
            hoveredUnit: { id: 3, type: 'HoveredUnit' },
            logs:        { id: 4, type: 'string', rule: 'repeated' },
            narrative:   { id: 5, type: 'string', rule: 'repeated' },
          },
        },
      },
    },
  },
};

// ─── Types (mirrored from proto schema) ──────────────────────────────────────
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
  logs: string[];
  narrative: string[];
}

// ─── Hook ────────────────────────────────────────────────────────────────────
export function useNucleusWS(url: string) {
  const [state, setState] = useState<NucleusState | null>(null);
  const ws       = useRef<WebSocket | null>(null);
  const msgType  = useRef<protobuf.Type | null>(null);

  // Load proto schema once
  useEffect(() => {
    const root = protobuf.Root.fromJSON(PROTO_JSON);
    msgType.current = root.lookupType('nucleuspb.NucleusState');
  }, []);

  useEffect(() => {
    let reconnectTimer: ReturnType<typeof setTimeout>;

    function connect() {
      const sock = new WebSocket(url);
      sock.binaryType = 'arraybuffer';
      ws.current = sock;

      sock.onmessage = (e: MessageEvent) => {
        try {
          if (e.data instanceof ArrayBuffer) {
            // Protobuf binary frame from Go nucleus artery
            const type = msgType.current;
            if (!type) return;
            const buf  = new Uint8Array(e.data);
            const msg  = type.decode(buf);
            const obj  = type.toObject(msg, { longs: Number, defaults: true }) as NucleusState;
            setState(obj);
          } else {
            // Fallback: JSON text frame (dev / compatibility)
            setState(JSON.parse(e.data as string) as NucleusState);
          }
        } catch {
          // malformed frame — ignore
        }
      };

      sock.onclose = () => {
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
      // Commands flow as JSON text — server decodes with json.Unmarshal
      ws.current.send(JSON.stringify({ action, arg }));
    }
  }, []);

  return { state, send };
}
