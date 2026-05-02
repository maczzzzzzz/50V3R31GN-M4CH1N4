use axum::{
    extract::State,
    response::IntoResponse,
    routing::post,
    Json, Router,
};
use reqwest::Client;
use serde_json::Value;
use std::net::SocketAddr;
use std::sync::Arc;
use std::env;
use std::time::Duration;
use tokio::net::TcpListener;
use tracing::{info, error};

use spiffe::workload_api::client::WorkloadApiClient;
use rustls::pki_types::{CertificateDer, PrivateKeyDer, PrivatePkcs8KeyDer};

mod security;

async fn create_mtls_client() -> anyhow::Result<Client> {
    let socket_path = env::var("SPIFFE_ENDPOINT_SOCKET");
    
    if socket_path.is_err() {
        info!("● [SECURITY] SPIFFE_ENDPOINT_SOCKET not set. Using standard Client.");
        return Ok(Client::builder()
            .timeout(Duration::from_secs(30))
            .build()?);
    }

    info!("◈ [SECURITY] Connecting to SPIRE Workload API...");
    
    // 1. Connect to SPIRE Workload API
    let mut client = WorkloadApiClient::connect_env().await?;
    
    // 2. Fetch X.509 Context
    let x509_context = client.fetch_x509_context().await?;
    let svid = x509_context.svids().iter().next()
        .ok_or_else(|| anyhow::anyhow!("No SVID found in SPIRE context"))?;
    
    info!("◈ [SECURITY] SPIFFE SVID Fetched: {}", svid.spiffe_id());

    // 3. Convert SVID to rustls-compatible types
    let cert_chain: Vec<CertificateDer<'static>> = svid.cert_chain()
        .iter()
        .map(|cert| CertificateDer::from(cert.as_bytes().to_vec()))
        .collect();
    
    let key_der = PrivateKeyDer::Pkcs8(PrivatePkcs8KeyDer::from(svid.private_key().as_bytes().to_vec()));

    // 4. Extract Trust Anchors from Bundles
    let mut root_cert_store = rustls::RootCertStore::empty();
    for (_trust_domain, bundle) in x509_context.bundle_set().iter() {
        for authority in bundle.authorities() {
            root_cert_store.add(CertificateDer::from(authority.as_bytes().to_vec()))
                .map_err(|e| anyhow::anyhow!("Failed to add trust anchor: {}", e))?;
        }
    }

    // 5. Build rustls ClientConfig
    let config = rustls::ClientConfig::builder()
        .with_root_certificates(root_cert_store)
        .with_client_auth_cert(cert_chain, key_der)
        .map_err(|e| anyhow::anyhow!("Failed to create rustls config: {}", e))?;

    // 6. Build reqwest Client with rustls config
    Ok(Client::builder()
        .use_preconfigured_tls(config)
        .timeout(Duration::from_secs(30))
        .build()?)
}

/**
 * HERMES ROUTER — PHASE 106, TASK 3
 *
 * High-throughput inference proxy for the Sovereign Trinity.
 * Enforces zero-trust mTLS via SPIFFE/SPIRE.
 */

struct AppState {
    client: Client,
    node_b_url: String,
    node_c_url: String,
    node_d_url: String,
    spiffe_id: String,
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt::init();

    // 1. Initialize SPIFFE Identity (Simplified for Batch 2)
    let spiffe_id = env::var("SPIFFE_ID").unwrap_or_else(|_| "spiffe://sovereign.machina/workload/hermes-router".to_string());
    info!("◈ [SECURITY] SPIFFE Identity: {}", spiffe_id);

    let node_b = env::var("NODE_B_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_string());
    let node_c = env::var("NODE_C_URL").unwrap_or_else(|_| "http://127.0.0.1:7339".to_string());
    let node_d = env::var("NODE_D_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_string());

    let client = create_mtls_client().await.unwrap_or_else(|e| {
        error!("!! [SECURITY] Failed to initialize mTLS client: {}. Falling back to standard Client.", e);
        Client::new()
    });

    let state = Arc::new(AppState {
        client,
        node_b_url: node_b,
        node_c_url: node_c,
        node_d_url: node_d,
        spiffe_id,
    });

    let app = Router::new()
        .route("/v1/chat/completions", post(route_inference))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 7341));
    info!("◈ [HERMES_ROUTER] Quaternary Artery open on {}", addr);
    
    let listener = TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;
    Ok(())
}

async fn route_inference(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    // 1. Identify context length and model preference
    let messages = payload.get("messages")
        .and_then(|m| m.as_array())
        .map(|m| m.len())
        .unwrap_or(0);
    
    let model = payload.get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("gemma")
        .to_lowercase();

    // 2. Select Artery
    let target_url = if model.contains("26b") || model.contains("coder") || model.contains("glm") || messages > 50 {
        &state.node_d_url 
    } else if model.contains("qwen") || model.contains("deepseek") || model.contains("flash") || model.contains("oracle") {
        &state.node_c_url 
    } else {
        &state.node_b_url 
    };

    info!("● [ROUTER] Routing {} request to {}", model, target_url);

    // ◈ [SECURITY] PHASE 106: Gated by Steganographic Heartbeat
    if env::var("ENFORCE_V2F").is_ok() {
        if let Err(e) = verify_v2f_pulse(&state).await {
            error!("!! [SECURITY] V2F Pulse Failed: {}", e);
            return (reqwest::StatusCode::FORBIDDEN, "Visual Identity Mismatch — Artery Blocked").into_response();
        }
    }

    // 3. Proxy Request
    let response = match state.client
        .post(format!("{}/v1/chat/completions", target_url))
        .json(&payload)
        .send()
        .await {
            Ok(res) => res,
            Err(e) => {
                error!("!! [ROUTER] Proxy failed: {}", e);
                return (reqwest::StatusCode::BAD_GATEWAY, "Gateway Artery Severed").into_response();
            }
        };

    // 4. Return Response
    let status = response.status();
    let body = response.bytes().await.unwrap_or_default();
    (axum::http::StatusCode::from_u16(status.as_u16()).unwrap(), body).into_response()
}

async fn verify_v2f_pulse(state: &AppState) -> anyhow::Result<()> {
    let proxy_url = env::var("SIDECAR_PROXY_URL").unwrap_or_else(|_| "http://127.0.0.1:3000".to_string());
    let response = state.client.get(format!("{}/api/v2f/pulse", proxy_url)).send().await?;
    
    if !response.status().is_success() {
        anyhow::bail!("Failed to retrieve pulse frame");
    }

    let bytes = response.bytes().await?;
    if bytes.len() < 1000 {
        anyhow::bail!("Pulse frame corrupted or too small");
    }

    // Extract steganographic token
    let shared_secret = env::var("V2F_SHARED_SECRET").unwrap_or_else(|_| "DEFAULT_SECRET".to_string());
    let token = security::extract_v2f_token(&bytes, &shared_secret)?;
    info!("◈ [SECURITY] V2F Pulse Verified. Token extracted: {}", token);

    Ok(())
}
