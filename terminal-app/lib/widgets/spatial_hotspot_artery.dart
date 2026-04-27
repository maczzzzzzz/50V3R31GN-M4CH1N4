import 'package:flutter/material.dart';
import 'dart:ui' as ui;

/**
 * SPATIAL_HOTSPOT_ARTERY — PHASE 95.1
 * 
 * 2.5D Tactical Map of the Neural Promenade.
 * Visualizes "Spatial Latches" (Agent-to-Memory anchors) on mobile.
 */

class SpatialHotspotArtery extends StatefulWidget {
  const SpatialHotspotArtery({super.key});

  @override
  State<SpatialHotspotArtery> createState() => _SpatialHotspotArteryState();
}

class _SpatialHotspotArteryState extends State<SpatialHotspotArtery> {
  // Simulated hotspots for initial materialization
  final List<Offset> _hotspots = [
    const Offset(0.2, 0.3),
    const Offset(0.7, 0.5),
    const Offset(0.5, 0.8),
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border.all(color: const Color(0xFF3C3836), width: 1),
      ),
      child: CustomPaint(
        size: Size.infinite,
        painter: HotspotPainter(hotspots: _hotspots),
      ),
    );
  }
}

class HotspotPainter extends CustomPainter {
  final List<Offset> hotspots;

  HotspotPainter({required this.hotspots});

  @override
  void paint(Canvas canvas, Size size) {
    // ◈ Draw Palace Floorplan
    _drawWings(canvas, size);
    _drawGrid(canvas, size);

    for (var spot in hotspots) {
      _drawHotspot(canvas, size, spot);
    }
  }

  void _drawWings(Canvas canvas, Size size) {
    final wingPaint = Paint()
      ..color = const Color(0xFF3C3836)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final List<Map<String, dynamic>> wings = [
      {'label': 'NODE_A', 'rect': Rect.fromLTWH(0, 0, size.width * 0.3, size.height), 'color': const Color(0xFFFB4934)},
      {'label': 'NODE_B', 'rect': Rect.fromLTWH(size.width * 0.35, 0, size.width * 0.3, size.height), 'color': const Color(0xFFB8BB26)},
      {'label': 'NODE_C', 'rect': Rect.fromLTWH(size.width * 0.7, 0, size.width * 0.3, size.height), 'color': const Color(0xFF83A598)},
    ];

    for (var wing in wings) {
      canvas.drawRect(wing['rect'], wingPaint..color = (wing['color'] as Color).withOpacity(0.2));
      _drawText(canvas, (wing['rect'] as Rect).topLeft + const Offset(10, 10), wing['label'], wing['color']);
    }
  }

  void _drawHotspot(Canvas canvas, Size size, Offset spot) {
    final center = Offset(spot.dx * size.width, spot.dy * size.height);
    final paint = Paint()..color = const Color(0xFFFB4934)..style = PaintingStyle.fill;
    
    canvas.drawCircle(center, 4, paint);
    canvas.drawCircle(center, 8, paint..style = PaintingStyle.stroke..strokeWidth = 1);
    
    _drawText(canvas, center + const Offset(10, -10), "LATCH", const Color(0xFFA89984));
  }

  void _drawGrid(Canvas canvas, Size size) {
    final gridPaint = Paint()..color = const Color(0xFF3C3836).withOpacity(0.3)..strokeWidth = 0.5;
    for (double i = 0; i < size.width; i += 40) canvas.drawLine(Offset(i, 0), Offset(i, size.height), gridPaint);
    for (double i = 0; i < size.height; i += 40) canvas.drawLine(Offset(0, i), Offset(size.width, i), gridPaint);
  }

  void _drawText(Canvas canvas, Offset offset, String text, Color color) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(textAlign: TextAlign.left, fontSize: 8, fontFamily: 'monospace'));
    builder.pushStyle(ui.TextStyle(color: color));
    builder.addText(text);
    final paragraph = builder.build();
    paragraph.layout(const ui.ParagraphConstraints(width: 100));
    canvas.drawParagraph(paragraph, offset);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
