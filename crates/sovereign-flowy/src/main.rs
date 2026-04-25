use axum::{
    extract::{Path, State, Json},
    routing::{get, post},
    Router,
    response::IntoResponse,
    http::StatusCode,
};
use serde::{Deserialize, Serialize};
use std::sync::Arc;
use sovereign_flowy::{FlowyEngine, Block};
use tower_http::cors::{Any, CorsLayer};
use tokio::sync::Mutex;

/**
 * SOVEREIGN-FLOWY API SERVER
 * 
 * Serves shored SQLite data to the AppFlowy Desktop client.
 */

struct AppState {
    engine: Mutex<FlowyEngine>,
}

#[derive(Serialize)]
struct WorkspaceResponse {
    id: String,
    name: String,
}

#[derive(Serialize)]
struct PageResponse {
    id: String,
    title: String,
    blocks: Vec<Block>,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt().init();

    let db_path = std::env::var("SOVEREIGN_DB_PATH").unwrap_or_else(|_| "data/SovereignIntelligence.db".to_string());
    let engine = FlowyEngine::new(&db_path).expect("Failed to initialize Flowy engine");

    let shared_state = Arc::new(AppState { 
        engine: Mutex::new(engine) 
    });

    let app = Router::new()
        .route("/api/v1/workspaces", get(list_workspaces))
        .route("/api/v1/workspaces", post(create_workspace))
        .route("/api/v1/pages/:id", get(get_page))
        .route("/api/v1/pages/:id/blocks", post(append_block))
        .layer(CorsLayer::new().allow_origin(Any))
        .with_state(shared_state);

    let addr = "0.0.0.0:3000";
    println!("◈ SOVEREIGN-FLOWY: Listening on {}", addr);
    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn list_workspaces(
    State(_state): State<Arc<AppState>>,
) -> impl IntoResponse {
    Json(vec![WorkspaceResponse {
        id: "default_workspace".to_string(),
        name: "Sovereign Workspace".to_string(),
    }])
}

#[derive(Deserialize)]
struct CreateWorkspaceRequest {
    name: String,
}

async fn create_workspace(
    State(state): State<Arc<AppState>>,
    Json(payload): Json<CreateWorkspaceRequest>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let engine = state.engine.lock().await;
    match engine.create_workspace(&payload.name) {
        Ok(id) => Ok((StatusCode::CREATED, Json(WorkspaceResponse { id, name: payload.name }))),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}

async fn get_page(
    State(state): State<Arc<AppState>>,
    Path(id): Path<String>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    let engine = state.engine.lock().await;
    match engine.get_page_content(&id) {
        Ok(blocks) => Ok(Json(PageResponse {
            id: id.clone(),
            title: "Sovereign Page".to_string(),
            blocks,
        })),
        Err(e) => Err((StatusCode::NOT_FOUND, e.to_string())),
    }
}

async fn append_block(
    State(state): State<Arc<AppState>>,
    Path(page_id): Path<String>,
    Json(mut block): Json<Block>,
) -> Result<impl IntoResponse, (StatusCode, String)> {
    block.page_id = page_id;
    let engine = state.engine.lock().await;
    match engine.append_block(&block) {
        Ok(_) => Ok(StatusCode::OK),
        Err(e) => Err((StatusCode::INTERNAL_SERVER_ERROR, e.to_string())),
    }
}
