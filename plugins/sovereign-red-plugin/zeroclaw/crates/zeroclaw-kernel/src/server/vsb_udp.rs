/// VSB UDP Server — Node A (ZeroClaw)
/// Phase 25: Native Inference Engine Migration
///
/// Tokio-driven UDP server on port 7878. Receives `IntentPacket` frames from Node B,
/// routes them to the resident 1B Judge (llama-server), and replies
/// with a `ResultPacket` back to the sender.
///
/// Port layout:
///   :7878 TCP — ClawLink binary transport
///   :7878 UDP — VSB Sovereign Highway

use std::net::SocketAddr;
use std::sync::Arc;
use tracing::{info, warn, error};
use tokio::net::UdpSocket;
use reqwest::Client;
use serde::{Serialize, Deserialize};

use crate::vsb_protocol::{
    IntentPacket, ResultPacket, ResultStatus, PacketType,
    as_bytes, from_bytes,
};
use crate::server::clawlink::get_red_rules;
use crate::linguistics::pruner::{incinerate_low_frequency_tokens, sample_vram_usage};

// ─── Constants ────────────────────────────────────────────────────────────────

pub const VSB_UDP_PORT: u16     = 7878;
pub const LLAMA_SERVER_URL: &str = "http://127.0.0.1:8080/v1/chat/completions";
pub const JUDGE_MODEL: &str      = "Open-Reasoner-Zero-1.5B";

/// Maximum UDP datagram size we'll accept. Packets larger than this are dropped.
const MAX_DATAGRAM: usize = 1024;

// ─── OpenAI-Compatible Request/Response ────────────────────────────────────────

#[derive(Debug, Serialize, Deserialize)]
struct ChatMessage {
    role: String,
    content: String,
}

#[derive(Debug, Serialize)]
struct OpenAIRequest {
    model: String,
    messages: Vec<ChatMessage>,
    stream: bool,
    temperature: f32,
    max_tokens: i32,
}

#[derive(Debug, Deserialize)]
struct OpenAIChoice {
    message: ChatMessage,
}

#[derive(Debug, Deserialize)]
struct OpenAIResponse {
    choices: Vec<OpenAIChoice>,
}

// ─── Judge ────────────────────────────────────────────────────────────────────

/// Route an intent payload to the resident 1B Judge and return its verdict.
async fn query_judge(
    client: &Client,
    intent_payload: &[u8],
    _sequence_id: u32,
) -> Result<(bool, u32), String> {
    let payload_str = std::str::from_utf8(intent_payload)
        .unwrap_or("[binary payload]")
        .trim_end_matches('\0');

    let raw_prompt = format!(
        "[SYSTEM CONSTITUTION]\n{rules}\n\
         [INTENT]\n{payload}\n\
         [TASK]\nValidate this mechanical intent against Cyberpunk RED rules.\n\
         Reply with VALID or INVALID followed by a one-sentence reason. \
         Be concise.",
        rules   = get_red_rules(),
        payload = payload_str,
    );

    // ── 7R1-M1N1NG: H1GH_D3N517Y_F33D ───────────────────────────────────────
    // Sample live VRAM usage and compress the prompt before sending to
    // llama-server. Preserves all #PHY51C5 and #57473 tokens unconditionally.
    let vram_usage = sample_vram_usage();
    let prompt = incinerate_low_frequency_tokens(&raw_prompt, vram_usage);
    info!(
        "vsb_udp: 7R1-M1N1NG seq={} VRAM={:.1}% raw={} pruned={} tokens",
        _sequence_id,
        vram_usage * 100.0,
        raw_prompt.split_whitespace().count(),
        prompt.split_whitespace().count(),
    );

    let messages = vec![
        ChatMessage {
            role: "system".to_string(),
            content: "You are the Cyberpunk RED Rules Oracle. You validate mechanical intents.".to_string(),
        },
        ChatMessage {
            role: "user".to_string(),
            content: prompt,
        },
    ];

    let response = client
        .post(LLAMA_SERVER_URL)
        .json(&OpenAIRequest {
            model: JUDGE_MODEL.to_string(),
            messages,
            stream: false,
            temperature: 0.1,
            max_tokens: 128,
        })
        .send()
        .await
        .map_err(|e| format!("llama-server request failed: {e}"))?
        .json::<OpenAIResponse>()
        .await
        .map_err(|e| format!("llama-server response parse failed: {e}"))?;

    let verdict = response.choices.first()
        .map(|c| c.message.content.trim().to_uppercase())
        .unwrap_or_default();

    let is_valid = verdict.starts_with("VALID");
    // Encode result_code: 0x01 = VALID, 0x00 = INVALID
    let result_code: u32 = if is_valid { 0x01 } else { 0x00 };

    Ok((is_valid, result_code))
}

// ─── Packet Dispatch ─────────────────────────────────────────────────────────

