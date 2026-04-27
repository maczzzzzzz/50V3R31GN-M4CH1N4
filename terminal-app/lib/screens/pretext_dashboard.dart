import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/task_service.dart';
import '../services/vsb_listener.dart';
import '../widgets/pretext_painter.dart';
import '../widgets/spatial_hotspot_artery.dart';
import 'terminal_screen.dart';
import 'settings_screen.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_DASHBOARD_V4 — PHASE 96.1
 * 
 * Total UI Modernization.
 * Inspired by hermes-ui / gruvbox-material-vscode.
 * Bottom Navigation + High-Density Mnemonic Grid.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  final TextEditingController _controller = TextEditingController();

  final List<Map<String, dynamic>> _navItems = [
    {'label': 'HOME', 'icon': Icons.terminal},
    {'label': 'TASKS', 'icon': Icons.fact_check},
    {'label': 'MEMORY', 'icon': Icons.hub},
    {'label': 'TERM', 'icon': Icons.code},
    {'label': 'SETUP', 'icon': Icons.settings},
  ];

  @override
  void dispose() {
    _pageController.dispose();
    _controller.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    _pageController.jumpToPage(index);
    setState(() => _currentIndex = index);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;
    final bg1 = const Color(0xFF32302f); // Gruvbox BG1

    return Scaffold(
      backgroundColor: theme.scaffoldBackgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // ◈ MONOLITHIC_HEADER
            _buildModernHeader(primaryColor),

            // ◈ MAIN_VIEWPORT
            Expanded(
              child: Container(
                margin: const EdgeInsets.symmetric(horizontal: 8),
                decoration: BoxDecoration(
                  border: Border.all(color: theme.dividerColor, width: 1),
                  color: bg1.withOpacity(0.5),
                ),
                child: PageView(
                  controller: _pageController,
                  physics: const NeverScrollableScrollPhysics(),
                  children: [
                    _buildChatView(),
                    _buildTasksView(),
                    const SpatialHotspotArtery(),
                    _buildTerminalView(),
                    const SettingsScreen(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
      // ◈ BOTTOM_NAVIGATION (Space Efficiency)
      bottomNavigationBar: _buildBottomNav(primaryColor, bg1),
    );
  }

  Widget _buildModernHeader(Color primaryColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        color: Color(0xFF32302f),
        border: Border(bottom: BorderSide(color: Color(0xFF504945), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  border: Border.all(color: primaryColor, width: 2),
                ),
                child: Center(child: Text("S", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, fontSize: 18))),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text("50V3R31GN_M4CH1N4", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, letterSpacing: 2, fontSize: 16)),
                  Text("OPERATIONAL // ${_navItems[_currentIndex]['label']}", style: const TextStyle(color: Color(0xFFA89984), fontSize: 10)),
                ],
              ),
            ],
          ),
          _buildContextRings(),
        ],
      ),
    );
  }

  Widget _buildBottomNav(Color primaryColor, Color bgColor) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: bgColor,
        border: const Border(top: BorderSide(color: Color(0xFF504945), width: 1)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_navItems.length, (index) {
          final isSelected = _currentIndex == index;
          return GestureDetector(
            onTap: () => _onTabTapped(index),
            behavior: HitTestBehavior.opaque,
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(_navItems[index]['icon'], color: isSelected ? primaryColor : const Color(0xFFA89984), size: 24),
                const SizedBox(height: 4),
                Text(_navItems[index]['label'], style: TextStyle(color: isSelected ? primaryColor : const Color(0xFFA89984), fontSize: 8, fontWeight: FontWeight.bold)),
              ],
            ),
          );
        }),
      ),
    );
  }

  // ─── 0. CHAT_VIEW ───────────────────────────────────────────────────────

  Widget _buildChatView() {
    final chatService = context.watch<ChatService>();
    final artery = context.watch<ArteryClient>();

    return Column(
      children: [
        if (artery.isRecording) _buildFluidSmokeOverlay(artery),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: chatService.messages.length,
            itemBuilder: (context, index) {
              final msg = chatService.messages[index];
              return Padding(
                padding: const EdgeInsets.only(bottom: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("::/${msg.sender.toUpperCase()}", style: const TextStyle(color: Color(0xFFFE8019), fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
                    Text(msg.text, style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 18, height: 1.4)),
                  ],
                ),
              );
            },
          ),
        ),
        _buildTacticalInput(artery),
      ],
    );
  }

  Widget _buildFluidSmokeOverlay(ArteryClient artery) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFfb4934).withOpacity(0.05),
        border: Border.all(color: const Color(0xFFfb4934), width: 1),
      ),
      child: Column(
        children: [
          Row(
            children: [
              const Icon(Icons.graphic_eq, color: Color(0xFFfb4934), size: 16),
              const SizedBox(width: 8),
              const Text("FLUID_SMOKE_ARTERY_ACTIVE", style: TextStyle(color: Color(0xFFfb4934), fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          const SizedBox(height: 8),
          Text(artery.currentTranscription, style: const TextStyle(color: Color(0xFFfbf1c7), fontSize: 14, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _buildTacticalInput(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF282828),
        border: Border(top: BorderSide(color: Color(0xFF504945))),
      ),
      child: Row(
        children: [
          _tacticalButton(
            icon: artery.isRecording ? Icons.stop : Icons.mic,
            color: artery.isRecording ? const Color(0xFFfb4934) : const Color(0xFFfabd2f),
            onPressed: () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Color(0xFFfbf1c7), fontSize: 18),
              decoration: const InputDecoration(
                hintText: "ENTER_DIRECTIVE...",
                border: InputBorder.none,
                filled: false,
              ),
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          const SizedBox(width: 16),
          _tacticalButton(
            icon: Icons.bolt,
            color: const Color(0xFFfb4934),
            onPressed: _handleSend,
          ),
        ],
      ),
    );
  }

  Widget _tacticalButton({required IconData icon, required Color color, required VoidCallback onPressed}) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 56,
        height: 56,
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 2),
          color: color.withOpacity(0.05),
        ),
        child: Icon(icon, color: color, size: 32),
      ),
    );
  }

  void _handleSend() {
    if (_controller.text.isEmpty) return;
    final artery = context.read<ArteryClient>();
    context.read<ChatService>().sendMessage(_controller.text, artery);
    _controller.clear();
  }

  // ─── 1. TASKS_VIEW ───────────────────────────────────────────────────────

  Widget _buildTasksView() {
    final taskService = context.watch<TaskService>();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: taskService.tasks.length,
      itemBuilder: (context, index) {
        final task = taskService.tasks[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF504945)),
            color: const Color(0xFF32302f),
          ),
          child: ListTile(
            leading: Checkbox(value: task.isCompleted, onChanged: (_) => taskService.toggleTask(task.id)),
            title: Text(task.title, style: TextStyle(color: task.isCompleted ? Colors.white24 : const Color(0xFFfbf1c7), fontSize: 18)),
          ),
        );
      },
    );
  }

  // ─── 3. TERMINAL_VIEW ───────────────────────────────────────────────────

  Widget _buildTerminalView() {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final combined = [...vsb.packets, ...artery.logs].reversed.toList();

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.all(12),
      child: ListView.builder(
        itemCount: combined.length,
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 1),
            child: Text(
              combined[index],
              style: const TextStyle(color: Color(0xFFb8bb26), fontSize: 12, fontFamily: 'monospace'),
            ),
          );
        },
      ),
    );
  }

  Widget _buildPlaceholder(String label) {
    return Center(child: Text("::/$label\_OFFLINE", style: const TextStyle(color: Colors.white12, fontSize: 18, fontWeight: FontWeight.bold)));
  }

  Widget _buildContextRings() {
    return Row(
      children: [
        _ring(0.85, const Color(0xFFfb4934)),
        const SizedBox(width: 8),
        _ring(0.42, const Color(0xFFb8bb26)),
        const SizedBox(width: 8),
        _ring(0.12, const Color(0xFF83a598)),
      ],
    );
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(width: 20, height: 20, child: CircularProgressIndicator(value: progress, strokeWidth: 3, color: color, backgroundColor: const Color(0xFF3c3836)));
  }
}
