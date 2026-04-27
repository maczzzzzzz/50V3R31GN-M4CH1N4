import 'package:flutter/material.dart';
import 'dart:math' as math;

/**
 * ◈ FLUID_SMOKE_PAINTER — PHASE 96.2
 * 
 * High-performance trig-noise loop for mobile metabolic visualization.
 * Ported from somnai-dreams/pretext-demos.
 */

class FluidSmokePainter extends CustomPainter {
  final double time;
  final double intensity; // Linked to Mic Input or Node B Pressure

  FluidSmokePainter({required this.time, this.intensity = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    const int cols = 40;
    const int rows = 80;
    final double cw = size.width / cols;
    final double ch = size.height / rows;

    final paint = Paint()
      ..style = PaintingStyle.fill;

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final double nx = c / cols;
        final double ny = r / rows;

        // ◈ Metabolic Trig-Noise (Listening vs Thinking)
        final double v = math.sin(ny * 6.28 + time * 0.5) * 2 + 
                         math.cos((nx + ny) * 12.5 + time * 0.8) * 0.7;
        
        final double val = math.max(0, math.min(1, (v + 1) / 2));
        
        if (val > 0.45) {
          paint.color = const Color(0xFFFB4934).withOpacity(val * 0.1 * intensity);
          canvas.drawRect(
            Rect.fromLTWH(c * cw, r * ch, cw - 0.5, ch - 0.5), 
            paint
          );
        }
      }
    }
  }

  @override
  bool shouldRepaint(covariant FluidSmokePainter oldDelegate) => 
    oldDelegate.time != time || oldDelegate.intensity != intensity;
}
