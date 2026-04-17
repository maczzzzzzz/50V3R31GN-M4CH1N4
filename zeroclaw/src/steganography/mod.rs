// steganography/mod.rs — ST3GG Rust (Node A Engine)
//
// LSB steganography over PNG pixel buffers.
//
// Wire format encoded into the image's LSBs:
//   - Bytes 0..=3  : big-endian u32 payload length (in bytes)
//   - Bytes 4..N+3 : raw payload bytes
//   - Bytes N+4..  : big-endian u64 FNV-1a checksum
//
// Each byte of the wire format occupies 8 consecutive RGBA channels (one bit
// per channel), reading channels in row-major order: R, G, B, A of pixel 0,
// then R, G, B, A of pixel 1, …
//
// Only the least-significant bit of each channel is touched.  The visual
// change is imperceptible (±1 per channel).

use image::{DynamicImage, GenericImageView, ImageBuffer, Rgba};
use std::io::Cursor;

/// Native FNV-1a 64-bit implementation to match VSB standards.
fn fnv1a_64(data: &[u8]) -> u64 {
    let mut hash: u64 = 0xcbf29ce484222325;
    for &byte in data {
        hash ^= byte as u64;
        hash = hash.wrapping_mul(0x100000001b3);
    }
    hash
}

/// Encode `payload` into the LSBs of a PNG image supplied as raw bytes.
/// Returns the modified PNG as a `Vec<u8>`.
pub fn encode(img_bytes: &[u8], payload: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let img = image::load_from_memory(img_bytes)?;
    let (width, height) = img.dimensions();
    let capacity_bytes = (width * height * 4 / 8) as usize;

    let payload_len = payload.len();
    let wire_len = 4 + payload_len + 8; // 4-byte length header + payload + 8-byte FNV-1a
    if wire_len > capacity_bytes {
        return Err(format!(
            "ST3GG encode: payload {} bytes + 12 header exceeds image capacity of {} bytes ({}x{} RGBA)",
            payload_len, capacity_bytes, width, height
        ).into());
    }

    // wire format: [4B length][payload][8B FNV-1a]
    let mut wire = Vec::with_capacity(wire_len);
    wire.extend_from_slice(&(payload_len as u32).to_be_bytes());
    wire.extend_from_slice(payload);
    let checksum = fnv1a_64(payload);
    wire.extend_from_slice(&checksum.to_be_bytes());

    // Convert to bit stream (MSB first within each byte)
    let bits: Vec<u8> = wire
        .iter()
        .flat_map(|byte| (0..8).rev().map(move |i| (byte >> i) & 1))
        .collect();

    let mut rgba = img.to_rgba8();
    let mut bit_idx = 0usize;

    'outer: for pixel in rgba.pixels_mut() {
        for channel in pixel.0.iter_mut() {
            if bit_idx >= bits.len() {
                break 'outer;
            }
            *channel = (*channel & 0xFE) | bits[bit_idx];
            bit_idx += 1;
        }
    }

    let mut out = Cursor::new(Vec::new());
    let out_img = DynamicImage::ImageRgba8(rgba);
    out_img.write_to(&mut out, image::ImageFormat::Png)?;
    Ok(out.into_inner())
}

/// Decode a payload previously embedded by `encode` from a PNG's LSBs.
pub fn decode(img_bytes: &[u8]) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let img = image::load_from_memory(img_bytes)?;
    let (width, height) = img.dimensions();
    let capacity_bytes = (width * height * 4 / 8) as usize;

    let rgba = img.to_rgba8();
    let bits: Vec<u8> = rgba
        .pixels()
        .flat_map(|p| p.0.iter().map(|c| c & 1).collect::<Vec<_>>())
        .collect();

    let len_bits = &bits[..32];
    let mut payload_len: u32 = 0;
    for &b in len_bits {
        payload_len = (payload_len << 1) | (b as u32);
    }

    let payload_len = payload_len as usize;
    let wire_len = 4 + payload_len + 8;
    if wire_len > capacity_bytes {
        return Err(format!(
            "ST3GG decode: embedded length {} exceeds image capacity {} bytes — not a ST3GG image or corrupted",
            payload_len, capacity_bytes
        ).into());
    }

    let total_wire_bits = 32 + (payload_len + 8) * 8;
    if total_wire_bits > bits.len() {
        return Err(format!(
            "ST3GG decode: embedded length {} requires {} bits, but image only has {} bits",
            payload_len, total_wire_bits, bits.len()
        ).into());
    }

    let block_bits = &bits[32..total_wire_bits];
    let block: Vec<u8> = block_bits
        .chunks(8)
        .map(|chunk| chunk.iter().fold(0u8, |acc, &b| (acc << 1) | b))
        .collect();

    let payload = &block[..payload_len];
    let mut sum_bytes = [0u8; 8];
    sum_bytes.copy_from_slice(&block[payload_len..]);
    let sum_stored = u64::from_be_bytes(sum_bytes);
    let sum_actual = fnv1a_64(payload);

    if sum_stored != sum_actual {
        return Err("st3gg: integrity mismatch — payload may be corrupted".into());
    }

    Ok(payload.to_vec())
}

/// Convenience: encode JSON `value` into the image and return modified PNG bytes.
pub fn encode_json(
    img_bytes: &[u8],
    value: &serde_json::Value,
) -> Result<Vec<u8>, Box<dyn std::error::Error + Send + Sync>> {
    let json_bytes = serde_json::to_vec(value)?;
    encode(img_bytes, &json_bytes)
}

/// Convenience: decode and parse JSON from a ST3GG image.
pub fn decode_json(
    img_bytes: &[u8],
) -> Result<serde_json::Value, Box<dyn std::error::Error + Send + Sync>> {
    let raw = decode(img_bytes)?;
    let value = serde_json::from_slice(&raw)?;
    Ok(value)
}

#[cfg(test)]
mod unit_tests {
    use super::*;

    fn white_png(w: u32, h: u32) -> Vec<u8> {
        let img: ImageBuffer<Rgba<u8>, Vec<u8>> =
            ImageBuffer::from_fn(w, h, |_, _| Rgba([255u8, 255, 255, 255]));
        let mut buf = Cursor::new(Vec::new());
        img.write_to(&mut buf, image::ImageFormat::Png).unwrap();
        buf.into_inner()
    }

    #[test]
    fn unit_round_trip_bytes() {
        let payload = b"BlackIce";
        let img = white_png(32, 32);
        let encoded = encode(&img, payload).unwrap();
        let decoded = decode(&encoded).unwrap();
        assert_eq!(decoded, payload);
    }

    #[test]
    fn unit_round_trip_json_value() {
        let val = serde_json::json!({ "walls": [[0,0,100,100]] });
        let img = white_png(64, 64);
        let encoded = encode_json(&img, &val).unwrap();
        let decoded = decode_json(&encoded).unwrap();
        assert_eq!(decoded["walls"][0][2], 100);
    }
}
