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
use candle_core::{Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::whisper::{self as m, Config, audio};
use candle_transformers::generation::LogitsProcessor;
use tokenizers::Tokenizer;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_PORT: u16 = 7340;
const LLAMA_SERVER_PORT: u16 = 7339;
const VOCAL_SOUL: &str = "/home/maczz/50V3R31GN-M4CH1N4/models";

/// Startup grace period — wait for llama-server to bind before returning
const STARTUP_GRACE_MS: u64 = 3_000;

// ---------------------------------------------------------------------------
// Whisper State
// ---------------------------------------------------------------------------

pub struct WhisperCore {
    model: m::model::Whisper,
    tokenizer: Tokenizer,
    mel_filters: Vec<f32>,
    device: Device,
}

impl WhisperCore {
    pub fn new(vocal_soul: &PathBuf) -> anyhow::Result<Self> {
        let whisper_dir = vocal_soul.join("whisper");
        let model_path = whisper_dir.join("model.safetensors");
        let tokenizer_path = whisper_dir.join("tokenizer.json");
        let config_path = whisper_dir.join("config.json");
        
        // Let's assume Node C CUDA usage, fallback to CPU if failed.
        let device = Device::new_cuda(0).unwrap_or(Device::Cpu);

        if !model_path.exists() {
            anyhow::bail!("Whisper model missing at: {}", model_path.display());
        }

        let config: Config = serde_json::from_reader(std::fs::File::open(config_path)?)?;
        let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[model_path], m::DTYPE, &device)? };
        let model = m::model::Whisper::load(&vb, config.clone())?;
        
        let tokenizer = Tokenizer::from_file(tokenizer_path).map_err(anyhow::Error::msg)?;
        let mel_bytes = include_bytes!("melfilters.bytes");
        let mut mel_filters = vec![0f32; mel_bytes.len() / 4];
        <byteorder::LittleEndian as byteorder::ByteOrder>::read_f32_into(mel_bytes, &mut mel_filters);

        Ok(Self { model, tokenizer, mel_filters, device })
    }
}


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
            Quantization::Q5 => "gemma-4-E4B-it-OBLITERATED-Q5_K_M.gguf",
            Quantization::Q4 => "gemma-4-E4B-it-OBLITERATED-Q4_K_M.gguf",
            Quantization::Q3 => "gemma-4-E4B-it-OBLITERATED-Q3_K_M.gguf",
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
    whisper_core: Option<Arc<WhisperCore>>,
    latest_frame_hash: Option<String>,
    udp_socket: Arc<tokio::net::UdpSocket>,
    director_addr: String,
}

impl ArteryState {
...
    async fn start_server(&mut self, q: Quantization) -> anyhow::Result<()> {
...
    }
    
    async fn broadcast_vocal_intent(&self, transcript: &str) {
        use zeroclaw::vsb_protocol::{IntentPacket, IntentType, as_bytes};
        
        let mut payload = [0u8; 256];
        let bytes = transcript.as_bytes();
        let len = std::cmp::min(bytes.len(), 255);
        payload[..len].copy_from_slice(&bytes[..len]);
        
        let pkt = IntentPacket::new(
            IntentType::VocalIntent,
            0, // sequence doesn't matter for async pushes
            [0u8; 16], // session
            [0u8; 16], // actor
            payload,
        );
        
        let bytes = unsafe { as_bytes(&pkt) };
        if let Err(e) = self.udp_socket.send_to(bytes, &self.director_addr).await {
            warn!("ARTERY: Failed to broadcast VOCAL_INTENT to {}: {}", self.director_addr, e);
        } else {
            info!("ARTERY: Broadcasted VOCAL_INTENT to {}", self.director_addr);
        }
    }
}

type SharedState = Arc<Mutex<ArteryState>>;

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

#[derive(Serialize, Deserialize)]
struct ChatMessage {
    id: String,
    sender: String,
    text: String,
    timestamp: String,
}

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

