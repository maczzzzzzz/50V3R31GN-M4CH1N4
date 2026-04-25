use anyhow::Result;
use serde::{Deserialize, Serialize};
use tokio::io::{AsyncReadExt, AsyncWriteExt};
use tokio::net::TcpStream;

/**
 * SOVEREIGN ATOMIC PROFILE ENGINE - KV BRIDGE
 * 
 * Synchronizes profile state across the Triad via Node A (Mooncake Master).
 */

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ProfileState {
    pub name: String,
    pub inference_preference: String,
    pub permission_policy: String,
    pub vault_target: String,
}

pub struct KvMesh {
    master_addr: String,
}

impl KvMesh {
    pub fn new(master_addr: &str) -> Self {
        Self {
            master_addr: master_addr.to_string(),
        }
    }

    /// Pushes a new profile state to the Mooncake Master.
    pub async fn push_profile(&self, state: &ProfileState) -> Result<()> {
        let mut stream = TcpStream::connect(&self.master_addr).await?;
        let payload = serde_json::to_vec(state)?;
        
        // Protocol: [4-byte LEN] [JSON PAYLOAD]
        let len = (payload.len() as u32).to_le_bytes();
        stream.write_all(&len).await?;
        stream.write_all(&payload).await?;
        
        Ok(())
    }

    /// Pulls the current active profile from the Mooncake Master.
    pub async fn pull_profile(&self) -> Result<ProfileState> {
        let mut stream = TcpStream::connect(&self.master_addr).await?;
        
        // Request current state (Placeholder: 0x01 command)
        stream.write_all(&[0x01]).await?;
        
        let mut len_buf = [0u8; 4];
        stream.read_exact(&mut len_buf).await?;
        let len = u32::from_le_bytes(len_buf) as usize;
        
        let mut payload = vec![0u8; len];
        stream.read_exact(&mut payload).await?;
        
        let state = serde_json::from_slice(&payload)?;
        Ok(state)
    }
}
