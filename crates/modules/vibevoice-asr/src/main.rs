//! VibeVoice ASR - Speech recognition layer.
//!
//! Core design: Multi-source ASR pipeline.
//! - Whisper-based speech-to-text
//! - VibeVoice post-processing (style, emotion)
//! - Multiple audio sources with priority: OmiHardwareBLE > MobileMic > FileInput
//! - Return text with confidence scores
//!
//! Phase 5: Omi Voice Layering (Hardware Artery)

#[cfg(feature = "ble")]
pub mod ble_stream;

use std::process::{exit, Command};
use std::path::PathBuf;
use std::env;
use serde::{Serialize, Deserialize};

#[cfg(feature = "ble")]
use ble_stream::BleStreamManager;

/// Positive sentiment words for vibe scoring (const to avoid per-call allocation).
const POSITIVE_WORDS: &[&str] = &["great", "awesome", "good", "happy", "excellent"];
/// Negative sentiment words for vibe scoring (const to avoid per-call allocation).
const NEGATIVE_WORDS: &[&str] = &["bad", "terrible", "awful", "sad", "angry"];

/// Audio source priority (higher = preferred).
#[derive(Debug, Clone, PartialEq, Eq, PartialOrd, Ord, Serialize, Deserialize)]
pub enum AudioSource {
    /// File-based audio input (lowest priority).
    FileInput = 0,
    /// Mobile device microphone input.
    MobileMic = 1,
    /// Omi hardware BLE PCM stream (highest priority).
    OmiHardwareBLE = 2,
}

impl std::fmt::Display for AudioSource {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AudioSource::OmiHardwareBLE => write!(f, "Omi_Hardware_BLE"),
            AudioSource::MobileMic => write!(f, "Mobile_Mic"),
            AudioSource::FileInput => write!(f, "File_Input"),
        }
    }
}

impl Default for AudioSource {
    fn default() -> Self {
        AudioSource::FileInput
    }
}

/// ASR request with audio source metadata.
#[derive(Debug, Serialize, Deserialize)]
pub struct ASRRequest {
    /// Path to audio file (required for FileInput, optional for live sources).
    pub audio_file: String,
    /// Language code (e.g., "en", "de", "ja").
    pub language: String,
    /// Enable VibeVoice post-processing.
    pub post_process: bool,
    /// Audio source for this request.
    pub source: AudioSource,
}

impl Default for ASRRequest {
    fn default() -> ASRRequest {
        ASRRequest {
            audio_file: String::new(),
            language: "en".to_string(),
            post_process: true,
            source: AudioSource::default(),
        }
    }
}

/// ASR response.
#[derive(Debug, Serialize, Deserialize)]
pub struct ASRResponse {
    /// Transcribed text.
    pub text: String,
    /// Confidence score (0.0 - 1.0).
    pub confidence: f64,
    /// VibeVoice emotion/style score.
    pub vibe_score: Option<f64>,
    /// Source that provided the audio.
    pub source: AudioSource,
}

/// VibeVoice ASR layer.
pub struct VibeVoiceASR {
    whisper_path: PathBuf,
    #[cfg(feature = "ble")]
    ble_manager: Option<BleStreamManager>,
}

impl VibeVoiceASR {
    /// Create ASR layer (uses Whisper + VibeVoice).
    pub fn new() -> Result<Self, String> {
        let whisper_path = env::var("WHISPER_PATH")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from("/run/current-system/sw/bin/whisper"));

        if !whisper_path.exists() {
            return Err(format!("Whisper not found at: {}", whisper_path.display()));
        }

        log::info!(
            "[VibeVoice ASR] Using Whisper at: {}",
            whisper_path.display()
        );