pub async fn dispatch(
    socket: &UdpSocket,
    client: &Client,
    buf: &[u8],
    src_addr: SocketAddr,
) {
    if buf.len() != std::mem::size_of::<IntentPacket>() {
        warn!(
            "vsb_udp: dropped datagram from {} — wrong size {} (expect {})",
            src_addr, buf.len(), std::mem::size_of::<IntentPacket>()
        );
        return;
    }

    let pkt: IntentPacket = match unsafe { from_bytes(buf) } {
        Some(p) => p,
        None => {
            warn!("vsb_udp: from_bytes failed for datagram from {}", src_addr);
            return;
        }
    };

    let hdr = pkt.header;
    if !hdr.is_valid() {
        warn!(
            "vsb_udp: dropped packet from {} — invalid header",
            src_addr
        );
        return;
    }

    if hdr.packet_type != PacketType::Intent as u8 {
        warn!(
            "vsb_udp: dropped packet from {} — unexpected type 0x{:02X}",
            src_addr, hdr.packet_type
        );
        return;
    }

use crate::rules::rules_oracle::{RulesOracle, Proposal, IntentType, VetoResult};

// ... inside dispatch ...
    let seq = hdr.sequence_id;
    info!("vsb_udp: ← INTENT seq={} from {}", seq, src_addr);

    // ── Phase 64: Ouroboros v2 — Semantic Veto ──────────────────────────────
    // Intercept intent and perform a deterministic rules check against Akashik.db
    let db_path = std::env::var("AKASHIK_DB_PATH").unwrap_or_else(|_| "../data/Akashik.db".to_string());
    let oracle = RulesOracle::with_db(db_path);
    
    // Attempt to parse payload into a Proposal (simplistic heuristic for now)
    let payload_str = std::str::from_utf8(&pkt.payload).unwrap_or("").trim_end_matches('\0');
    if let Ok(json) = serde_json::from_str::<serde_json::Value>(payload_str) {
        let actor_id = json.get("actor_id").and_then(|v| v.as_str()).unwrap_or("UNKNOWN").to_string();
        let intent_type = if json.get("action").and_then(|v| v.as_str()) == Some("spend") {
            Some(IntentType::SpendEb)
        } else if json.get("action").and_then(|v| v.as_str()) == Some("equip") {
            Some(IntentType::EquipCyberware { 
                item_id: json.get("item_id").and_then(|v| v.as_str()).unwrap_or("").to_string() 
            })
        } else {
            None
        };

        if let Some(it) = intent_type {
            let proposal = Proposal {
                actor_id,
                intent_type: it,
                value: json.get("amount").and_then(|v| v.as_i64()).unwrap_or(0),
                context: payload_str.to_string(),
            };
            
            if let VetoResult::VetoLogicFail(reason) = oracle.evaluate(&proposal) {
                error!("vsb_udp: [OUROBOROS_V2] VETO_LOGIC_FAIL for seq={}: {}", seq, reason);
                // Immediately return an ERROR result to Node B
                let result_pkt = ResultPacket::new(ResultStatus::Error, seq, pkt.session_id, 0x0A0B0C0D, [0u8; 256]);
                let result_bytes = unsafe { as_bytes(&result_pkt) };
                socket.send_to(result_bytes, src_addr).await.ok();
                return;
            }
        }
    }

    let (is_valid, result_code) = match query_judge(client, &pkt.payload, seq).await {
        Ok(verdict) => verdict,
        Err(e) => {
            error!("vsb_udp: Judge error for seq={}: {}", seq, e);
            (false, 0x02) // PENDING
        }
    };

    let status = if is_valid {
        ResultStatus::Ok
    } else {
        ResultStatus::Error
    };

    info!(
        "vsb_udp: → RESULT seq={} status={:?} result_code=0x{:04X} to {}",
        seq, status, result_code, src_addr
    );

    let result_pkt = ResultPacket::new(status, seq, pkt.session_id, result_code, [0u8; 256]);
    let result_bytes = unsafe { as_bytes(&result_pkt) };

    if let Err(e) = socket.send_to(result_bytes, src_addr).await {
        error!("vsb_udp: failed to send ResultPacket to {}: {}", src_addr, e);
    }
}

pub async fn run(client: Arc<Client>) {
    let bind_addr = format!("0.0.0.0:{}", VSB_UDP_PORT);
    let socket = UdpSocket::bind(&bind_addr)
        .await
        .unwrap_or_else(|e| panic!("vsb_udp: failed to bind UDP socket: {e}"));

    info!("⚡ VSB Sovereign Highway ONLINE (Native Inference) — UDP:{}", VSB_UDP_PORT);

    let mut buf = [0u8; MAX_DATAGRAM];
    let idle_timeout = tokio::time::Duration::from_secs(15 * 60); // 15 minutes

    loop {
        // Phase 28: Idle Timeout Watchdog
        // Self-terminate if no packets received for 15 minutes to save Node A resources.
        match tokio::time::timeout(idle_timeout, socket.recv_from(&mut buf)).await {
            Ok(Ok((n, src))) => {
                dispatch(&socket, &client, &buf[..n], src).await;
            }
            Ok(Err(e)) => {
                error!("vsb_udp: recv_from error: {}", e);
            }
            Err(_) => {
                warn!("!! IDLE TIMEOUT: No VSB traffic for 15m. Neutralizing Node A kernel to save resources.");
                std::process::exit(0);
            }
        }
    }
}
