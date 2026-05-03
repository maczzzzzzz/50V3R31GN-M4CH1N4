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
 * Kinetic HUD instrument with Central Ingress Navigation.
 * Navigation: CHAT > TASKS > INGRESS > MEMORY > ARTERY.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> with SingleTickerProviderStateMixin {
  int _currentIndex = 2; // Default to Ingress
  final PageController _pageController = PageController(initialPage: 2);
  late AnimationController _smokeController;

  final List<Map<String, dynamic>> _navItems = [
    {'label': 'CHAT', 'icon': Icons.chat_bubble},
    {'label': 'TASKS', 'icon': Icons.fact_check},
    {'label': 'INGRESS', 'icon': Icons.mic},
    {'label': 'MEMORY', 'icon': Icons.hub},
    {'label': 'ARTERY', 'icon': Icons.terminal},
  ];

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
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
    setState(() {
      _currentIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    final accentColor = const Color(0xFF376374); // Tactical Authority

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
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
                    legacyStyle: const TextStyle(fontSize: 10, color: Color(0xFF376374)),
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
      bottomNavigationBar: _buildStandardNavBar(accentColor),
    );
  }

  // ─── 0. HIGH_FIDELITY_INGRESS ───────────────────────────────────────────

  Widget _buildHighFidelityIngressView() {
    final artery = context.watch<ArteryClient>();
    final accentColor = const Color(0xFF376374);

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24.0, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionHeader("◈ AMBIENT_INGRESS", accentColor),
          const SizedBox(height: 16),
          
          // Kinetic Waveform Shard
          Container(
            height: 140,
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
          
          const SizedBox(height: 24),
          
          // Dedicated Mic Button inside Ingress Window
          Center(
            child: _brutalistButton(
              artery.isRecording ? Icons.stop : Icons.mic,
              artery.isRecording ? Colors.red : accentColor,
              () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
              size: 80,
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }

  Widget _buildStandardNavBar(Color accentColor) {
    return Container(
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFF161616), width: 2)),
        color: Color(0xFF0F0F0F),
      ),
      child: BottomNavigationBar(
        currentIndex: _currentIndex >= 5 ? 4 : _currentIndex, // Cap at 4 for nav display
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
          const Text("QUATERNARY_MESH // v3.8.28", style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ]),
        GestureDetector(
          onTap: () => _onTabTapped(5), // Settings
          child: _brutalistRing(0.92, accentColor),
        ),
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

  Widget _buildSectionHeader(String title, Color color) {
    return Text(
      title,
      style: TextStyle(color: color, fontWeight: FontWeight.w900, letterSpacing: 4, fontSize: 10),
    );
  }
}
