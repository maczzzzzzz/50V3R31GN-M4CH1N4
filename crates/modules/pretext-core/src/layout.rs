//! Core Pretext layout arithmetic
//!
//! Provides pure geometric calculations for text layout without DOM dependency.
//! Implements the "Editorial Engine" for obstacle-aware thought streams.

use log::debug;

#[cfg(target_arch = "wasm32")]
use wasm_bindgen::prelude::*;

/// Represents a text segment with its metrics
#[derive(Debug, Clone, serde::Serialize)]
#[allow(dead_code)]
pub struct TextSegment {
    pub text: String,
    pub width: f32,
    pub char_count: usize,
}

/// Represents a single line in the layout
#[derive(Debug, Clone, serde::Serialize)]
#[allow(dead_code)]
pub struct LayoutLine {
    pub segments: Vec<TextSegment>,
    pub width: f32,
}

/// Result of a layout calculation
#[derive(Debug, Clone, serde::Serialize)]
pub struct LayoutResult {
    pub lines: Vec<LayoutLine>,
    pub tight_width: f32,
    pub total_height: f32,
}

/// Core engine for Pretext layout calculations
pub struct PretextEngine {
    font_family: String,
    font_size: f32,
    // Average character width for Georgia at 16px (empirical value)
    avg_char_width: f32,
    // Line height multiplier for Georgia (1.2 is standard)
    line_height_multiplier: f32,
}

impl PretextEngine {
    /// Create a new Pretext engine with specified font settings
    pub fn new(font_family: &str, font_size: u32) -> Self {
        let font_size = font_size as f32;

        // Approximate character widths for common fonts at 16px
        // These are empirical averages that work well for the "Editorial Engine"
        let avg_char_width = match font_family {
            "Georgia" => 0.56 * font_size,  // Georgia is wider
            "Arial" => 0.44 * font_size,
            "Courier New" => 0.60 * font_size, // Monospace
            _ => 0.50 * font_size, // Default fallback
        };

        Self {
            font_family: font_family.to_string(),
            font_size,
            avg_char_width,
            line_height_multiplier: 1.2,
        }
    }

    /// Step 1: Prepare phase - segment text and calculate metrics
    ///
    /// Splits input text into words and calculates their widths.
    /// This is a preprocessing step that enables fast layout recalculation.
    fn prepare(&self, text: &str) -> Vec<TextSegment> {
        debug!("Preparing text: '{}'", text);

        text.split_whitespace()
            .map(|word| TextSegment {
                text: word.to_string(),
                width: self.estimate_width(word),
                char_count: word.chars().count(),
            })
            .collect()
    }

    /// Estimate the width of a text string based on character count
    ///
    /// Uses the average character width for the configured font family.
    /// For production, this would use actual font metrics from a text shaping library.
    fn estimate_width(&self, text: &str) -> f32 {
        let char_count = text.chars().count() as f32;
        char_count * self.avg_char_width
    }

    /// Step 2: Layout phase - pure arithmetic line-breaking
    ///
    /// Arranges text segments into lines that fit within the specified width.
    /// Implements the "shrink-wrap" behavior where lines wrap naturally.
    pub fn layout(&self, text: &str, max_width: f32) -> LayoutResult {
        let segments = self.prepare(text);

        if segments.is_empty() {
            return LayoutResult {
                lines: vec![],
                tight_width: 0.0,
                total_height: 0.0,
            };
        }

        let mut lines: Vec<LayoutLine> = Vec::new();
        let mut current_line: Vec<TextSegment> = Vec::new();
        let mut current_width = 0.0;
        let mut tight_width: f32 = 0.0;

        for segment in &segments {
            let space_width = self.avg_char_width; // Space between words
            let segment_with_space = segment.width + space_width;

            // Check if adding this segment would exceed max width
            if current_width + segment_with_space > max_width && !current_line.is_empty() {
                // Finalize current line
                let line_width = current_width - self.avg_char_width; // Remove trailing space
                tight_width = tight_width.max(line_width);
                lines.push(LayoutLine {
                    segments: current_line.clone(),
                    width: line_width,
                });

                // Start new line
                current_line = vec![segment.clone()];
                current_width = segment.width;
            } else {
                current_line.push(segment.clone());
                current_width += segment_with_space;
            }
        }

        // Don't forget the last line
        if !current_line.is_empty() {
            let line_width = current_width - self.avg_char_width;
            tight_width = tight_width.max(line_width);
            lines.push(LayoutLine {
                segments: current_line,
                width: line_width,
            });
        }

        // Calculate total height
        let total_height = lines.len() as f32 * self.font_size * self.line_height_multiplier;

        debug!(
            "Layout complete: {} lines, tight_width: {}, total_height: {}",
            lines.len(),
            tight_width,
            total_height
        );

        LayoutResult {
            lines,
            tight_width,
            total_height,
        }
    }

