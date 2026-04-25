use axum::{
    extract::{State, Json},
    routing::post,
    Router,
    response::IntoResponse,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use tracing::{info, error};
use reqwest::Client;
use sovereign_core::kv_bridge::{KvMesh, ProfileState};

/**
 * HERMES COGNITION ROUTER - TRAFFIC CONTROLLER
 * 
 * Routes LLM requests based on complexity (L-length) and profile state.
 */

const NODE_B_URL: &str = "http://100.101.177.76:7331/v1/chat/completions";
const NODE_C_URL: &str = "http://localhost:7339/v1/chat/completions";
const L_THRESHOLD: usize = 4000;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct ChatCompletionRequest {
    messages: Vec<serde_json::Value>,
    #[serde(flatten)]
    extra: serde_json::Value,
}

struct RouterState {
    client: Client,
    kv_mesh: KvMesh,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().with_target(false).init();
    info!("◈ HERMES-ROUTER: Phase 76 // 50V3R31GN-M4CH1N4");

    let kv_master = std::env::var("MOONCAKE_MASTER").unwrap_or_else(|_| "10.0.0.10:6789".to_string());
    
    let shared_state = Arc::new(RouterState {
        client: Client::new(),
        kv_mesh: KvMesh::new(&kv_master),
    });

    let app = Router::new()
        .route("/v1/chat/completions", post(handle_route))
        .with_state(shared_state);

    let addr = "0.0.0.0:3012";
    info!("ROUTER: Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.expect("Failed to bind port");
    axum::serve(listener, app).await.expect("Router server error");
}

async fn handle_route(
    State(state): State<Arc<RouterState>>,
    Json(payload): Json<ChatCompletionRequest>,
) -> impl IntoResponse {
    // 1. Calculate Complexity (L-length)
    let prompt_text: String = payload.messages.iter()
        .map(|m| m["content"].as_str().unwrap_or(""))
        .collect::<Vec<_>>()
        .join(" ");
    
    let l_length = prompt_text.len();
    
    // 2. Fetch Active Profile
    let profile = match state.kv_mesh.pull_profile().await {
        Ok(p) => p,
        Err(_) => ProfileState {
            name: "daily-use".to_string(),
            inference_preference: "node_c_light".to_string(),
            permission_policy: "default".to_string(),
            vault_target: "".to_string(),
        },
    };

    // 3. Routing Decision
    let target_url = if l_length > L_THRESHOLD || profile.name == "researcher" {
        info!("ROUTER: [DEEP_SYNTHESIS] L={} Profile={} -> Node B", l_length, profile.name);
        NODE_B_URL
    } else {
        let endpoint = get_node_c_endpoint(&profile.inference_preference);
        info!("ROUTER: [FAST_PARSING] L={} Profile={} Preference={} -> {}", 
            l_length, profile.name, profile.inference_preference, endpoint);
        endpoint
    };

    // 4. Proxy Request
    let response = match state.client.post(target_url).json(&payload).send().await {
        Ok(res) => res,
        Err(e) => {
            error!("ROUTER: Failed to connect to backend: {}", e);
            return (axum::http::StatusCode::BAD_GATEWAY, "Backend unreachable").into_response();
        }
    };

    // 5. Proxy response back to caller.
    // TODO(Phase 77): implement SSE pass-through for `stream: true` requests.
    // Currently the full response is buffered — callers using streaming inference
    // will receive no tokens until generation is complete. For L > 4000 on Node B
    // this can block for tens of seconds.
    let status = response.status();
    let body = response.bytes().await.unwrap_or_default();
    (status, body).into_response()
}
is can block for tens of seconds.
    let status = response.status();
    let body = response.bytes().await.unwrap_or_default();
    (status, body).into_response()
}
