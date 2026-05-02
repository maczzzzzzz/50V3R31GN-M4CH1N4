import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/memory_provider.dart';
import '../services/theme_service.dart';
import '../widgets/temporal_tab_bar.dart';
import '../widgets/geometric_shard.dart';

/**
 * ◈ MEMORY_SCREEN : TEMPORAL_INTERFACE — v3.8.25
 * 
 * Implements the [LIVE] | [ARCHIVE] | [CONTEXT] navigation.
 * Standardized clinical data ingress.
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
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: const Text('MEMORY_CORE'),
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
          Icon(Icons.radar, size: 64, color: const Color(0xFFF36622).withOpacity(0.3)),
          const SizedBox(height: 24),
          const Text(
            'ACTIVE_SESSION_MONITORING',
            style: TextStyle(color: Color(0xFFF36622), letterSpacing: 4.0, fontWeight: FontWeight.w900, fontSize: 10, fontFamily: 'Space Grotesk'),
          ),
        ],
      ),
    );
  }

  Widget _buildArchiveView(MemoryProvider memory, ThemePreset theme) {
    if (memory.archivedConversations.isEmpty) {
      return const Center(child: Text('NO_ARCHIVED_MEMORIES', style: TextStyle(color: Color(0xFF404040), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(24.0),
      itemCount: memory.archivedConversations.length,
      itemBuilder: (context, index) {
        final conv = memory.archivedConversations[index];
        return GeometricShard(
          borderColor: const Color(0xFFC7A87A),
          leading: const Icon(Icons.history, color: Color(0xFFC7A87A), size: 18),
          title: Text(conv['title'] ?? 'UNTITLED_FRAG', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 15)),
          subtitle: Text(conv['created_at'], style: const TextStyle(color: Color(0xFFA3A3A3), fontSize: 9, letterSpacing: 1)),
        );
      },
    );
  }

  Widget _buildContextView(MemoryProvider memory, ThemePreset theme) {
    if (memory.triplets.isEmpty) {
      return const Center(child: Text('NO_CONTEXT_TRIPLETS_SHORED', style: TextStyle(color: Color(0xFF404040), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)));
    }
    return ListView.builder(
      padding: const EdgeInsets.all(24.0),
      itemCount: memory.triplets.length,
      itemBuilder: (context, index) {
        final t = memory.triplets[index];
        return GeometricShard(
          borderColor: const Color(0xFFF36622).withOpacity(0.4),
          leading: const Icon(Icons.hub, color: Color(0xFFF36622), size: 18),
          title: Text('${t['subject_id']} -> ${t['predicate']}', style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.white)),
          subtitle: Text(t['object_literal'], style: const TextStyle(color: Color(0xFFE5E5E5), fontSize: 13)),
          trailing: Text(
            t['created_at'].split(' ').last,
            style: const TextStyle(fontSize: 8, color: Color(0xFF404040), fontWeight: FontWeight.w900),
          ),
        );
      },
    );
  }
}
