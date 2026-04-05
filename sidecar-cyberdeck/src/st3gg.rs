// sidecar-cyberdeck/src/st3gg.rs — ST3GG Decoder for HUD (Node B)
//
// Extracts JSON payloads from Smart PNG assets via LSB steganography.
// Synchronized with Phase 29 Go implementation (CRC32 checked).

use std::error::Error;
use image::{DynamicImage, GenericImageView};

/// Decode and validate a JSON payload from a ST3GG-encoded PNG.
pub fn decode_json(img_bytes: &[u8]) -> Result<serde_json::Value, Box<dyn Error + Send + Sync>> {
    let img = image::load_from_memory(img_bytes)?;
    let (width, height) = img.dimensions();
    let capacity_bits = (width * height * 4) as usize;

    let rgba = img.to_rgba8();
    // Collect all channel LSBs into a flat bit stream
    let bits: Vec<u8> = rgba
        .pixels()
        .flat_map(|p| p.0.iter().map(|c| c & 1).collect::<Vec<_>>())
        .collect();

    if bits.len() < 32 {
        return Err("Image too small for ST3GG header".into());
    }

    // Read 32-bit big-endian length header
    let mut payload_len: u32 = 0;
    for i in 0..32 {
        payload_len = (payload_len << 1) | (bits[i] as u32);
    }
    let payload_len = payload_len as usize;

    // Total bits required: 32 (header) + (payload_len * 8) + 32 (CRC32)
    let total_wire_bits = 32 + (payload_len + 4) * 8;
    if total_wire_bits > capacity_bits {
        return Err(format!(
            "ST3GG decode: embedded length {} exceeds image capacity — not a Smart PNG or corrupted",
            payload_len
        ).into());
    }

    // Extract payload + CRC32 block
    let block_bits = &bits[32..total_wire_bits];
    let block: Vec<u8> = block_bits
        .chunks(8)
        .map(|chunk| chunk.iter().fold(0u8, |acc, &b| (acc << 1) | b))
        .collect();

    let payload = &block[..payload_len];
    let mut crc_bytes = [0u8; 4];
    crc_bytes.copy_from_slice(&block[payload_len..]);
    let crc_stored = u32::from_be_bytes(crc_bytes);
    let crc_actual = crc32fast::hash(payload);

    if crc_stored != crc_actual {
        return Err("st3gg: CRC32 mismatch — payload corrupted".into());
    }

    let value = serde_json::from_slice(payload)?;
    Ok(value)
}
