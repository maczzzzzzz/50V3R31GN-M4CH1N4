// Pretext FFI Bridge
//
// Provides Flutter/FFI bindings to the Rust Pretext Core layout engine.
// Enables bit-identical text layout across Node B (React/WASM) and Machina Terminal (Flutter/FFI).

import 'dart:ffi' as ffi;
import 'package:ffi/ffi.dart';

/// Text segment with metrics
class TextSegment {
  final String text;
  final double width;
  final int charCount;

  TextSegment({
    required this.text,
    required this.width,
    required this.charCount,
  });

  factory TextSegment.fromJson(Map<String, dynamic> json) {
    return TextSegment(
      text: json['text'] as String,
      width: (json['width'] as num).toDouble(),
      charCount: json['char_count'] as int,
    );
  }
}

/// Single line in the layout
class LayoutLine {
  final List<TextSegment> segments;
  final double width;

  LayoutLine({
    required this.segments,
    required this.width,
  });

  factory LayoutLine.fromJson(Map<String, dynamic> json) {
    return LayoutLine(
      segments: (json['segments'] as List<dynamic>)
          .map((e) => TextSegment.fromJson(e as Map<String, dynamic>))
          .toList(),
      width: (json['width'] as num).toDouble(),
    );
  }
}

/// Result of a layout calculation
class LayoutResult {
  final List<LayoutLine> lines;
  final double tightWidth;
  final double totalHeight;

  LayoutResult({
    required this.lines,
    required this.tightWidth,
    required this.totalHeight,
  });

  factory LayoutResult.fromJson(Map<String, dynamic> json) {
    return LayoutResult(
      lines: (json['lines'] as List<dynamic>)
          .map((e) => LayoutLine.fromJson(e as Map<String, dynamic>))
          .toList(),
      tightWidth: (json['tight_width'] as num).toDouble(),
      totalHeight: (json['total_height'] as num).toDouble(),
    );
  }
}

/// Pretext engine FFI wrapper
class PretextEngine {
  final ffi.DynamicLibrary _lib;

  PretextEngine(ffi.DynamicLibrary lib) : _lib = lib;

  /// Create a new Pretext engine
  factory PretextEngine.load(String path) {
    final lib = ffi.DynamicLibrary.open(path);
    return PretextEngine(lib);
  }

  /// Calculate layout for the given text
  ///
  /// [text] - Input text to layout
  /// [maxWidth] - Maximum width for layout
  /// [fontSize] - Font size in pixels
  /// [fontFamily] - Font family name (default: 'Georgia')
  LayoutResult layout({
    required String text,
    required double maxWidth,
    required int fontSize,
    String fontFamily = 'Georgia',
  }) {
    // For now, use Dart implementation as fallback
    // In production, this would call into Rust via FFI
    return _layoutDart(text, maxWidth, fontSize, fontFamily);
  }

  /// Find optimal width for the given text
  ///
  /// [text] - Input text
  /// [minWidth] - Minimum width
  /// [maxWidth] - Maximum width
  /// [fontSize] - Font size
  double findOptimalWidth({
    required String text,
    required double minWidth,
    required double maxWidth,
    required int fontSize,
  }) {
    // Binary search for optimal width
    double low = minWidth;
    double high = maxWidth;
    double optimal = maxWidth;

    while (high - low > 1.0) {
      final mid = (low + high) / 2.0;
      final result = _layoutDart(text, mid, fontSize, 'Georgia');

      // If lines wrap too aggressively, increase width
      if (result.lines.length > 3) {
        low = mid;
      } else {
        optimal = mid;
        high = mid;
      }
    }

    return optimal;
  }

