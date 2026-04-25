use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Default)]
pub struct SearchOptions {
    pub num_results: Option<usize>,
    pub include_domains: Option<Vec<String>>,
    pub exclude_domains: Option<Vec<String>>,
    pub start_crawl_date: Option<String>,
    pub end_crawl_date: Option<String>,
    pub start_published_date: Option<String>,
    pub end_published_date: Option<String>,
    pub use_autoprompt: Option<bool>,
    pub type_: Option<String>, // "keyword" or "neural"
}

#[derive(Debug, Serialize)]
pub struct SearchRequest {
    pub query: String,
    #[serde(flatten)]
    pub options: SearchOptions,
}

#[derive(Debug, Deserialize)]
pub struct SearchResult {
    pub id: String,
    pub url: String,
    pub title: Option<String>,
    pub author: Option<String>,
    pub published_date: Option<String>,
    pub score: f32,
}

#[derive(Debug, Deserialize)]
pub struct SearchResponse {
    pub results: Vec<SearchResult>,
}

#[derive(Debug, Serialize)]
pub struct ContentsRequest {
    pub ids: Vec<String>,
}

#[derive(Debug, Deserialize)]
pub struct ContentResult {
    pub id: String,
    pub url: String,
    pub title: Option<String>,
    pub text: String,
}

#[derive(Debug, Deserialize)]
pub struct ContentsResponse {
    pub results: Vec<ContentResult>,
}
