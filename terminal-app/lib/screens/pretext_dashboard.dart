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
import 'terminal_screen.dart';
import 'settings_screen.dart';
import 'dart:ui' as ui;

/**
 * ◈ PRETEXT_DASHBOARD : CLINICAL_ASCENSION — v3.8.25
 * 
 * Handheld Command Instrument for the NODESTADT Authority.
 * Replaces Material Design with custom-painted Brutalist componentry.
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
  final TextEditingController _taskController = TextEditingController();
  final TextEditingController _terminalController = TextEditingController();
  final FocusNode _terminalFocus = FocusNode();
  late AnimationController _smokeController;

  final List<Map<String, dynamic>> _navItems = [
    {'label': 'INGRESS', 'icon': Icons.terminal},
    {'label': 'TASKS', 'icon': Icons.fact_check},
    {'label': 'MEMORY', 'icon': Icons.hub},
    {'label': 'ARTERY', 'icon': Icons.code},
    {'label': 'SECURE', 'icon': Icons.security},
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
    _taskController.dispose();
    _terminalController.dispose();
    _terminalFocus.dispose();
    _smokeController.dispose();
    super.dispose();
  }

  void _onTabTapped(int index) {
    _pageController.jumpToPage(index);
    setState(() {
      _currentIndex = index;
      if (index == 3) {
        Future.delayed(const Duration(milliseconds: 100), () => _terminalFocus.requestFocus());
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
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

            Row(
              children: [
                _buildClinicalSideRail(accentColor),
                Expanded(
                  child: Column(
                    children: [
                      _buildClinicalHeader(accentColor),
                      Expanded(
                        child: PageView(
                          controller: _pageController,
                          physics: const NeverScrollableScrollPhysics(),
                          children: [
                            _buildClinicalIngressView(),
                            _buildClinicalTasksView(),
                            _buildClinicalMemoryView(),
                            _buildTerminalView(),
                            _buildSecurityVisualizer(),
                          ],
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

  // ─── 0. INGRESS_VIEW ──────────────────────────────────────────────────────

  Widget _buildClinicalIngressView() {
    final chatService = context.watch<ChatService>();
    final artery = context.watch<ArteryClient>();

    return Column(
      children: [
        if (artery.isRecording) _buildSecurityPulseOverlay(),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.all(20),
            itemCount: chatService.messages.length,
            itemBuilder: (context, index) {
              final msg = chatService.messages[index];
              return GeometricShard(
                borderColor: msg.sender == 'system' ? const Color(0xFFC7A87A) : const Color(0xFFF36622),
                title: Text("::/${msg.sender.toUpperCase()}", style: TextStyle(color: msg.sender == 'system' ? const Color(0xFFC7A87A) : const Color(0xFFF36622), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 2)),
                subtitle: Text(msg.text, style: const TextStyle(color: Color(0xFFE5E5E5), fontSize: 16, height: 1.4)),
              );
            },
          ),
        ),
        _buildClinicalInput(artery),
      ],
    );
  }

  Widget _buildSecurityPulseOverlay() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      color: const Color(0xFFF36622).withOpacity(0.1),
      child: Row(children: [
        const Icon(Icons.emergency, color: Color(0xFFF36622), size: 14),
        const SizedBox(width: 12),
        const Text("VOICE_INGRESS: ACTIVE_ARTERY", style: TextStyle(color: Color(0xFFF36622), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 2)),
        const Spacer(),
        const Text("V2F_GATED", style: TextStyle(color: Color(0xFFC7A87A), fontSize: 9, fontWeight: FontWeight.w900)),
      ]),
    );
  }

  Widget _buildClinicalInput(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(
        color: Color(0xFF161616),
        border: Border(top: BorderSide(color: Color(0xFF333333))),
      ),
      child: Row(
        children: [
          _brutalistButton(artery.isRecording ? Icons.stop : Icons.mic, const Color(0xFFC7A87A), () {
            artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream();
          }),
          const SizedBox(width: 16),
          Expanded(child: TextField(
            controller: _chatController,
            style: const TextStyle(color: Colors.white, fontSize: 15),
            decoration: const InputDecoration(hintText: "ENTER_DIRECTIVE", border: InputBorder.none)
          )),
          const SizedBox(width: 16),
          _brutalistButton(Icons.bolt, const Color(0xFFF36622), () {
            if (_chatController.text.isNotEmpty) {
               context.read<ChatService>().sendMessage(_chatController.text, artery);
               _chatController.clear();
            }
          }),
        ],
      ),
    );
  }

  // ─── 1. TASKS_VIEW ───────────────────────────────────────────────────────

  Widget _buildClinicalTasksView() {
    final taskService = context.watch<TaskService>();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(20),
          child: TextField(
            controller: _taskController,
            style: const TextStyle(color: Colors.white),
            decoration: const InputDecoration(hintText: "ADD_IMPLEMENTATION_SHARD"),
            onSubmitted: (val) {
              if (val.isNotEmpty) {
                taskService.addTask(val);
                _taskController.clear();
              }
            },
          ),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            itemCount: taskService.tasks.length,
            itemBuilder: (context, index) {
              final task = taskService.tasks[index];
              return GeometricShard(
                borderColor: task.isCompleted ? const Color(0xFF404040) : const Color(0xFFC7A87A),
                onTap: () => taskService.toggleTask(task.id),
                title: Text(task.title, style: TextStyle(color: task.isCompleted ? const Color(0xFFA3A3A3) : Colors.white, decoration: task.isCompleted ? TextDecoration.lineThrough : null)),
                trailing: Icon(task.isCompleted ? Icons.check_box : Icons.check_box_outline_blank, color: task.isCompleted ? const Color(0xFFF36622) : const Color(0xFF404040), size: 20),
              );
            },
          ),
        ),
      ],
    );
  }

  // ─── 2. MEMORY_VIEW ──────────────────────────────────────────────────────

  Widget _buildClinicalMemoryView() {
    final memoryProvider = context.watch<MemoryProvider>();
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 15),
          decoration: const BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF333333)))),
          child: Row(children: [
            const Text("MEMORY_SHARD_INGRESS", style: TextStyle(color: Color(0xFFC7A87A), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
            const Spacer(),
            _brutalistButton(Icons.sync, const Color(0xFFA3A3A3), memoryProvider.fetchMemories, size: 30),
          ]),
        ),
        Expanded(
          child: memoryProvider.isLoading 
            ? const Center(child: CircularProgressIndicator(color: Color(0xFFF36622)))
            : ListView.builder(
                padding: const EdgeInsets.all(20),
                itemCount: memoryProvider.memories.length,
                itemBuilder: (context, index) {
                  final m = memoryProvider.memories[index];
                  return GeometricShard(
                    borderColor: const Color(0xFFF36622).withOpacity(0.5),
                    title: Text(m['content'] ?? 'NO_DATA', style: const TextStyle(color: Colors.white, fontSize: 14)),
                    subtitle: Text(m['timestamp'] ?? 'DATETIME_UNKNOWN', style: const TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, letterSpacing: 1)),
                  );
                },
              ),
        ),
      ],
    );
  }

  // ─── 4. SECURITY_VISUALIZER ──────────────────────────────────────────────

  Widget _buildSecurityVisualizer() {
    return Padding(
      padding: const EdgeInsets.all(30),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.security, color: Color(0xFFF36622), size: 80),
          const SizedBox(height: 40),
          const Text("SPIFFE_IDENTITY_PULSE", style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900, letterSpacing: 4)),
          const SizedBox(height: 20),
          const Text("V2F_GATING: ENFORCED", style: TextStyle(color: Color(0xFFC7A87A), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 2)),
          const SizedBox(height: 60),
          _securityAuraRing(),
          const SizedBox(height: 60),
          const Text("ST3GG_TOKEN: VALID", style: TextStyle(color: Color(0xFFF36622), fontSize: 12, fontWeight: FontWeight.w900, letterSpacing: 1)),
        ],
      ),
    );
  }

  Widget _securityAuraRing() {
    return Container(
      width: 200,
      height: 2,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.transparent, const Color(0xFFF36622), Colors.transparent],
        ),
      ),
    );
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  Widget _buildClinicalSideRail(Color accentColor) {
    return Container(
      width: 64,
      decoration: const BoxDecoration(
        border: Border(right: BorderSide(color: Color(0xFF333333), width: 1)),
        color: Color(0xFF0F0F0F),
      ),
      child: Column(children: [
        const SizedBox(height: 30),
        const Text("Σ", style: TextStyle(color: Color(0xFFF36622), fontSize: 24, fontWeight: FontWeight.w900)),
        const SizedBox(height: 50),
        ...List.generate(_navItems.length, (index) {
          final isSelected = _currentIndex == index;
          return GestureDetector(
            onTap: () => _onTabTapped(index),
            child: Container(
              height: 72,
              width: double.infinity,
              color: isSelected ? const Color(0xFFF36622).withOpacity(0.1) : Colors.transparent,
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Icon(_navItems[index]['icon'], color: isSelected ? accentColor : const Color(0xFF404040), size: 24),
                const SizedBox(height: 6),
                Text(_navItems[index]['label'], style: TextStyle(color: isSelected ? accentColor : const Color(0xFF404040), fontSize: 7, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ]),
            ),
          );
        }),
      ]),
    );
  }

  Widget _buildClinicalHeader(Color accentColor) {
    return Container(
      padding: const EdgeInsets.all(24),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text("NODESTADT_HUB", style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, letterSpacing: 5, fontSize: 18)),
          const SizedBox(height: 4),
          const Text("QUATERNARY_MESH // v3.8.25", style: TextStyle(color: Color(0xFFA3A3A3), fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 2)),
        ]),
        _brutalistRing(0.85, const Color(0xFFF36622)),
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
        ),
        child: Icon(icon, color: color, size: size * 0.5)
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

  Widget _buildTerminalView() {
    return const TerminalScreen();
  }
}
