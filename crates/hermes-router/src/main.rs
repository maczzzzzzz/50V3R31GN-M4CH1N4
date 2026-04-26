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

struct AppState {
    client: Client,
    node_a_url: String, // Node A: GPU (Local)
    node_b_url: String, // Node B: CPU (Remote)
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();

    let state = Arc::new(AppState {
        client: Client::new(),
        node_a_url: "http://127.0.0.1:8080".to_string(),
        node_b_url: "http://100.x.y.z:8080".to_string(),
    });

    let app = Router::new()
        .route("/v1/chat/completions", post(route_inference))
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 7341));
    info!("◈ [HERMES_ROUTER] Artery open on {}", addr);
    
    let listener = TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn route_inference(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<Value>,
) -> impl IntoResponse {
    // 1. Identify context length
    let messages = payload.get("messages")
        .and_then(|m| m.as_array())
        .map(|m| m.len())
        .unwrap_or(0);
    
    // 2. Select Artery
    let target_url = if messages > 20 {
        &state.node_b_url
    } else {
        &state.node_a_url
    };

    info!("● [ROUTER] Routing request to {} (L={})", target_url, messages);

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
