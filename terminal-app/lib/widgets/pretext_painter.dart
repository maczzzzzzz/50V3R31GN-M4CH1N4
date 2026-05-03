import 'package:flutter/material.dart';
import 'dart:ui' as ui;

/**
 * ◈ PRETEXT_PAINTER : CLINICAL_RENDERER — v3.8.25
 * 
 * Recursive Shroud Renderer for the NODESTADT Authority.
 * Executes low-level canvas mutations for geometric UI shards.
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
      ..color = _parseColor(comp.style['bg'] ?? '#0A0A0A')
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
        ..strokeWidth = 1.5;
      // Clinical sharp corners
      canvas.drawRect(Rect.fromLTWH(offset.dx + x, offset.dy + y, w, h), borderPaint);
    }
  }

  void _drawText(Canvas canvas, ShroudComponent comp, Offset offset) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(
      textAlign: TextAlign.left,
      fontSize: (comp.style['fontSize'] ?? 14).toDouble(),
      fontFamily: 'Lexend', // Clinical default
      fontWeight: ui.FontWeight.bold,
    ));

    builder.pushStyle(ui.TextStyle(color: _parseColor(comp.style['color'] ?? '#E5E5E5')));
    builder.addText(comp.style['content'] ?? '');

    final paragraph = builder.build();
    paragraph.layout(const ui.ParagraphConstraints(width: 800));
    
    final x = (comp.style['x'] ?? 0).toDouble();
    final y = (comp.style['y'] ?? 0).toDouble();

    canvas.drawParagraph(paragraph, offset + Offset(x, y));
  }

  void _renderLegacy(Canvas canvas, Size size) {
    final builder = ui.ParagraphBuilder(ui.ParagraphStyle(
      textAlign: TextAlign.left,
      fontSize: legacyStyle?.fontSize ?? 14,
      fontFamily: 'Cinzel',
      fontWeight: ui.FontWeight.w900,
    ));
    builder.pushStyle(ui.TextStyle(color: legacyStyle?.color ?? const Color(0xFFE07A5F)));
    builder.addText(legacyText!);
    final paragraph = builder.build();
    paragraph.layout(ui.ParagraphConstraints(width: size.width));
    canvas.drawParagraph(paragraph, Offset.zero);
  }

  Color _parseColor(String hex) {
    try {
      return Color(int.parse(hex.replaceFirst('#', '0xFF')));
    } catch (e) {
      return const Color(0xFFE07A5F); // Fallback to Machina Rust
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}
