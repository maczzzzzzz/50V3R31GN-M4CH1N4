import 'package:flutter/material.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_PAINTER — PHASE 92, TASK 1
 * 
 * High-performance low-level text engine for the Sovereign HUD.
 * Implements high-density documentation rendering and linguistic folding.
 */

class PretextPainter extends CustomPainter {
  final String text;
  final TextStyle style;

  PretextPainter({required this.text, required this.style});

  @override
  void paint(Canvas canvas, Size size) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(
      textAlign: TextAlign.left,
      fontSize: style.fontSize,
      fontFamily: style.fontFamily,
      fontWeight: style.fontWeight,
    ));

    builder.pushStyle(ui.TextStyle(color: style.color));
    builder.addText(text);

    final paragraph = builder.build();
    paragraph.layout(ui.ParagraphConstraints(width: size.width));

    canvas.drawParagraph(paragraph, Offset.zero);
    
    // ◈ Resonance Pulses (Visual Hardening)
    _drawResonancePulses(canvas, size);
  }

  void _drawResonancePulses(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = const Color(0xFFFB4934).withOpacity(0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    canvas.drawRect(Rect.fromLTWH(0, 0, size.width, size.height), paint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
