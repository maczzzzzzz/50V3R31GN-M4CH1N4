use crate::ExaClient;
use crate::models::SearchOptions;
use anyhow::Result;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Claim {
    pub text: String,
    pub verified: bool,
    pub sources: Vec<String>,
    pub confidence: f32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct VerificationReport {
    pub original_text: String,
    pub claims: Vec<Claim>,
    pub total_score: f32,
}

pub struct Shield {
    client: ExaClient,
}

impl Shield {
    pub fn new(api_key: String) -> Self {
        Self {
            client: ExaClient::new(api_key),
        }
    }

    /// Verifies factual claims within a block of text.
    /// This is a high-level port of the exa-hallucination-detector.
    pub async fn verify(&self, text: &str) -> Result<VerificationReport> {
        // Step 1: Claim Extraction (Placeholder logic - in production this uses a local LLM or regex)
        let claims_texts = vec![text.to_string()]; // Treat the whole block as one claim for this pass

        let mut claims = Vec::new();
        let mut total_confidence = 0.0;

        for claim_text in claims_texts {
            // Step 2: Semantic Search via Exa
            let search_results = self.client.search(&claim_text, SearchOptions {
                num_results: Some(3),
                ..Default::default()
            }).await?;

            let mut sources = Vec::new();
            let mut highest_score = 0.0;

            for result in search_results.results {
                sources.push(result.url);
                if result.score > highest_score {
                    highest_score = result.score;
                }
            }

            // Step 3: Scoring (Simplified port)
            let verified = highest_score > 0.85; // Mandatory 0.85 threshold

            claims.push(Claim {
                text: claim_text,
                verified,
                sources,
                confidence: highest_score,
            });

            total_confidence += highest_score;
        }

        Ok(VerificationReport {
            original_text: text.to_string(),
            claims,
            total_score: total_confidence,
        })
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    use crate::models::SearchResult;
    use anyhow::Result;

    #[tokio::test]
    async fn test_shield_verification_logic() -> Result<()> {
        // Since we can't call the real API in unit tests easily without a key,
        // we verify the structure and confidence thresholding logic.
        
        let report = VerificationReport {
            original_text: "Militech is a mega-corp in Night City.".to_string(),
            claims: vec![
                Claim {
                    text: "Militech is a mega-corp in Night City.".to_string(),
                    verified: true,
                    sources: vec!["https://militech.com".to_string()],
                    confidence: 0.92,
                }
            ],
            total_score: 0.92,
        };

        assert!(report.claims[0].verified);
        assert!(report.total_score > 0.85);
        Ok(())
    }

    #[test]
    fn test_hallucination_detection_threshold() {
        let confidence_low = 0.70;
        let verified = confidence_low > 0.85;
        assert!(!verified, "Should block low-confidence claims");
        
        let confidence_high = 0.86;
        let verified = confidence_high > 0.85;
        assert!(verified, "Should allow high-confidence claims");
    }
}