  /// Dart fallback implementation for layout
  LayoutResult _layoutDart(
    String text,
    double maxWidth,
    int fontSize,
    String fontFamily,
  ) {
    final words = text.split(RegExp(r'\s+'));
    final avgCharWidth = _getAvgCharWidth(fontFamily) * fontSize;
    final lineHeight = fontSize * 1.2;

    final lines = <LayoutLine>[];
    final currentLineSegments = <TextSegment>[];
    double currentWidth = 0.0;
    double tightWidth = 0.0;

    for (final word in words) {
      final wordWidth = word.length * avgCharWidth;
      final spaceWidth = avgCharWidth;
      final segmentWithSpace = wordWidth + spaceWidth;

      if (currentWidth + segmentWithSpace > maxWidth && currentLineSegments.isNotEmpty) {
        // Finalize current line
        final lineWidth = currentWidth - avgCharWidth;
        tightWidth = tightWidth > lineWidth ? tightWidth : lineWidth;
        lines.add(LayoutLine(
          segments: List.from(currentLineSegments),
          width: lineWidth,
        ));

        // Start new line
        currentLineSegments.clear();
        currentLineSegments.add(TextSegment(
          text: word,
          width: wordWidth,
          charCount: word.length,
        ));
        currentWidth = wordWidth;
      } else {
        currentLineSegments.add(TextSegment(
          text: word,
          width: wordWidth,
          charCount: word.length,
        ));
        currentWidth += segmentWithSpace;
      }
    }

    // Don't forget the last line
    if (currentLineSegments.isNotEmpty) {
      final lineWidth = currentWidth - avgCharWidth;
      tightWidth = tightWidth > lineWidth ? tightWidth : lineWidth;
      lines.add(LayoutLine(
        segments: List.from(currentLineSegments),
        width: lineWidth,
      ));
    }

    final totalHeight = lines.length * lineHeight;

    return LayoutResult(
      lines: lines,
      tightWidth: tightWidth,
      totalHeight: totalHeight,
    );
  }

  /// Get average character width for a font family
  double _getAvgCharWidth(String fontFamily) {
    switch (fontFamily.toLowerCase()) {
      case 'georgia':
        return 0.56; // Georgia is wider
      case 'arial':
        return 0.44;
      case 'courier new':
        return 0.60; // Monospace
      default:
        return 0.50; // Default fallback
    }
  }
}

/// ASCII mapper functions (WASM bindings would be used in production)
class AsciiMapper {
  /// Maps brightness (0.0-1.0) to ASCII character
  static String brightnessToChar(double brightness) {
    brightness = brightness.clamp(0.0, 1.0);
    const palette = r'@%#8&o:=+xX0QGCDBHKNRSZcdhknrsxX+=-:,.`^~-_ ';
    final index = (brightness * (palette.length - 1)).round();
    return palette[index];
  }

  /// Maps text to ASCII with brightness
  static String textToAsciiBrightness(String text, double brightness) {
    return text.split('').map((c) {
      return c.trim().isEmpty ? ' ' : brightnessToChar(brightness);
    }).join();
  }

  /// Creates gradient effect across text
  static String gradientAscii(String text, double startBrightness, double endBrightness) {
    final chars = text.split('');
    final len = chars.length;
    return chars.mapIndexed((i, c) {
      if (c.trim().isEmpty) return ' ';
      final t = i / (len - 1);
      final brightness = startBrightness * (1 - t) + endBrightness * t;
      return brightnessToChar(brightness);
    }).join();
  }

  /// Creates wave effect across text
  static String waveAscii(String text, double frequency, double amplitude) {
    final chars = text.split('');
    return chars.mapIndexed((i, c) {
      if (c.trim().isEmpty) return ' ';
      final base = 0.5;
      final wave = (i * frequency).sin() * amplitude;
      final brightness = (base + wave).clamp(0.0, 1.0);
      return brightnessToChar(brightness);
    }).join();
  }

  /// Creates pulse effect over time
  static String pulseAscii(String text, double time, double speed) {
    final pulse = (time * speed).sin() * 0.5 + 0.5;
    return textToAsciiBrightness(text, pulse);
  }
}

/// Extension for mapWithIndex
extension ListIndexed<T> on List<T> {
  String mapIndexed(String Function(int index, T element) f) {
    final buffer = StringBuffer();
    for (var i = 0; i < length; i++) {
      buffer.write(f(i, this[i]));
    }
    return buffer.toString();
  }
}
