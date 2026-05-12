//! Pretext Core - Unified Text Engine for Zero-DOM Layout
//!
//! Provides bit-identical layout arithmetic across Node B (React/WASM) and
//! the Machina Terminal (Flutter/FFI) using pure Rust geometric calculations.

mod ascii_mapper;
mod layout;
mod virtualization;

pub use ascii_mapper::{
    brightness_to_ascii,
    gradient_ascii_typography,
    pulse_ascii_typography,
    text_to_ascii_brightness,
    token_ascii_mapping,
    variable_ascii_typography,
    wave_ascii_typography,
};
pub use layout::{PretextEngine, LayoutResult};
pub use virtualization::{ThoughtStreamVirtualizer, VirtualLayoutResult, VirtualThoughtNode};

/// Safe wrapper for FFI string input — checks null and validates UTF-8
fn ffi_str<'a>(ptr: *const u8, len: usize) -> Result<&'a str, &'static str> {
    if ptr.is_null() {
        return Err("null pointer received from FFI");
    }
    let bytes = unsafe { std::slice::from_raw_parts(ptr, len) };
    std::str::from_utf8(bytes).map_err(|_| "invalid UTF-8 in FFI input")
}

// FFI bindings for Flutter
#[no_mangle]
pub extern "C" fn pretext_engine_create(font_family: *const u8, font_family_len: usize, font_size: u32) -> *mut PretextEngine {
    let font_family_str = match ffi_str(font_family, font_family_len) {
        Ok(s) => s,
        Err(e) => {
            log::error!("pretext_engine_create: {}", e);
            return std::ptr::null_mut();
        }
    };
    let engine = PretextEngine::new(font_family_str, font_size);
    Box::into_raw(Box::new(engine))
}

#[no_mangle]
pub extern "C" fn pretext_engine_destroy(engine: *mut PretextEngine) {
    unsafe {
        let _ = Box::from_raw(engine);
    }
}

#[no_mangle]
pub extern "C" fn pretext_layout(
    engine: *const PretextEngine,
    text: *const u8,
    text_len: usize,
    max_width: f32,
) -> *mut LayoutResult {
    if engine.is_null() {
        return std::ptr::null_mut();
    }
    let engine = unsafe { &*engine };
    let text_str = match ffi_str(text, text_len) {
        Ok(s) => s,
        Err(e) => {
            log::error!("pretext_layout: {}", e);
            return std::ptr::null_mut();
        }
    };
    let result = engine.layout(text_str, max_width);
    Box::into_raw(Box::new(result))
}

#[no_mangle]
pub extern "C" fn pretext_layout_destroy(result: *mut LayoutResult) {
    unsafe {
        let _ = Box::from_raw(result);
    }
}

#[no_mangle]
pub extern "C" fn pretext_layout_get_lines(result: *const LayoutResult) -> *const layout::LayoutLine {
    let result = unsafe { &*result };
    result.lines.as_ptr()
}

#[no_mangle]
pub extern "C" fn pretext_layout_get_lines_count(result: *const LayoutResult) -> usize {
    let result = unsafe { &*result };
    result.lines.len()
}

#[no_mangle]
pub extern "C" fn pretext_layout_get_tight_width(result: *const LayoutResult) -> f32 {
    let result = unsafe { &*result };
    result.tight_width
}

#[no_mangle]
pub extern "C" fn pretext_layout_get_total_height(result: *const LayoutResult) -> f32 {
    let result = unsafe { &*result };
    result.total_height
}

#[no_mangle]
pub extern "C" fn pretext_layout_line_get_segments(line: *const layout::LayoutLine) -> *const layout::TextSegment {
    let line = unsafe { &*line };
    line.segments.as_ptr()
}

#[no_mangle]
pub extern "C" fn pretext_layout_line_get_segments_count(line: *const layout::LayoutLine) -> usize {
    let line = unsafe { &*line };
    line.segments.len()
}

#[no_mangle]
pub extern "C" fn pretext_layout_line_get_width(line: *const layout::LayoutLine) -> f32 {
    let line = unsafe { &*line };
    line.width
}

#[no_mangle]
pub extern "C" fn pretext_layout_segment_get_text(segment: *const layout::TextSegment) -> *const u8 {
    let segment = unsafe { &*segment };
    segment.text.as_ptr()
}

#[no_mangle]
pub extern "C" fn pretext_layout_segment_get_text_len(segment: *const layout::TextSegment) -> usize {
    let segment = unsafe { &*segment };
    segment.text.len()
}

#[no_mangle]
pub extern "C" fn pretext_layout_segment_get_width(segment: *const layout::TextSegment) -> f32 {
    let segment = unsafe { &*segment };
    segment.width
}

#[no_mangle]
pub extern "C" fn pretext_layout_segment_get_char_count(segment: *const layout::TextSegment) -> usize {
    let segment = unsafe { &*segment };
    segment.char_count
}

// ASCII mapper FFI bindings
#[no_mangle]
pub extern "C" fn ffi_ascii_brightness_to_char(brightness: f32) -> u8 {
    brightness_to_ascii(brightness) as u8
}

#[no_mangle]
pub extern "C" fn ffi_ascii_text_brightness(
    text: *const u8,
    text_len: usize,
    brightness: f32,
    output: *mut u8,
    output_len: usize,
) -> usize {
    let text_str = match ffi_str(text, text_len) {
        Ok(s) => s,
        Err(e) => {
            log::error!("ffi_ascii_text_brightness: {}", e);
            return 0;
        }
    };
    let result = text_to_ascii_brightness(text_str, brightness);
    if output.is_null() {
        return 0;
    }
    let output_slice = unsafe { std::slice::from_raw_parts_mut(output, output_len) };
    let result_bytes = result.as_bytes();
    let copy_len = result_bytes.len().min(output_len);
    output_slice[..copy_len].copy_from_slice(&result_bytes[..copy_len]);
    copy_len
}
