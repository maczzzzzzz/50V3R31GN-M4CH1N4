use serde::{Serialize, Deserialize};
use tracing::{info, error};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use reqwest::Client;
use std::sync::{Arc, OnceLock};
use std::fs;

use crate::cv::edge_detector;
use crate::perception::PerceptionController;
use image::open;

static RED_RULES: OnceLock<String> = OnceLock::new();

pub fn get_red_rules() -> &'static str {
    RED_RULES.get_or_init(|| {
        fs::read_to_string("../RED_RULES.md").unwrap_or_else(|_| {
            // Fallback for different working directories
            fs::read_to_string("RED_RULES.md").unwrap_or_else(|_| {
                "RECONSTITUTION ERROR: Global Rules Oracle Invariants Missing.".to_string()
            })
        })
    })
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ClawLinkPacket {
    pub trace_id: String,
    pub payload: String,
    pub checksum: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RpcRequest {
    pub id: String,
    pub method: String,
    pub params: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RpcResponse {
    pub id: String,
    pub result: Option<serde_json::Value>,
    pub error: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaGenerateRequest {
    model: String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OllamaGenerateResponse {
    response: String,
}

pub async fn handle_connection(socket: TcpStream, perception: Arc<PerceptionController>) {
    let client = Client::new();
    let (reader, mut writer) = socket.into_split();
    let mut reader = BufReader::new(reader);
    let (tx, mut rx) = tokio::sync::mpsc::channel::<ClawLinkPacket>(32);

    // Response writer task: Handles outgoing packets sequentially to avoid interleaving.
    tokio::spawn(async move {
        while let Some(response_packet) = rx.recv().await {
            let response_line = format!("{}\n", serde_json::to_string(&response_packet).unwrap());
            if let Err(e) = writer.write_all(response_line.as_bytes()).await {
                error!("Failed to write response: {}", e);
                break;
            }
        }
    });

    let mut line = String::new();
    loop {
        line.clear();
        match reader.read_line(&mut line).await {
            Ok(0) => break, // Connection closed
            Ok(_) => {
                let packet: ClawLinkPacket = match serde_json::from_str(&line) {
                    Ok(p) => p,
                    Err(e) => {
                        error!("Failed to parse packet: {}", e);
                        continue;
                    }
                };

                let request: RpcRequest = match serde_json::from_str(&packet.payload) {
                    Ok(r) => r,
                    Err(e) => {
                        error!("Failed to parse RPC: {}", e);
                        continue;
                    }
                };

                info!("Processing method: {} [trace_id: {}]", request.method, packet.trace_id);

                let client_clone = client.clone();
                let tx_clone = tx.clone();
                let perception_clone = Arc::clone(&perception);

                // Swarm Oracle: Each request is processed in its own isolated task.
                tokio::spawn(async move {
                    let rpc_result = process_rpc(&client_clone, &perception_clone, request.method, request.params).await;

                    let response = match rpc_result {
                        Ok(val) => RpcResponse {
                            id: request.id.clone(),
                            result: Some(val),
                            error: None,
                        },
                        Err(e) => RpcResponse {
                            id: request.id.clone(),
                            result: None,
                            error: Some(e.to_string()),
                        },
                    };

                    let response_payload = serde_json::to_string(&response).unwrap();
                    let response_packet = ClawLinkPacket {
                        trace_id: packet.trace_id,
                        payload: response_payload,
                        checksum: 0,
                    };

                    if let Err(e) = tx_clone.send(response_packet).await {
                        error!("Failed to queue response: {}", e);
                    }
                });
            }
            Err(e) => {
                error!("Socket error: {}", e);
                break;
            }
        }
    }
}

fn build_math_prompt(rules: &str, params: &serde_json::Value) -> String {
    format!(
        "CONSTITUTION:\n{}\n\nYou are the Cyberpunk RED Rules Oracle. Resolve this math/rule check: {}",
        rules, params
    )
}

async fn process_rpc(
    client: &Client,
    perception: &PerceptionController,
    method: String,
    params: serde_json::Value,
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
    match method.as_str() {
        "ping" => Ok(serde_json::json!({ "pong": true })),

        "resolve_math" => {
            let rules = get_red_rules();
            let prompt = build_math_prompt(rules, &params);
            let ollama_req = OllamaGenerateRequest {
                model: "llama3.2:3b".to_string(),
                prompt,
                stream: false,
            };

            let res = client
                .post("http://localhost:11434/api/generate")
                .json(&ollama_req)
                .send()
                .await?
                .json::<OllamaGenerateResponse>()
                .await?;

            Ok(serde_json::json!({ "result": res.response }))
        }

        "detect_walls" => {
            let image_path = params.as_str().ok_or("image_path parameter must be a string")?;
            let img = open(image_path)?;
            let edges = edge_detector::detect_edges(&img);
            let walls = edge_detector::detect_lines(&edges);
            Ok(serde_json::to_value(walls)?)
        }

        // ── Phase 16: Falcon Sidecar — OCR Scene Analysis ───────────────────
        //
        // Params: { "image": "<base64-encoded PNG/JPEG>" }
        // Returns: [ { "text": "...", "x": 0.0, "y": 0.0, "confidence": 0.0 }, ... ]
        //
        // Activates the Model Swap Protocol:
        //   Unloads Llama-3 → Falcon inference → Reloads Llama-3
        "ocr_analyze" => {
            let base64_image = params
                .get("image")
                .and_then(|v| v.as_str())
                .ok_or("ocr_analyze requires params.image (base64 string)")?;

            info!("[RPC] ocr_analyze: initiating Model Swap Protocol...");
            let entities = perception.ocr_analyze(base64_image).await?;
            Ok(serde_json::to_value(entities)?)
        }

        // ── Phase 21 Task 2: Tactical Swarm Simulation ──────────────────────
        //
        // Params: JSON array of action objects.
        // Each object must have a "type" field of "attack" or "damage".
        //
        // Attack fields: attacker_id, dice (array of u8), stat, skill, dv
        // Damage fields: attacker_id, dice (array of u8), bonus, armour_sp
        //
        // Returns: array of SwarmResult objects. Actions that fail to parse
        // are silently skipped; an unparseable batch returns [].
        "resolve_swarm" => {
            use crate::rules::swarm_resolver::{SwarmAction, resolve_swarm};

            let raw_actions = params
                .as_array()
                .ok_or("resolve_swarm: params must be a JSON array")?;

            let actions: Vec<SwarmAction> = raw_actions
                .iter()
                .filter_map(|v| {
                    match serde_json::from_value::<SwarmAction>(v.clone()) {
                        Ok(a) => Some(a),
                        Err(e) => {
                            error!("[resolve_swarm] skipping unparseable action: {} — {:?}", e, v);
                            None
                        }
                    }
                })
                .collect();

            let results = resolve_swarm(actions);
            Ok(serde_json::to_value(results)?)
        }

        // ── Phase 20 Task 3: P4RS3LT0NGV3 Linguistic Steganography ────────────
        //
        // linguistic_encode
        //   Params: { "text": "<conlang text>", "payload_hex": "<hex-encoded bytes>" }
        //   Returns: { "encoded": "<text with morpheme variants substituted>" }
        //
        // linguistic_decode
        //   Params: { "text": "<encoded conlang text>" }
        //   Returns: { "payload_hex": "<hex-encoded recovered bytes>" }
        //
        // Both operations are pure CPU — no VRAM usage, no LLM inference.
        "linguistic_encode" => {
            let text = params
                .get("text")
                .and_then(|v| v.as_str())
                .ok_or("linguistic_encode requires params.text (string)")?;

            let payload_hex = params
                .get("payload_hex")
                .and_then(|v| v.as_str())
                .ok_or("linguistic_encode requires params.payload_hex (hex string)")?;

            let payload = decode_hex(payload_hex)
                .map_err(|e| format!("linguistic_encode: invalid hex payload: {}", e))?;

            let encoded = crate::linguistics::encode(text, &payload)
                .map_err(|e| format!("linguistic_encode failed: {}", e))?;

            Ok(serde_json::json!({ "encoded": encoded }))
        }

        "linguistic_decode" => {
            let text = params
                .get("text")
                .and_then(|v| v.as_str())
                .ok_or("linguistic_decode requires params.text (string)")?;

            let payload = crate::linguistics::decode(text)
                .map_err(|e| format!("linguistic_decode failed: {}", e))?;

            Ok(serde_json::json!({ "payload_hex": encode_hex(&payload) }))
        }

        _ => Err(format!("Unknown method: {}", method).into()),
    }
}

// ── Hex helpers ───────────────────────────────────────────────────────────────

fn decode_hex(s: &str) -> Result<Vec<u8>, String> {
    if s.len() % 2 != 0 {
        return Err("hex string has odd length".to_string());
    }
    (0..s.len())
        .step_by(2)
        .map(|i| {
            u8::from_str_radix(&s[i..i + 2], 16)
                .map_err(|e| format!("invalid hex byte at position {}: {}", i, e))
        })
        .collect()
}

fn encode_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_build_math_prompt() {
        let rules = "Rule 1: Be cool.";
        let params = serde_json::json!({ "check": "D10 + 5" });
        let prompt = build_math_prompt(rules, &params);
        assert!(prompt.contains("CONSTITUTION:"));
        assert!(prompt.contains("Rule 1: Be cool."));
        assert!(prompt.contains("D10 + 5"));
    }
}
