import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/memory_provider.dart';
import '../services/theme_service.dart';
import '../widgets/temporal_tab_bar.dart';

/**
 * TEMPORAL_INTERFACE (MemoryScreen) : v3.7.0
 * 
 * Implements the [LIVE] | [ARCHIVE] | [CONTEXT] view.
 * Allows navigation through titled memories and extracted context.
 */

class MemoryScreen extends StatefulWidget {
  const MemoryScreen({super.key});

  @override
  State<MemoryScreen> createState() => _MemoryScreenState();
}

class _MemoryScreenState extends State<MemoryScreen> {
  TemporalState _selectedState = TemporalState.live;

  @override
  Widget build(BuildContext context) {
    final memoryProvider = context.watch<MemoryProvider>();
    final theme = Provider.of<ThemeService>(context).currentPreset;

    return Scaffold(
      backgroundColor: Colors.transparent,
      appBar: AppBar(
        title: const Text('MACHINA_TERMINAL // TEMPORAL_HUD'),
      ),
      body: Column(
        children: [
          TemporalTabBar(
            selectedState: _selectedState,
            onStateChanged: (state) {
              setState(() {
                _selectedState = state;
              });
            },
          ),
          Expanded(
            child: _buildTemporalView(memoryProvider, theme),
          ),
        ],
      ),
    );
  }

  Widget _buildTemporalView(MemoryProvider memory, ThemePreset theme) {
    switch (_selectedState) {
      case TemporalState.live:
        return _buildLiveView(theme);
      case TemporalState.archive:
        return _buildArchiveView(memory, theme);
      case TemporalState.context:
        return _buildContextView(memory, theme);
    }
  }

  Widget _buildLiveView(ThemePreset theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.radar, size: 64, color: theme.primaryColor.withValues(alpha: 0.3)),
          const SizedBox(height: 16),
          Text(
            'ACTIVE_SESSION_MONITORING...',
            style: TextStyle(color: theme.primaryColor, letterSpacing: 2.0),
          ),
        ],
      ),
    );
  }

  Widget _buildArchiveView(MemoryProvider memory, ThemePreset theme) {
    if (memory.archivedConversations.isEmpty) {
      return const Center(child: Text('NO_ARCHIVED_MEMORIES'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: memory.archivedConversations.length,
      itemBuilder: (context, index) {
        final conv = memory.archivedConversations[index];
        return Card(
          child: ListTile(
            leading: Icon(Icons.history, color: theme.primaryColor),
            title: Text(conv['title'] ?? 'UNTITLED_FRAG'),
            subtitle: Text(conv['created_at']),
          ),
        );
      },
    );
  }

  Widget _buildContextView(MemoryProvider memory, ThemePreset theme) {
    if (memory.triplets.isEmpty) {
      return const Center(child: Text('NO_CONTEXT_TRIPLETS_SHORED'));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(16.0),
      itemCount: memory.triplets.length,
      itemBuilder: (context, index) {
        final t = memory.triplets[index];
        return Card(
          child: ListTile(
            leading: Icon(Icons.bolt, color: theme.primaryColor),
            title: Text('${t['subject_id']} -> ${t['predicate']}'),
            subtitle: Text(t['object_literal']),
            trailing: Text(
              t['created_at'].split(' ').last,
              style: const TextStyle(fontSize: 10, color: Colors.white24),
            ),
          ),
        );
      },
    );
  }
}
