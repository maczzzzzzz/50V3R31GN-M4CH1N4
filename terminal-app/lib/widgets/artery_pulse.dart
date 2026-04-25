import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_service.dart';

/**
 * ARTERY_PULSE : v3.7.0
 * 
 * A glowing pulsing indicator that appears when a CONTEXT_PROPOSAL
 * is active in the Artery stream.
 */

class ArteryPulse extends StatefulWidget {
  final bool isActive;
  final VoidCallback onTap;

  const ArteryPulse({
    super.key,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<ArteryPulse> createState() => _ArteryPulseState();
}

class _ArteryPulseState extends State<ArteryPulse> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _glowAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _glowAnimation = Tween<double>(begin: 2.0, end: 12.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!widget.isActive) return const SizedBox.shrink();

    final theme = Provider.of<ThemeService>(context).currentPreset;

    return GestureDetector(
      onTap: widget.onTap,
      child: AnimatedBuilder(
        animation: _glowAnimation,
        builder: (context, child) {
          return Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: theme.primaryColor.withValues(alpha: 0.1),
              boxShadow: [
                BoxShadow(
                  color: theme.primaryColor.withValues(alpha: 0.5),
                  blurRadius: _glowAnimation.value,
                  spreadRadius: _glowAnimation.value / 2,
                ),
              ],
              border: Border.all(color: theme.primaryColor, width: 2.0),
            ),
            child: Icon(
              Icons.bolt,
              color: theme.primaryColor,
              size: 24,
            ),
          );
        },
      ),
    );
  }
}
