/**
 * SOVEREIGN VESPER EYE — PHASE 78, TASK 2
 *
 * Autonomous sensory ingress for the Vesper Mesh Integration.
 *
 * ┌──────────────────────────────────────────────────────────────────┐
 * │  PatternMatcher  — regex rule set for Scribe drift detection    │
 * │  LogDistiller    — file-watch log tail + SPO triplet extraction  │
 * └──────────────────────────────────────────────────────────────────┘
 *
 * VRAM invariant: this crate has zero inference dependencies.
 * All pattern matching is deterministic regex — no GPU budget consumed.
 */

pub mod log_distiller;
pub mod pattern_matcher;

pub use log_distiller::LogDistiller;
pub use pattern_matcher::{PatternMatcher, TripletProposal};
