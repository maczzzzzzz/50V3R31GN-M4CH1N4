/// VSB UDP Server — Node A (ZeroClaw)
/// Phase 22.5: Cross-Node Stabilization — Task 2
///
/// Tokio-driven UDP server on port 7878 (UDP, independent of the TCP ClawLink
/// socket on the same port). Receives `IntentPacket` frames from Node B,
/// routes them to the resident 1B Judge (Ollama llama3.2:1b), and replies
/// with a `ResultPacket` back to the sender.
///
/// Port layout:
///   :7878 TCP — ClawLink binary transport (existing)
///   :7878 UDP — VSB Sovereign Highway (this file)

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

// ─── Constants ────────────────────────────────────────────────────────────────

pub const VSB_UDP_PORT: u16   = 7878;
pub const OLLAMA_URL: &str    = "http://localhost:11434/api/generate";
pub const JUDGE_MODEL: &str   = "llama3.2:1b";

/// Maximum UDP datagram size we'll accept. Packets larger than this are dropped.
const MAX_DATAGRAM: usize = 1024;

// ─── Ollama Request/Response ──────────────────────────────────────────────────

#[derive(Debug, Serialize)]
struct OllamaRequest {
    model:  String,
    prompt: String,
    stream: bool,
}

#[derive(Debug, Deserialize)]
struct OllamaResponse {
    response: String,
}

// ─── Judge ────────────────────────────────────────────────────────────────────

/// Route an intent payload to the resident 1B Judge and return its verdict.
///
/// Prompt schema:
///   [SYSTEM CONSTITUTION]
///   {RED_RULES}
///   [INTENT]
///   {UTF-8 payload up to 256 bytes}
///   [TASK]
///   Validate this intent against the Cyberpunk RED rules.
///   Reply with VALID or INVALID and a one-sentence reason.
async fn query_judge(
    client: &Client,
    intent_payload: &[u8],
    _sequence_id: u32,
) -> Result<(bool, u32), String> {
    let payload_str = std::str::from_utf8(intent_payload)
        .unwrap_or("[binary payload]")
        .trim_end_matches('\0');

    let prompt = format!(
        "[SYSTEM CONSTITUTION]\n{rules}\n\
         [INTENT]\n{payload}\n\
         [TASK]\nValidate this mechanical intent against Cyberpunk RED rules.\n\
         Reply with VALID or INVALID followed by a one-sentence reason. \
         Be concise.",
        rules   = get_red_rules(),
        payload = payload_str,
    );

    let response = client
        .post(OLLAMA_URL)
        .json(&OllamaRequest {
            model:  JUDGE_MODEL.to_string(),
            prompt,
            stream: false,
        })
        .send()
        .await
        .map_err(|e| format!("ollama request failed: {e}"))?
        .json::<OllamaResponse>()
        .await
        .map_err(|e| format!("ollama response parse failed: {e}"))?;

    let verdict = response.response.trim().to_uppercase();
    let is_valid = verdict.starts_with("VALID");
    // Encode first byte of verdict as result_code: 0x01 = VALID, 0x00 = INVALID
    let result_code: u32 = if is_valid { 0x01 } else { 0x00 };

    Ok((is_valid, result_code))
}

// ─── Packet Dispatch ─────────────────────────────────────────────────────────

