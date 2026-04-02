use serde::{Serialize, Deserialize};
use tracing::{info, error};
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::net::TcpStream;
use reqwest::Client;
use std::sync::OnceLock;
use std::fs;

use crate::cv::edge_detector;
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

pub async fn handle_connection(socket: TcpStream) {
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
                
                // Swarm Oracle: Each request is processed in its own isolated task.
                tokio::spawn(async move {
                    let rpc_result = process_rpc(&client_clone, request.method, request.params).await;

                    let response = match rpc_result {
                        Ok(val) => RpcResponse {
                            id: request.id,
                            result: Some(val),
                            error: None,
                        },
                        Err(e) => RpcResponse {
                            id: request.id,
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

async fn process_rpc(client: &Client, method: String, params: serde_json::Value) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
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

            let res = client.post("http://localhost:11434/api/generate")
                .json(&ollama_req)
                .send()
                .await?
                .json::<OllamaGenerateResponse>()
                .await?;

            Ok(serde_json::json!({ "result": res.response }))
        },
        "detect_walls" => {
            let image_path = params.as_str().ok_or("image_path parameter must be a string")?;
            let img = open(image_path)?;
            let edges = edge_detector::detect_edges(&img);
            let walls = edge_detector::detect_lines(&edges);
            Ok(serde_json::to_value(walls)?)
        },
        _ => Err(format!("Unknown method: {}", method).into()),
    }
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
