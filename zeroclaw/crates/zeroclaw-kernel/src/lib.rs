// ZeroClaw library crate
pub mod server;
pub mod rules;
pub mod rdt;
pub mod cv;
pub mod perception;
pub mod steganography;
pub mod linguistics;

// Phase 22.5: VSB Sovereign Binary Schema (shared wire protocol)
pub use sovereign_sdk::protocol as vsb_protocol;
