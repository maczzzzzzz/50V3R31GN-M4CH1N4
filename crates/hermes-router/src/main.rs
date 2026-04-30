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
use tokio::net::TcpListener;
use tracing::{info, error};

/**
 * HERMES ROUTER — PHASE 77, TASK 1
 *
 * High-throughput inference proxy for the Sovereign Trinity.
 * Intercepts /v1/chat/completions and routes based on context length.
 * Updated for Axum 0.7+
 */

use std::env;

struct AppState {
    client: Client,
    node_b_url: String, // Director
    node_c_url: String, // Oracle
    node_d_url: String, // Quaternary Oracle (Swapper)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let node_b = env::var("NODE_B_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_string());
    let node_c = env::var("NODE_C_URL").unwrap_or_else(|_| "http://127.0.0.1:7339".to_string());
    let node_d = env::var("NODE_D_URL").unwrap_or_else(|_| "http://127.0.0.1:8080".to_string()); // Points to Node D Swapper (node-d-swapper.ts)

    let state = Arc::new(AppState {
        client: Client::new(),
        node_b_url: node_b,
        node_c_url: node_c,
        node_d_url: node_d,
    });

    let app = Router::new()
        .route("/v1/chat/completions", post(route_inference))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 7341));
    info!("◈ [HERMES_ROUTER] Quaternary Artery open on {}", addr);
    
    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
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
    // If we request Node D specific models or have a long context, we hit the Swapper on 8080.
    // The Swapper will then proxy the request to the raw llama-server on 8081 after ensuring the model is loaded.
    let target_url = if model.contains("26b") || model.contains("coder") || model.contains("qwen") || model.contains("flash") || model.contains("glm") || messages > 50 {
        &state.node_d_url // Routes to Node D Swapper (8080)
    } else if model.contains("stable") || model.contains("oracle") {
        &state.node_c_url
    } else {
        &state.node_b_url
    };

    info!("● [ROUTER] Routing {} request (M={}) to {} (L={})", model, model, target_url, messages);

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
