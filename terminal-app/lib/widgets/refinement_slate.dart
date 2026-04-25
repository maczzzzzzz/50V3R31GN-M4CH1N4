import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/theme_service.dart';

/**
 * REFINEMENT_SLATE : v3.7.0
 * 
 * modal for user-assisted context extraction.
 * Allows editing a CONTEXT_PROPOSAL before engraving it into the graph.
 */

class RefinementSlate extends StatefulWidget {
  final String initialContent;
  final Function(String) onEngrave;

  const RefinementSlate({
    super.key,
    required this.initialContent,
    required this.onEngrave,
  });

  @override
  State<RefinementSlate> createState() => _RefinementSlateState();
}

class _RefinementSlateState extends State<RefinementSlate> {
  late TextEditingController _controller;

  @override
  void initState() {
    super.initState();
    _controller = TextEditingController(text: widget.initialContent);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Provider.of<ThemeService>(context).currentPreset;

    return Container(
      padding: const EdgeInsets.all(16.0),
      decoration: BoxDecoration(
        color: theme.scaffoldBackgroundColor,
        border: Border(top: BorderSide(color: theme.primaryColor, width: 2.0)),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '◈ CONTEXT_REFINEMENT_SLATE',
            style: TextStyle(color: theme.primaryColor, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            maxLines: 5,
            style: TextStyle(color: theme.textColor),
            decoration: const InputDecoration(
              hintText: 'Refine proposal...',
            ),
          ),
          const SizedBox(height: 16),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton(
                onPressed: () => Navigator.pop(context),
                child: Text('CANCEL', style: TextStyle(color: theme.accentColor)),
              ),
              const SizedBox(width: 8),
              ElevatedButton(
                onPressed: () {
                  widget.onEngrave(_controller.text);
                  Navigator.pop(context);
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: theme.primaryColor,
                  foregroundColor: theme.scaffoldBackgroundColor,
                ),
                child: const Text('ENGRAVE'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
