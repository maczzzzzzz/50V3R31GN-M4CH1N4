import 'package:flutter/material.dart';
import 'dart:math' as math;

/**
 * ◈ FLUID_SMOKE_PAINTER — v3.8.25
 * 
 * Clinical metabolic visualization for the handheld HUD.
 * Tactical Authority pulse against Artery Black.
 */

class FluidSmokePainter extends CustomPainter {
  final double time;
  final double intensity;

  FluidSmokePainter({required this.time, this.intensity = 1.0});

  @override
  void paint(Canvas canvas, Size size) {
    const int cols = 60;
    const int rows = 120;
    final double cw = size.width / cols;
    final double ch = size.height / rows;

    final paint = Paint()
      ..style = PaintingStyle.fill;

    for (int r = 0; r < rows; r++) {
      for (int c = 0; c < cols; c++) {
        final double nx = c / cols;
        final double ny = r / rows;

        // ◈ Clinical Trig-Noise: Sharper gradients
        final double v = math.sin(ny * 8 + time * 0.4) * 1.5 + 
                         math.cos((nx + ny) * 12 + time * 0.6) * 1.2;
        
        final double val = math.max(0, math.min(1, (v + 1) / 2));
        
        if (val > 0.5) {
          // Tactical Authority #376374 with variable opacity
          paint.color = const Color(0xFF376374).withOpacity(val * 0.08 * intensity);
          canvas.drawRect(
            Rect.fromLTWH(c * cw, r * ch, cw - 0.2, ch - 0.2), 
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
