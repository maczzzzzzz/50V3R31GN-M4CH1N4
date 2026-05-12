//! Layout tests for Pretext Core
//!
//! Verifies bit-identical text layout calculations

use pretext_core::PretextEngine;

#[test]
fn test_exact_shrinkwrap() {
    let engine = PretextEngine::new("Georgia", 16);
    let layout = engine.layout("Thought Stream", 100.0);
    assert_eq!(layout.tight_width, 62.72); // Calculated from Georgia font metrics
}