async fn handle_chat_sync(
    State(_state): State<SharedState>,
    Json(req): Json<Vec<ChatMessage>>,
) -> (StatusCode, Json<serde_json::Value>) {
    let db_path = PathBuf::from("/home/maczz/50V3R31GN-M4CH1N4/data/artery_history.db");
    
    match rusqlite::Connection::open(&db_path) {
        Ok(conn) => {
            let _ = conn.execute(
                "CREATE TABLE IF NOT EXISTS chat_history (id TEXT PRIMARY KEY, sender TEXT, text TEXT, timestamp TEXT)",
                [],
            );
            let mut count = 0;
            for msg in &req {
                if let Ok(_) = conn.execute(
                    "INSERT OR IGNORE INTO chat_history (id, sender, text, timestamp) VALUES (?1, ?2, ?3, ?4)",
                    [&msg.id, &msg.sender, &msg.text, &msg.timestamp],
                ) {
                    count += 1;
                }
            }
            info!("ARTERY: Chat sync complete. {} records shored in {}.", count, db_path.display());
            (StatusCode::OK, Json(serde_json::json!({ "status": "ok", "synced": count })))
        }
        Err(e) => {
            error!("ARTERY: DB sync failed: {e}");
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "status": "error", "error": e.to_string() })))
        }
    }
}

async fn handle_theme_sync(
    State(_state): State<SharedState>,
    Json(req): Json<serde_json::Value>,
) -> StatusCode {
    if let Some(theme) = req.get("theme").and_then(|t| t.as_str()) {
        info!("ARTERY: System theme synchronized → {}", theme);
        StatusCode::OK
    } else {
        StatusCode::BAD_REQUEST
    }
}

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

#[derive(Deserialize)]
struct HashRequest {
    hash: String,
}

async fn handle_hash_update(
    State(state): State<SharedState>,
    Json(req): Json<HashRequest>,
) -> StatusCode {
    let mut s = state.lock().await;
    s.latest_frame_hash = Some(req.hash);
    StatusCode::OK
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async fn handle_ws(State(state): State<SharedState>, ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: SharedState) {
    info!("◈ OMI Wearable connected");
    
    let mut audio_buffer = Vec::new();
    let mut is_speaking = false;
    let mut silence_chunks = 0;
    const VAD_THRESHOLD: f32 = 0.010; // More sensitive
    const MAX_SILENCE_CHUNKS: usize = 12; // Faster trigger (approx 0.6s at 20fps)

    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Binary(bytes) = msg {
            // Task 1: VAD (Voice Activity Detection) Gate using RMS Energy
            let mut energy = 0.0;
            let mut sample_count = 0;
            let mut chunks = bytes.chunks_exact(2);
            while let Some(chunk) = chunks.next() {
                let sample = i16::from_le_bytes([chunk[0], chunk[1]]) as f32 / 32768.0;
                energy += sample * sample;
                sample_count += 1;
            }
            let rms = if sample_count > 0 { (energy / sample_count as f32).sqrt() } else { 0.0 };

            if rms > VAD_THRESHOLD {
                is_speaking = true;
                silence_chunks = 0;
                audio_buffer.extend_from_slice(&bytes);
            } else if is_speaking {
                silence_chunks += 1;
                audio_buffer.extend_from_slice(&bytes); // Retain brief pauses
                
                if silence_chunks > MAX_SILENCE_CHUNKS {
                    trigger_transcription(&mut socket, &mut audio_buffer, &state).await;
                    is_speaking = false;
                    silence_chunks = 0;
                }
            }
        }
    }
    
    if is_speaking && !audio_buffer.is_empty() {
        trigger_transcription(&mut socket, &mut audio_buffer, &state).await;
    }
    
    info!("◈ OMI Wearable disconnected");
}

