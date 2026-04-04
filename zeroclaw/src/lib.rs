// ZeroClaw library crate
pub mod server;
pub mod rules;
pub mod cv;
pub mod perception;
pub mod steganography;
pub mod linguistics;

// Phase 22.5: VSB Sovereign Binary Schema (shared wire protocol)
#[path = "../../src/shared/vsb_protocol.rs"]
pub mod vsb_protocol;
