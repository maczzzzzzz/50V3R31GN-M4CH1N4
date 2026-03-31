// zeroclaw/src/cv/edge_detector.rs
//
// Phase 6: Project Eyes-On — Geometric Wall Engine (Node A)
//
// Pipeline:
//   PNG bytes → Grayscale → Canny edges → Hough lines → Foundry walls JSON
//
// Coordinate Transform:
//   SceneX = PixelX + (ImageWidth  * Padding)
//   SceneY = PixelY + (ImageHeight * Padding)

use anyhow::Result;
use image::DynamicImage;
use imageproc::edges::canny;
use imageproc::hough::{detect_lines, LineDetectionOptions, PolarLine};
use serde_json::{json, Value};
use std::f64::consts::PI;

// ── Defaults ──────────────────────────────────────────────────────────────────

const CANNY_LOW: f32 = 50.0;
const CANNY_HIGH: f32 = 100.0;
const VOTE_THRESHOLD: u32 = 50;
const SUPPRESSION_RADIUS: f64 = 8.0;

// ── Public types ──────────────────────────────────────────────────────────────

#[derive(Debug, PartialEq)]
pub struct WallSegment {
    pub x1: f64,
    pub y1: f64,
    pub x2: f64,
    pub y2: f64,
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Detect structural walls in a map image.
///
/// `image_bytes` — raw PNG (or any image format supported by the `image` crate).
/// `padding`     — fractional offset applied to both axes (e.g. 0.05 = 5 % of image dimension).
///
/// Returns a `Vec<WallSegment>` with Scene-space coordinates.
pub fn detect_walls(image_bytes: &[u8], padding: f64) -> Result<Vec<WallSegment>> {
    let img = image::load_from_memory(image_bytes)?;
    let width = img.width();
    let height = img.height();

    let gray = img.to_luma8();
    let edges = canny(&gray, CANNY_LOW, CANNY_HIGH);

    let options = LineDetectionOptions {
        vote_threshold: VOTE_THRESHOLD,
        suppression_radius: SUPPRESSION_RADIUS,
    };
    let lines = detect_lines(&edges, options);

    let walls = lines
        .iter()
        .filter_map(|line| polar_to_wall(line, width, height, padding))
        .collect();

    Ok(walls)
}

/// Serialize wall segments to Foundry VTT v12 `walls` array JSON.
///
/// Each entry has the form `{ "c": [x1, y1, x2, y2] }`.
pub fn walls_to_foundry_json(walls: &[WallSegment]) -> Value {
    let arr: Vec<Value> = walls
        .iter()
        .map(|w| json!({ "c": [w.x1, w.y1, w.x2, w.y2] }))
        .collect();
    json!(arr)
}

// ── Private helpers ───────────────────────────────────────────────────────────

/// Convert a Hough polar line to a wall segment clipped to the image bounds,
/// then apply the Scene coordinate transform.
fn polar_to_wall(line: &PolarLine, width: u32, height: u32, padding: f64) -> Option<WallSegment> {
    let theta = (line.angle_in_degrees as f64) * PI / 180.0;
    let r = line.r as f64;
    let w = width as f64;
    let h = height as f64;

    // Foot of perpendicular from origin: the unique point on the line closest to (0,0).
    let px = r * theta.cos();
    let py = r * theta.sin();

    // Direction along the line (perpendicular to the normal).
    let dx = -theta.sin();
    let dy = theta.cos();

    let (t1, t2) = line_box_clip(px, py, dx, dy, w, h)?;

    Some(WallSegment {
        x1: scene_x(px + t1 * dx, w, padding),
        y1: scene_y(py + t1 * dy, h, padding),
        x2: scene_x(px + t2 * dx, w, padding),
        y2: scene_y(py + t2 * dy, h, padding),
    })
}

/// `SceneX = PixelX + (ImageWidth * Padding)`
#[inline]
fn scene_x(pixel_x: f64, img_width: f64, padding: f64) -> f64 {
    pixel_x + img_width * padding
}

/// `SceneY = PixelY + (ImageHeight * Padding)`
#[inline]
fn scene_y(pixel_y: f64, img_height: f64, padding: f64) -> f64 {
    pixel_y + img_height * padding
}

/// Parametric line–box clipping (Liang–Barsky variant).
///
/// Given a point `(px, py)` and direction `(dx, dy)`, find `t_min` and `t_max`
/// such that `(px + t*dx, py + t*dy)` lies within `[0, w] × [0, h]`.
/// Returns `None` if the line misses the box entirely.
fn line_box_clip(
    px: f64, py: f64,
    dx: f64, dy: f64,
    w: f64,  h: f64,
) -> Option<(f64, f64)> {
    let mut t_min = f64::NEG_INFINITY;
    let mut t_max = f64::INFINITY;

    // X slab [0, w]
    if dx.abs() > 1e-10 {
        let t0 = -px / dx;
        let t1 = (w - px) / dx;
        t_min = t_min.max(t0.min(t1));
        t_max = t_max.min(t0.max(t1));
    } else if px < 0.0 || px > w {
        return None;
    }

    // Y slab [0, h]
    if dy.abs() > 1e-10 {
        let t0 = -py / dy;
        let t1 = (h - py) / dy;
        t_min = t_min.max(t0.min(t1));
        t_max = t_max.min(t0.max(t1));
    } else if py < 0.0 || py > h {
        return None;
    }

    if t_min > t_max {
        return None;
    }

    Some((t_min, t_max))
}

// ── Tests ─────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;
    use image::{DynamicImage, GrayImage, Luma};

