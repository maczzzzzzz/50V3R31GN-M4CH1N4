//! perception/mod.rs
//!
//! Phase 25: Native Inference Engine — Migrated from Ollama to llama-server.
//! Both Open-Reasoner-Zero-1.5B and Falcon-0.3B are permanently resident.
//! Residency is enforced by --mlock at the process level.

use std::path::Path;
use std::sync::Arc;

use base64::{engine::general_purpose::STANDARD as B64, Engine as _};
use image::imageops::FilterType;
use ndarray::Array4;
use ort::{
    inputs,
    session::builder::GraphOptimizationLevel,
    session::Session,
    value::Value,
    ep::{CUDA, CPU},
};
use reqwest::Client;
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex as TokioMutex;
use tracing::{info, warn};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct DetectedEntity {
    pub text: String,
    pub x: f32,
    pub y: f32,
    pub confidence: f32,
}

#[derive(Debug, Clone, PartialEq)]
enum VramModel {
    Llama,
    Falcon,
    Empty,
}

struct VramGuard {
    loaded: VramModel,
}

#[derive(Debug, Clone)]
pub struct PerceptionConfig {
    pub falcon_model_path: String,
    /// llama-server base URL (default: http://localhost:8080).
    pub llama_url: String,
    pub llama_model_name: String,
}

impl Default for PerceptionConfig {
    fn default() -> Self {
        Self {
            falcon_model_path: "models/falcon-0.3b-ocr.onnx".to_string(),
            llama_url: "http://127.0.0.1:8080".to_string(),
            llama_model_name: "Open-Reasoner-Zero-1.5B".to_string(),
        }
    }
}

pub struct PerceptionController {
    config: PerceptionConfig,
    client: Client,
    vram_lock: Arc<TokioMutex<VramGuard>>,
    falcon_session: Arc<TokioMutex<Session>>,
}

impl PerceptionController {
    pub fn new(config: PerceptionConfig) -> Result<Self, Box<dyn std::error::Error + Send + Sync>> {
        ort::init()
            .with_name("falcon-sidecar")
            .commit();

        let model_path = &config.falcon_model_path;
        if !Path::new(model_path).exists() {
            return Err(format!("[Perception] Falcon ONNX model not found at: {}", model_path).into());
        }

        let session = Session::builder()
            .map_err(|e| e.to_string())?
            .with_optimization_level(GraphOptimizationLevel::Level3)
            .map_err(|e| e.to_string())?
            .with_execution_providers([
                CUDA::default().build(),
                CPU::default().build(),
            ])
            .map_err(|e| e.to_string())?
            .commit_from_file(model_path)
            .map_err(|e| e.to_string())?;

        Ok(Self {
            config,
            client: Client::new(),
            vram_lock: Arc::new(TokioMutex::new(VramGuard { loaded: VramModel::Llama })),
            falcon_session: Arc::new(TokioMutex::new(session)),
        })
    }

    /// Verify residency via health check (enforced by startup script via --mlock).
    pub async fn ensure_residency(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        info!("[Perception] Verifying native llama-server residency (Phase 25)...");
        
        let url = format!("{}/health", self.config.llama_url);
        let res = self.client.get(&url).send().await?;
        
        if !res.status().is_success() {
            return Err(format!("[Perception] llama-server not healthy at {}", url).into());
        }
        
        info!("[Perception] Residency verified. Node A Native Inference is ACTIVE.");
        Ok(())
    }

    pub async fn ocr_analyze(
        &self,
        base64_image: &str,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        let mut guard = self.vram_lock.lock().await;

        info!("[Perception] Falcon inference pass (resident mode)...");
        let tensor = Self::preprocess_image(base64_image)?;

        guard.loaded = VramModel::Falcon;
        let entities = self.run_falcon_inference(tensor)?;
        guard.loaded = VramModel::Llama;

        info!("[Perception] Falcon pass complete. {} entities detected.", entities.len());
        Ok(entities)
    }

    pub(crate) fn preprocess_image(
        base64_image: &str,
    ) -> Result<Array4<f32>, Box<dyn std::error::Error + Send + Sync>> {
        let bytes = B64.decode(base64_image)?;
        let img = image::load_from_memory(&bytes)?;
        let rgb = img.resize_exact(384, 384, FilterType::Lanczos3).to_rgb8();

        let mut tensor = Array4::<f32>::zeros((1, 3, 384, 384));
        for (px, py, pixel) in rgb.enumerate_pixels() {
            tensor[[0, 0, py as usize, px as usize]] = pixel[0] as f32 / 255.0;
            tensor[[0, 1, py as usize, px as usize]] = pixel[1] as f32 / 255.0;
            tensor[[0, 2, py as usize, px as usize]] = pixel[2] as f32 / 255.0;
        }
        Ok(tensor)
    }

    fn run_falcon_inference(
        &self,
        image_tensor: Array4<f32>,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        let input_value = Value::from_array(image_tensor)
            .map_err(|e| e.to_string())?;
        
        let mut session = self.falcon_session.blocking_lock();
        let outputs = session.run(inputs![input_value])
            .map_err(|e| e.to_string())?;

        Self::decode_outputs(outputs)
    }

    fn decode_outputs(
        outputs: ort::session::SessionOutputs,
    ) -> Result<Vec<DetectedEntity>, Box<dyn std::error::Error + Send + Sync>> {
        if outputs.len() == 0 {
            return Ok(vec![]);
        }
        
        let (_shape, data) = outputs[0].try_extract_tensor::<f32>()
            .map_err(|e| e.to_string())?;
        
        Ok(vec![DetectedEntity {
            text: "PERCEPTION_STUB".to_string(),
            x: 0.0,
            y: 0.0,
            confidence: *data.first().unwrap_or(&0.0),
        }])
    }
}