/// Process one received datagram:
///   1. Validate length → must be exactly 302 bytes (IntentPacket)
///   2. Decode header → check magic/version/checksum
///   3. Verify packet_type == Intent
///   4. Route to 1B Judge
///   5. Build ResultPacket and send back to `src_addr`
pub async fn dispatch(
    socket: &UdpSocket,
    client: &Client,
    buf: &[u8],
    src_addr: SocketAddr,
) {
    // ── 1. Size gate ───────────────────────────────────────────────────────
    if buf.len() != std::mem::size_of::<IntentPacket>() {
        warn!(
            "vsb_udp: dropped datagram from {} — wrong size {} (expect {})",
            src_addr, buf.len(), std::mem::size_of::<IntentPacket>()
        );
        return;
    }

    // ── 2. Decode and validate header ──────────────────────────────────────
    let pkt: IntentPacket = match unsafe { from_bytes(buf) } {
        Some(p) => p,
        None => {
            warn!("vsb_udp: from_bytes failed for datagram from {}", src_addr);
            return;
        }
    };

    let hdr = pkt.header; // copy to aligned local
    if !hdr.is_valid() {
        warn!(
            "vsb_udp: dropped packet from {} — invalid header (bad magic/version/checksum)",
            src_addr
        );
        return;
    }

    // ── 3. Intent gate ─────────────────────────────────────────────────────
    if hdr.packet_type != PacketType::Intent as u8 {
        warn!(
            "vsb_udp: dropped packet from {} — unexpected type 0x{:02X} (expect Intent=0x01)",
            src_addr, hdr.packet_type
        );
        return;
    }

    let seq = hdr.sequence_id;
    info!(
        "vsb_udp: ← INTENT seq={} intent_type=0x{:02X} from {}",
        seq, pkt.intent_type, src_addr
    );

    // ── 4. Route to 1B Judge ───────────────────────────────────────────────
    let (is_valid, result_code) = match query_judge(client, &pkt.payload, seq).await {
        Ok(verdict) => verdict,
        Err(e) => {
            error!("vsb_udp: 1B Judge error for seq={}: {}", seq, e);
            // Fail-open: return PENDING so Node B can retry or fallback
            (false, 0x02)
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

    // ── 5. Build and send ResultPacket ─────────────────────────────────────
    let result_pkt = ResultPacket::new(status, seq, pkt.session_id, result_code, [0u8; 256]);
    let result_bytes = unsafe { as_bytes(&result_pkt) };

    if let Err(e) = socket.send_to(result_bytes, src_addr).await {
        error!("vsb_udp: failed to send ResultPacket to {}: {}", src_addr, e);
    }
}

// ─── Server Entry Point ───────────────────────────────────────────────────────

/// Bind the VSB UDP socket and run the receive loop.
/// This function is `!` — it runs until the process exits.
pub async fn run(client: Arc<Client>) {
    let bind_addr = format!("0.0.0.0:{}", VSB_UDP_PORT);
    let socket = UdpSocket::bind(&bind_addr)
        .await
        .unwrap_or_else(|e| panic!("vsb_udp: failed to bind UDP socket on {bind_addr}: {e}"));

    info!("⚡ VSB Sovereign Highway ONLINE — UDP:{}", VSB_UDP_PORT);

    let mut buf = [0u8; MAX_DATAGRAM];

    loop {
        match socket.recv_from(&mut buf).await {
            Ok((n, src)) => {
                dispatch(&socket, &client, &buf[..n], src).await;
            }
            Err(e) => {
                error!("vsb_udp: recv_from error: {}", e);
            }
        }
    }
}

// ─── Tests ───────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use crate::vsb_protocol::IntentType;
    use tokio::net::UdpSocket as TokioUdpSocket;

    // ── Helpers ───────────────────────────────────────────────────────────────

    fn make_intent_pkt(seq: u32, intent_type: IntentType) -> IntentPacket {
        let mut payload = [0u8; 256];
        payload[0] = b'R';
        IntentPacket::new(intent_type, seq, [0xAB; 16], [0xCD; 16], payload)
    }

    fn pkt_to_buf(pkt: &IntentPacket) -> Vec<u8> {
        unsafe { as_bytes(pkt) }.to_vec()
    }

    // ── Packet decode ─────────────────────────────────────────────────────────

    #[test]
    fn test_intent_packet_header_validates() {
        let pkt = make_intent_pkt(1, IntentType::Roll);
        let hdr = pkt.header;
        assert!(hdr.is_valid());
        assert_eq!(hdr.packet_type, PacketType::Intent as u8);
        let seq = hdr.sequence_id;
        assert_eq!(seq, 1);
    }

    #[test]
    fn test_result_packet_encodes_verdict_correctly() {
        let session_id = [0xAB; 16];
        let ok_pkt  = ResultPacket::new(ResultStatus::Ok,    42, session_id, 0x01, [0u8; 256]);
        let err_pkt = ResultPacket::new(ResultStatus::Error, 43, session_id, 0x00, [0u8; 256]);

        let ok_hdr  = ok_pkt.header;
        let err_hdr = err_pkt.header;

        assert!(ok_hdr.is_valid());
        assert!(err_hdr.is_valid());
        assert_eq!(ok_pkt.status,  ResultStatus::Ok as u8);
        assert_eq!(err_pkt.status, ResultStatus::Error as u8);

        let ok_rc  = ok_pkt.result_code;
        let err_rc = err_pkt.result_code;
        assert_eq!(ok_rc,  0x01);
        assert_eq!(err_rc, 0x00);
    }

    #[test]
    fn test_wrong_size_packet_is_detected() {
        // A packet of wrong size should be detectable via size check
        let short_buf = [0u8; 100];
        let result: Option<IntentPacket> = unsafe { from_bytes(&short_buf) };
        assert!(result.is_none(), "short buf must return None");
    }

    #[test]
    fn test_corrupted_header_fails_validation() {
        let pkt = make_intent_pkt(5, IntentType::Damage);
        let mut buf = pkt_to_buf(&pkt);
        buf[12] ^= 0xFF; // corrupt checksum byte
        let decoded: IntentPacket = unsafe { from_bytes(&buf) }.unwrap();
        let hdr = decoded.header;
        assert!(!hdr.is_valid(), "corrupted checksum must fail");
    }

    #[test]
    fn test_wrong_packet_type_is_detected() {
        let pkt = make_intent_pkt(7, IntentType::Heal);
        let mut buf = pkt_to_buf(&pkt);
        // Patch packet_type byte (offset 3) to Result=0x02 and recompute checksum
        buf[3] = PacketType::Result as u8;
        // Recompute XOR checksum over [0..12]
        let csum = buf[..12].iter().fold(0u8, |a, &b| a ^ b);
        buf[12] = csum;
        let decoded: IntentPacket = unsafe { from_bytes(&buf) }.unwrap();
        let hdr = decoded.header;
        assert!(hdr.is_valid(), "header itself is valid after patch");
        assert_ne!(
            hdr.packet_type,
            PacketType::Intent as u8,
            "packet_type must NOT be Intent after patch"
        );
    }

    // ── UDP round-trip (loopback) ─────────────────────────────────────────────

    #[tokio::test]
    async fn test_udp_loopback_intent_size() {
        // Verify IntentPacket fits in a single UDP datagram and survives a
        // loopback send/recv without truncation.
        let server = TokioUdpSocket::bind("127.0.0.1:0").await.unwrap();
        let client = TokioUdpSocket::bind("127.0.0.1:0").await.unwrap();
        let server_addr = server.local_addr().unwrap();

        let pkt = make_intent_pkt(99, IntentType::SkillCheck);
        let pkt_bytes = pkt_to_buf(&pkt);
        assert_eq!(pkt_bytes.len(), 302);

        client.send_to(&pkt_bytes, server_addr).await.unwrap();

        let mut recv_buf = [0u8; 512];
        let (n, _src) = server.recv_from(&mut recv_buf).await.unwrap();

        assert_eq!(n, 302, "loopback must deliver full 302-byte datagram");

        let recovered: IntentPacket = unsafe { from_bytes(&recv_buf[..n]) }.unwrap();
        let hdr = recovered.header;
        assert!(hdr.is_valid());
        let seq = hdr.sequence_id;
        assert_eq!(seq, 99);
        assert_eq!(recovered.intent_type, IntentType::SkillCheck as u8);
    }
}
