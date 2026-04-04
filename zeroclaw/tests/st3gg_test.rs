// Integration test: ST3GG LSB steganography round-trip.
// Run: cargo test --test st3gg_test

use zeroclaw::steganography::{decode, encode};

/// A 1x1 white RGBA PNG (the smallest valid PNG possible).
fn minimal_png() -> Vec<u8> {
    // Generated via: python3 -c "
    //   import struct, zlib
    //   def chunk(tag, data): s = struct.pack('>I', len(data)) + tag + data; return s + struct.pack('>I', zlib.crc32(s[4:]) & 0xffffffff)
    //   sig = b'\x89PNG\r\n\x1a\n'
    //   ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', 1, 1, 8, 2, 0, 0, 0))
    //   idat = chunk(b'IDAT', zlib.compress(b'\x00\xff\xff\xff'))
    //   iend = chunk(b'IEND', b'')
    //   print(list(sig+ihdr+idat+iend))
    // "
    // Instead, build a larger synthetic image using the `image` crate to keep the test
    // self-contained (no external file dependency).
    //
    // We create a 32x32 RGBA image filled with white pixels — 32*32*4 = 4096 bytes of
    // pixel data, which can carry 4096/8 = 512 bytes of payload.
    use image::{ImageBuffer, Rgba};
    let img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::from_fn(32, 32, |_, _| Rgba([255u8, 255, 255, 255]));
    let mut buf = std::io::Cursor::new(Vec::new());
    img.write_to(&mut buf, image::ImageFormat::Png).expect("PNG encode failed");
    buf.into_inner()
}

#[test]
fn round_trip_ascii() {
    let payload = "NETRUNNER";
    let png_bytes = minimal_png();
    let encoded = encode(&png_bytes, payload.as_bytes()).expect("encode failed");
    let decoded = decode(&encoded).expect("decode failed");
    assert_eq!(decoded, payload.as_bytes(), "decoded bytes should equal original payload");
}

#[test]
fn round_trip_json() {
    let payload = r#"{"district":"Watson","walls":[[0,0,100,0],[100,0,100,100]]}"#;
    let png_bytes = minimal_png();
    let encoded = encode(&png_bytes, payload.as_bytes()).expect("encode failed");
    let decoded = decode(&encoded).expect("decode failed");
    assert_eq!(decoded, payload.as_bytes());
}

#[test]
fn encode_rejects_oversized_payload() {
    // 512 bytes capacity for a 32x32 RGBA image; 600 bytes should fail.
    let big_payload = vec![0xAAu8; 600];
    let png_bytes = minimal_png();
    let result = encode(&png_bytes, &big_payload);
    assert!(result.is_err(), "encode should fail when payload exceeds capacity");
}