    // ── Helper: encode a GrayImage to PNG bytes ────────────────────────────

    fn gray_to_png(img: GrayImage) -> Vec<u8> {
        let mut buf = Vec::new();
        DynamicImage::ImageLuma8(img)
            .write_to(&mut std::io::Cursor::new(&mut buf), image::ImageFormat::Png)
            .expect("test PNG encode failed");
        buf
    }

    // ── Foundry schema ─────────────────────────────────────────────────────

    #[test]
    fn test_foundry_json_schema() {
        let walls = vec![
            WallSegment { x1: 10.0, y1: 20.0, x2: 100.0, y2: 20.0 },
            WallSegment { x1: 100.0, y1: 20.0, x2: 100.0, y2: 80.0 },
        ];

        let json = walls_to_foundry_json(&walls);
        let arr = json.as_array().expect("root must be array");
        assert_eq!(arr.len(), 2);

        let c = arr[0].get("c").expect("must have 'c' key");
        let coords = c.as_array().expect("'c' must be array");
        assert_eq!(coords.len(), 4);
        assert_eq!(coords[0].as_f64().unwrap(), 10.0);
        assert_eq!(coords[1].as_f64().unwrap(), 20.0);
        assert_eq!(coords[2].as_f64().unwrap(), 100.0);
        assert_eq!(coords[3].as_f64().unwrap(), 20.0);
    }

    #[test]
    fn test_foundry_json_empty() {
        let json = walls_to_foundry_json(&[]);
        assert_eq!(json.as_array().unwrap().len(), 0);
    }

    // ── Scene coordinate transform ─────────────────────────────────────────

    #[test]
    fn test_scene_x_with_padding() {
        // SceneX = 100 + (1000 * 0.05) = 150
        let result = scene_x(100.0, 1000.0, 0.05);
        assert!((result - 150.0).abs() < 1e-9, "expected 150.0, got {result}");
    }

    #[test]
    fn test_scene_x_zero_padding() {
        let result = scene_x(100.0, 1000.0, 0.0);
        assert!((result - 100.0).abs() < 1e-9);
    }

    #[test]
    fn test_scene_y_with_padding() {
        // SceneY = 50 + (800 * 0.1) = 130
        let result = scene_y(50.0, 800.0, 0.1);
        assert!((result - 130.0).abs() < 1e-9, "expected 130.0, got {result}");
    }

    // ── Line–box clipping ──────────────────────────────────────────────────

