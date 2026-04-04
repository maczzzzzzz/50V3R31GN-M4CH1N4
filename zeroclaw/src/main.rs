use std::sync::Arc;
use tracing::{info, error};
use tokio::net::TcpListener;
use zeroclaw::server::clawlink;
use zeroclaw::perception::{PerceptionConfig, PerceptionController};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialise Tracing (High-Signal Observability)
    tracing_subscriber::fmt::init();

    info!("🌃 ZeroClaw Rules Oracle v1.5.0 Initializing...");

    // 2. Construct shared PerceptionController (Phase 16 — Falcon Sidecar)
    //    Shared across all ClawLink connections via Arc.
    let perception = Arc::new(
        PerceptionController::new(PerceptionConfig::default())
            .expect("Failed to initialise ORT environment for Falcon Sidecar"),
    );
    info!("👁️  Falcon Sidecar: PerceptionController online (VRAM lock acquired).");

    // 3. Bind TCP Listener (ClawLink Binary Transport)
    let addr = "0.0.0.0:7878";
    let listener = TcpListener::bind(addr).await?;
    info!("📡 ZeroClaw ACTIVE and listening on: {}", addr);

    // 4. The Infinite Server Loop
    loop {
        match listener.accept().await {
            Ok((socket, addr)) => {
                info!("🟢 New ClawLink connection established from: {}", addr);

                // Clone the Arc — all connections share the same PerceptionController
                // so sequential VRAM management is enforced across concurrent sessions.
                let perception_clone = Arc::clone(&perception);

                tokio::spawn(async move {
                    clawlink::handle_connection(socket, perception_clone).await;
                });
            }
            Err(e) => {
                error!("❌ Socket acceptance error: {}", e);
            }
        }
    }
}
