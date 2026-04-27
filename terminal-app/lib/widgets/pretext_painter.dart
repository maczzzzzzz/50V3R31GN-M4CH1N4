import 'package:flutter/material.dart';
import 'dart:ui' as ui;

/**
 * ◈ PRETEXT_PAINTER — v3.8.7 RE-GROUNDED
 * 
 * Recursive Shroud Renderer.
 * Decodes the JSON Component Stream and executes low-level canvas mutations.
 * Supports Containers, Text, and Metabolic Shaders.
 */

class ShroudComponent {
  final String id;
  final String type;
  final Map<String, dynamic> style;
  final List<ShroudComponent> children;

  ShroudComponent({
    required this.id,
    required this.type,
    required this.style,
    this.children = const [],
  });

  factory ShroudComponent.fromJson(Map<String, dynamic> json) {
    return ShroudComponent(
      id: json['id'],
      type: json['type'],
      style: json['style'] ?? {},
      children: (json['children'] as List? ?? [])
          .map((c) => ShroudComponent.fromJson(c))
          .toList(),
    );
  }
}

class PretextPainter extends CustomPainter {
  final ShroudComponent? root;
  final String? legacyText;
  final TextStyle? legacyStyle;

  PretextPainter({this.root, this.legacyText, this.legacyStyle});

  @override
  void paint(Canvas canvas, Size size) {
    if (root != null) {
      _renderComponent(canvas, root!, Offset.zero, size);
    } else if (legacyText != null) {
      _renderLegacy(canvas, size);
    }
  }

  void _renderComponent(Canvas canvas, ShroudComponent comp, Offset offset, Size size) {
    switch (comp.type) {
      case 'CONTAINER':
        _drawContainer(canvas, comp, offset);
        break;
      case 'TEXT':
        _drawText(canvas, comp, offset);
        break;
    }

    for (var child in comp.children) {
      _renderComponent(canvas, child, offset, size);
    }
  }

  void _drawContainer(Canvas canvas, ShroudComponent comp, Offset offset) {
    final paint = Paint()
      ..color = _parseColor(comp.style['bg'] ?? '#1d2021')
      ..style = PaintingStyle.fill;
    
    final x = (comp.style['x'] ?? 0).toDouble();
    final y = (comp.style['y'] ?? 0).toDouble();
    final w = (comp.style['w'] ?? 100).toDouble();
    final h = (comp.style['h'] ?? 50).toDouble();

    canvas.drawRect(Rect.fromLTWH(offset.dx + x, offset.dy + y, w, h), paint);

    if (comp.style['border'] != null) {
      final borderPaint = Paint()
        ..color = _parseColor(comp.style['border'])
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.0;
      canvas.drawRect(Rect.fromLTWH(offset.dx + x, offset.dy + y, w, h), borderPaint);
    }
  }

  void _drawText(Canvas canvas, ShroudComponent comp, Offset offset) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(
      textAlign: TextAlign.left,
      fontSize: (comp.style['fontSize'] ?? 14).toDouble(),
      fontFamily: 'monospace',
    ));

    builder.pushStyle(ui.TextStyle(color: _parseColor(comp.style['color'] ?? '#ebdbb2')));
    builder.addText(comp.style['content'] ?? '');

    final paragraph = builder.build();
    paragraph.layout(const ui.ParagraphConstraints(width: 500));
    
    final x = (comp.style['x'] ?? 0).toDouble();
    final y = (comp.style['y'] ?? 0).toDouble();

    canvas.drawParagraph(paragraph, offset + Offset(x, y));
  }

  void _renderLegacy(Canvas canvas, Size size) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(
      textAlign: TextAlign.left,
      fontSize: legacyStyle?.fontSize,
      fontFamily: legacyStyle?.fontFamily,
    ));
    builder.pushStyle(ui.TextStyle(color: legacyStyle?.color));
    builder.addText(legacyText!);
    final paragraph = builder.build();
    paragraph.layout(ui.ParagraphConstraints(width: size.width));
    canvas.drawParagraph(paragraph, Offset.zero);
  }

  Color _parseColor(String hex) {
    return Color(int.parse(hex.replaceFirst('#', '0xFF')));
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