    #[test]
    fn test_clip_horizontal_line() {
        // Horizontal line through y=50, in a 100×100 box.
        let result = line_box_clip(50.0, 50.0, 1.0, 0.0, 100.0, 100.0);
        let (t1, t2) = result.expect("should intersect box");
        let x1 = 50.0 + t1 * 1.0;
        let x2 = 50.0 + t2 * 1.0;
        assert!((x1 - 0.0).abs() < 1e-9, "x1 should be 0");
        assert!((x2 - 100.0).abs() < 1e-9, "x2 should be 100");
    }

    #[test]
    fn test_clip_line_outside_box() {
        // Horizontal line at y=200 is entirely outside a 100×100 box.
        let result = line_box_clip(0.0, 200.0, 1.0, 0.0, 100.0, 100.0);
        assert!(result.is_none());
    }

    #[test]
    fn test_clip_diagonal_line() {
        // 45° line through origin in a 100×100 box: t_min=-0, t_max at corner.
        let result = line_box_clip(0.0, 0.0, 1.0, 1.0, 100.0, 100.0);
        let (t1, t2) = result.expect("diagonal should intersect");
        assert!(t1 <= t2);
        // Should extend from (0,0) to (100,100)
        assert!((0.0 + t1 * 1.0 - 0.0).abs() < 1e-9);
        assert!((0.0 + t2 * 1.0 - 100.0).abs() < 1e-9);
    }

    // ── detect_walls: blank image ──────────────────────────────────────────

    #[test]
    fn test_detect_walls_blank_image() {
        // A completely white image has no edges → no walls.
        let img = GrayImage::from_pixel(100, 100, Luma([255u8]));
        let png = gray_to_png(img);

        let walls = detect_walls(&png, 0.0).expect("detect_walls failed");
        assert_eq!(walls.len(), 0, "blank image must yield no walls");
    }

    // ── detect_walls: rectangle border ────────────────────────────────────

    #[test]
    fn test_detect_walls_rectangle() {
        // White image with a solid black rectangle border → at least 2 wall lines.
        let mut img = GrayImage::from_pixel(200, 200, Luma([255u8]));

        for x in 20..180u32 {
            img.put_pixel(x, 20, Luma([0u8]));
            img.put_pixel(x, 179, Luma([0u8]));
        }
        for y in 20..180u32 {
            img.put_pixel(20, y, Luma([0u8]));
            img.put_pixel(179, y, Luma([0u8]));
        }

        let png = gray_to_png(img);
        let walls = detect_walls(&png, 0.0).expect("detect_walls failed");

        assert!(
            walls.len() >= 2,
            "rectangle should yield at least 2 walls, got {}",
            walls.len()
        );
    }

    // ── detect_walls: padding shifts coordinates ───────────────────────────

    #[test]
    fn test_detect_walls_padding_shifts_coordinates() {
        // Same rectangle, 0 padding vs 0.1 padding.
        // Scene coords with padding must all be >= those without.
        let mut img = GrayImage::from_pixel(200, 200, Luma([255u8]));
        for x in 20..180u32 {
            img.put_pixel(x, 20, Luma([0u8]));
            img.put_pixel(x, 179, Luma([0u8]));
        }
        for y in 20..180u32 {
            img.put_pixel(20, y, Luma([0u8]));
            img.put_pixel(179, y, Luma([0u8]));
        }

        let png = gray_to_png(img);
        let walls_0 = detect_walls(&png, 0.0).expect("detect_walls 0 padding failed");
        let walls_p = detect_walls(&png, 0.1).expect("detect_walls 0.1 padding failed");

        // Both runs must return same number of lines (identical image / same threshold)
        assert_eq!(walls_0.len(), walls_p.len(), "padding must not change wall count");

        // Every padded coordinate must exceed the unpadded one by exactly 200 * 0.1 = 20
        for (w0, wp) in walls_0.iter().zip(walls_p.iter()) {
            assert!((wp.x1 - w0.x1 - 20.0).abs() < 1e-6, "x1 padding delta wrong");
            assert!((wp.y1 - w0.y1 - 20.0).abs() < 1e-6, "y1 padding delta wrong");
            assert!((wp.x2 - w0.x2 - 20.0).abs() < 1e-6, "x2 padding delta wrong");
            assert!((wp.y2 - w0.y2 - 20.0).abs() < 1e-6, "y2 padding delta wrong");
        }
    }
}
