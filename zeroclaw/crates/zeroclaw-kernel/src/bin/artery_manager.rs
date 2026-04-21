//! Phase 67 — Artery Manager (Node C Daemon)
//!
//! Axum HTTP daemon running on port 7340 (Node C host).
//! Manages dynamic VRAM gating by restarting `llama-server` with the correct
//! GGUF quantization variant: Q5 (Authority), Q4 (Comm), Q3 (Berserker).
//!
//! ## Endpoints
//! | Method | Path        | Description                        |
//! |--------|-------------|------------------------------------|
//! | GET    | /status     | Current quantization and PID       |
//! | POST   | /shift      | Swap to a different quantization   |
//! | POST   | /stop       | Kill the current llama-server      |
//! | POST   | /start      | (Re)start with the current quant   |
//! | GET    | /health     | Liveness probe                     |
//!
//! ## VRAM Safety (SOVEREIGN_VITAL_SIGNS.md)
//! Node C ceiling: 5.1GB (Logic) / 5.9GB (Voice).
//! Q5 is the default — highest fidelity within the safety envelope.
//!
//! GGUF paths on `/mnt/vocal_soul` (Node C storage):
//!   - Q5: `E4B-it-OBLITERATED-Q5_K_M.gguf`   ← Authority  (~5.1GB)
//!   - Q4: `E4B-it-OBLITERATED-Q4_K_M.gguf`   ← Comm       (~4.2GB)
//!   - Q3: `E4B-it-OBLITERATED-Q3_K_M.gguf`   ← Berserker  (~3.3GB)

use std::{
    env,
    path::PathBuf,
    sync::Arc,
    time::Duration,
};

use axum::{
    extract::{State, ws::{Message, WebSocket, WebSocketUpgrade}},
    http::StatusCode,
    response::{IntoResponse, Json},
    routing::{get, post},
    Router,
};
use serde::{Deserialize, Serialize};
use tokio::{
    process::{Child, Command},
    sync::Mutex,
    time::sleep,
};
use tracing::{error, info, warn};

// Phase 67.5: Rust ML Integration
// use candle_transformers::models::whisper;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PORT: u16 = 7340;
const LLAMA_SERVER_PORT: u16 = 7339;
const VOCAL_SOUL: &str = "/mnt/vocal_soul";

/// Startup grace period — wait for llama-server to bind before returning
const STARTUP_GRACE_MS: u64 = 3_000;

// ---------------------------------------------------------------------------
// Quantization variant
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Quantization {
    Q5,
    Q4,
    Q3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum NodeTarget {
    NodeA,
    NodeC,
}

pub fn determine_route(tokens: usize) -> NodeTarget {
    if tokens > 4000 {
        NodeTarget::NodeA
    } else {
        NodeTarget::NodeC
    }
}

impl Quantization {
    fn gguf_filename(self) -> &'static str {
        match self {
            Quantization::Q5 => "E4B-it-OBLITERATED-Q5_K_M.gguf",
            Quantization::Q4 => "E4B-it-OBLITERATED-Q4_K_M.gguf",
            Quantization::Q3 => "E4B-it-OBLITERATED-Q3_K_M.gguf",
        }
    }

    fn vram_label(self) -> &'static str {
        match self {
            Quantization::Q5 => "~5.1GB (Authority)",
            Quantization::Q4 => "~4.2GB (Comm)",
            Quantization::Q3 => "~3.3GB (Berserker)",
        }
    }

    /// Context length tuned per VRAM headroom
    fn ctx_size(self) -> u32 {
        match self {
            Quantization::Q5 => 4096,
            Quantization::Q4 => 8192,
            Quantization::Q3 => 16384,
        }
    }
}

impl std::fmt::Display for Quantization {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Quantization::Q5 => "q5",
            Quantization::Q4 => "q4",
            Quantization::Q3 => "q3",
        };
        write!(f, "{s}")
    }
}

// ---------------------------------------------------------------------------
// Daemon state
// ---------------------------------------------------------------------------

struct ArteryState {
    current_quant: Quantization,
    child: Option<Child>,
    vocal_soul: PathBuf,
    llama_server_bin: PathBuf,
    n_gpu_layers: i32,
}

impl ArteryState {
    fn gguf_path(&self, q: Quantization) -> PathBuf {
        self.vocal_soul.join(q.gguf_filename())
    }

    async fn stop_server(&mut self) {
        if let Some(mut child) = self.child.take() {
            info!("ARTERY: Killing llama-server (PID {:?})", child.id());
            let _ = child.kill().await;
            let _ = child.wait().await;
            info!("ARTERY: llama-server terminated");
        }
    }

    async fn start_server(&mut self, q: Quantization) -> anyhow::Result<()> {
        self.stop_server().await;

        let model_path = self.gguf_path(q);
        if !model_path.exists() {
            anyhow::bail!(
                "ARTERY_FAIL: GGUF not found at {} — run ingestor to shore the model",
                model_path.display()
            );
        }

        info!(
            "ARTERY: Igniting llama-server with {} ({})",
            q,
            q.vram_label()
        );

        let child = Command::new(&self.llama_server_bin)
            .args([
                "--model",
                model_path.to_str().unwrap_or_default(),
                "--port",
                &LLAMA_SERVER_PORT.to_string(),
                "--host",
                "0.0.0.0",
                "--ctx-size",
                &q.ctx_size().to_string(),
                "--n-gpu-layers",
                &self.n_gpu_layers.to_string(),
                "--parallel",
                "2",
                "--cont-batching",
                "--log-disable",
            ])
            .spawn()?;

        self.child = Some(child);
        self.current_quant = q;

        // Grace period — let the server bind
        sleep(Duration::from_millis(STARTUP_GRACE_MS)).await;
        info!("ARTERY: llama-server online on port {}", LLAMA_SERVER_PORT);

        Ok(())
    }
}