async fn trigger_transcription(socket: &mut WebSocket, audio_buffer: &mut Vec<u8>, state: &SharedState) {
    // Trigger Inference
    let whisper_core = {
        let s = state.lock().await;
        s.whisper_core.clone()
    };

    let transcript = transcribe_audio(&audio_buffer, whisper_core).await;
    
    if !transcript.is_empty() {
        // Send back to client
        let response = Message::Text(serde_json::json!({
            "type": "TRANSCRIPTION",
            "text": transcript
        }).to_string());
        
        let _ = socket.send(response).await;

        // Broadcast to Director (Node B)
        {
            let s = state.lock().await;
            s.broadcast_vocal_intent(transcript).await;
        }

        // Tasks 2 & 3: Decoupled Intent Routing & Visual Context Injection
        let frame_hash = {
            let s = state.lock().await;
            s.latest_frame_hash.clone().unwrap_or_else(|| "null".to_string())
        };

        let payload = serde_json::json!({
            "type": "VOCAL_INTENT",
            "transcript": transcript,
            "confidence": 0.95,
            "timestamp": std::time::SystemTime::now().duration_since(std::time::UNIX_EPOCH).unwrap().as_secs(),
            "visual_context": frame_hash
        });

        info!("::/VSB_INJECT : VOCAL_INTENT | {}", payload.to_string());
    }
    audio_buffer.clear();
}

