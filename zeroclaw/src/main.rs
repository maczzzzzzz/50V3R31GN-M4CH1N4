use tracing::{info, error};
use tokio::net::TcpListener;
use zeroclaw::server::clawlink;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // 1. Initialise Tracing (High-Signal Observability)
    tracing_subscriber::fmt::init();
    
    info!("🌃 ZeroClaw Rules Oracle v1.0.0 Initializing...");

    // 2. Bind TCP Listener (ClawLink Binary Transport)
    let addr = "0.0.0.0:7878";
    let listener = TcpListener::bind(addr).await?;
    info!("📡 ZeroClaw ACTIVE and listening on: {}", addr);

    // 3. The Infinite Server Loop
    loop {
        match listener.accept().await {
            Ok((socket, addr)) => {
                info!("🟢 New ClawLink connection established from: {}", addr);
                
                // Spawn a concurrent task for this connection (The Swarm Oracle)
                tokio::spawn(async move {
                    clawlink::handle_connection(socket).await;
                });
            }
            Err(e) => {
                error!("❌ Socket acceptance error: {}", e);
            }
        }
    }
}
