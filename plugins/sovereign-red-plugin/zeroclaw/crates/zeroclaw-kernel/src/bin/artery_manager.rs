//! Phase 67 — Artery Manager (Node C Daemon)
//!
//! Axum HTTP daemon running on port 7340 (Node C host).
//! Manages dynamic VRAM gating by restarting `llama-server` with the correct
//! GGUF quantization variant: Q5 (Authority), Q4 (Comm), Q3 (Berserker).

use std::{
    env,
    path::{PathBuf},
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
    signal::unix::{signal, SignalKind},
};
use sovereign_core::kv_bridge::{KvMesh, ProfileState};
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
    whisper_core: Option<Arc<WhisperCore>>,
    latest_frame_hash: Option<String>,
    udp_socket: Arc<tokio::net::UdpSocket>,
    director_addr: String,
    kv_mesh: Arc<KvMesh>,
}

impl ArteryState {
    async fn reload_profile(&mut self) -> anyhow::Result<()> {
        info!("ARTERY: Pulling latest profile from Mooncake...");
        let profile = self.kv_mesh.pull_profile().await?;
        info!("ARTERY: Profile pulled: {}", profile.name);

        let target_quant = match profile.name.as_str() {
            "researcher" => Quantization::Q5,
            "daily-use" => Quantization::Q4,
            _ => Quantization::Q3,
        };

        if self.current_quant != target_quant {
            info!("ARTERY: Atomic switch required: {} -> {}", self.current_quant, target_quant);
            self.start_server(target_quant).await?;
        } else {
            info!("ARTERY: Profile matches current state. No switch needed.");
        }

        Ok(())
    }

    fn gguf_path(&self, q: Quantization) -> PathBuf {
        self.vocal_soul.join("gemma-4-e2b").join(q.gguf_filename())
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

        let quant_arg = match q {
            Quantization::Q5 => "q5",
            Quantization::Q4 => "q4",
            Quantization::Q3 => "q3",
        };

        info!("ARTERY: Igniting Oracle via bash script wrapper (mode={})", quant_arg);

        let child = Command::new("bash")
            .arg("/home/maczz/50V3R31GN-M4CH1N4/scripts/ops/node-c-ignition.sh")
            .arg(quant_arg)
            .stdout(std::process::Stdio::null())
            .stderr(std::process::Stdio::null())
            .spawn()?;

        self.child = Some(child);
        self.current_quant = q;

        sleep(Duration::from_millis(STARTUP_GRACE_MS)).await;
        info!("ARTERY: llama-server online on port {}", LLAMA_SERVER_PORT);

        Ok(())
    }
    
    async fn broadcast_vocal_intent(&self, transcript: &str) {
        use zeroclaw::vsb_protocol::{IntentPacket, IntentType, as_bytes};
        
        let mut payload = [0u8; 256];
        let bytes = transcript.as_bytes();
        let len = std::cmp::min(bytes.len(), 255);
        payload[..len].copy_from_slice(&bytes[..len]);
        
        let pkt = IntentPacket::new(
            IntentType::VocalIntent,
            0,
            [0u8; 16],
            [0u8; 16],
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
            info!("ARTERY: Chat sync complete. {} records shored.", count);
            (StatusCode::OK, Json(serde_json::json!({ "status": "ok", "synced": count })))
        }
        Err(e) => {
            error!("ARTERY: DB sync failed: {}", e);
            let err_msg = e.to_string();
            (StatusCode::INTERNAL_SERVER_ERROR, Json(serde_json::json!({ "status": "error", "error": err_msg })))
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
            error!("ARTERY: Shift failed: {}", e);
            let err_msg = e.to_string();
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "status": "error", "error": err_msg })),
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
            error!("ARTERY: Start failed: {}", e);
            let err_msg = e.to_string();
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(serde_json::json!({ "status": "error", "error": err_msg })),
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

async fn handle_ws(State(state): State<SharedState>, ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(|socket| handle_socket(socket, state))
}

