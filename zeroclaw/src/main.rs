use std::sync::Arc;
use tracing::{info, error};
use tokio::net::TcpListener;
use reqwest::Client;
use zeroclaw::server::{clawlink, vsb_udp};
use zeroclaw::perception::{PerceptionConfig, PerceptionController};

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialise Tracing (High-Signal Observability)
    tracing_subscriber::fmt::init();

    info!("🌃 ZeroClaw Rules Oracle v1.5.0 Initializing...");

    // 2. Construct shared PerceptionController (Phase 16 — Falcon Sidecar)
    let perception = Arc::new(
        PerceptionController::new(PerceptionConfig::default())
            .expect("Failed to initialise ORT environment for Falcon Sidecar"),
    );
    info!("👁️  Falcon Sidecar: PerceptionController online (VRAM lock acquired).");

    // 3. Shared HTTP client for Ollama (reused by ClawLink and VSB Judge)
    let http_client = Arc::new(Client::new());

    // 3a. Warm up resident Llama-1B (VSB Judge + ClawLink) — best-effort, non-blocking
    {
        let wc = Arc::clone(&http_client);
        tokio::spawn(async move {
            #[derive(serde::Serialize)]
            struct Warmup<'a> { model: &'a str, prompt: &'a str, stream: bool }
            match wc.post("http://localhost:11434/api/generate")
                .json(&Warmup { model: "llama3.2:1b", prompt: ".", stream: false })
                .send().await
            {
                Ok(_)  => tracing::info!("🔒 Llama-1B resident model locked into VRAM."),
                Err(e) => tracing::warn!("⚠️  Llama-1B warmup failed (Ollama unavailable): {}", e),
            }
        });
    }

    // 4. Spawn VSB Sovereign Highway (UDP :7878) — Phase 22.5
    //    Runs concurrently with the TCP ClawLink server. UDP and TCP share
    //    the same port number in different protocol namespaces.
    let vsb_client = Arc::clone(&http_client);
    tokio::spawn(async move {
        vsb_udp::run(vsb_client).await;
    });

    // 5. Bind TCP Listener (ClawLink Binary Transport)
    let addr = "0.0.0.0:7878";
    let listener = TcpListener::bind(addr).await?;
    info!("📡 ZeroClaw ACTIVE and listening on TCP:{}", addr);

    // 6. The Infinite Server Loop
    loop {
        match listener.accept().await {
            Ok((socket, addr)) => {
                info!("🟢 New ClawLink connection established from: {}", addr);

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
