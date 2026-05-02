# ST3GG V2F Decoder Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement Rust-side ST3GG decoder for V2F verification in `hermes-router`.

**Architecture:**
- Create `security.rs` for steganography and decryption logic.
- Use `image` crate for pixel-level LSB extraction (RGB channels).
- Use `aes-gcm` for payload decryption.
- Use `sha2` for key derivation.
- Integrate with `main.rs` in `verify_v2f_pulse`.

**Tech Stack:** Rust, `image`, `aes-gcm`, `sha2`, `anyhow`.

---

### Task 1: Update Dependencies

**Files:**
- Modify: `crates/hermes-router/Cargo.toml`

- [ ] **Step 1: Add `aes-gcm` dependency**

```toml
[dependencies]
# ...
aes-gcm = "0.10"
# ...
```

- [ ] **Step 2: Run `cargo check`**

Run: `cargo check -p hermes-router`
Expected: SUCCESS

### Task 2: Implement ST3GG Decoder

**Files:**
- Create: `crates/hermes-router/src/security.rs`

- [ ] **Step 1: Implement `extract_v2f_token`**

```rust
use anyhow::{anyhow, Result};
use image::{GenericImageView, Pixel};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use sha2::{Digest, Sha256};

pub fn extract_v2f_token(png_bytes: &[u8], _shared_secret: &str) -> Result<String> {
    let img = image::load_from_memory(png_bytes)?;
    let (width, height) = img.dimensions();

    let mut bits = Vec::new();
    'outer: for y in 0..height {
        for x in 0..width {
            let pixel = img.get_pixel(x, y);
            let rgb = pixel.to_rgb();
            bits.push(rgb[0] & 1);
            bits.push(rgb[1] & 1);
            bits.push(rgb[2] & 1);
            
            // Optimization: we could stop once we have enough bits, 
            // but for simplicity we collect all and then parse.
            // A typical 1080p frame has ~6M bits, which is ~750KB.
            if bits.len() > 1024 * 1024 * 8 { break 'outer; } 
        }
    }

    let bytes = bits_to_bytes(&bits);
    
    if bytes.len() < 8 || &bytes[0..4] != b"V2F!" {
        return Err(anyhow!("Invalid magic: expected V2F!"));
    }

    let payload_len = u32::from_be_bytes(bytes[4..8].try_into()?) as usize;
    if bytes.len() < 8 + payload_len {
        return Err(anyhow!("Incomplete payload: expected {} bytes", payload_len));
    }

    let encrypted_payload = &bytes[8..8 + payload_len];

    let mut hasher = Sha256::new();
    hasher.update("SOVEREIGN_M4CH1N4_V2F_KEY");
    let key_bytes = hasher.finalize();

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)?;
    
    let nonce_size = 12;
    if encrypted_payload.len() < nonce_size {
        return Err(anyhow!("Payload too short for GCM nonce"));
    }

    let nonce = Nonce::from_slice(&encrypted_payload[..nonce_size]);
    let ciphertext = &encrypted_payload[nonce_size..];

    let decrypted = cipher.decrypt(nonce, ciphertext)
        .map_err(|e| anyhow!("Decryption failed: {}", e))?;

    String::from_utf8(decrypted).map_err(|e| anyhow!("Invalid UTF-8 token: {}", e))
}

fn bits_to_bytes(bits: &[u8]) -> Vec<u8> {
    let mut bytes = Vec::new();
    for chunk in bits.chunks(8) {
        if chunk.len() == 8 {
            let mut b = 0u8;
            for (i, &bit) in chunk.iter().enumerate() {
                b |= (bit & 1) << (7 - i);
            }
            bytes.push(b);
        }
    }
    bytes
}
```

- [ ] **Step 2: Add basic test**

```rust
#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_bits_to_bytes() {
        let bits = vec![0, 1, 0, 1, 0, 1, 1, 0]; // 0x56 'V'
        assert_eq!(bits_to_bytes(&bits), vec![0x56]);
    }
}
```

### Task 3: Integrate and Verify

**Files:**
- Modify: `crates/hermes-router/src/main.rs`

- [ ] **Step 1: Declare security module**

```rust
mod security;
```

- [ ] **Step 2: Update `verify_v2f_pulse`**

```rust
async fn verify_v2f_pulse(state: &AppState) -> anyhow::Result<()> {
    // ...
    let bytes = response.bytes().await?;
    
    let shared_secret = std::env::var("V2F_SHARED_SECRET").unwrap_or_else(|_| "DEFAULT_SECRET".to_string());
    let token = security::extract_v2f_token(&bytes, &shared_secret)?;
    info!("◈ [SECURITY] V2F Pulse Verified. Token: {}", token);

    Ok(())
}
```

- [ ] **Step 3: Run `cargo check` and tests**

Run: `cargo check -p hermes-router && cargo test -p hermes-router`
Expected: SUCCESS
