import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_service.dart';

/**
 * TEMPORAL_TAB_BAR : v3.7.0
 * 
 * Custom navigation bar for switching between temporal states:
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
      height: 50,
      decoration: BoxDecoration(
        color: Colors.black,
        border: Border(bottom: BorderSide(color: theme.primaryColor.withValues(alpha: 0.3))),
      ),
      child: Row(
        children: [
          _buildTab(context, '[LIVE]', TemporalState.live, theme),
          _buildTab(context, '[ARCHIVE]', TemporalState.archive, theme),
          _buildTab(context, '[CONTEXT]', TemporalState.context, theme),
        ],
      ),
    );
  }

  Widget _buildTab(BuildContext context, String label, TemporalState state, ThemePreset theme) {
    final isSelected = selectedState == state;
    return Expanded(
      child: InkWell(
        onTap: () => onStateChanged(state),
        child: Container(
          alignment: Alignment.center,
          decoration: BoxDecoration(
            border: isSelected 
              ? Border(bottom: BorderSide(color: theme.primaryColor, width: 3.0))
              : null,
          ),
          child: Text(
            label,
            style: TextStyle(
              color: isSelected ? theme.primaryColor : Colors.grey,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}
