//! sovereign-kernel — Phase 87: Kernel Vitals Artery
//!
//! WebSocket server (default: 0.0.0.0:3013) that streams CPU/VRAM/IO
//! pressure telemetry to the HUD [VITALS] panel.
//!
//! Protocol:
//!   Client → server: { "type": "SUBSCRIBE" }  (optional — streams on connect)
//!   Server → client: VitalsSnapshot (JSON) every POLL_INTERVAL_MS
//!
//! Usage:
//!   cargo run --release -- --port 3013 --poll-ms 2000

mod vitals;

use anyhow::Result;
use futures_util::{SinkExt, StreamExt};
use serde_json::json;
use std::{net::SocketAddr, time::Duration};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{accept_async, tungstenite::Message};
use tracing::{error, info, warn};

// ── Config ────────────────────────────────────────────────────────────────────

const DEFAULT_PORT:     u16 = 3013;
const POLL_INTERVAL_MS: u64 = 2000;   // vitals broadcast cadence
const CPU_SAMPLE_MS:    u64 = 200;    // /proc/stat delta window

// ── Entry point ───────────────────────────────────────────────────────────────

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(std::env::var("RUST_LOG").unwrap_or_else(|_| "info".into()))
        .init();

    let port = std::env::args()
        .skip_while(|a| a != "--port")
        .nth(1)
        .and_then(|v| v.parse::<u16>().ok())
        .unwrap_or(DEFAULT_PORT);

    let addr: SocketAddr = format!("0.0.0.0:{port}").parse()?;
    let listener = TcpListener::bind(addr).await?;
    info!("◈ sovereign-kernel: Vitals Artery live on ws://{addr}");

    loop {
        match listener.accept().await {
            Ok((stream, peer)) => {
                info!("HUD connected: {peer}");
                tokio::spawn(handle_client(stream, peer));
            }
            Err(e) => error!("Accept error: {e}"),
        }
    }
}

// ── Per-client handler ────────────────────────────────────────────────────────

async fn handle_client(stream: TcpStream, peer: SocketAddr) {
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => { warn!("WS handshake failed for {peer}: {e}"); return; }
    };

    let (mut tx, mut rx) = ws_stream.split();
    let poll = Duration::from_millis(POLL_INTERVAL_MS);

    // Send initial snapshot immediately
    send_snapshot(&mut tx).await;

    let mut interval = tokio::time::interval(poll);
    interval.tick().await; // consume immediate first tick

    loop {
        tokio::select! {
            _ = interval.tick() => {
                if !send_snapshot(&mut tx).await { break; }
            }
            msg = rx.next() => {
                match msg {
                    None | Some(Err(_)) => break,
                    Some(Ok(Message::Close(_))) => break,
                    Some(Ok(Message::Text(t))) => {
                        // Accept SUBSCRIBE / PING from HUD — no-op, already streaming
                        info!("HUD msg from {peer}: {t}");
                    }
                    _ => {}
                }
            }
        }
    }
    info!("HUD disconnected: {peer}");
}

async fn send_snapshot<S>(tx: &mut S) -> bool
where
    S: SinkExt<Message> + Unpin,
    S::Error: std::fmt::Debug,
{
    match vitals::snapshot(CPU_SAMPLE_MS).await {
        Ok(snap) => {
            let payload = json!({ "type": "VITALS", "data": snap });
            tx.send(Message::Text(payload.to_string().into())).await.is_ok()
        }
        Err(e) => {
            warn!("Vitals read error: {e}");
            let err_msg = json!({ "type": "VITALS_ERROR", "error": e.to_string() });
            tx.send(Message::Text(err_msg.to_string().into())).await.is_ok()
        }
    }
}
