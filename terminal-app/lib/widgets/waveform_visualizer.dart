import 'dart:math' as math;
import 'package:flutter/material.dart';

/**
 * ◈ WAVEFORM_VISUALIZER : v3.8.26
 * 
 * Kinetic waveform that pulses with voice intensity.
 * Materialized for Phase 115 Omniscient Artery.
 */

class WaveformVisualizer extends StatefulWidget {
  final bool isActive;
  final Color color;

  const WaveformVisualizer({
    super.key,
    required this.isActive,
    this.color = const Color(0xFFF36622),
  });

  @override
  State<WaveformVisualizer> createState() => _WaveformVisualizerState();
}

class _WaveformVisualizerState extends State<WaveformVisualizer> with SingleTickerProviderStateMixin {
  late AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return CustomPaint(
          size: const Size(double.infinity, 40),
          painter: WaveformPainter(
            animationValue: _controller.value,
            isActive: widget.isActive,
            color: widget.color,
          ),
        );
      },
    );
  }
}

class WaveformPainter extends CustomPainter {
  final double animationValue;
  final bool isActive;
  final Color color;

  WaveformPainter({
    required this.animationValue,
    required this.isActive,
    required this.color,
  });

  @override
  void paint(Canvas canvas, Size size) {
    if (!isActive) return;

    final paint = Paint()
      ..color = color.withOpacity(0.6)
      ..strokeWidth = 2.0
      ..style = PaintingStyle.stroke;

    final path = Path();
    final width = size.width;
    final height = size.height;
    final midY = height / 2;

    for (double x = 0; x <= width; x++) {
      final normalizedX = x / width;
      final wave1 = math.sin(normalizedX * 10 * math.pi + animationValue * 4 * math.pi) * 10;
      final wave2 = math.cos(normalizedX * 6 * math.pi - animationValue * 2 * math.pi) * 5;
      
      // Amplitude envelope
      final envelope = math.sin(normalizedX * math.pi);
      final finalY = midY + (wave1 + wave2) * envelope;

      if (x == 0) {
        path.moveTo(x, finalY);
      } else {
        path.lineTo(x, finalY);
      }
    }

    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(covariant WaveformPainter oldDelegate) => true;
}
