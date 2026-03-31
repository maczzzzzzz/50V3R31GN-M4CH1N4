// zeroclaw/src/cv/mod.rs
//
// Phase 6: Project Eyes-On — Computer Vision module.
//
// Submodules:
//   edge_detector — Canny + Hough wall extraction from map screenshots.

pub mod edge_detector;
pub use edge_detector::{detect_walls, walls_to_foundry_json, WallSegment};
