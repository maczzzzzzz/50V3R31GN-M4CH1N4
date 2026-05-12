// Machina Pretext HUD Panel - Flutter/FFI Integration
//
// Materializes Kinetic HUD in Flutter using CustomPainter for bit-identical layout.
// Ensures mobile Machina Terminal shows the same typographic flow as Sovereign Workspace HUD.

import 'dart:ffi' as ffi;
import 'dart:ui' as ui;
import 'package:ffi/ffi.dart';
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'pretext_ffi.dart';

/// Obstacle for layout-aware text flow
class Obstacle {
  final String id;
  final double x;
  final double y;
  final double width;
  final double height;

  Obstacle({
    required this.id,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
  });
}

/// Kinetic HUD Panel using Pretext layout engine
class KineticHUDPanel extends StatefulWidget {
  final String text;
  final List<Obstacle> obstacles;
  final double fontSize;
  final String fontFamily;
  final bool asciiMode;
  final String asciiEffect;

  const KineticHUDPanel({
    super.key,
    required this.text,
    this.obstacles = const [],
    this.fontSize = 16.0,
    this.fontFamily = 'Georgia',
    this.asciiMode = false,
    this.asciiEffect = 'gradient',
  });

  @override
  State<KineticHUDPanel> createState() => _KineticHUDPanelState();
}

class _KineticHUDPanelState extends State<KineticHUDPanel> with SingleTickerProviderStateMixin {
  late PretextEngine _engine;
  LayoutResult? _layout;
  bool _isLoaded = false;
  String? _error;
  late AnimationController _animationController;
  double _time = 0.0;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 1),
    )..repeat();

    _initializeEngine();
  }

  Future<void> _initializeEngine() async {
    try {
      // Load the Rust library
      // In production, this would be the actual compiled .so/.dll/.dylib
      // For now, we'll use the Dart fallback implementation
      _engine = PretextEngine.load('libpretext_core.so');
      _calculateLayout();
      setState(() {
        _isLoaded = true;
      });
    } catch (e) {
      print('Failed to initialize Pretext engine: $e');
      // Use Dart fallback
      _engine = PretextEngine.load('');
      _calculateLayout();
      setState(() {
        _isLoaded = true;
        _error = e.toString();
      });
    }
  }

  void _calculateLayout() {
    final result = _engine.layout(
      text: widget.text,
      maxWidth: 800.0,
      fontSize: widget.fontSize.toInt(),
      fontFamily: widget.fontFamily,
    );
    setState(() {
      _layout = result;
    });
  }

  @override
  void didUpdateWidget(KineticHUDPanel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.text != widget.text ||
        oldWidget.fontSize != widget.fontSize ||
        oldWidget.fontFamily != widget.fontFamily) {
      _calculateLayout();
    }
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_isLoaded) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(child: Text('Warning: Using Dart fallback\n$_error'));
    }

    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        if (widget.asciiMode) {
          _time = _animationController.value;
        }
        return CustomPaint(
          painter: _PretextPainter(
            layout: _layout!,
            fontSize: widget.fontSize,
            fontFamily: widget.fontFamily,
            asciiMode: widget.asciiMode,
            asciiEffect: widget.asciiEffect,
            asciiBrightness: 0.5,
            time: _time,
            obstacles: widget.obstacles,
          ),
          child: const SizedBox.expand(),
        );
      },
    );
  }
}

/// Custom painter for Pretext layout
class _PretextPainter extends CustomPainter {
  final LayoutResult layout;
  final double fontSize;
  final String fontFamily;
  final bool asciiMode;
  final String asciiEffect;
  final double asciiBrightness;
  final double time;
  final List<Obstacle> obstacles;

  _PretextPainter({
    required this.layout,
    required this.fontSize,
    required this.fontFamily,
    required this.asciiMode,
    required this.asciiEffect,
    required this.asciiBrightness,
    required this.time,
    required this.obstacles,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final textStyle = TextStyle(
      fontSize: fontSize,
      fontFamily: fontFamily,
      color: const Color(0xFFAFAB9C),
      height: 1.2,
    );

    final textPainter = TextPainter(
      textDirection: TextDirection.ltr,
      text: TextSpan(text: '', style: textStyle),
    );

    let y = 0.0;
    const lineHeightMultiplier = 1.2;

    for (final line in layout.lines) {
      let x = 0.0;

      for (final segment in line.segments) {
        String displayText = segment.text;

        // Apply ASCII effect if enabled
        if (asciiMode) {
          switch (asciiEffect) {
            case 'gradient':
              displayText = AsciiMapper.gradientAscii(displayText, 0.0, 1.0);
              break;
            case 'wave':
              displayText = AsciiMapper.waveAscii(displayText, 1.0, 0.3);
              break;
            case 'pulse':
              displayText = AsciiMapper.pulseAscii(displayText, time * 2.0);
              break;
            default:
              displayText = AsciiMapper.textToAsciiBrightness(displayText, asciiBrightness);
          }
        }

        textPainter.text = TextSpan(text: displayText, style: textStyle);
        textPainter.layout();
        textPainter.paint(canvas, Offset(x, y));

        x += segment.width + fontSize * 0.56; // Add space
      }

      y += fontSize * lineHeightMultiplier;
    }

    // Draw obstacles (for debugging/visualization)
    final obstaclePaint = Paint()
      ..color = const Color(0xFFFF0000).withOpacity(0.3)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    for (final obstacle in obstacles) {
      canvas.drawRect(
        Rect.fromLTWH(obstacle.x, obstacle.y, obstacle.width, obstacle.height),
        obstaclePaint,
      );
    }
  }

  @override
  bool shouldRepaint(_PretextPainter oldDelegate) {
    return asciiMode && asciiEffect != 'gradient';
  }
}

/// Example usage widget
class MachinaHUDDemo extends StatelessWidget {
  const MachinaHUDDemo({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A282F),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            children: [
              const Text(
                'Machina Terminal HUD',
                style: TextStyle(
                  color: Color(0xFFAFAB9C),
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Expanded(
                child: KineticHUDPanel(
                  text: 'Sovereign Machina operational. Node D (Quaternary) processing active context. Hermes-LCM managing 10,000 summary nodes. VSB Router mesh stable.',
                  asciiMode: true,
                  asciiEffect: 'pulse',
                  obstacles: [
                    Obstacle(
                      id: 'node-status',
                      x: 600,
                      y: 100,
                      width: 150,
                      height: 100,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
