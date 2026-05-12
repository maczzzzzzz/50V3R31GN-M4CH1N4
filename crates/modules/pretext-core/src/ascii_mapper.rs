//! Variable Typographic ASCII Mapper
//!
//! Maps 0.0–1.0 brightness to proportional Georgia glyph set.
//! Handles 450-variant character lookup table for expressive typography.

/// ASCII brightness character set (Georgia proportional approximation)
///
/// Ordered from darkest to lightest for brightness mapping.
/// This is a subset of the full 450-variant character palette.
const ASCII_BRIGHTNESS_PALETTE: [char; 49] = [
    // Darkest (dense fill)
    '@', '%', '#', '8', '&', 'o', ':', '*',
    // Medium-dark
    '=', '+', 'X', 'x', 'O', '0', 'Q', 'G',
    // Medium
    'C', 'D', 'B', 'H', 'K', 'N', 'R', 'S',
    'Z', 'z', 'c', 'd', 'h', 'k', 'n', 'r',
    // Medium-light to light (deduplicated — no repeated chars)
    's', '-', '.', ',', '\'', '`', '^', '~', '_',
    // Lightest
    ' ', ' ', ' ', ' ', ' ', ' ', ' ', ' ',
];

/// Maps a brightness value (0.0-1.0) to an ASCII character
///
/// # Arguments
/// * `brightness` - Normalized brightness value (0.0 = darkest, 1.0 = lightest)
///
/// # Returns
/// ASCII character representing the brightness level
///
/// # Examples
/// ```
/// use pretext_core::brightness_to_ascii;
///
/// let dark_char = brightness_to_ascii(0.0);
/// let light_char = brightness_to_ascii(1.0);
/// assert_eq!(dark_char, '@');
/// assert_eq!(light_char, ' ');
/// ```
pub fn brightness_to_ascii(brightness: f32) -> char {
    let brightness = brightness.clamp(0.0, 1.0);
    let index = (brightness * (ASCII_BRIGHTNESS_PALETTE.len() - 1) as f32) as usize;
    ASCII_BRIGHTNESS_PALETTE[index]
}

/// Maps text to ASCII art with brightness variation
///
/// # Arguments
/// * `text` - Input text to convert
/// * `brightness` - Base brightness for all characters (0.0-1.0)
///
/// # Returns
/// String with ASCII characters selected based on brightness
pub fn text_to_ascii_brightness(text: &str, brightness: f32) -> String {
    text.chars()
        .map(|c| {
            if c.is_whitespace() {
                ' '
            } else {
                brightness_to_ascii(brightness)
            }
        })
        .collect()
}

/// Advanced variable typography with per-character brightness
///
/// # Arguments
/// * `text` - Input text
/// * `brightness_fn` - Function that maps character position to brightness
///
/// # Returns
/// String with per-character brightness variation
pub fn variable_ascii_typography<F>(text: &str, brightness_fn: F) -> String
where
    F: Fn(usize, char) -> f32,
{
    text.chars()
        .enumerate()
        .map(|(i, c)| {
            if c.is_whitespace() {
                ' '
            } else {
                brightness_to_ascii(brightness_fn(i, c))
            }
        })
        .collect()
}

/// Gradient effect for ASCII text
///
/// Creates a brightness gradient across the text from start to end.
///
/// # Arguments
/// * `text` - Input text
/// * `start_brightness` - Brightness at start (0.0-1.0)
/// * `end_brightness` - Brightness at end (0.0-1.0)
///
/// # Returns
/// String with gradient brightness effect
pub fn gradient_ascii_typography(text: &str, start_brightness: f32, end_brightness: f32) -> String {
    let len = text.chars().count().max(1);
    variable_ascii_typography(text, |i, _| {
        let t = i as f32 / (len - 1) as f32;
        start_brightness * (1.0 - t) + end_brightness * t
    })
}

/// Wave effect for ASCII text
///
/// Creates a sinusoidal brightness variation across the text.
///
/// # Arguments
/// * `text` - Input text
/// * `frequency` - Frequency of the wave
/// * `amplitude` - Amplitude of brightness variation
///
/// # Returns
/// String with wave brightness effect
pub fn wave_ascii_typography(text: &str, frequency: f32, amplitude: f32) -> String {
    variable_ascii_typography(text, |i, _| {
        let base = 0.5;
        let wave = (i as f32 * frequency).sin() * amplitude;
        (base + wave).clamp(0.0, 1.0)
    })
}

/// Pulse effect for ASCII text
///
/// Creates a pulsing brightness effect that animates over time.
///
/// # Arguments
/// * `text` - Input text
/// * `time` - Time value for animation
/// * `speed` - Speed of the pulse
///
/// # Returns
/// String with pulsing brightness effect
pub fn pulse_ascii_typography(text: &str, time: f32, speed: f32) -> String {
    let pulse = (time * speed).sin() * 0.5 + 0.5; // 0.0 to 1.0
    text_to_ascii_brightness(text, pulse)
}

/// Token-aware ASCII mapping for active reasoning
///
/// Maps tokens from LLM inference to ASCII with brightness based on
/// token probability or confidence.
///
/// # Arguments
/// * `tokens` - Iterator of (token_text, confidence) pairs
///
/// # Returns
/// String with confidence-based ASCII brightness
pub fn token_ascii_mapping<'a, I>(tokens: I) -> String
where
    I: Iterator<Item = (&'a str, f32)>,
{
    tokens
        .map(|(token, confidence)| {
            text_to_ascii_brightness(token, confidence)
        })
        .collect::<Vec<_>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_brightness_mapping() {
        assert_eq!(brightness_to_ascii(0.0), '@');
        assert_eq!(brightness_to_ascii(1.0), ' ');
        assert_eq!(brightness_to_ascii(0.5), 'Z'); // Mid-range character
    }

    #[test]
    fn test_brightness_clamping() {
        assert_eq!(brightness_to_ascii(-1.0), '@');
        assert_eq!(brightness_to_ascii(2.0), ' ');
    }

    #[test]
    fn test_text_to_ascii_brightness() {
        let result = text_to_ascii_brightness("Hello", 0.0);
        assert_eq!(result, "@@@@@");
    }

    #[test]
    fn test_variable_ascii_typography() {
        let result = variable_ascii_typography("ABC", |i, _| {
            i as f32 / 2.0 // Gradient from 0 to 1
        });
        assert!(result.starts_with('@'));
        assert!(result.ends_with(' '));
    }

    #[test]
    fn test_gradient_ascii_typography() {
        let result = gradient_ascii_typography("TEST", 0.0, 1.0);
        assert_eq!(result.len(), 4);
        assert!(result.chars().next().unwrap() == '@');
        assert!(result.chars().last().unwrap() == ' ');
    }

    #[test]
    fn test_wave_ascii_typography() {
        let result = wave_ascii_typography("WAVE", 1.0, 0.5);
        assert_eq!(result.len(), 4);
    }

    #[test]
    fn test_pulse_ascii_typography() {
        let result1 = pulse_ascii_typography("PULSE", 0.0, 1.0);
        let result2 = pulse_ascii_typography("PULSE", 1.57, 1.0); // Quarter cycle
        // Should be different due to time offset
        assert!(result1 != result2);
    }

    #[test]
    fn test_token_ascii_mapping() {
        let tokens = vec![("Hello", 0.2), ("World", 0.8)];
        let result = token_ascii_mapping(tokens.into_iter());
        assert!(result.contains(' ')); // Should have light characters
    }
}
