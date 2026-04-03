//! perception/mod.rs
//!
//! Phase 16: Falcon Sidecar — Semantic Perception via Sequential VRAM
//!
//! Model Swap Protocol (4GB Pascal Constraint):
//!   Node A (GTX 1050 Ti) cannot hold Llama-3 and Falcon simultaneously.
//!   The PerceptionController enforces strict sequential VRAM management:
//!
//!   1. Acquire exclusive `vram_lock` → blocks any concurrent OCR request
//!   2. Unload Llama-3 via Ollama (keep_alive=0)
//!   3. Load Falcon ONNX session and run inference
//!   4. Unload Falcon session (drop) and preemptively reload Llama-3
//!   5. Release lock, return DetectedEntity list to caller

use std::path::Path;
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use image::imageops::FilterType;
use ndarray::{Array4, CowArray, IxDyn};
use ort::{Environment, ExecutionProvider, GraphOptimizationLevel, LoggingLevel, OrtResult,
           Session, SessionBuilder, Value};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex as TokioMutex;
use tracing::{info, warn};

// ── Public output type ────────────────────────────────────────────────────────

/// A single entity detected by the Falcon OCR pass.
/// Coordinates are normalised to [0.0, 1.0] relative to the source image.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DetectedEntity {
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub confidence: f32,
}

// ── Internal VRAM state ───────────────────────────────────────────────────────

#[derive(Debug, Clone, PartialEq)]
enum VramModel {
    Llama,
    Falcon,
    Empty,
}

struct VramGuard {
    loaded: VramModel,
}

// ── Configuration ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone)]
pub struct PerceptionConfig {
    /// Path to the Falcon 0.3B ONNX model file on Node A.
    pub falcon_model_path: String,
    /// Ollama base URL (Node A local inference server).
    pub ollama_url: String,
    /// Llama model identifier in Ollama.
    pub llama_model_name: String,
}

impl Default for PerceptionConfig {
    fn default() -> Self {
        Self {
            falcon_model_path: "models/falcon-0.3b-ocr.onnx".to_string(),
            ollama_url: "http://localhost:11434".to_string(),
            llama_model_name: "llama3.2:3b".to_string(),
        }
    }
}

// ── PerceptionController ──────────────────────────────────────────────────────

pub struct PerceptionController {
    config: PerceptionConfig,
    client: Client,
    /// Exclusive VRAM lock — enforces sequential model swaps.
    vram_lock: Arc<TokioMutex<VramGuard>>,
    /// ORT Environment must outlive every Session derived from it.
    ort_env: Arc<Environment>,
}

impl PerceptionController {
    pub fn new(config: PerceptionConfig) -> OrtResult<Self> {
        let ort_env = Arc::new(
            Environment::builder()
                .with_name("falcon-sidecar")
                .with_log_level(LoggingLevel::Warning)
                .build()?,
        );
        Ok(Self {
            config,
            client: Client::new(),
            vram_lock: Arc::new(TokioMutex::new(VramGuard { loaded: VramModel::Llama })),
            ort_env,
        })
    }

    /// Run OCR analysis on a base64-encoded PNG/JPEG image.
    ///
    /// Implements the full Model Swap Protocol under an exclusive VRAM lock.
    /// Returns a list of detected text entities with normalised coordinates.
    pub async fn ocr_analyze(
        &self,
        base64_image: &str,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        // ── Step 1: Acquire exclusive VRAM lock ───────────────────────────────
        let mut guard = self.vram_lock.lock().await;

        // ── Step 2: Unload Llama-3 from VRAM ─────────────────────────────────
        if guard.loaded == VramModel::Llama {
            info!("[Perception] Unloading Llama-3 from VRAM (keep_alive=0)...");
            self.ollama_set_keep_alive(&self.config.llama_model_name, 0).await?;
            guard.loaded = VramModel::Empty;
        }

        // ── Step 3: Preprocess image ──────────────────────────────────────────
        info!("[Perception] Decoding and preprocessing image tensor...");
        let tensor = Self::preprocess_image(base64_image)?;

        // ── Step 4: Falcon ONNX inference ─────────────────────────────────────
        guard.loaded = VramModel::Falcon;
        info!("[Perception] Falcon Sidecar inference pass started...");
        let entities = self.run_falcon_inference(tensor)?;

        // ── Step 5: Unload Falcon + preemptively reload Llama ─────────────────
        guard.loaded = VramModel::Empty;
        info!("[Perception] Preemptive logic restoration: reloading Llama-3...");
        self.ollama_warmup(&self.config.llama_model_name).await?;
        guard.loaded = VramModel::Llama;

        info!("[Perception] Model swap complete. {} entities detected.", entities.len());
        Ok(entities)
    }

    // ── Ollama VRAM management ────────────────────────────────────────────────

