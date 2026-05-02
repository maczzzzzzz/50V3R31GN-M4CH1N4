use anyhow::{anyhow, Result};
use image::{GenericImageView, Pixel};
use aes_gcm::{
    aead::{Aead, KeyInit},
    Aes256Gcm, Nonce,
};
use sha2::{Digest, Sha256};

/**
 * ST3GG V2F DECODER — PHASE 106, TASK 3
 *
 * Extracts steganographic Visual Second Factor (V2F) tokens from PNG pulse frames.
 */

pub fn extract_v2f_token(png_bytes: &[u8], _shared_secret: &str) -> Result<String> {
    let img = image::load_from_memory(png_bytes)?;
    let (width, height) = img.dimensions();

    let mut bits = Vec::new();
    // Prompt: "Data is embedded in the LSB of R, G, B channels sequentially."
    'outer: for y in 0..height {
        for x in 0..width {
            let pixel = img.get_pixel(x, y);
            let rgb = pixel.to_rgb();
            bits.push(rgb[0] & 1);
            bits.push(rgb[1] & 1);
            bits.push(rgb[2] & 1);
            
            // Safety break: don't consume infinite memory if image is huge
            // 8MB of bits is 1MB of payload, more than enough for a token.
            if bits.len() > 1024 * 1024 * 8 { break 'outer; }
        }
    }

    let bytes = bits_to_bytes(&bits);
    
    // Check Magic: V2F!
    if bytes.len() < 8 || &bytes[0..4] != b"V2F!" {
        return Err(anyhow!("Invalid magic: expected V2F!"));
    }

    // Read Length (Big Endian)
    let payload_len = u32::from_be_bytes(bytes[4..8].try_into()?) as usize;
    if bytes.len() < 8 + payload_len {
        return Err(anyhow!("Incomplete payload: expected {} bytes, got {}", payload_len, bytes.len() - 8));
    }

    let encrypted_payload = &bytes[8..8 + payload_len];

    // Decrypt AES-GCM
    // Key = sha256("SOVEREIGN_M4CH1N4_V2F_KEY")
    let mut hasher = Sha256::new();
    hasher.update("SOVEREIGN_M4CH1N4_V2F_KEY");
    let key_bytes = hasher.finalize();

    let cipher = Aes256Gcm::new_from_slice(&key_bytes)?;
    
    // AES-GCM nonce is first 12 bytes of payload
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bits_to_bytes() {
        // 'V' = 0x56 = 01010110
        let bits = vec![0, 1, 0, 1, 0, 1, 1, 0];
        assert_eq!(bits_to_bytes(&bits), vec![0x56]);
        
        // '2' = 0x32 = 00110010
        let bits2 = vec![0, 0, 1, 1, 0, 0, 1, 0];
        assert_eq!(bits_to_bytes(&bits2), vec![0x32]);
    }

    #[test]
    fn test_extract_invalid_magic() {
        let dummy_png = vec![0u8; 100]; // Not a real PNG, but image load will fail first
        let result = extract_v2f_token(&dummy_png, "secret");
        assert!(result.is_err());
    }
}
