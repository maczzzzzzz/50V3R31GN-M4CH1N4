"use client";

import { useEffect, useRef, useState, useCallback } from "react";

export interface TelemetryPacket {
  ts: string;
  seq: number;
  pkt_type: number;
  intent_type: number;
  payload_len: number;
  session_id: string;
  actor_id: string;
  payload: string;
}

export interface SovereignTelemetryState {
  telemetry: TelemetryPacket | null;
  connected: boolean;
  /** Rolling packets-per-second count (sampled over 1s window) */
  packetRate: number;
  /** Last N packets for waveform history */
  history: TelemetryPacket[];
}

const HISTORY_LEN = 60;
const RECONNECT_DELAY_MS = 2000;

export function useSovereignTelemetry(url: string): SovereignTelemetryState {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [connected, setConnected] = useState(false);
  const [packetRate, setPacketRate] = useState(0);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const packetCountRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);

    ws.onmessage = (evt) => {
      try {
        const pkt: TelemetryPacket = JSON.parse(evt.data as string);
        packetCountRef.current += 1;
        setTelemetry(pkt);
        setHistory((prev) => {
          const next = [...prev, pkt];
          return next.length > HISTORY_LEN ? next.slice(-HISTORY_LEN) : next;
        });
      } catch {
        // drop malformed frames
      }
    };

    ws.onclose = () => {
      setConnected(false);
      // Auto-reconnect
      reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY_MS);
    };

    ws.onerror = () => ws.close();
  }, [url]);

  useEffect(() => {
    connect();

    // Packet-rate sampler: count packets per second
    const rateInterval = setInterval(() => {
      setPacketRate(packetCountRef.current);
      packetCountRef.current = 0;
    }, 1000);

    return () => {
      clearInterval(rateInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { telemetry, connected, packetRate, history };
}
