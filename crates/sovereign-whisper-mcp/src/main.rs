/// sovereign-whisper-mcp — VSB PCM-16 audio ingestor + Whisper STT MCP sidecar
///
/// Listens on UDP 0.0.0.0:7878 for PCM-16 audio frames (16 kHz, mono),
/// buffers up to 30 seconds in a ring buffer, and exposes STT resources to
/// the Hermes Python harness via MCP JSON-RPC 2.0 over stdin/stdout.

use std::io::{BufRead, Write};
use std::sync::{Arc, Mutex};
use serde_json::{json, Value};
use tokio::net::UdpSocket;

// ---------------------------------------------------------------------------
// Ring buffer — 30 s @ 16 kHz PCM-16 (2 bytes/sample)
// ---------------------------------------------------------------------------

const RING_CAPACITY: usize = 30 * 16000 * 2; // 960 000 bytes

struct RingBuffer {
    data: Vec<u8>,
    head: usize,
    len: usize,
}

impl RingBuffer {
    fn new() -> Self {
        Self {
            data: vec![0u8; RING_CAPACITY],
            head: 0,
            len: 0,
        }
    }

    /// Append a chunk of PCM bytes, overwriting oldest data when full.
    fn push_chunk(&mut self, chunk: &[u8]) {
        let cap = self.data.len();
        for &byte in chunk {
            let write_pos = (self.head + self.len) % cap;
            if self.len < cap {
                self.data[write_pos] = byte;
                self.len += 1;
            } else {
                // Buffer full — overwrite oldest byte, advance head.
                self.data[self.head] = byte;
                self.head = (self.head + 1) % cap;
            }
        }
    }
}

// ---------------------------------------------------------------------------
// Shared whisper state
// ---------------------------------------------------------------------------

struct WhisperState {
    ring: RingBuffer,
    transcript: String,
    partial: String,
}

impl WhisperState {
    fn new() -> Self {
        Self {
            ring: RingBuffer::new(),
            transcript: String::new(),
            partial: String::new(),
        }
    }
}

// ---------------------------------------------------------------------------
// UDP PCM-16 listener
// ---------------------------------------------------------------------------

async fn udp_audio_listener(state: Arc<Mutex<WhisperState>>) {
    let sock = match UdpSocket::bind("0.0.0.0:7878").await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[whisper-vsb] Failed to bind UDP 7878: {e}");
            return;
        }
    };
    eprintln!("[whisper-vsb] Listening for PCM-16 on UDP 0.0.0.0:7878");

    let mut buf = vec![0u8; 65535];
    loop {
        let (len, _addr) = match sock.recv_from(&mut buf).await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[whisper-vsb] recv error: {e}");
                continue;
            }
        };

        let chunk = &buf[..len];
        let mut guard = state.lock().unwrap();
        guard.ring.push_chunk(chunk);
        guard.partial = format!("[PCM_RX: {len} bytes]");
    }
}

// ---------------------------------------------------------------------------
// MCP JSON-RPC 2.0 dispatcher (synchronous stdio loop)
// ---------------------------------------------------------------------------