async fn handle_socket(mut socket: WebSocket, state: SharedState) {
    info!("◈ OMI Wearable connected");
    
    let mut audio_buffer = Vec::new();
    let mut is_speaking = false;
    let mut silence_chunks = 0;
    const VAD_THRESHOLD: f32 = 0.010;
    const MAX_SILENCE_CHUNKS: usize = 12;

    while let Some(Ok(msg)) = socket.recv().await {
        if let Message::Binary(bytes) = msg {
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
                audio_buffer.extend_from_slice(&bytes);
                
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
    let whisper_core = {
        let s = state.lock().await;
        s.whisper_core.clone()
    };

    let transcript = transcribe_audio(&audio_buffer, whisper_core).await;
    
    if !transcript.is_empty() {
        let response = Message::Text(serde_json::json!({
            "type": "TRANSCRIPTION",
            "text": transcript
        }).to_string());
        
        let _ = socket.send(response).await;

        {
            let s = state.lock().await;
            s.broadcast_vocal_intent(&transcript).await;
        }

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

    let mut pcm_data = Vec::with_capacity(bytes.len() / 2);
    let mut chunks = bytes.chunks_exact(2);
    while let Some(chunk) = chunks.next() {
        let sample = i16::from_le_bytes([chunk[0], chunk[1]]);
        pcm_data.push(sample as f32 / 32768.0);
    }

    let mel = audio::pcm_to_mel(&core.model.config, &pcm_data, &core.mel_filters);
    let mel_len = mel.len();
    let num_mel_bins = core.model.config.num_mel_bins;
    let mel = match Tensor::from_vec(
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

    let mut dc = LogitsProcessor::new(299792458, None, None);
    
    let language_token = core.tokenizer.token_to_id("<|en|>").unwrap_or(0);
    let transcribe_token = core.tokenizer.token_to_id("<|transcribe|>").unwrap_or(0);
    let sot_token = core.tokenizer.token_to_id("<|startoftranscript|>").unwrap_or(0);
    let eot_token = core.tokenizer.token_to_id("<|endoftext|>").unwrap_or(0);
    let no_timestamps_token = core.tokenizer.token_to_id("<|notimestamps|>").unwrap_or(0);
    
    let mut tokens = vec![sot_token, language_token, transcribe_token, no_timestamps_token];
    let mut model = core.model.clone();

    let audio_features = match model.encoder.forward(&mel, false) {
        Ok(f) => f,
        Err(e) => {
            error!("ARTERY: Whisper encoder forward failed: {e}");
            return "".to_string();
        }
    };

    for _ in 0..100 {
        let tokens_t = match Tensor::new(tokens.as_slice(), &core.device) {
            Ok(t) => t.unsqueeze(0).unwrap_or(t),
            Err(_) => break,
        };

        let logits = match model.decoder.forward(&tokens_t, &audio_features, false) {
            Ok(l) => l,
            Err(_) => break,
        };

        let logits = match logits.squeeze(0) {
            Ok(l) => l,
            Err(_) => break,
        };
        
        let seq_len = logits.dim(0).unwrap_or(0);
        if seq_len == 0 { break; }
        
        let last_logits = match logits.get(seq_len - 1) {
             Ok(l) => l,
             Err(_) => break,
        };

        let next_token = match dc.sample(&last_logits) {
            Ok(t) => t,
            Err(_) => break,
        };

        tokens.push(next_token);
        if next_token == eot_token {
            break;
        }
    }

    core.tokenizer.decode(&tokens, true).unwrap_or_default().trim().to_string()
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_target(false).with_level(true).init();
    info!("◈ ARTERY_MANAGER: Phase 67 // 50V3R31GN-M4CH1N4");

    let vocal_soul = PathBuf::from(env::var("VOCAL_SOUL_PATH").unwrap_or_else(|_| VOCAL_SOUL.to_string()));
    let bind_port: u16 = env::var("ARTERY_PORT").ok().and_then(|v| v.parse().ok()).unwrap_or(DEFAULT_PORT);
    let director_addr = env::var("DIRECTOR_VSB_ADDR").unwrap_or_else(|_| "100.101.177.76:9090".to_string());
    let udp_socket = Arc::new(tokio::net::UdpSocket::bind("0.0.0.0:0").await.expect("Failed to bind ephemeral UDP socket"));

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

    let kv_master = env::var("MOONCAKE_MASTER").unwrap_or_else(|_| "100.102.95.43:6789".to_string());
    let kv_mesh = Arc::new(KvMesh::new(&kv_master));

    let initial_state = ArteryState {
        current_quant: Quantization::Q5,
        child: None,
        vocal_soul,
        whisper_core,
        latest_frame_hash: None,
        udp_socket,
        director_addr,
        kv_mesh: kv_mesh.clone(),
    };

    let shared = Arc::new(Mutex::new(initial_state));

    // Spawn SIGUSR1 reload listener
    let shared_reload = shared.clone();
    tokio::spawn(async move {
        let mut stream = match signal(SignalKind::user_defined1()) {
            Ok(s) => s,
            Err(e) => {
                error!("ARTERY: Failed to bind SIGUSR1 listener: {}", e);
                return;
            }
        };

        info!("ARTERY: SIGUSR1 listener active (Atomic Profile Reload)");

        loop {
            stream.recv().await;
            info!("::/5Y573M-N071C3 : SIGUSR1_RECOGNIZED. ATOMIC_RELOAD_START.");
            let mut s = shared_reload.lock().await;
            if let Err(e) = s.reload_profile().await {
                error!("ARTERY: Atomic reload failed: {}", e);
            }
        }
    });

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
    let listener = tokio::net::TcpListener::bind(&bind_addr).await.expect("Failed to bind Artery Manager port");
    axum::serve(listener, app).await.expect("Artery Manager server error");
}
