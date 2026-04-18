/// zeroclaw/src/server/telemetry.rs
/// Phase 61: Sovereign Telemetry Stream — broadcasts JSON events to the proxy.

use std::net::UdpSocket;
use std::sync::OnceLock;
use tracing::{error, debug};
use crate::vsb_protocol::{TelemetryPacket, as_bytes};

static TELEMETRY_SOCKET: OnceLock<UdpSocket> = OnceLock::new();
static PROXY_ADDR: OnceLock<String> = OnceLock::new();

pub fn init_telemetry(proxy_addr: String) {
    let socket = UdpSocket::bind("0.0.0.0:0").expect("Failed to bind telemetry socket");
    socket.set_broadcast(true).ok();
    TELEMETRY_SOCKET.set(socket).ok();
    PROXY_ADDR.set(proxy_addr).ok();
}

pub fn emit_roll_breakdown(
    actor: &str,
    d10: i32,
    stat: i32,
    skill: i32,
    mods: i32,
    total: i32,
    dv: i32,
    success: bool,
) {
    let json = serde_json::json!({
        "type": "roll_breakdown",
        "actor": actor,
        "d10": d10,
        "stat": stat,
        "skill": skill,
        "mods": mods,
        "total": total,
        "dv": dv,
        "success": success,
    });

    emit_json(json.to_string());
}

fn emit_json(payload: String) {
    if let (Some(socket), Some(addr)) = (TELEMETRY_SOCKET.get(), PROXY_ADDR.get()) {
        let mut buf = [0u8; 256];
        let bytes = payload.as_bytes();
        let len = bytes.len().min(256);
        buf[..len].copy_from_slice(&bytes[..len]);

        let pkt = TelemetryPacket::new(0, buf);
        let wire_bytes = unsafe { as_bytes(&pkt) };

        if let Err(e) = socket.send_to(wire_bytes, addr) {
            error!("Failed to emit telemetry: {}", e);
        } else {
            debug!("Emitted telemetry: {}", payload);
        }
    }
}