fn handle_request(req: &Value, state: &Arc<Mutex<WhisperState>>) -> Option<Value> {
    let id = req.get("id").cloned().unwrap_or(Value::Null);

    // Notifications have null/absent id — no response required.
    if id == Value::Null {
        return None;
    }

    let method = match req.get("method").and_then(|v| v.as_str()) {
        Some(m) => m,
        None => {
            return Some(json!({
                "jsonrpc": "2.0",
                "id": id,
                "error": { "code": -32600, "message": "Invalid Request: missing method" }
            }));
        }
    };

    let params = req.get("params").cloned().unwrap_or(Value::Null);

    match method {
        "initialize" => Some(json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {
                    "resources": {},
                    "tools": {}
                },
                "serverInfo": {
                    "name": "sovereign-whisper-mcp",
                    "version": "0.1.0"
                }
            }
        })),

        "resources/list" => Some(json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": {
                "resources": [
                    {
                        "uri": "whisper://live-transcript",
                        "name": "Live Transcript",
                        "mimeType": "text/plain"
                    },
                    {
                        "uri": "whisper://ring-buffer-status",
                        "name": "Ring Buffer Status",
                        "mimeType": "application/json"
                    }
                ]
            }
        })),

        "resources/read" => {
            let uri = params
                .get("uri")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_owned();

            let guard = state.lock().unwrap();
            match uri.as_str() {
                "whisper://live-transcript" => {
                    let text = guard.transcript.clone();
                    drop(guard);
                    Some(json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": {
                            "contents": [
                                {
                                    "uri": "whisper://live-transcript",
                                    "mimeType": "text/plain",
                                    "text": text
                                }
                            ]
                        }
                    }))
                }
                "whisper://ring-buffer-status" => {
                    let bytes_buffered = guard.ring.len;
                    let capacity = guard.ring.data.len();
                    drop(guard);
                    Some(json!({
                        "jsonrpc": "2.0",
                        "id": id,
                        "result": {
                            "contents": [
                                {
                                    "uri": "whisper://ring-buffer-status",
                                    "mimeType": "application/json",
                                    "text": serde_json::to_string(&json!({
                                        "bytes_buffered": bytes_buffered,
                                        "capacity": capacity
                                    })).unwrap()
                                }
                            ]
                        }
                    }))
                }
                other => Some(json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": {
                        "code": -32602,
                        "message": format!("Unknown resource URI: {other}")
                    }
                })),
            }
        }

        "tools/list" => Some(json!({
            "jsonrpc": "2.0",
            "id": id,
            "result": {
                "tools": [
                    {
                        "name": "transcribe_buffer",
                        "description": "Transcribe last N seconds of ring buffer",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "seconds": {
                                    "type": "integer",
                                    "default": 10
                                }
                            },
                            "required": []
                        }
                    }
                ]
            }
        })),

        "tools/call" => {
            let name = params
                .get("name")
                .and_then(|v| v.as_str())
                .unwrap_or("");

            match name {
                "transcribe_buffer" => Some(json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "result": {
                        "content": [
                            {
                                "type": "text",
                                "text": "[WHISPER_STUB] Transcription pending hardware integration — candle-whisper weights not loaded"
                            }
                        ]
                    }
                })),
                other => Some(json!({
                    "jsonrpc": "2.0",
                    "id": id,
                    "error": {
                        "code": -32601,
                        "message": format!("Tool not found: {other}")
                    }
                })),
            }
        }

        _unknown => Some(json!({
            "jsonrpc": "2.0",
            "id": id,
            "error": {
                "code": -32601,
                "message": format!("Method not found: {_unknown}")
            }
        })),
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

fn main() {
    // Spawn tokio runtime for the async UDP listener task.
    let state = Arc::new(Mutex::new(WhisperState::new()));

    let rt = tokio::runtime::Runtime::new().expect("failed to build tokio runtime");
    let udp_state = Arc::clone(&state);
    rt.spawn(async move {
        udp_audio_listener(udp_state).await;
    });

    // Synchronous JSON-RPC 2.0 loop on the main thread (MCP stdio transport).
    let stdin = std::io::stdin();
    let stdout = std::io::stdout();
    let mut out = std::io::BufWriter::new(stdout.lock());

    for line in stdin.lock().lines() {
        let line = match line {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[whisper-mcp] stdin read error: {e}");
                break;
            }
        };
        let line = line.trim().to_owned();
        if line.is_empty() {
            continue;
        }

        let req: Value = match serde_json::from_str(&line) {
            Ok(v) => v,
            Err(e) => {
                let resp = json!({
                    "jsonrpc": "2.0",
                    "id": Value::Null,
                    "error": { "code": -32700, "message": format!("Parse error: {e}") }
                });
                let mut s = serde_json::to_string(&resp).unwrap();
                s.push('\n');
                let _ = out.write_all(s.as_bytes());
                let _ = out.flush();
                continue;
            }
        };

        if let Some(resp) = handle_request(&req, &state) {
            let mut s = serde_json::to_string(&resp).unwrap();
            s.push('\n');
            let _ = out.write_all(s.as_bytes());
            let _ = out.flush();
        }
    }
}
