use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tokio::net::{TcpListener, TcpStream};
use tokio::io::AsyncWriteExt;
use tracing::{info, error};

pub mod vitals;

/**
 * SOVEREIGN_KERNEL : Phase 87 / Phase 89 Dual Artery
 * 
 * Task 1: Hardware-backed TPM signing for agentic social activities.
 * Task 2: eBPF/Proc Vitals Streaming via WebSocket/TCP.
 */

#[derive(Serialize, Deserialize, Debug)]
pub struct VsbPacket {
    pub payload: String,
    pub signature: Option<String>,
}

pub struct HardwareSigner {
    tpm_key_stub: String,
}

impl HardwareSigner {
    pub fn new() -> Self {
        Self {
            tpm_key_stub: "r00t-tpm-hardware-key-0x4A7B".to_string(),
        }
    }

    pub fn sign_activity(&self, packet: &mut VsbPacket) {
        packet.signature = Some(format!("signed_with_{}", self.tpm_key_stub));
    }
}

async fn handle_vitals_client(mut socket: TcpStream) {
    loop {
        match vitals::snapshot(1000).await {
            Ok(snap) => {
                if let Ok(json) = serde_json::to_string(&snap) {
                    if socket.write_all(format!("{}\n", json).as_bytes()).await.is_err() {
                        break;
                    }
                }
            }
            Err(e) => {
                error!("Vitals snapshot error: {}", e);
                tokio::time::sleep(tokio::time::Duration::from_secs(1)).await;
            }
        }
    }
}

async fn run_vitals_server() -> Result<()> {
    let addr = SocketAddr::from(([127, 0, 0, 1], 3013));
    let listener = TcpListener::bind(addr).await?;
    info!("◈ [KERNEL_VITALS] Streaming telemetry on {}", addr);

    loop {
        let (socket, _) = listener.accept().await?;
        tokio::spawn(handle_vitals_client(socket));
    }
}

async fn run_tpm_server() -> Result<()> {
    let signer = HardwareSigner::new();
    let addr = SocketAddr::from(([127, 0, 0, 1], 3014)); // Changed port to avoid conflict
    let listener = TcpListener::bind(addr).await?;
    info!("◈ [KERNEL_R00TS] Listening for VSB packets on {}", addr);

    loop {
        let (mut _socket, peer_addr) = listener.accept().await?;
        info!("● [KERNEL_R00TS] Connection from {}", peer_addr);
        
        let mut packet = VsbPacket {
            payload: "ACTIVITY_BOOST".to_string(),
            signature: None,
        };
        signer.sign_activity(&mut packet);
        info!("● [KERNEL_R00TS] Packet Signed: {:?}", packet.signature);
    }
}

#[tokio::main]
async fn main() -> Result<()> {
    tracing_subscriber::fmt::init();
    info!("◈ [SOVEREIGN_KERNEL] Ignition sequence...");

    let vitals_handle = tokio::spawn(run_vitals_server());
    let tpm_handle = tokio::spawn(run_tpm_server());

    let _ = tokio::join!(vitals_handle, tpm_handle);

    Ok(())
}
