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
 * Navigation: CHAT > TASKS > (INGRESS FAB) > MEMORY > ARTERY.
 * Restores Pretext Scrolling Background and High-Fidelity Ingress UI.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> with SingleTickerProviderStateMixin {
  int _currentIndex = 0; // Local index (0:Chat, 1:Tasks, 2:Memory, 3:Artery, 4:Settings)
  // PageView indices: 0:Chat, 1:Tasks, 2:Ingress, 3:Memory, 4:Artery, 5:Settings
  final PageController _pageController = PageController(initialPage: 2);
  late AnimationController _smokeController;

  @override
  void initState() {
    super.initState();
    _currentIndex = 2; // Default to Ingress
    _smokeController = AnimationController(vsync: this, duration: const Duration(seconds: 15))..repeat();
  }

  @override
  void dispose() {
    _pageController.dispose();
    _smokeController.dispose();
    super.dispose();
  }

  void _onTabTapped(int pageIndex) {
    _pageController.animateToPage(
      pageIndex,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() {
      _currentIndex = pageIndex;
    });
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFFF36622); // Machina Rust

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      extendBody: true,
      body: SafeArea(
        child: Stack(
          children: [
            // ◈ 1. METABOLIC_BACKGROUND (Smoke)
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _smokeController,
                builder: (context, _) => CustomPaint(
                  painter: FluidSmokePainter(time: _smokeController.value * 25),
                ),
              ),
            ),

            // ◈ 2. PRETEXT_SCROLLING_BACKGROUND (Legacy Code Rain)
            Positioned.fill(
              child: Opacity(
                opacity: 0.1,
                child: CustomPaint(
                  painter: PretextPainter(
                    legacyText: "://NODESTADT_MESH_ACTIVE // ARTERY_SIGNAL_STRENGTH_98 // VOXCPM2_INFERENCE_READY // OMI_PROTOCOL_V1_LOCKED // ST3GG_SIGNATURE_VERIFIED // M7B_BUS_TRUTH_MMAP // PURE_BASE_INVARIANT_ENFORCED",
                    legacyStyle: const TextStyle(fontSize: 10, color: Color(0xFFF36622)),
                  ),
                ),
              ),
            ),

            Column(
              children: [
                _buildClinicalHeader(accentColor),
                Expanded(
                  child: PageView(
                    controller: _pageController,
                    onPageChanged: (idx) => setState(() => _currentIndex = idx),
                    children: [
                      const ChatScreen(),
                      const TasksScreen(),
                      _buildHighFidelityIngressView(),
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
      floatingActionButton: _buildOmniscientIngressFAB(accentColor),
      bottomNavigationBar: _buildOmiStyleNavBar(accentColor),
    );
  }

  // ─── 0. HIGH_FIDELITY_INGRESS ───────────────────────────────────────────

  Widget _buildHighFidelityIngressView() {
    final artery = context.watch<ArteryClient>();
    final accentColor = const Color(0xFFF36622);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader("◈ AMBIENT_INGRESS", accentColor),
          const SizedBox(height: 16),
          
          // Kinetic Waveform Shard
          Container(
            height: 120,
            decoration: BoxDecoration(
              color: Colors.black.withOpacity(0.3),
              border: Border.all(color: accentColor.withOpacity(0.2)),
            ),
            child: Stack(
              children: [
                Center(child: WaveformVisualizer(isActive: artery.isRecording, color: accentColor)),
                if (!artery.isRecording)
                  const Center(child: Text("STANDBY", style: TextStyle(color: Color(0xFF404040), fontWeight: FontWeight.w900, letterSpacing: 8, fontSize: 12))),
              ],
            ),
          ),
          
          const SizedBox(height: 24),
          
          // Transcription Shard
          if (artery.currentTranscription.isNotEmpty || artery.isRecording)
            GeometricShard(
              borderColor: accentColor.withOpacity(0.5),
              title: Text(artery.isRecording ? "◈ LISTENING..." : "◈ LAST_INGRESS", style: TextStyle(color: accentColor, fontWeight: FontWeight.bold, fontSize: 10)),
              subtitle: Text(
                artery.currentTranscription.isEmpty ? "..." : artery.currentTranscription,
                style: const TextStyle(color: Colors.white, fontSize: 16, fontFamily: 'monospace', height: 1.4),
              ),
            ),
            
          const SizedBox(height: 24),
          
          _buildSectionHeader("◈ ARTERY_LOGS", const Color(0xFF404040)),
          Expanded(
            child: Container(
              margin: const EdgeInsets.only(top: 8),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                border: Border(left: BorderSide(color: accentColor.withOpacity(0.1), width: 2)),
              ),
              child: ListView.builder(
                itemCount: artery.logs.length,
                itemBuilder: (context, index) => Padding(
                  padding: const EdgeInsets.only(bottom: 4.0),
                  child: Text(
                    artery.logs[index],
                    style: TextStyle(color: accentColor.withOpacity(0.4), fontSize: 9, fontFamily: 'monospace', letterSpacing: 1),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildOmniscientIngressFAB(Color accentColor) {
    final artery = context.watch<ArteryClient>();
    return SizedBox(
      height: 76,
      width: 76,
      child: FloatingActionButton(
        onPressed: () {
          if (_currentIndex != 2) {
            _onTabTapped(2);
          } else {
            artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream();
          }
        },
        backgroundColor: artery.isRecording ? Colors.red : const Color(0xFF0A0A0A),
        elevation: 10,
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
        height: 64,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            // CHAT (0) > TASKS (1)
            Row(children: [
              _navIcon(0, Icons.chat_bubble, "CHAT"),
              const SizedBox(width: 32),
              _navIcon(1, Icons.fact_check, "TASKS"),
            ]),
            // FAB SPACE
            const SizedBox(width: 48),
            // MEMORY (3) > ARTERY (4)
            Row(children: [
              _navIcon(3, Icons.hub, "MEMORY"),
              const SizedBox(width: 32),
              _navIcon(4, Icons.terminal, "ARTERY"),
            ]),
          ],
        ),
      ),
    );
  }

  Widget _navIcon(int pageIndex, IconData icon, String label) {
    final active = _currentIndex == pageIndex;
    final color = active ? const Color(0xFFF36622) : const Color(0xFF404040);

    return GestureDetector(
      onTap: () => _onTabTapped(pageIndex),
      behavior: HitTestBehavior.opaque,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, color: color, size: 22),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(color: color, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1),
          ),
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

  Widget _buildClinicalHeader(Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text("NODESTADT_HUB", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 5, fontSize: 18)),
          const SizedBox(height: 4),
          const Text("QUATERNARY_MESH // v3.8.28", style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ]),
        GestureDetector(
          onTap: () => _onTabTapped(5), // Settings
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
