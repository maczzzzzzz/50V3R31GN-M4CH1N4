pub mod models;
pub mod shield;

use anyhow::Result;
use models::*;
use reqwest::Client;

pub struct ExaClient {
    client: Client,
    api_key: String,
    base_url: String,
}

impl ExaClient {
    pub fn new(api_key: String) -> Self {
        Self {
            client: Client::new(),
            api_key,
            base_url: "https://api.exa.ai".to_string(),
        }
    }

    pub async fn search(&self, query: &str, options: SearchOptions) -> Result<SearchResponse> {
        let request = SearchRequest {
            query: query.to_string(),
            options,
        };

        let response = self.client
            .post(format!("{}/search", self.base_url))
            .header("x-api-key", &self.api_key)
            .json(&request)
            .send()
            .await?
            .json::<SearchResponse>()
            .await?;

        Ok(response)
    }

    pub async fn find_similar(&self, url: &str, options: SearchOptions) -> Result<SearchResponse> {
        // Exa find_similar typically uses a similar structure to search but with a URL target
        let response = self.client
            .post(format!("{}/findSimilar", self.base_url))
            .header("x-api-key", &self.api_key)
            .json(&serde_json::json!({
                "url": url,
                "numResults": options.num_results,
                "includeDomains": options.include_domains,
                "excludeDomains": options.exclude_domains,
            }))
            .send()
            .await?
            .json::<SearchResponse>()
            .await?;

        Ok(response)
    }

    pub async fn get_contents(&self, ids: Vec<String>) -> Result<ContentsResponse> {
        let response = self.client
            .post(format!("{}/contents", self.base_url))
            .header("x-api-key", &self.api_key)
            .json(&ContentsRequest { ids })
            .send()
            .await?
            .json::<ContentsResponse>()
            .await?;

        Ok(response)
    }
}