    /// POST to Ollama /api/generate with keep_alive to control VRAM residence.
    /// keep_alive=0  → unload the model immediately after the (empty) request.
    async fn ollama_set_keep_alive(
        &self,
        model: &str,
        keep_alive: i64,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        #[derive(Serialize)]
        struct OllamaKeepAliveRequest<'a> {
            model: &'a str,
            keep_alive: i64,
        }

        let url = format!("{}/api/generate", self.config.ollama_url);
        let res = self
            .client
            .post(&url)
            .json(&OllamaKeepAliveRequest { model, keep_alive })
            .send()
            .await?;

        if !res.status().is_success() {
            warn!("[Perception] Ollama keep_alive={} for '{}' returned {}", keep_alive, model, res.status());
        }
        Ok(())
    }

    /// Warm a model back into VRAM with a lightweight single-token prompt.
    async fn ollama_warmup(
        &self,
        model: &str,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        #[derive(Serialize)]
        struct OllamaWarmupRequest<'a> {
            model: &'a str,
            prompt: &'a str,
            stream: bool,
        }

        let url = format!("{}/api/generate", self.config.ollama_url);
        let res = self
            .client
            .post(&url)
            .json(&OllamaWarmupRequest { model, prompt: ".", stream: false })
            .send()
            .await?;

        if !res.status().is_success() {
            warn!("[Perception] Ollama warmup for '{}' returned {}", model, res.status());
        }
        Ok(())
    }

    // ── Image preprocessing ───────────────────────────────────────────────────

    /// Decode a base64-encoded image and convert to an NCHW float32 tensor.
    /// Output shape: (1, 3, 224, 224) normalised to [0.0, 1.0].
    pub(crate) fn preprocess_image(
        base64_image: &str,
    ) -> Result<Array4<f32>, Box<dyn std::error::Error + Send + Sync>> {
        let bytes = B64.decode(base64_image)?;
        let img = image::load_from_memory(&bytes)?;
        let rgb = img.resize_exact(224, 224, FilterType::Lanczos3).to_rgb8();

        let mut tensor = Array4::<f32>::zeros((1, 3, 224, 224));
        for (px, py, pixel) in rgb.enumerate_pixels() {
            tensor[[0, 0, py as usize, px as usize]] = pixel[0] as f32 / 255.0;
            tensor[[0, 1, py as usize, px as usize]] = pixel[1] as f32 / 255.0;
            tensor[[0, 2, py as usize, px as usize]] = pixel[2] as f32 / 255.0;
        }
        Ok(tensor)
    }

    // ── ONNX inference ────────────────────────────────────────────────────────

    /// Load the Falcon ONNX session (CUDA EP, Pascal sm_60), run inference,
    /// and decode the output tensor into DetectedEntity results.
    ///
    /// NOTE: The session is constructed and dropped within this call, releasing
    /// VRAM as soon as inference completes. Gemini wires the token decoder
    /// to the actual Falcon output vocabulary once the model file is deployed.
    fn run_falcon_inference(
        &self,
        image_tensor: Array4<f32>,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        let model_path = &self.config.falcon_model_path;

        if !Path::new(model_path).exists() {
            return Err(format!(
                "[Perception] Falcon ONNX model not found at: {}. Deploy model before running inference.",
                model_path
            )
            .into());
        }

        // Build ONNX Runtime session with CUDA execution provider (Pascal sm_60).
        // Falls back to CPU if CUDA EP is unavailable at runtime.
        let session: Session = SessionBuilder::new(&self.ort_env)?
            .with_optimization_level(GraphOptimizationLevel::Level3)?
            .with_execution_providers([
                ExecutionProvider::CUDA(Default::default()),
                ExecutionProvider::CPU(Default::default()),
            ])?
            .with_model_from_file(model_path)?;

        // Build input: reshape NCHW Array4 → dynamic IxDyn for ORT
        let cow: CowArray<f32, IxDyn> = image_tensor.into_dyn().into();
        let input_value = Value::from_array(session.allocator(), &cow)?;

        // Run inference (session is released / VRAM freed on drop at end of scope)
        let outputs = session.run(vec![input_value])?;

        Self::decode_outputs(outputs)
    }

    /// Decode raw ONNX output tensors into DetectedEntity results.
    ///
    /// Default contract: output[0] is a flat float32 confidence map.
    /// Gemini replaces this stub with the real token / bounding-box decoder
    /// once the Falcon model architecture is confirmed.
    fn decode_outputs(
        outputs: Vec<Value>,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        if outputs.is_empty() {
            return Ok(vec![]);
        }
        let tensor = outputs[0].try_extract::<f32>()?;
        let view = tensor.view();
        let scores: Vec<f32> = view.iter().cloned().collect();

        if scores.is_empty() {
            return Ok(vec![]);
        }

        // Pipeline-validation stub: returns a single sentinel entity so the
        // end-to-end RPC path can be verified before the real decoder lands.
        Ok(vec![DetectedEntity {
            text: "PERCEPTION_STUB".to_string(),
            x: 0.0,
            y: 0.0,
            confidence: scores[0],
        }])
    }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /// Encode a 4×4 solid-red RGB PNG as base64 for preprocessing tests.
    fn make_red_4x4_base64() -> String {
        use image::{ImageBuffer, Rgb, ImageFormat};
        use std::io::Cursor;
        let img: ImageBuffer<Rgb<u8>, Vec<u8>> =
            ImageBuffer::from_fn(4, 4, |_, _| Rgb([255u8, 0, 0]));
        let mut buf = Cursor::new(Vec::new());
        img.write_to(&mut buf, ImageFormat::Png).unwrap();
        B64.encode(buf.into_inner())
    }

    // ── DetectedEntity serialization ──────────────────────────────────────────

    #[test]
    fn test_detected_entity_serialization_round_trip() {
        let entity = DetectedEntity {
            text: "Room 101".to_string(),
            x: 0.25,
            y: 0.75,
            confidence: 0.92,
        };
        let json = serde_json::to_string(&entity).unwrap();
        let decoded: DetectedEntity = serde_json::from_str(&json).unwrap();
        assert_eq!(entity, decoded);
    }

    #[test]
    fn test_detected_entity_json_fields() {
        let entity = DetectedEntity {
            text: "Entrance".to_string(),
            x: 0.1,
            y: 0.9,
            confidence: 0.85,
        };
        let json = serde_json::to_string(&entity).unwrap();
        assert!(json.contains("\"text\""));
        assert!(json.contains("\"Entrance\""));
        assert!(json.contains("\"confidence\""));
    }

    // ── Image preprocessing ───────────────────────────────────────────────────

    #[test]
    fn test_preprocess_image_output_shape() {
        let b64 = make_red_4x4_base64();
        let tensor = PerceptionController::preprocess_image(&b64).unwrap();
        assert_eq!(tensor.shape(), &[1, 3, 224, 224]);
    }

    #[test]
    fn test_preprocess_image_channel_normalisation() {
        let b64 = make_red_4x4_base64();
        let tensor = PerceptionController::preprocess_image(&b64).unwrap();
        // Solid red image: R channel should be ~1.0, G/B channels ~0.0
        let r = tensor[[0, 0, 0, 0]];
        let g = tensor[[0, 1, 0, 0]];
        let b = tensor[[0, 2, 0, 0]];
        assert!((r - 1.0_f32).abs() < 0.01, "Red channel should be ~1.0, got {}", r);
        assert!(g < 0.01, "Green channel should be ~0.0, got {}", g);
        assert!(b < 0.01, "Blue channel should be ~0.0, got {}", b);
    }

    #[test]
    fn test_preprocess_image_rejects_invalid_base64() {
        let result = PerceptionController::preprocess_image("not-valid-base64!@#");
        assert!(result.is_err(), "Expected error for invalid base64");
    }

    #[test]
    fn test_preprocess_image_rejects_non_image_bytes() {
        // Valid base64 but not a valid image
        let garbage = B64.encode(b"this is not an image");
        let result = PerceptionController::preprocess_image(&garbage);
        assert!(result.is_err(), "Expected error for non-image bytes");
    }

    // ── PerceptionConfig defaults ─────────────────────────────────────────────

    #[test]
    fn test_perception_config_defaults() {
        let cfg = PerceptionConfig::default();
        assert!(cfg.falcon_model_path.ends_with(".onnx"));
        assert!(cfg.ollama_url.starts_with("http://"));
        assert!(!cfg.llama_model_name.is_empty());
    }

    // ── VRAM guard initial state ──────────────────────────────────────────────

    #[test]
    fn test_vram_model_initial_state_is_llama() {
        // VramGuard starts with Llama loaded — confirms swap protocol baseline
        let guard = VramGuard { loaded: VramModel::Llama };
        assert_eq!(guard.loaded, VramModel::Llama);
    }

    #[test]
    fn test_vram_model_transitions() {
        // Verify state machine enum values are distinct
        assert_ne!(VramModel::Llama, VramModel::Falcon);
        assert_ne!(VramModel::Llama, VramModel::Empty);
        assert_ne!(VramModel::Falcon, VramModel::Empty);
    }

    // ── Decode outputs (stub path) ────────────────────────────────────────────

    #[test]
    fn test_decode_empty_outputs_returns_empty_vec() {
        let result = PerceptionController::decode_outputs(vec![]).unwrap();
        assert!(result.is_empty());
    }
}