async fn transcribe_audio(bytes: &[u8], core_opt: Option<Arc<WhisperCore>>) -> String {
    let core = match core_opt {
        Some(c) => c,
        None => return "".to_string(),
    };

    if bytes.is_empty() {
        return "".to_string();
    }

    // Assuming raw 16-bit PCM at 16kHz from OMI stream. 
    // Convert bytes to f32 samples normalized to [-1.0, 1.0]
    let mut pcm_data = Vec::with_capacity(bytes.len() / 2);
    let mut chunks = bytes.chunks_exact(2);
    while let Some(chunk) = chunks.next() {
        let sample = i16::from_le_bytes([chunk[0], chunk[1]]);
        pcm_data.push(sample as f32 / 32768.0);
    }

    // Process audio into mel spectrogram using the loaded filters
    let mel = audio::pcm_to_mel(&core.model.config, &pcm_data, &core.mel_filters);
    
    let mel_len = mel.len();
    let num_mel_bins = core.model.config.num_mel_bins;
    let mel = match candle_core::Tensor::from_vec(
        mel,
        (1, num_mel_bins, mel_len / num_mel_bins),
        &core.device,
    ) {
        Ok(m) => m,
        Err(e) => {
            error!("ARTERY: Failed to create mel tensor: {e}");
            return "".to_string();
        }
    };

    // Construct the decoder for Whisper
    let mut dc = LogitsProcessor::new(
        299792458, /* random seed */
        None,      /* temp */
        None,      /* top_p */
    );
    
    let language_token = match core.tokenizer.token_to_id("<|en|>") {
        Some(token) => token,
        None => {
            error!("ARTERY: English token missing in Whisper tokenizer");
            return "".to_string();
        }
    };
    
    let transcribe_token = match core.tokenizer.token_to_id("<|transcribe|>") {
        Some(token) => token,
        None => {
            error!("ARTERY: Transcribe token missing in Whisper tokenizer");
            return "".to_string();
        }
    };
    
    let sot_token = match core.tokenizer.token_to_id("<|startoftranscript|>") {
        Some(token) => token,
        None => {
            error!("ARTERY: SOT token missing in Whisper tokenizer");
            return "".to_string();
        }
    };
    
    let eot_token = match core.tokenizer.token_to_id("<|endoftext|>") {
        Some(token) => token,
        None => {
            error!("ARTERY: EOT token missing in Whisper tokenizer");
            return "".to_string();
        }
    };
    
    let no_timestamps_token = match core.tokenizer.token_to_id("<|notimestamps|>") {
        Some(token) => token,
        None => {
            error!("ARTERY: No timestamps token missing in Whisper tokenizer");
            return "".to_string();
        }
    };
    
    let mut tokens = vec![sot_token, language_token, transcribe_token, no_timestamps_token];
    
    // We clone the model here to gain mutable access to its cache during inference
    let mut model = core.model.clone();

    // 1. Get audio features from encoder
    let audio_features = match model.encoder.forward(&mel, false) {
        Ok(f) => f,
        Err(e) => {
            error!("ARTERY: Whisper encoder forward failed: {e}");
            return "".to_string();
        }
    };

    for _ in 0..100 {
        let tokens_t = match candle_core::Tensor::new(tokens.as_slice(), &core.device) {
            Ok(t) => t.unsqueeze(0).unwrap_or(t),
            Err(e) => {
                error!("ARTERY: Token tensor creation failed: {e}");
                break;
            }
        };

        // 2. Pass features to decoder
        let logits = match model.decoder.forward(&tokens_t, &audio_features, false) {
            Ok(l) => l,
            Err(e) => {
                error!("ARTERY: Whisper decoder forward failed: {e}");
                break;
            }
        };

        // Get the logits for the last generated token
        let logits = match logits.squeeze(0) {
            Ok(l) => l,
            Err(e) => {
                error!("ARTERY: Logits squeeze failed: {e}");
                break;
            }
        };
        
        let seq_len = logits.dim(0).unwrap_or(0);
        if seq_len == 0 { break; }
        
        let last_logits = match logits.get(seq_len - 1) {
             Ok(l) => l,
             Err(e) => {
                 error!("ARTERY: Logits get failed: {e}");
                 break;
             }
        };

        let next_token = match dc.sample(&last_logits) {
            Ok(t) => t,
            Err(e) => {
                error!("ARTERY: Logits sampling failed: {e}");
                break;
            }
        };

        tokens.push(next_token);
        if next_token == eot_token {
            break;
        }
    }

    let text = match core.tokenizer.decode(&tokens, true) {
        Ok(t) => t.trim().to_string(),
        Err(e) => {
            error!("ARTERY: Decoding failed: {e}");
            "".to_string()
        }
    };
    
    text
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

    let director_addr = env::var("DIRECTOR_VSB_ADDR")
        .unwrap_or_else(|_| "100.101.177.76:9090".to_string());

    let udp_socket = Arc::new(tokio::net::UdpSocket::bind("0.0.0.0:0").await.expect("Failed to bind ephemeral UDP socket"));

    if !vocal_soul.exists() {
        warn!(
            "ARTERY: {} does not exist — GGUF paths will fail until Node C storage is mounted",
            vocal_soul.display()
        );
    }

    let whisper_core = match WhisperCore::new(&vocal_soul) {
        Ok(core) => {
            info!("◈ VOCAL_SOUL: Whisper Core initialized.");
            Some(Arc::new(core))
        },
        Err(e) => {
            warn!("◈ VOCAL_SOUL: Whisper Core failed to initialize: {e}");
            None
        }
    };

    let initial_state = ArteryState {
        current_quant: Quantization::Q5,
        child: None,
        vocal_soul,
        llama_server_bin,
        n_gpu_layers,
        whisper_core,
        latest_frame_hash: None,
        udp_socket,
        director_addr,
    };

    let shared = Arc::new(Mutex::new(initial_state));

    // ◈ AUTO_IGNITION: Ensure llama-server is online on port 7339
    {
        let mut s = shared.lock().await;
        let q = s.current_quant;
        let _ = s.start_server(q).await;
    }

    let app = Router::new()
        .route("/health", get(handle_health))
        .route("/status", get(handle_status))
        .route("/shift", post(handle_shift))
        .route("/stop", post(handle_stop))
        .route("/start", post(handle_start))
        .route("/sync/chat", post(handle_chat_sync))
        .route("/system/theme", post(handle_theme_sync))
        .route("/observer/hash", post(handle_hash_update))
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
