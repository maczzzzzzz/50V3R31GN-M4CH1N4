use egui::{Color32, FontId, Painter, Pos2, Rect, Stroke};
use rand::Rng;

/// Egui paint-based glitch engine.
///
/// Intensity is driven by `intrusion_level` from the Mmap (0.0–1.0).
/// At low intensity nothing is drawn.  Above 0.3 scanlines, noise pixels,
/// and a jitter offset are applied.  Above 0.7 a full hue-shift overlay
/// and edge flash are added.
pub struct GlitchEngine {
    intensity: f32,
    rng: rand::rngs::ThreadRng,
}

impl GlitchEngine {
    pub fn new() -> Self {
        Self {
            intensity: 0.0,
            rng: rand::thread_rng(),
        }
    }

    /// Sync intrusion level from Mmap state.  Range [0.0, 1.0].
    pub fn set_intensity(&mut self, level: f32) {
        self.intensity = level.clamp(0.0, 1.0);
    }

    /// Paint glitch effects onto `painter` over `rect`.
    ///
    /// `ctx` is used to sample monotonic time for scanline animation.
    pub fn paint(&mut self, painter: &Painter, rect: Rect, ctx: &egui::Context) {
        if self.intensity < 0.05 {
            return;
        }

        let t = ctx.input(|i| i.time) as f32;

        // ── Scanlines ─────────────────────────────────────────────────────────
        // Subtle horizontal lines at ~4px pitch, alpha proportional to intensity.
        let scanline_alpha = (self.intensity * 40.0).min(40.0) as u8;
        let scanline_color = Color32::from_rgba_unmultiplied(0, 0, 0, scanline_alpha);
        let mut y = rect.top();
        while y < rect.bottom() {
            painter.line_segment(
                [Pos2::new(rect.left(), y), Pos2::new(rect.right(), y)],
                Stroke::new(1.0, scanline_color),
            );
            y += 4.0;
        }

        // ── Noise pixels ─────────────────────────────────────────────────────
        let noise_count = (self.intensity * 30.0) as usize;
        for _ in 0..noise_count {
            let rx: f32 = self.rng.gen_range(rect.left()..rect.right());
            let ry: f32 = self.rng.gen_range(rect.top()..rect.bottom());
            let alpha: u8 = self.rng.gen_range(80..200);
            let color = if self.intensity > 0.7 {
                Color32::from_rgba_unmultiplied(0xff, 0x20, 0x20, alpha)
            } else {
                Color32::from_rgba_unmultiplied(0x00, 0xf3, 0xff, alpha)
            };
            painter.circle_filled(Pos2::new(rx, ry), 1.5, color);
        }

        // ── Horizontal jitter bands ───────────────────────────────────────────
        // At intrusion > 0.5 draw 1-3 displaced horizontal slices.
        if self.intensity > 0.5 {
            let band_count = 1 + (self.intensity * 3.0) as usize;
            for i in 0..band_count {
                let band_y = rect.top()
                    + ((t * 2.3 + i as f32 * 97.1).sin().abs() * rect.height());
                let band_h = 3.0 + self.rng.gen_range(0.0f32..6.0);
                let shift = (t * 7.0 + i as f32 * 33.3).sin() * self.intensity * 20.0;
                let alpha: u8 = (self.intensity * 60.0) as u8;
                let slice_color =
                    Color32::from_rgba_unmultiplied(0x00, 0xf3, 0xff, alpha);
                let band_rect = Rect::from_min_max(
                    Pos2::new(rect.left() + shift, band_y),
                    Pos2::new(rect.right() + shift, band_y + band_h),
                );
                painter.rect_filled(band_rect, 0.0, slice_color);
            }
        }

        // ── Red edge flash (high intrusion) ───────────────────────────────────
        if self.intensity > 0.7 {
            let flash = (t * 5.0).sin() > 0.0;
            if flash {
                painter.rect_stroke(
                    rect,
                    0.0,
                    Stroke::new(2.0, Color32::from_rgba_unmultiplied(0xff, 0x20, 0x20, 180)),
                    egui::StrokeKind::Middle,
                );
                painter.text(
                    rect.center() + egui::vec2(0.0, -120.0),
                    egui::Align2::CENTER_CENTER,
                    "!! INTRUSION CRITICAL !!",
                    FontId::monospace(20.0),
                    Color32::from_rgba_unmultiplied(0xff, 0x20, 0x20, 200),
                );
            }
        }
    }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_glitch_engine_new_zero_intensity() {
        let engine = GlitchEngine::new();
        assert_eq!(engine.intensity, 0.0);
    }

    #[test]
    fn test_set_intensity_clamps_above_one() {
        let mut engine = GlitchEngine::new();
        engine.set_intensity(5.0);
        assert!((engine.intensity - 1.0).abs() < 1e-6, "intensity={}", engine.intensity);
    }

    #[test]
    fn test_set_intensity_clamps_below_zero() {
        let mut engine = GlitchEngine::new();
        engine.set_intensity(-1.0);
        assert!((engine.intensity - 0.0).abs() < 1e-6, "intensity={}", engine.intensity);
    }

    #[test]
    fn test_set_intensity_mid_range() {
        let mut engine = GlitchEngine::new();
        engine.set_intensity(0.42);
        assert!((engine.intensity - 0.42).abs() < 1e-6);
    }
}
