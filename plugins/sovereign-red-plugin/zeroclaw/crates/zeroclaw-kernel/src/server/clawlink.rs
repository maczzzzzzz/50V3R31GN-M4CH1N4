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
        fs::read_to_string("plugins/sovereign-red-plugin/RED_RULES.md").unwrap_or_else(|_| {
            fs::read_to_string("../RED_RULES.md").unwrap_or_else(|_| {
                fs::read_to_string("../../RED_RULES.md").unwrap_or_else(|_| {
                    "RECONSTITUTION ERROR: Global Rules Oracle Invariants Missing.".to_string()
                })
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
struct OpenAIMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<OpenAIMessage>,
    stream: bool,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIChoice {
    message: OpenAIMessage,
}

#[derive(Debug, Serialize, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

pub async fn handle_connection(socket: TcpStream, perception: Arc<PerceptionController>) {
    let client = Client::new();
    let (reader, mut writer) = socket.into_split();
    let mut reader = BufReader::new(reader);
    let (tx, mut rx) = tokio::sync::mpsc::channel::<ClawLinkPacket>(32);

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
            Ok(0) => break,
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

        "resolve_dv" => {
            use crate::rules::dv_resolver::DvResolver;
            let db_path = std::env::var("AKASHIK_DB_PATH").unwrap_or_else(|_| "../data/Akashik.db".to_string());
            let resolver = DvResolver::new(db_path);

            let weapon_category = params.get("weapon_category").and_then(|v| v.as_str()).ok_or("missing weapon_category")?;
            let range_bracket = params.get("range_bracket").and_then(|v| v.as_str()).ok_or("missing range_bracket")?;

            let dv = resolver.resolve(weapon_category, range_bracket);
            Ok(serde_json::json!({ "dv": dv }))
        }

        "resolve_math" => {
            // Phase 59 upgrade: Use canonical Rust math for basic stat/skill checks
            // Expected params: { stat: N, skill: M, [actor: "name"] }
            if let (Some(stat), Some(skill)) = (params.get("stat").and_then(|v| v.as_i64()), params.get("skill").and_then(|v| v.as_i64())) {
                use crate::rules::canonical_math::roll_stat_check;
                use crate::server::telemetry::emit_roll_breakdown;

                let d10_total = roll_stat_check(stat as i32, skill as i32);
                // We don't have a DV here, so assume success = true (it's just a check)
                let actor = params.get("actor").and_then(|v| v.as_str()).unwrap_or("UNKNOWN");
                
                // Roll check logic
                let d10 = d10_total - stat as i32 - skill as i32;
                emit_roll_breakdown(actor, d10, stat as i32, skill as i32, 0, d10_total, 0, true);

                return Ok(serde_json::json!({ "total": d10_total }));
            }

            // Fallback to LLM for complex rules reasoning
            let rules = get_red_rules();
            let prompt = build_math_prompt(rules, &params);
            let req = OpenAIRequest {
                model: "Open-Reasoner-Zero-1.5B".to_string(),
                messages: vec![OpenAIMessage { role: "user".to_string(), content: prompt }],
                stream: false,
            };

            let res = client
                .post("http://127.0.0.1:8080/v1/chat/completions")
                .json(&req)
                .send()
                .await?
                .json::<OpenAIResponse>()
                .await?;

            let result = res.choices.first().map(|c| c.message.content.clone()).unwrap_or_default();
            Ok(serde_json::json!({ "result": result }))
        }

        "detect_walls" => {
            let image_path = params.as_str().ok_or("image_path parameter must be a string")?;
            let img = open(image_path)?;
            let edges = edge_detector::detect_edges(&img);
            let walls = edge_detector::detect_lines(&edges);
            Ok(serde_json::to_value(walls)?)
        }

        "ocr_analyze" => {
            let base64_image = params
                .get("image")
                .and_then(|v| v.as_str())
                .ok_or("ocr_analyze requires params.image (base64 string)")?;

            info!("[RPC] ocr_analyze: initiating Model Swap Protocol...");
            let entities = perception.ocr_analyze(base64_image).await?;
            Ok(serde_json::to_value(entities)?)
        }

        "resolve_swarm" => {
            use crate::rules::swarm_resolver::{SwarmAction, resolve_swarm};
            use crate::server::telemetry::emit_roll_breakdown;

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
            
            // Emit telemetry for each result
            for r in results.iter() {
                if r.action_type == "attack" {
                    emit_roll_breakdown(&r.attacker_id, r.d10, r.stat, r.skill, r.mods, r.total, r.dv, r.success);
                }
            }

            Ok(serde_json::to_value(results)?)
        }

        "audit_narrative_fidelity" => {
            let text = params.get("text").and_then(|v| v.as_str()).ok_or("missing text")?;
            let lower_text = text.to_lowercase();
            let ai_isms = [
                "as an ai", "however,", "it is important to remember", "let's explore", 
                "i cannot", "i apologize", "delve into", "tapestry", "testament", "realm of"
            ];
            let mut ai_ism_count = 0;
            for ism in ai_isms.iter() {
                if lower_text.contains(ism) {
                    ai_ism_count += 1;
                }
            }
            
            let mut score = 10.0;
            score -= (ai_ism_count as f64) * 5.0;
            if score < 0.0 { score = 0.0; }

            let passed = score >= 7.0 && ai_ism_count == 0;

            Ok(serde_json::json!({
                "score": score,
                "ai_ism_count": ai_ism_count,
                "passed": passed,
                "reasoning": format!("Found {} AI-isms.", ai_ism_count)
            }))
        }

        "linguistic_encode" => {
            let text = params.get("text").and_then(|v| v.as_str()).ok_or("missing text")?;
            let payload_hex = params.get("payload_hex").and_then(|v| v.as_str()).ok_or("missing payload")?;
            let payload = decode_hex(payload_hex)?;
            let encoded = crate::linguistics::encode(text, &payload)?;
            Ok(serde_json::json!({ "encoded": encoded }))
        }

        "linguistic_decode" => {
            let text = params.get("text").and_then(|v| v.as_str()).ok_or("missing text")?;
            let payload = crate::linguistics::decode(text)?;
            Ok(serde_json::json!({ "payload_hex": encode_hex(&payload) }))
        }

        _ => Err(format!("Unknown method: {}", method).into()),
    }
}

fn decode_hex(s: &str) -> Result<Vec<u8>, String> {
    (0..s.len()).step_by(2).map(|i| u8::from_str_radix(&s[i..i+2], 16).map_err(|e| e.to_string())).collect()
}

fn encode_hex(bytes: &[u8]) -> String {
    bytes.iter().map(|b| format!("{:02x}", b)).collect()
}