    /// Step 3: walkLineRanges - binary search for optimal shrink-wrapping
    ///
    /// Finds the minimum width that accommodates all text without excessive
    /// line wrapping. Uses binary search for O(log n) performance.
    pub fn find_optimal_width(&self, text: &str, min_width: f32, max_width: f32) -> f32 {
        let mut low = min_width;
        let mut high = max_width;
        let mut optimal = max_width;

        // Binary search for the tightest width that fits
        while high - low > 1.0 {
            let mid = (low + high) / 2.0;
            let result = self.layout(text, mid);

            // If lines wrap too aggressively, increase width
            if result.lines.len() > 3 {
                low = mid;
            } else {
                optimal = mid;
                high = mid;
            }
        }

        optimal
    }

    /// Get line height for the current font configuration
    pub fn line_height(&self) -> f32 {
        self.font_size * self.line_height_multiplier
    }

    /// Get the current font family
    pub fn font_family(&self) -> &str {
        &self.font_family
    }

    /// Get the current font size
    pub fn font_size(&self) -> f32 {
        self.font_size
    }
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[cfg(target_arch = "wasm32")]
/// Simple WASM-compatible wrapper for text layout
#[wasm_bindgen]
pub fn wasm_pretext_layout(text: &str, max_width: f32, font_size: u32) -> JsValue {
    let engine = PretextEngine::new("Georgia", font_size);
    let result = engine.layout(text, max_width);
    serde_wasm_bindgen::to_value(&result).unwrap()
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn layout_ascii_brightness_to_char(brightness: f32) -> char {
    super::ascii_mapper::brightness_to_ascii(brightness)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn layout_ascii_text_brightness(text: &str, brightness: f32) -> String {
    super::ascii_mapper::text_to_ascii_brightness(text, brightness)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn layout_ascii_gradient(text: &str, start_brightness: f32, end_brightness: f32) -> String {
    super::ascii_mapper::gradient_ascii_typography(text, start_brightness, end_brightness)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn layout_ascii_wave(text: &str, frequency: f32, amplitude: f32) -> String {
    super::ascii_mapper::wave_ascii_typography(text, frequency, amplitude)
}

#[cfg(target_arch = "wasm32")]
#[wasm_bindgen]
pub fn layout_ascii_pulse(text: &str, time: f32, speed: f32) -> String {
    super::ascii_mapper::pulse_ascii_typography(text, time, speed)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_creation() {
        let engine = PretextEngine::new("Georgia", 16);
        assert_eq!(engine.font_family(), "Georgia");
        assert_eq!(engine.font_size(), 16.0);
    }

    #[test]
    fn test_empty_text() {
        let engine = PretextEngine::new("Georgia", 16);
        let result = engine.layout("", 100.0);
        assert_eq!(result.lines.len(), 0);
        assert_eq!(result.tight_width, 0.0);
    }

    #[test]
    fn test_single_word() {
        let engine = PretextEngine::new("Georgia", 16);
        let result = engine.layout("Hello", 100.0);
        assert_eq!(result.lines.len(), 1);
        assert!(result.tight_width > 0.0);
    }

    #[test]
    fn test_line_wrapping() {
        let engine = PretextEngine::new("Georgia", 16);
        let result = engine.layout("This is a long text that should wrap to multiple lines", 100.0);
        assert!(result.lines.len() > 1);
    }

    #[test]
    fn test_optimal_width_search() {
        let engine = PretextEngine::new("Georgia", 16);
        let optimal = engine.find_optimal_width("Thought Stream", 50.0, 200.0);
        assert!(optimal >= 50.0);
        assert!(optimal <= 200.0);
    }
}