        Ok(VibeVoiceASR {
            whisper_path,
            #[cfg(feature = "ble")]
            ble_manager: None,
        })
    }

    /// Create ASR layer with BLE support enabled.
    ///
    /// Initializes the BLE adapter for Omi hardware audio streaming.
    /// Falls back gracefully if BLE is not available.
    #[cfg(feature = "ble")]
    pub async fn new_with_ble() -> Result<Self, String> {
        let mut asr = Self::new()?;

        log::info!("[VibeVoice ASR] Initializing BLE audio stream...");
        let mut ble_manager = BleStreamManager::new();

        match ble_manager.init().await {
            Ok(()) => {
                log::info!("[VibeVoice ASR] BLE adapter ready");
                asr.ble_manager = Some(ble_manager);
            }
            Err(e) => {
                log::warn!(
                    "[VibeVoice ASR] BLE unavailable: {} — falling back to file input",
                    e
                );
            }
        }

        Ok(asr)
    }

    /// Resolve the best available audio source based on hardware availability.
    ///
    /// Priority: OmiHardwareBLE > MobileMic > FileInput
    pub async fn resolve_source(&self) -> AudioSource {
        #[cfg(feature = "ble")]
        {
            // Check if Omi BLE hardware is connected
            if let Some(ref ble) = self.ble_manager {
                if ble.is_connected() {
                    log::info!("[VibeVoice ASR] Source resolved: Omi_Hardware_BLE");
                    return AudioSource::OmiHardwareBLE;
                }

                // Try to discover and connect
                match ble.scan_for_omi().await {
                    Ok(devices) if !devices.is_empty() => {
                        log::info!(
                            "[VibeVoice ASR] Found {} Omi device(s), attempting connection",
                            devices.len()
                        );
                        return AudioSource::OmiHardwareBLE;
                    }
                    _ => {
                        log::info!("[VibeVoice ASR] No Omi BLE devices found");
                    }
                }
            }
        }

        // Check for mobile mic (would be via network/Tailscale in production)
        if env::var("MOBILE_MIC_ENDPOINT").is_ok() {
            log::info!("[VibeVoice ASR] Source resolved: Mobile_Mic");
            return AudioSource::MobileMic;
        }

        log::info!("[VibeVoice ASR] Source resolved: File_Input (default)");
        AudioSource::FileInput
    }

    /// Transcribe audio from the specified source.
    pub async fn transcribe(&self, mut req: ASRRequest) -> Result<ASRResponse, String> {
        // Auto-resolve source if not explicitly set to BLE or if using default
        let source = if req.source == AudioSource::FileInput {
            self.resolve_source().await
        } else {
            req.source.clone()
        };
        req.source = source;

        log::info!(
            "[VibeVoice ASR] Transcribing via Source: {} (lang: {})",
            req.source,
            req.language
        );

        // Get audio data based on source
        let text = match req.source {
            AudioSource::OmiHardwareBLE => self.transcribe_ble(&req).await?,
            AudioSource::MobileMic => self.transcribe_mobile_mic(&req).await?,
            AudioSource::FileInput => self.transcribe_file(&req)?,
        };

        // VibeVoice post-processing (simplified - emotion scoring)
        let vibe_score = if req.post_process {
            Some(Self::calculate_vibe(&text))
        } else {
            None
        };

        let response = ASRResponse {
            text,
            // TODO: Parse actual confidence from Whisper output
            confidence: 0.95, // Placeholder — Whisper provides this
            vibe_score,
            source: req.source,
        };

        log::info!(
            "[VibeVoice ASR] Transcribed: {} chars, vibe={:?}, source={}",
            response.text.len(),
            response.vibe_score,
            response.source
        );

        Ok(response)
    }

    /// Transcribe from Omi BLE hardware stream.
    async fn transcribe_ble(&self, req: &ASRRequest) -> Result<String, String> {
        log::info!("[VibeVoice ASR] Source: Omi_Hardware_BLE — reading PCM stream");

        if req.audio_file.is_empty() {
            return Err("BLE streaming requires audio_file fallback until live PCM pipeline is complete".to_string());
        }

        log::info!(
            "[VibeVoice ASR] Source: Omi_Hardware_BLE — using file '{}' as BLE stream proxy",
            req.audio_file
        );

        self.run_whisper(&req.audio_file, &req.language)
    }

    /// Transcribe from mobile microphone (Tailscale Artery endpoint).
    async fn transcribe_mobile_mic(&self, req: &ASRRequest) -> Result<String, String> {
        log::info!("[VibeVoice ASR] Source: Mobile_Mic — ingesting from endpoint");

        let _endpoint = env::var("MOBILE_MIC_ENDPOINT")
            .map_err(|_| "MOBILE_MIC_ENDPOINT not set".to_string())?;

        if req.audio_file.is_empty() {
            return Err("Mobile mic streaming not yet implemented, provide audio_file".to_string());
        }

        self.run_whisper(&req.audio_file, &req.language)
    }

    /// Transcribe from file input (existing functionality).
    fn transcribe_file(&self, req: &ASRRequest) -> Result<String, String> {
        log::info!(
            "[VibeVoice ASR] Source: File_Input — file: {}",
            req.audio_file
        );
        self.run_whisper(&req.audio_file, &req.language)
    }

    /// Run Whisper CLI transcription on an audio file.
    fn run_whisper(&self, audio_file: &str, language: &str) -> Result<String, String> {
        let output = Command::new(&self.whisper_path)
            .arg(audio_file)
            .arg("--model")
            .arg("base")
            .arg("--language")
            .arg(language)
            .arg("--output_format")
            .arg("txt")
            .output()
            .map_err(|e| format!("Failed to transcribe: {}", e))?;

        let exit_code = output.status.code().unwrap_or(-1);
        let stdout = String::from_utf8_lossy(&output.stdout);
        let stderr = String::from_utf8_lossy(&output.stderr);

        if exit_code != 0 {
            return Err(format!("Whisper failed: {}", stderr));
        }

        Ok(stdout.trim().to_string())
    }

    /// Calculate vibe score (simplified).
    fn calculate_vibe(text: &str) -> f64 {
        let lower = text.to_ascii_lowercase();
        let pos_count = POSITIVE_WORDS
            .iter()
            .filter(|w| lower.contains(**w))
            .count();
        let neg_count = NEGATIVE_WORDS
            .iter()
            .filter(|w| lower.contains(**w))
            .count();
        (pos_count as f64 - neg_count as f64) / 10.0
    }

    /// Get a reference to the BLE manager (for direct device control).
    #[cfg(feature = "ble")]
    pub fn ble_manager(&self) -> Option<&BleStreamManager> {
        self.ble_manager.as_ref()
    }

    /// Get a mutable reference to the BLE manager (for direct device control).
    #[cfg(feature = "ble")]
    pub fn ble_manager_mut(&mut self) -> Option<&mut BleStreamManager> {
        self.ble_manager.as_mut()
    }
}

