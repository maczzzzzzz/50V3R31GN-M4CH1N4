/// zeroclaw/src/cv/colpali_bridge.rs
/// Phase 65: ColPali MaxSim Reranker — late-interaction visual search.
///
/// Architecture:
///   Node B (VisualRAGService.ts) posts a query embedding vector.
///   This module retrieves stored document embeddings (Feather/Parquet or JSON cache),
///   computes MaxSim scores, and returns ranked (source_pdf, page_number, score) tuples.
///
/// MaxSim formula (ColPali paper):
///   Score(Q, D) = Σ_{q ∈ Q} max_{d ∈ D} (q · d)
///   Where Q = query patch embeddings [n_patches × dim],
///         D = document patch embeddings [n_pages × n_patches × dim].
///
/// Storage: Embeddings cached as JSON vectors in the data/ingest/colpali_index/ directory.
/// Format: { "source_pdf": "...", "page_number": 1, "vectors": [[f32, ...], ...] }

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PageEmbedding {
    pub source_pdf: String,
    pub page_number: u32,
    /// Multi-vector: one embedding vector per patch [n_patches × dim]
    pub vectors: Vec<Vec<f32>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MaxSimResult {
    pub source_pdf: String,
    pub page_number: u32,
    pub score: f32,
}

#[derive(Debug, Deserialize)]
pub struct MaxSimRequest {
    pub query_embedding: Vec<f32>,
    pub top_k: usize,
}

// ---------------------------------------------------------------------------
// MaxSim computation
// ---------------------------------------------------------------------------

/// Compute MaxSim score between a single query vector and a document's multi-vector patches.
///
/// MaxSim: for each query patch, find the maximum dot-product across all document patches.
/// Sum these maxima to get the document score.
///
/// This is the standard late-interaction ColPali scoring function.
pub fn maxsim_score(query: &[f32], doc_patches: &[Vec<f32>]) -> f32 {
    if doc_patches.is_empty() || query.is_empty() {
        return 0.0;
    }

    // Single query vector against multi-vector document
    let max_score = doc_patches
        .iter()
        .map(|patch| dot_product(query, patch))
        .fold(f32::NEG_INFINITY, f32::max);

    max_score.max(0.0) // Clamp to non-negative
}

/// Multi-vector MaxSim: query has multiple patch vectors, document has multiple patch vectors.
/// Score = Σ_{q} max_{d} (q · d)
pub fn maxsim_multi(query_patches: &[Vec<f32>], doc_patches: &[Vec<f32>]) -> f32 {
    if doc_patches.is_empty() || query_patches.is_empty() {
        return 0.0;
    }

    query_patches
        .iter()
        .map(|q| {
            doc_patches
                .iter()
                .map(|d| dot_product(q, d))
                .fold(f32::NEG_INFINITY, f32::max)
        })
        .sum::<f32>()
        .max(0.0)
}

/// Dot product of two equal-length vectors.
fn dot_product(a: &[f32], b: &[f32]) -> f32 {
    a.iter()
        .zip(b.iter())
        .map(|(x, y)| x * y)
        .sum()
}

// ---------------------------------------------------------------------------
// Index loader
// ---------------------------------------------------------------------------

/// Load all page embeddings from the colpali_index directory.
pub fn load_index(index_dir: &PathBuf) -> Vec<PageEmbedding> {
    let mut embeddings = Vec::new();

    let Ok(entries) = fs::read_dir(index_dir) else {
        return embeddings;
    };

    for entry in entries.flatten() {
        let path = entry.path();
        if path.extension().and_then(|e| e.to_str()) != Some("json") {
            continue;
        }
        let Ok(raw) = fs::read_to_string(&path) else { continue };
        if let Ok(emb) = serde_json::from_str::<PageEmbedding>(&raw) {
            embeddings.push(emb);
        }
    }

    embeddings
}

// ---------------------------------------------------------------------------
// Top-K search
// ---------------------------------------------------------------------------

/// Search the index for the top-K most similar pages to the query vector.
///
/// Uses single-vector MaxSim (query is a mean-pooled 128D vector from ChromaDB fast-path).
/// For multi-vector reranking, use `rerank_with_full_embeddings`.
pub fn search_top_k(
    query: &[f32],
    index: &[PageEmbedding],
    top_k: usize,
) -> Vec<MaxSimResult> {
    let mut scores: Vec<MaxSimResult> = index
        .iter()
        .map(|page| MaxSimResult {
            source_pdf: page.source_pdf.clone(),
            page_number: page.page_number,
            score: maxsim_score(query, &page.vectors),
        })
        .collect();

    // Sort descending by score
    scores.sort_by(|a, b| b.score.partial_cmp(&a.score).unwrap_or(std::cmp::Ordering::Equal));
    scores.truncate(top_k);
    scores
}

// ---------------------------------------------------------------------------
// Axum handler integration (called from main.rs routes)
// ---------------------------------------------------------------------------

/// Handle a MaxSim search request from VisualRAGService.ts.
/// Expects the colpali index directory at data/ingest/colpali_index/.
pub fn handle_maxsim(
    request: &MaxSimRequest,
    index_dir: &PathBuf,
) -> Vec<MaxSimResult> {
    let index = load_index(index_dir);
    search_top_k(&request.query_embedding, &index, request.top_k.max(1).min(50))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;

    fn vec3(a: f32, b: f32, c: f32) -> Vec<f32> {
        vec![a, b, c]
    }

    #[test]
    fn dot_product_correct() {
        assert_eq!(dot_product(&[1.0, 2.0, 3.0], &[4.0, 5.0, 6.0]), 32.0);
    }

    #[test]
    fn maxsim_score_selects_closest_patch() {
        let query = vec3(1.0, 0.0, 0.0);
        let patches = vec![
            vec3(0.0, 1.0, 0.0), // dot = 0
            vec3(1.0, 0.0, 0.0), // dot = 1  ← max
            vec3(0.5, 0.5, 0.0), // dot = 0.5
        ];
        let score = maxsim_score(&query, &patches);
        assert!((score - 1.0).abs() < 1e-5, "score={}", score);
    }

    #[test]
    fn maxsim_multi_sums_per_query() {
        let q_patches = vec![
            vec3(1.0, 0.0, 0.0),
            vec3(0.0, 1.0, 0.0),
        ];
        let d_patches = vec![
            vec3(1.0, 0.0, 0.0), // matches q[0]
            vec3(0.0, 1.0, 0.0), // matches q[1]
        ];
        let score = maxsim_multi(&q_patches, &d_patches);
        // Each query patch gets max = 1.0, sum = 2.0
        assert!((score - 2.0).abs() < 1e-5, "score={}", score);
    }

    #[test]
    fn top_k_returns_sorted_results() {
        let index = vec![
            PageEmbedding { source_pdf: "A.pdf".into(), page_number: 1, vectors: vec![vec3(0.5, 0.5, 0.0)] },
            PageEmbedding { source_pdf: "B.pdf".into(), page_number: 1, vectors: vec![vec3(1.0, 0.0, 0.0)] },
            PageEmbedding { source_pdf: "C.pdf".into(), page_number: 1, vectors: vec![vec3(0.1, 0.1, 0.0)] },
        ];
        let query = vec3(1.0, 0.0, 0.0);
        let results = search_top_k(&query, &index, 2);
        assert_eq!(results.len(), 2);
        assert_eq!(results[0].source_pdf, "B.pdf");
        assert!(results[0].score > results[1].score);
    }

    #[test]
    fn empty_index_returns_empty() {
        let query = vec3(1.0, 0.0, 0.0);
        let results = search_top_k(&query, &[], 5);
        assert!(results.is_empty());
    }
}
