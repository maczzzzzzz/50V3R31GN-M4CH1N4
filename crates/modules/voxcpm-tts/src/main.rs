//! VoxCPM2 TTS - Speech synthesis layer.
//!
//! Core design: Simple TTS pipeline.
//! - Text-to-speech via VoxCPM2
//! - Style transfer (tone, pace, emotion)
//! - Return audio file with metadata
use std::process::{Command, exit};
use std::path::PathBuf;
use std::env;
use serde::{Serialize, Deserialize};


/// TTS request
#[derive(Debug, Serialize, Deserialize)]
struct TTSRequest {
    text: String,
    voice_id: String,
    style: String,  // fast, slow, emotional, etc.
}

/// TTS response
#[derive(Debug, Serialize, Deserialize)]
struct TTSResponse {
    audio_file: String,
    duration_ms: u32,
}

/// VoxCPM2 TTS layer
pub struct VoxCPM2 {
    vox_path: PathBuf,
}

impl VoxCPM2 {
    /// Create TTS layer (uses VoxCPM2)
    pub fn new() -> Result<Self, String> {
        let vox_path = env::var("VOXCPM_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/run/current-system/sw/bin/voxcpm"));

        if !vox_path.exists() {
            return Err(format!("VoxCPM2 not found at: {}", vox_path.display()));
        }

        log::info!("[VoxCPM2 TTS] Using VoxCPM2 at: {}", vox_path.display());

        Ok(VoxCPM2 { vox_path })
    }

    /// Synthesize speech
    pub fn synthesize(&self, req: TTSRequest) -> Result<TTSResponse, String> {
        log::info!("[VoxCPM2 TTS] Synthesizing: {} chars (voice: {}, style: {})",
                         req.text.len(), req.voice_id, req.style);

        // Output file
        let output_file = format!("/tmp/voxcpm_{}.wav", uuid::Uuid::new_v4());

        // VoxCPM2 synthesis (simplified - command line)
        let output = Command::new(&self.vox_path)
            .arg("--text")
            .arg(&req.text)
            .arg("--voice")
            .arg(&req.voice_id)
            .arg("--style")
            .arg(&req.style)
            .arg("--output")
            .arg(&output_file)
            .output()
            .map_err(|e| format!("Failed to synthesize: {}", e))?;

        let exit_code = output.status.code().unwrap_or(-1);

        if exit_code != 0 {
            return Err(format!("VoxCPM2 failed: {}", String::from_utf8_lossy(&output.stderr)));
        }

        // TODO: Read actual audio duration via ffprobe or symphonia library
        let duration_ms = 0;

        let response = TTSResponse {
            audio_file: output_file,
            duration_ms,
        };

        log::info!("[VoxCPM2 TTS] Synthesized: {}ms", response.duration_ms);

        Ok(response)
    }
}

fn main() {
    env_logger::init();
    log::info!("[VoxCPM2 TTS] Initializing...");

    match VoxCPM2::new() {
        Ok(tts) => {
            // Test synthesis
            let test_req = TTSRequest {
                text: "Hello from VoxCPM2!".to_string(),
                voice_id: "default".to_string(),
                style: "fast".to_string(),
            };

            match tts.synthesize(test_req) {
                Ok(response) => {
                    log::info!("[VoxCPM2 TTS] Response: file={}, duration={}ms",
                                     response.audio_file, response.duration_ms);
                }
                Err(e) => {
                    log::error!("[VoxCPM2 TTS] Test failed: {}", e);
                    exit(1);
                }
            }

            log::info!("[VoxCPM2 TTS] Ready. Speech synthesis layer active.");
        }
        Err(e) => {
            log::error!("[VoxCPM2 TTS] Init failed: {}", e);
            exit(1);
        }
    }
}