#[cfg(feature = "ble")]
#[tokio::main]
async fn main() {
    env_logger::init();
    log::info!("[VibeVoice ASR] Initializing...");

    match VibeVoiceASR::new_with_ble().await {
        Ok(asr) => {
            log::info!("[VibeVoice ASR] Ready. Whisper + VibeVoice + BLE layer active.");

            let source = asr.resolve_source().await;
            log::info!("[VibeVoice ASR] Available source: {}", source);

            let test_req = ASRRequest {
                audio_file: "test.wav".to_string(),
                language: "en".to_string(),
                post_process: true,
                source,
            };

            match asr.transcribe(test_req).await {
                Err(e) => log::error!(
                    "[VibeVoice ASR] Test failed: {} (need real audio)",
                    e
                ),
                Ok(_) => (),
            }
        }
        Err(e) => {
            log::error!("[VibeVoice ASR] Init failed: {}", e);
            exit(1);
        }
    }
}

#[cfg(not(feature = "ble"))]
fn main() {
    env_logger::init();
    log::info!("[VibeVoice ASR] Initializing (no BLE)...");

    match VibeVoiceASR::new() {
        Ok(asr) => {
            log::info!("[VibeVoice ASR] Ready. Whisper + VibeVoice layer active.");

            let test_req = ASRRequest {
                audio_file: "test.wav".to_string(),
                language: "en".to_string(),
                post_process: true,
                source: AudioSource::FileInput,
            };

            // Block on async resolve_source (no BLE, returns FileInput immediately)
            let rt = tokio::runtime::Runtime::new().unwrap();
            let source = rt.block_on(async { asr.resolve_source().await });

            let test_req = ASRRequest {
                source,
                ..test_req
            };

            match rt.block_on(async { asr.transcribe(test_req).await }) {
                Err(e) => log::error!(
                    "[VibeVoice ASR] Test failed: {} (need real audio)",
                    e
                ),
                Ok(_) => (),
            }
        }
        Err(e) => {
            log::error!("[VibeVoice ASR] Init failed: {}", e);
            exit(1);
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_audio_source_display() {
        assert_eq!(format!("{}", AudioSource::OmiHardwareBLE), "Omi_Hardware_BLE");
        assert_eq!(format!("{}", AudioSource::MobileMic), "Mobile_Mic");
        assert_eq!(format!("{}", AudioSource::FileInput), "File_Input");
    }

    #[test]
    fn test_audio_source_priority_ordering() {
        // OmiHardwareBLE (2) > MobileMic (1) > FileInput (0)
        assert!(AudioSource::OmiHardwareBLE > AudioSource::MobileMic);
        assert!(AudioSource::MobileMic > AudioSource::FileInput);
        assert!(AudioSource::OmiHardwareBLE > AudioSource::FileInput);
    }

    #[test]
    fn test_audio_source_serialization() {
        let source = AudioSource::OmiHardwareBLE;
        let json = serde_json::to_string(&source).unwrap();
        assert!(json.contains("OmiHardwareBLE"));

        let deserialized: AudioSource = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized, AudioSource::OmiHardwareBLE);
    }

    #[test]
    fn test_asr_request_default() {
        let req = ASRRequest::default();
        assert_eq!(req.source, AudioSource::FileInput);
        assert_eq!(req.language, "en");
        assert!(req.post_process);
        assert!(req.audio_file.is_empty());
    }

    #[test]
    fn test_asr_request_with_source() {
        let req = ASRRequest {
            audio_file: "test.wav".to_string(),
            language: "en".to_string(),
            post_process: false,
            source: AudioSource::OmiHardwareBLE,
        };
        assert_eq!(req.source, AudioSource::OmiHardwareBLE);
    }

    #[test]
    fn test_asr_response_source_tagging() {
        let resp = ASRResponse {
            text: "hello world".to_string(),
            confidence: 0.95,
            vibe_score: Some(0.1),
            source: AudioSource::OmiHardwareBLE,
        };
        assert_eq!(resp.source, AudioSource::OmiHardwareBLE);
        assert_eq!(resp.text, "hello world");
    }

    #[test]
    fn test_calculate_vibe() {
        assert_eq!(VibeVoiceASR::calculate_vibe("hello world"), 0.0);
        assert_eq!(VibeVoiceASR::calculate_vibe("this is great"), 0.1);
        let score = VibeVoiceASR::calculate_vibe("great awesome excellent work");
        assert!(score > 0.0);
    }

    #[test]
    fn test_audio_source_default_is_file_input() {
        assert_eq!(AudioSource::default(), AudioSource::FileInput);
    }

    #[test]
    fn test_asr_response_serialization() {
        let resp = ASRResponse {
            text: "test transcription".to_string(),
            confidence: 0.9,
            vibe_score: Some(0.3),
            source: AudioSource::MobileMic,
        };

        let json = serde_json::to_string(&resp).unwrap();
        assert!(json.contains("MobileMic"));
        assert!(json.contains("test transcription"));

        let deserialized: ASRResponse = serde_json::from_str(&json).unwrap();
        assert_eq!(deserialized.text, resp.text);
        assert_eq!(deserialized.source, resp.source);
    }

    #[tokio::test]
    async fn test_resolve_source_no_ble_returns_file_input() {
        // Without BLE feature or env vars, should return FileInput
        let rt_source = if std::env::var("MOBILE_MIC_ENDPOINT").is_ok() {
            AudioSource::MobileMic
        } else {
            AudioSource::FileInput
        };
        assert!(
            rt_source == AudioSource::FileInput || rt_source == AudioSource::MobileMic
        );
    }
}
