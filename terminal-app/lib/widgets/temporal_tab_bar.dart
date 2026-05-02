import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_service.dart';

/**
 * ◈ TEMPORAL_TAB_BAR : CLINICAL_NAV — v3.8.25
 * 
 * Custom navigation for switching between temporal memory states:
 * [LIVE] | [ARCHIVE] | [CONTEXT]
 */

enum TemporalState { live, archive, context }

class TemporalTabBar extends StatelessWidget {
  final TemporalState selectedState;
  final Function(TemporalState) onStateChanged;

  const TemporalTabBar({
    super.key,
    required this.selectedState,
    required this.onStateChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeService>(context).currentPreset;

    return Container(
      height: 60,
      decoration: const BoxDecoration(
        color: Color(0xFF0F0F0F),
        border: Border(bottom: BorderSide(color: Color(0xFF262626))),
      ),
      child: Row(
        children: [
          _buildClinicalTab(context, 'LIVE_ARTERY', TemporalState.live, theme),
          _buildClinicalTab(context, 'ARCHIVE_CORE', TemporalState.archive, theme),
          _buildClinicalTab(context, 'CONTEXT_RKG', TemporalState.context, theme),
        ],
      ),
    );
  }

  Widget _buildClinicalTab(BuildContext context, String label, TemporalState state, ThemePreset theme) {
    final isSelected = selectedState == state;
    return Expanded(
      child: GestureDetector(
        onTap: () => onStateChanged(state),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            color: isSelected ? const Color(0xFFF36622).withOpacity(0.05) : Colors.transparent,
            border: isSelected 
              ? const Border(bottom: BorderSide(color: Color(0xFFF36622), width: 3.0))
              : null,
          ),
          child: Text(
            label.toUpperCase(),
            style: TextStyle(
              color: isSelected ? const Color(0xFFF36622) : const Color(0xFF404040),
              fontWeight: FontWeight.w900,
              fontSize: 10,
              letterSpacing: 2,
              fontFamily: 'Space Grotesk',
            ),
          ),
        ),
      ),
    );
  }
}
