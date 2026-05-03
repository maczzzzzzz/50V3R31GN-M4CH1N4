/// sovereign-mcp-bridge — VSB-to-MCP stdio bridge
///
/// Listens on UDP 0.0.0.0:7878 for VSB binary frames and exposes them as
/// MCP resources /vitals, /memory, /mesh via JSON-RPC 2.0 over stdin/stdout.

use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::UdpSocket;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

// ---------------------------------------------------------------------------
// Shared VSB state
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Default)]
struct VsbState {
    vitals: String,
    memory: String,
    mesh: String,
}

// ---------------------------------------------------------------------------
// JSON-RPC types
// ---------------------------------------------------------------------------

#[derive(Debug, Deserialize)]
struct JsonRpcRequest {
    #[serde(default)]
    id: Value,
    method: String,
    #[serde(default)]
    params: Value,
}

#[derive(Debug, Serialize)]
struct JsonRpcResponse {
    jsonrpc: &'static str,
    id: Value,
    #[serde(skip_serializing_if = "Option::is_none")]
    result: Option<Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    error: Option<Value>,
}

impl JsonRpcResponse {
    fn ok(id: Value, result: Value) -> Self {
        Self { jsonrpc: "2.0", id, result: Some(result), error: None }
    }
    fn err(id: Value, code: i64, message: &str) -> Self {
        Self {
            jsonrpc: "2.0",
            id,
            result: None,
            error: Some(json!({ "code": code, "message": message })),
        }
    }
}

// ---------------------------------------------------------------------------
// VSB UDP listener
// ---------------------------------------------------------------------------

async fn vsb_listener(state: Arc<Mutex<VsbState>>) {
    let sock = match UdpSocket::bind("0.0.0.0:7878").await {
        Ok(s) => s,
        Err(e) => {
            eprintln!("[vsb] Failed to bind UDP 7878: {e}");
            return;
        }
    };
    eprintln!("[vsb] Listening on UDP 0.0.0.0:7878");

    let mut buf = vec![0u8; 65535];
    loop {
        let (len, _addr) = match sock.recv_from(&mut buf).await {
            Ok(r) => r,
            Err(e) => {
                eprintln!("[vsb] recv error: {e}");
                continue;
            }
        };

        let raw = &buf[..len];

        // Attempt to parse as UTF-8 JSON; fallback to hex string.
        let parsed: Value = match std::str::from_utf8(raw) {
            Ok(s) => serde_json::from_str(s).unwrap_or_else(|_| Value::String(s.to_owned())),
            Err(_) => Value::String(raw.iter().map(|b| format!("{b:02x}")).collect::<String>()),
        };

        // Extract fields if the frame is an object, otherwise populate vitals.
        let mut guard = state.lock().await;
        if let Value::Object(ref map) = parsed {
            if let Some(v) = map.get("vitals") {
                guard.vitals = v.to_string();
            }
            if let Some(m) = map.get("memory") {
                guard.memory = m.to_string();
            }
            if let Some(m) = map.get("mesh") {
                guard.mesh = m.to_string();
            }
        } else {
            // Raw / unknown frame → store in vitals
            guard.vitals = parsed.to_string();
        }
    }
}

// ---------------------------------------------------------------------------
// MCP resource helpers
// ---------------------------------------------------------------------------

fn resource_list_result() -> Value {
    json!({
        "resources": [
            {
                "uri": "/vitals",
                "name": "Vitals",
                "description": "Hardware vitals telemetry from VSB",
                "mimeType": "application/json"
            },
            {
                "uri": "/memory",
                "name": "Memory",
                "description": "Memory telemetry from VSB",
                "mimeType": "application/json"
            },
            {
                "uri": "/mesh",
                "name": "Mesh",
                "description": "Mesh topology telemetry from VSB",
                "mimeType": "application/json"
            }
        ]
    })
}

async fn resource_read_result(uri: &str, state: &Arc<Mutex<VsbState>>) -> Result<Value, String> {
    let guard = state.lock().await;
    let content = match uri {
        "/vitals" => guard.vitals.clone(),
        "/memory" => guard.memory.clone(),
        "/mesh"   => guard.mesh.clone(),
        other     => return Err(format!("Unknown resource URI: {other}")),
    };
    // Wrap in MCP resource content envelope
    Ok(json!({
        "contents": [
            {
                "uri": uri,
                "mimeType": "application/json",
                "text": if content.is_empty() { "{}".to_owned() } else { content }
            }
        ]
    }))
}

// ---------------------------------------------------------------------------
// Request dispatcher
// ---------------------------------------------------------------------------

async fn handle_request(req: JsonRpcRequest, state: &Arc<Mutex<VsbState>>) -> JsonRpcResponse {
    let id = req.id.clone();
    match req.method.as_str() {
        "initialize" => {
            JsonRpcResponse::ok(id, json!({
                "protocolVersion": "2024-11-05",
                "serverInfo": {
                    "name": "sovereign-mcp-bridge",
                    "version": "0.1.0"
                },
                "capabilities": {
                    "resources": {
                        "subscribe": false,
                        "listChanged": false
                    }
                }
            }))
        }

        "initialized" => {
            // Notification — no response required; return a no-op value.
            // Caller will skip sending if we return a "null id" pattern.
            JsonRpcResponse::ok(Value::Null, json!({}))
        }

        "resources/list" => {
            JsonRpcResponse::ok(id, resource_list_result())
        }

        "resources/read" => {
            let uri = req.params
                .get("uri")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_owned();
            match resource_read_result(&uri, state).await {
                Ok(result) => JsonRpcResponse::ok(id, result),
                Err(msg)   => JsonRpcResponse::err(id, -32602, &msg),
            }
        }

        other => {
            JsonRpcResponse::err(id, -32601, &format!("Method not found: {other}"))
        }
    }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() {
    let state = Arc::new(Mutex::new(VsbState::default()));

    // Spawn background VSB UDP listener.
    let vsb_state = Arc::clone(&state);
    tokio::spawn(async move {
        vsb_listener(vsb_state).await;
    });

    // MCP stdio transport: read JSON-RPC lines from stdin, write to stdout.
    let stdin  = tokio::io::stdin();
    let stdout = tokio::io::stdout();
    let mut reader = BufReader::new(stdin).lines();
    let mut writer = tokio::io::BufWriter::new(stdout);

    while let Ok(Some(line)) = reader.next_line().await {
        let line = line.trim().to_owned();
        if line.is_empty() {
            continue;
        }

        let req: JsonRpcRequest = match serde_json::from_str(&line) {
            Ok(r)  => r,
            Err(e) => {
                let resp = JsonRpcResponse::err(Value::Null, -32700, &format!("Parse error: {e}"));
                let mut out = serde_json::to_string(&resp).unwrap();
                out.push('\n');
                let _ = writer.write_all(out.as_bytes()).await;
                let _ = writer.flush().await;
                continue;
            }
        };

        // Skip notifications (id is null/absent — no response required)
        let is_notification = req.id == Value::Null;

        if is_notification {
            continue;
        }

        let resp = handle_request(req, &state).await;

        let mut out = serde_json::to_string(&resp).unwrap();
        out.push('\n');
        let _ = writer.write_all(out.as_bytes()).await;
        let _ = writer.flush().await;
    }
}
