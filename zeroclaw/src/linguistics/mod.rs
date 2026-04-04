//! zeroclaw/src/linguistics/mod.rs
//!
//! Phase 20 Task 3 — P4RS3LT0NGV3 Linguistic Steganography Engine
//!
//! Encodes binary payloads into Skillstone conlang text by substituting
//! equivalent morpheme variants ("synonym substitution" channel). Pairs of
//! interchangeable morphemes drawn from the Skillstone phoneme pool act as
//! "carriers": choosing variant A encodes a 0 bit; variant B encodes a 1 bit.
//!
//! ── Encoding scheme ───────────────────────────────────────────────────────────
//!   Payload is length-prefixed (1 × u8, max 255 bytes) before bit-packing.
//!   Carrier words are identified by suffix match (longest-suffix-first to avoid
//!   ambiguity between e.g. "ra" and the "sha" terminal pair).
//!   Non-carrier words pass through unchanged, preserving semantic content.
//!
//! ── Carrier pair table ────────────────────────────────────────────────────────
//!   Each entry is (form_a → bit 0, form_b → bit 1).
//!   Morphemes are drawn from the same pools used by the Skillstone generator
//!   (TENSE_PARTICLES, NEG_FORMS, PLURAL_ANIMATE, PLURAL_INANIMATE,
//!   QUESTION_PARTICLES) so substitutions are always grammatically valid.
//!
//! ── Capacity ──────────────────────────────────────────────────────────────────
//!   A 20-word Skillstone bark typically contains 6–10 carrier words, giving
//!   6–10 bits of covert capacity (≈1 byte of payload + the 8-bit length prefix).
//!   Longer texts or repeated particle usage increase capacity proportionally.

// ── Carrier pair table ────────────────────────────────────────────────────────
// Ordered longest-suffix-first to prevent "sha" being shadowed by "a".

const CARRIER_PAIRS: &[(&str, &str)] = &[
    ("zha", "me"),  // tense particles (free): zha ↔ me
    ("sha", "ve"),  // question / terminal particles: sha ↔ ve
    ("ra",  "va"),  // tense particles: past-ra ↔ habitual-va
    ("ku",  "shi"), // tense particles: future-ku ↔ present-shi
    ("ke",  "mo"),  // question particles: ke ↔ mo
    ("da",  "no"),  // negation suffixes: -da ↔ -no
    ("ak",  "ri"),  // animate plural suffixes: -ak ↔ -ri
    ("ek",  "ok"),  // inanimate plural suffixes: -ek ↔ -ok
];

/// Payload bytes exceeding this limit cannot be encoded by a single call.
const MAX_PAYLOAD_BYTES: usize = 255;

// ── Bit helpers ───────────────────────────────────────────────────────────────

fn bytes_to_bits(bytes: &[u8]) -> Vec<u8> {
    let mut bits = Vec::with_capacity(bytes.len() * 8);
    for &byte in bytes {
        for shift in (0..8).rev() {
            bits.push((byte >> shift) & 1);
        }
    }
    bits
}

fn bits_to_bytes(bits: &[u8]) -> Vec<u8> {
    bits.chunks(8)
        .map(|chunk| {
            chunk.iter().enumerate().fold(0u8, |acc, (i, &bit)| {
                acc | (bit << (7 - i))
            })
        })
        .collect()
}

// ── Carrier identification ────────────────────────────────────────────────────

/// Return `(pair_index, current_bit)` if `word` ends with a carrier morpheme,
/// else `None`. Longest-suffix-first ordering in `CARRIER_PAIRS` prevents
/// shorter morphemes from shadowing longer ones.
fn carrier_match(word: &str) -> Option<(usize, u8)> {
    let lower = word.to_lowercase();
    for (i, &(a, b)) in CARRIER_PAIRS.iter().enumerate() {
        if lower.ends_with(a) {
            return Some((i, 0));
        }
        if lower.ends_with(b) {
            return Some((i, 1));
        }
    }
    None
}

