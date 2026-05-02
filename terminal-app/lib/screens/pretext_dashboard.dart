import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import 'dart:convert';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/task_service.dart';
import '../services/memory_provider.dart';
import '../services/vsb_listener.dart';
import '../widgets/pretext_painter.dart';
import '../widgets/geometric_shard.dart';
import '../widgets/fluid_smoke_painter.dart';
import '../widgets/waveform_visualizer.dart';
import 'terminal_screen.dart';
import 'settings_screen.dart';
import 'tasks_screen.dart';
import 'memory_screen.dart';
import 'chat_screen.dart';
import 'dart:ui' as ui;

/**
 * ◈ PRETEXT_DASHBOARD : CLINICAL_ASCENSION — v3.8.28
 * 
 * Kinetic HUD instrument with OMI-style Central Ingress.
 * Navigation: CHAT > TASKS > (INGRESS) > MEMORY > ARTERY.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  late AnimationController _smokeController;

  @override
  void initState() {
    super.initState();
    _smokeController = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _smokeController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    if (index == 2) return; // Skip central ingress slot in PageView mapping
    
    int pageIndex = index;
    if (index > 2) pageIndex = index - 1; // Shift back to accommodate the middle gap

    _pageController.jumpToPage(pageIndex);
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFFF36622); // Machina Rust

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBody: true, // Crucial for OMI notch effect
      body: SafeArea(
        child: Stack(
          children: [
            // ◈ METABOLIC_BACKGROUND
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _smokeController,
                builder: (context, _) => CustomPaint(
                  painter: FluidSmokePainter(time: _smokeController.value * 25),
                ),
              ),
            ),

            Column(
              children: [
                _buildClinicalHeader(accentColor),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    children: [
                      const ChatScreen(),
                      const TasksScreen(),
                      const MemoryScreen(),
                      const TerminalScreen(),
                      const SettingsScreen(),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      floatingActionButtonLocation: FloatingActionButtonLocation.centerDocked,
      floatingActionButton: _buildOmniscientIngressButton(accentColor),
      bottomNavigationBar: _buildOmiStyleNavBar(accentColor),
    );
  }

  Widget _buildOmniscientIngressButton(Color accentColor) {
    final artery = context.watch<ArteryClient>();
    return Container(
      height: 72,
      width: 72,
      margin: const EdgeInsets.only(top: 32),
      child: FloatingActionButton(
        onPressed: () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
        backgroundColor: artery.isRecording ? Colors.red : const Color(0xFF0F0F0F),
        elevation: 0,
        shape: CircleBorder(side: BorderSide(color: artery.isRecording ? Colors.red : accentColor, width: 2)),
        child: Icon(
          artery.isRecording ? Icons.stop : Icons.mic,
          color: artery.isRecording ? Colors.white : accentColor,
          size: 32,
        ),
      ),
    );
  }

  Widget _buildOmiStyleNavBar(Color accentColor) {
    return BottomAppBar(
      color: const Color(0xFF0F0F0F),
      shape: const CircularNotchedRectangle(),
      notchMargin: 8,
      child: Container(
        height: 60,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            _navItem(0, Icons.chat_bubble, "CHAT"),
            _navItem(1, Icons.fact_check, "TASKS"),
            const SizedBox(width: 48), // Gap for FAB
            _navItem(3, Icons.hub, "MEMORY"),
            _navItem(4, Icons.code, "ARTERY"),
          ],
        ),
      ),
    );
  }

  Widget _navItem(int index, IconData icon, String label) {
    final active = _currentIndex == index;
    final color = active ? const Color(0xFFF36622) : const Color(0xFF404040);

    return GestureDetector(
      onTap: () => _onTabTapped(index),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
        ],
      ),
    );
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  Widget _buildClinicalHeader(Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text("NODESTADT_HUB", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 5, fontSize: 18)),
          const SizedBox(height: 4),
          const Text("OMNISCIENT_ARTERY // v3.8.28", style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ]),
        GestureDetector(
          onTap: () => _onTabTapped(5), // Link to Settings
          child: _brutalistRing(0.92, accentColor),
        ),
      ]),
    );
  }

  Widget _brutalistRing(double progress, Color color) {
    return SizedBox(
      width: 28,
      height: 28,
      child: CircularProgressIndicator(
        value: progress,
        strokeWidth: 4,
        color: color,
        backgroundColor: const Color(0xFF161616),
      ),
    );
  }
}
