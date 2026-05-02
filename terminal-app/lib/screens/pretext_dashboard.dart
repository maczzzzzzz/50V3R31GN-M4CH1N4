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
 * ◈ PRETEXT_DASHBOARD : CLINICAL_ASCENSION — v3.8.26
 * 
 * Handheld Command Instrument for the NODESTADT Authority.
 * Integrated with VoxCPM2 Waveforms and Interactive Artery Shell.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> with SingleTickerProviderStateMixin {
  int _currentIndex = 0;
  final PageController _pageController = PageController();
  final TextEditingController _chatController = TextEditingController();
  late AnimationController _smokeController;

  final List<Map<String, dynamic>> _navItems = [
    {'label': 'INGRESS', 'icon': Icons.mic},
    {'label': 'TASKS', 'icon': Icons.fact_check},
    {'label': 'MEMORY', 'icon': Icons.hub},
    {'label': 'ARTERY', 'icon': Icons.terminal},
    {'label': 'CHAT', 'icon': Icons.chat_bubble},
    {'label': 'SETTINGS', 'icon': Icons.settings},
  ];

  @override
  void initState() {
    super.initState();
    _smokeController = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _chatController.dispose();
    _smokeController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    _pageController.jumpToPage(index);
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFFF36622); // Machina Rust

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
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
                      _buildOmniscientIngressView(),
                      const TasksScreen(),
                      const MemoryScreen(),
                      const TerminalScreen(),
                      const ChatScreen(),
                      const SettingsScreen(),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          border: Border(top: BorderSide(color: Color(0xFF161616), width: 2)),
          color: Color(0xFF0F0F0F),
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: _onTabTapped,
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: accentColor,
          unselectedItemColor: const Color(0xFF404040),
          selectedFontSize: 8,
          unselectedFontSize: 8,
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1),
          unselectedLabelStyle: const TextStyle(fontWeight: FontWeight.w500, letterSpacing: 1),
          items: _navItems.map((item) => BottomNavigationBarItem(
            icon: Icon(item['icon'], size: 20),
            label: item['label'],
          )).toList(),
        ),
      ),
    );
  }

  // ─── 0. OMNISCIENT_INGRESS ──────────────────────────────────────────────

  Widget _buildOmniscientIngressView() {
    final artery = context.watch<ArteryClient>();
    final accentColor = const Color(0xFFF36622);

    return Padding(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader("◈ AMBIENT_INGRESS", accentColor),
          const SizedBox(height: 16),
          WaveformVisualizer(isActive: artery.isRecording),
          const SizedBox(height: 16),
          if (artery.currentTranscription.isNotEmpty)
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF161616),
                border: Border.all(color: accentColor.withOpacity(0.3)),
              ),
              child: Text(
                artery.currentTranscription,
                style: const TextStyle(color: Colors.white, fontSize: 13, fontStyle: FontStyle.italic, fontFamily: 'monospace'),
              ),
            ),
          const SizedBox(height: 24),
          _buildSectionHeader("◈ ARTERY_TELEMETRY", accentColor),
          Expanded(
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.2),
                border: Border.all(color: const Color(0xFF161616)),
              ),
              child: ListView.builder(
                itemCount: artery.logs.length,
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 4.0),
                  child: Text(
                    artery.logs[index],
                    style: TextStyle(color: accentColor.withOpacity(0.6), fontSize: 9, fontFamily: 'monospace', letterSpacing: 1),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 24),
          _buildVoiceControl(artery, accentColor),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, Color color) {
    return Text(
      title,
      style: TextStyle(color: color, fontWeight: FontWeight.w900, letterSpacing: 4, fontSize: 10),
    );
  }

  Widget _buildVoiceControl(ArteryClient artery, Color color) {
    return Center(
      child: _brutalistButton(
        artery.isRecording ? Icons.stop : Icons.mic,
        artery.isRecording ? Colors.red : color,
        () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
        size: 80,
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
          const Text("OMNISCIENT_ARTERY // v3.8.26", style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ]),
        _brutalistRing(0.92, accentColor),
      ]),
    );
  }

  Widget _brutalistButton(IconData icon, Color color, VoidCallback onTap, {double size = 48}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 2),
          color: color.withOpacity(0.05),
          boxShadow: [
            BoxShadow(color: color.withOpacity(0.1), blurRadius: 10, spreadRadius: 2)
          ]
        ),
        child: Icon(icon, color: color, size: size * 0.4)
      ),
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
