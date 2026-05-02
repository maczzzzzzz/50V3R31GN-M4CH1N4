import 'package:flutter/material.dart';

/**
 * ◈ GEOMETRIC_SHARD — v3.8.25
 * 
 * Brutalist UI primitive. Replaces Material ListTile.
 * Sharp edges, technical layout, high-density data.
 */

class GeometricShard extends StatelessWidget {
  final Widget title;
  final Widget? subtitle;
  final Widget? leading;
  final Widget? trailing;
  final Color? borderColor;
  final VoidCallback? onTap;

  const GeometricShard({
    super.key,
    required this.title,
    this.subtitle,
    this.leading,
    this.trailing,
    this.borderColor,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: const Color(0xFF161616).withOpacity(0.8),
          border: Border(
            left: BorderSide(color: borderColor ?? const Color(0xFF404040), width: 4),
            top: const BorderSide(color: Color(0xFF333333), width: 1),
            right: const BorderSide(color: Color(0xFF333333), width: 1),
            bottom: const BorderSide(color: Color(0xFF333333), width: 1),
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(12.0),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (leading != null) ...[
                leading!,
                const SizedBox(width: 16),
              ],
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    title,
                    if (subtitle != null) ...[
                      const SizedBox(height: 4),
                      subtitle!,
                    ],
                  ],
                ),
              ),
              if (trailing != null) ...[
                const SizedBox(width: 16),
                trailing!,
              ],
            ],
          ),
        ),
      ),
    );
  }
}