/// Replace the carrier suffix in `word` with the variant that encodes `target_bit`.
/// Preserves the case of the word stem.
fn apply_variant(word: &str, pair_idx: usize, target_bit: u8) -> String {
    let (a, b) = CARRIER_PAIRS[pair_idx];
    let lower = word.to_lowercase();

    // Determine which suffix is currently present and which to replace it with.
    let (old_suffix, new_suffix) = if target_bit == 0 {
        // Want bit 0 → need form_a; if currently form_b, replace with form_a
        (b, a)
    } else {
        // Want bit 1 → need form_b; if currently form_a, replace with form_b
        (a, b)
    };

    if lower.ends_with(old_suffix) {
        let stem = &word[..word.len() - old_suffix.len()];
        format!("{}{}", stem, new_suffix)
    } else {
        // Already in the correct variant form — no change needed.
        word.to_string()
    }
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Encode a binary `payload` into `text` via morpheme-variant substitution.
///
/// The payload is prefixed with a 1-byte length field before bit-packing into
/// carrier words. Non-carrier words pass through unchanged. Word boundaries
/// (whitespace) are preserved exactly.
///
/// Returns `Err` if:
/// - `payload` exceeds 255 bytes.
/// - `text` does not contain enough carrier words for the full bit stream.
pub fn encode(text: &str, payload: &[u8]) -> Result<String, String> {
    if payload.len() > MAX_PAYLOAD_BYTES {
        return Err(format!(
            "Payload too large: {} bytes (max {})",
            payload.len(),
            MAX_PAYLOAD_BYTES,
        ));
    }

    // Prepend length prefix so the decoder knows when to stop.
    let mut framed: Vec<u8> = Vec::with_capacity(1 + payload.len());
    framed.push(payload.len() as u8);
    framed.extend_from_slice(payload);

    let bits = bytes_to_bits(&framed);
    let mut bit_iter = bits.iter().copied().peekable();

    // Preserve original whitespace runs so the output is a faithful rewrite.
    // We split on whitespace boundaries but reconstruct with the same separators.
    let mut output = String::with_capacity(text.len());
    let mut char_iter = text.char_indices().peekable();

    // Collect leading whitespace
    while let Some(&(_, ch)) = char_iter.peek() {
        if ch.is_whitespace() {
            output.push(ch);
            char_iter.next();
        } else {
            break;
        }
    }

    // Walk token-by-token (tokens separated by whitespace runs).
    while char_iter.peek().is_some() {
        // Collect one token
        let token_start = char_iter.peek().map(|&(i, _)| i).unwrap_or(text.len());
        let mut token_end = token_start;
        while let Some(&(i, ch)) = char_iter.peek() {
            if ch.is_whitespace() {
                break;
            }
            token_end = i + ch.len_utf8();
            char_iter.next();
        }
        let token = &text[token_start..token_end];

        // Encode a bit into this token if it's a carrier and we still have bits.
        let out_token = if bit_iter.peek().is_some() {
            if let Some((pair_idx, _)) = carrier_match(token) {
                let target_bit = bit_iter.next().unwrap();
                apply_variant(token, pair_idx, target_bit)
            } else {
                token.to_string()
            }
        } else {
            token.to_string()
        };
        output.push_str(&out_token);

        // Collect trailing whitespace after this token
        while let Some(&(_, ch)) = char_iter.peek() {
            if ch.is_whitespace() {
                output.push(ch);
                char_iter.next();
            } else {
                break;
            }
        }
    }

    if bit_iter.peek().is_some() {
        let remaining = bit_iter.count() + 1; // +1 for the peeked bit
        return Err(format!(
            "Insufficient carrier capacity: {} bits remaining unencoded. \
             Provide a longer text or a smaller payload.",
            remaining,
        ));
    }

    Ok(output)
}

/// Decode a binary payload previously embedded by [`encode`].
///
/// Walks carrier words left-to-right, extracting one bit per carrier. Reads
/// the 8-bit length prefix first, then extracts exactly `length × 8` payload
/// bits. Returns `Err` if the text has too few carriers to read the prefix or
/// the declared payload.
pub fn decode(text: &str) -> Result<Vec<u8>, String> {
    let mut bits: Vec<u8> = Vec::new();

    for token in text.split_whitespace() {
        if let Some((_, current_bit)) = carrier_match(token) {
            bits.push(current_bit);
        }
    }

    if bits.len() < 8 {
        return Err(format!(
            "Insufficient carriers to read length prefix: found {} bits, need 8",
            bits.len(),
        ));
    }

    let length = bits_to_bytes(&bits[..8])[0] as usize;
    let total_bits_needed = 8 + length * 8;

    if bits.len() < total_bits_needed {
        return Err(format!(
            "Insufficient carriers for declared payload: need {} bits, found {}",
            total_bits_needed,
            bits.len(),
        ));
    }

    Ok(bits_to_bytes(&bits[8..total_bits_needed]))
}

// ── Unit tests ────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    /// Build a text that has at least `n_carriers` carrier words.
    fn carrier_text(n: usize) -> String {
        // Each word here ends in a registered carrier morpheme.
        let carriers = ["ra", "va", "ku", "shi", "ke", "mo", "da", "no",
                        "ak", "ri", "ek", "ok", "zha", "me", "sha", "ve"];
        carriers.iter().cycle().take(n)
            .map(|s| s.to_string())
            .collect::<Vec<_>>()
            .join(" ")
    }

    #[test]
    fn test_round_trip_single_byte() {
        // Need 8 (length prefix) + 8 (1 byte payload) = 16 carrier words.
        let text = carrier_text(20);
        let payload = b"X";
        let encoded = encode(&text, payload).expect("encode failed");
        let decoded = decode(&encoded).expect("decode failed");
        assert_eq!(decoded.as_slice(), payload.as_ref());
    }

    #[test]
    fn test_round_trip_two_bytes() {
        // Need 8 + 16 = 24 carrier words.
        let text = carrier_text(30);
        let payload = b"Hi";
        let encoded = encode(&text, payload).expect("encode failed");
        let decoded = decode(&encoded).expect("decode failed");
        assert_eq!(decoded.as_slice(), payload.as_ref());
    }

    #[test]
    fn test_empty_payload_round_trip() {
        // Need at least 8 carriers for the length prefix (value 0).
        let text = carrier_text(10);
        let payload: &[u8] = b"";
        let encoded = encode(&text, payload).expect("encode failed");
        let decoded = decode(&encoded).expect("decode failed");
        assert_eq!(decoded.as_slice(), payload);
    }

    #[test]
    fn test_non_carrier_words_pass_through_unchanged() {
        // Mix of carrier and non-carrier words; non-carriers must survive verbatim.
        let text = "Vekh ra koru-tse zheva da";
        // Need 16 carriers for a 1-byte payload — this text has fewer.
        // Use a zero payload so we need exactly 8+8=16 bits.
        // This text has 3 carriers: "ra", "zheva" (ends in 'a'? no), "da"
        // Actually: "ra" → pair (ra,va), "da" → pair (da,no) → 2 carriers only.
        // 2 bits < 16 needed → should error.
        let result = encode(text, b"X");
        // We just want to confirm non-carrier words were not touched in the
        // portion that was processed — check by encoding a zero-bit payload
        // that only touches the first few carriers.
        // Use a shorter route: encode empty payload (needs 8 bits = 8 carriers).
        // Still only 2 carriers here → error. Use carrier_text instead:
        let mixed = format!("Vekh {} koru tse {} zheva", carrier_text(8), carrier_text(8));
        let encoded = encode(&mixed, b"").expect("encode failed");
        assert!(encoded.contains("Vekh"));
        assert!(encoded.contains("koru"));
        assert!(encoded.contains("tse"));
        assert!(encoded.contains("zheva"));
        let _ = result; // expected error — just checking non-carriers
    }

    #[test]
    fn test_insufficient_capacity_returns_err() {
        // Only 2 carrier words → 2 bits < 16 needed for 1-byte payload.
        let text = "ra ke";
        let result = encode(text, b"X");
        assert!(result.is_err(), "expected error on insufficient capacity");
        assert!(result.unwrap_err().contains("Insufficient carrier capacity"));
    }

    #[test]
    fn test_decode_no_carriers_returns_err() {
        let result = decode("absolutely no carrier morphemes here at all");
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Insufficient carriers to read length prefix"));
    }

    #[test]
    fn test_payload_too_large_returns_err() {
        let text = carrier_text(10); // irrelevant — error fires before scanning
        let big_payload = vec![0u8; 256];
        let result = encode(&text, &big_payload);
        assert!(result.is_err());
        assert!(result.unwrap_err().contains("Payload too large"));
    }

    #[test]
    fn test_bits_round_trip() {
        let bytes = vec![0b10110010u8, 0b00001111u8, 0b11001100u8];
        let bits = bytes_to_bits(&bytes);
        let recovered = bits_to_bytes(&bits);
        assert_eq!(recovered, bytes);
    }

    #[test]
    fn test_apply_variant_flips_correctly() {
        // pair 0: ("zha", "me") — zha=0, me=1
        assert_eq!(apply_variant("zha", 0, 1), "me");   // 0→1: replace zha with me
        assert_eq!(apply_variant("me",  0, 0), "zha");  // 1→0: replace me with zha
        assert_eq!(apply_variant("zha", 0, 0), "zha");  // already 0: no change
        assert_eq!(apply_variant("me",  0, 1), "me");   // already 1: no change
    }

    #[test]
    fn test_stem_preserved_on_variant_flip() {
        // "vekh-ra" has stem "vekh-" and carrier "ra"
        let flipped = apply_variant("vekh-ra", 2, 1); // pair 2 = ("ra","va"), bit 1 → "va"
        assert_eq!(flipped, "vekh-va");
    }

    #[test]
    fn test_whitespace_preserved_in_output() {
        let text = carrier_text(10);
        let encoded = encode(&text, b"").expect("encode failed");
        // Word count must be identical
        let original_words: Vec<&str> = text.split_whitespace().collect();
        let encoded_words: Vec<&str> = encoded.split_whitespace().collect();
        assert_eq!(original_words.len(), encoded_words.len());
    }
}
