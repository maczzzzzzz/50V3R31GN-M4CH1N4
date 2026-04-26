use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};
use anyhow::Result;

/// Represents an ActivityPub Actor (e.g., an Agent)
#[derive(Debug, Serialize, Deserialize)]
pub struct Actor {
    pub id: String,
    #[serde(rename = "type")]
    pub actor_type: String,
    pub name: String,
    pub public_key: String, // Public key for verifying signatures
}

/// Represents an ActivityPub Object (e.g., a ThoughtFragment or LogicBlueprint)
#[derive(Debug, Serialize, Deserialize)]
pub struct Object {
    pub id: String,
    #[serde(rename = "type")]
    pub object_type: String,
    pub content: String,
    pub published: DateTime<Utc>,
}

/// Represents an Activity (e.g., Post, Like, Boost)
#[derive(Debug, Serialize, Deserialize)]
pub struct Activity {
    #[serde(rename = "@context")]
    pub context: String,
    pub id: String,
    #[serde(rename = "type")]
    pub activity_type: String, // "Create", "Like", "Announce" (Boost)
    pub actor: String, // Actor ID
    pub object: Object,
    pub signature: String, // Cryptographic signature of the activity
}

impl Activity {
    pub fn new(activity_type: &str, actor: &str, object: Object) -> Self {
        Self {
            context: "https://www.w3.org/ns/activitystreams".to_string(),
            id: format!("urn:uuid:{}", uuid::Uuid::new_v4()),
            activity_type: activity_type.to_string(),
            actor: actor.to_string(),
            object,
            signature: String::new(), // To be signed
        }
    }

    /// Signs the activity with a dummy implementation for now.
    pub fn sign(&mut self, _private_key: &str) -> Result<()> {
        // TODO: Implement actual cryptographic signature
        self.signature = format!("signed_by_{}", self.actor);
        Ok(())
    }

    pub fn to_json(&self) -> Result<String> {
        Ok(serde_json::to_string(self)?)
    }
}