type SharedState = Arc<Mutex<ArteryState>>;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

#[derive(Serialize)]
struct StatusResponse {
    quantization: Quantization,
    vram_label: &'static str,
    ctx_size: u32,
    server_running: bool,
    llama_port: u16,
}

#[derive(Serialize)]
struct OkResponse {
    status: &'static str,
    message: String,
}

#[derive(Deserialize)]
struct ShiftRequest {
    quantization: Quantization,
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async fn handle_status(State(state): State<SharedState>) -> Json<StatusResponse> {
    let s = state.lock().await;
    Json(StatusResponse {
        quantization: s.current_quant,
        vram_label: s.current_quant.vram_label(),
        ctx_size: s.current_quant.ctx_size(),
        server_running: s.child.is_some(),
        llama_port: LLAMA_SERVER_PORT,
    })
}

async fn handle_health() -> StatusCode {
    StatusCode::OK
}

async fn handle_shift(
    State(state): State<SharedState>,
    Json(req): Json<ShiftRequest>,
) -> (StatusCode, Json<serde_json::Value>) {
    let mut s = state.lock().await;

    if s.current_quant == req.quantization && s.child.is_some() {
        return (
            StatusCode::OK,
            Json(serde_json::json!({
                "status": "ok",
                "message": format!("Already running {}", req.quantization)
            })),
        );
    }

    info!("ARTERY: Shift requested → {}", req.quantization);

    match s.start_server(req.quantization).await {
        Ok(()) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "status": "ok",
                "message": format!(
                    "Shifted to {} — {} ctx={}",
                    req.quantization,
                    req.quantization.vram_label(),
                    req.quantization.ctx_size()
                )
            })),
        ),
        Err(e) => {
            error!("ARTERY: Shift failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "status": "error", "error": e.to_string() })),
            )
        }
    }
}

async fn handle_stop(State(state): State<SharedState>) -> Json<OkResponse> {
    let mut s = state.lock().await;
    s.stop_server().await;
    Json(OkResponse { status: "ok", message: "llama-server stopped".into() })
}

async fn handle_start(State(state): State<SharedState>) -> (StatusCode, Json<serde_json::Value>) {
    let mut s = state.lock().await;
    let q = s.current_quant;
    match s.start_server(q).await {
        Ok(()) => (
            StatusCode::OK,
            Json(serde_json::json!({
                "status": "ok",
                "message": format!("Started with current quant: {}", q)
            })),
        ),
        Err(e) => {
            error!("ARTERY: Start failed: {e}");
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "status": "error", "error": e.to_string() })),
            )
        }
    }
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async fn handle_ws(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(handle_socket)
}

async fn handle_socket(mut socket: WebSocket) {
    info!("◈ OMI Wearable connected");
    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Binary(bytes) = msg {
            // Task 2: Rust ML Integration (Phase 67.5)
            let transcript = transcribe_audio(&bytes).await;
            
            // VSB Intent Extraction
            if transcript.to_lowercase().contains("scan") {
                info!("::/VSB_INJECT : TACTICAL_SCAN | {{\"source\":\"omi\",\"confidence\":0.95}}");
            }
        }
    }
    info!("◈ OMI Wearable disconnected");
}

async fn transcribe_audio(bytes: &[u8]) -> String {
    // Placeholder for candle-transformers Whisper inference
    // In a full implementation, this would load the model from /mnt/vocal_soul/whisper/
    // and process the audio chunk.
    if bytes.len() > 0 {
        "Tactical audio packet received. scan".to_string()
    } else {
        "".to_string()
    }
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_target(false)
        .with_level(true)
        .init();

    info!("◈ ARTERY_MANAGER: Phase 67 // 50V3R31GN-M4CH1N4");

    // Config from environment
    let vocal_soul = PathBuf::from(
        env::var("VOCAL_SOUL_PATH").unwrap_or_else(|_| VOCAL_SOUL.to_string()),
    );
    let llama_server_bin = PathBuf::from(
        env::var("LLAMA_SERVER_BIN").unwrap_or_else(|_| "llama-server".to_string()),
    );
    let n_gpu_layers: i32 = env::var("N_GPU_LAYERS")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(99); // load all layers to CUDA by default

    let bind_port: u16 = env::var("ARTERY_PORT")
        .ok()
        .and_then(|v| v.parse().ok())
        .unwrap_or(DEFAULT_PORT);

    if !vocal_soul.exists() {
        warn!(
            "ARTERY: {} does not exist — GGUF paths will fail until Node C storage is mounted",
            vocal_soul.display()
        );
    }

    let initial_state = ArteryState {
        current_quant: Quantization::Q5,
        child: None,
        vocal_soul,
        llama_server_bin,
        n_gpu_layers,
    };

    let shared = Arc::new(Mutex::new(initial_state));

    let app = Router::new()
        .route("/health", get(handle_health))
        .route("/status", get(handle_status))
        .route("/shift", post(handle_shift))
        .route("/stop", post(handle_stop))
        .route("/start", post(handle_start))
        .route("/ws/audio", get(handle_ws))
        .with_state(shared);

    let bind_addr = format!("0.0.0.0:{bind_port}");
    info!("ARTERY: Listening on {bind_addr}");

    let listener = tokio::net::TcpListener::bind(&bind_addr)
        .await
        .expect("Failed to bind Artery Manager port");

    axum::serve(listener, app)
        .await
        .expect("Artery Manager server error");
}
