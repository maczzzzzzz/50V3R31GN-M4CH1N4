import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/task_service.dart';
import '../services/vsb_listener.dart';
import '../widgets/pretext_painter.dart';
import '../widgets/spatial_hotspot_artery.dart';
import '../widgets/fluid_smoke_painter.dart';
import 'terminal_screen.dart';
import 'settings_screen.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_DASHBOARD_V4 — PHASE 96.2 (Ascended)
 * 
 * Modular Command Deck with Fluid Smoke metabolism.
 * Features:
 * - Direct Pretext-Painter background (120fps).
 * - Persistent tactical side-rail.
 * - High-readability tactile cards.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  final TextEditingController _controller = TextEditingController();
  late AnimationController _smokeController;

  final List<Map<String, dynamic>> _navItems = [
    {'label': 'HOME', 'icon': Icons.terminal},
    {'label': 'TASKS', 'icon': Icons.fact_check},
    {'label': 'MEMORY', 'icon': Icons.hub},
    {'label': 'TERM', 'icon': Icons.code},
    {'label': 'SETUP', 'icon': Icons.settings},
  ];

  @override
  void initState() {
    super.initState();
    _smokeController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 10),
    )..repeat();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _controller.dispose();
    _smokeController.dispose();
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

    return Scaffold(
      backgroundColor: const Color(0xFF1D2021),
      body: SafeArea(
        child: Stack(
          children: [
            // ◈ METABOLIC_BACKGROUND (Fluid Smoke)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _smokeController,
                builder: (context, _) => CustomPaint(
                  painter: FluidSmokePainter(time: _smokeController.value * 20),
                ),
              ),
            ),

            Row(
              children: [
                // ◈ PERSISTENT_SIDE_RAIL
                _buildSideRail(primaryColor),

                // ◈ MAIN_TACTICAL_VIEWPORT
                Expanded(
                  child: Column(
                    children: [
                      _buildModernHeader(primaryColor),
                      Expanded(
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFF3C3836).withOpacity(0.5), width: 1),
                            color: const Color(0xFF282828).withOpacity(0.4),
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
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSideRail(Color primaryColor) {
    return Container(
      width: 72,
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: Color(0xFF3C3836), width: 2)),
        color: Color(0xFF282828),
      ),
      child: Column(
        children: [
          const SizedBox(height: 20),
          // ◈ S_OS LOGO
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFFB4934), width: 2),
              color: Colors.black12,
            ),
            child: const Center(child: Text("S", style: TextStyle(color: Color(0xFFFB4934), fontWeight: FontWeight.bold))),
          ),
          const SizedBox(height: 40),
          ...List.generate(_navItems.length, (index) {
            final item = _navItems[index];
            final isSelected = _currentIndex == index;
            return GestureDetector(
              onTap: () => _onTabTapped(index),
              child: Container(
                height: 72,
                width: double.infinity,
                color: isSelected ? const Color(0xFF3C3836) : Colors.transparent,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(item['icon'], color: isSelected ? primaryColor : const Color(0xFFA89984), size: 28),
                    const SizedBox(height: 4),
                    Text(item['label'], style: TextStyle(color: isSelected ? primaryColor : const Color(0xFFA89984), fontSize: 8, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
            );
          }),
          const Spacer(),
          const Padding(
            padding: EdgeInsets.only(bottom: 20),
            child: Icon(Icons.bolt, color: Color(0xFFB8BB26), size: 20),
          ),
        ],
      ),
    );
  }

  Widget _buildModernHeader(Color primaryColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "50V3R31GN_M4CH1N4",
                style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, letterSpacing: 3, fontSize: 20),
              ),
              const Text("ASCENDED_v3.8.7 // TACTICAL_DECK", style: TextStyle(color: Color(0xFFA89984), fontSize: 10, fontWeight: FontWeight.bold)),
            ],
          ),
          _buildContextRings(),
        ],
      ),
    );
  }

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
                padding: const EdgeInsets.only(bottom: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text("::/${msg.sender.toUpperCase()}", style: const TextStyle(color: Color(0xFFFE8019), fontSize: 10, fontWeight: FontWeight.bold)),
                    const SizedBox(height: 6),
                    Text(msg.text, style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 18, height: 1.4)),
                  ],
                ),
              );
            },
          ),
        ),
        _buildInputArtery(artery),
      ],
    );
  }

  Widget _buildFluidSmokeOverlay(ArteryClient artery) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFfb4934).withOpacity(0.1),
        border: Border.all(color: const Color(0xFFfb4934), width: 1),
      ),
      child: Text(
        "⟨ V01C3_IN6R355 ⟩ : ${artery.currentTranscription}",
        style: const TextStyle(color: Color(0xFFfb4934), fontSize: 14, fontStyle: FontStyle.italic),
      ),
    );
  }

  Widget _buildInputArtery(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF282828),
        border: Border(top: BorderSide(color: Color(0xFF3C3836))),
      ),
      child: Row(
        children: [
          _tacticalIconButton(artery.isRecording ? Icons.stop : Icons.mic, const Color(0xFFFABD2F), () {
            artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream();
          }),
          const SizedBox(width: 12),
          Expanded(child: TextField(
            controller: _controller,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: const InputDecoration(hintText: "ENTER_DIRECTIVE...", border: InputBorder.none)
          )),
          const SizedBox(width: 12),
          _tacticalIconButton(Icons.bolt, const Color(0xFFFB4934), () {
            if (_controller.text.isNotEmpty) {
               context.read<ChatService>().sendMessage(_controller.text, artery);
               _controller.clear();
            }
          }),
        ],
      ),
    );
  }

  Widget _tacticalIconButton(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 54,
        height: 54,
        decoration: BoxDecoration(border: Border.all(color: color, width: 2), color: color.withOpacity(0.05)),
        child: Icon(icon, color: color, size: 28),
      ),
    );
  }

  Widget _buildTasksView() {
    final taskService = context.watch<TaskService>();
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: taskService.tasks.length,
      itemBuilder: (context, index) {
        final task = taskService.tasks[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(border: Border.all(color: const Color(0xFF3C3836)), color: const Color(0xFF282828)),
          child: ListTile(
            leading: Checkbox(value: task.isCompleted, onChanged: (_) => taskService.toggleTask(task.id)),
            title: Text(task.title, style: TextStyle(color: task.isCompleted ? Colors.white24 : Colors.white, fontSize: 18)),
          ),
        );
      },
    );
  }

  Widget _buildTerminalView() {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final combined = [...vsb.packets, ...artery.logs].reversed.toList();

    return Container(
      color: Colors.black,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: combined.length,
        itemBuilder: (context, index) => Text(combined[index], style: const TextStyle(color: Color(0xFFB8BB26), fontSize: 12, fontFamily: 'monospace')),
      ),
    );
  }

  Widget _buildContextRings() {
    return Row(
      children: [
        _ring(0.85, const Color(0xFFFB4934)),
        const SizedBox(width: 12),
        _ring(0.42, const Color(0xFFB8BB26)),
        const SizedBox(width: 12),
        _ring(0.12, const Color(0xFF83A598)),
      ],
    );
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(width: 24, height: 24, child: CircularProgressIndicator(value: progress, strokeWidth: 4, color: color, backgroundColor: const Color(0xFF3C3836)));
  }
}
