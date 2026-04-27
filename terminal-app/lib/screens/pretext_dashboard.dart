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
import '../widgets/spatial_hotspot_artery.dart';
import '../widgets/fluid_smoke_painter.dart';
import 'terminal_screen.dart';
import 'settings_screen.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_DASHBOARD_ASCENDED — v3.8.7 RE-GROUNDED
 * 
 * Total Integrity Reconstruction.
 * Restores: Memory Shards, Task CRUD, Voice Ingress, and Interactive Terminal.
 * 
 * PHASE 97: Unified Component Stream (Headless UI)
 * - Decodes JSON-serialized Shroud components from Node B.
 * - Renders bit-identical UI elements across Web and Mobile.
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

  // ◈ Shroud Component Tree (Phase 97)
  ShroudComponent? _shroudRoot;

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
    _smokeController = AnimationController(vsync: this, duration: const Duration(seconds: 10))..repeat();
    _igniteShroudStream();
  }

  Future<void> _igniteShroudStream() async {
    // ◈ Artery Ingress for Shroud Components (SSE)
    // In Phase 97, this connects to the Headless UI Server on Node B.
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
      if (index == 3) { // Terminal Auto-Focus
        Future.delayed(const Duration(milliseconds: 100), () => _terminalFocus.requestFocus());
      }
    });
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
            // ◈ METABOLIC_BACKGROUND
            Positioned.fill(
              child: AnimatedBuilder(
                animation: _smokeController,
                builder: (context, _) => CustomPaint(
                  painter: FluidSmokePainter(time: _smokeController.value * 20),
                ),
              ),
            ),

            // ◈ SHROUD_COMPONENT_OVERLAY (Phase 97)
            if (_shroudRoot != null)
              Positioned.fill(
                child: CustomPaint(painter: PretextPainter(root: _shroudRoot)),
              ),

            Row(
              children: [
                _buildSideRail(primaryColor),
                Expanded(
                  child: Column(
                    children: [
                      _buildModernHeader(primaryColor),
                      Expanded(
                        child: Container(
                          margin: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            border: Border.all(color: const Color(0xFF3C3836), width: 1),
                            color: const Color(0xFF282828).withOpacity(0.4),
                          ),
                          child: PageView(
                            controller: _pageController,
                            physics: const NeverScrollableScrollPhysics(),
                            children: [
                              _buildChatView(),
                              _buildTasksView(),
                              _buildMemoryView(),
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

  // ─── 0. CHAT_VIEW ───────────────────────────────────────────────────────

  Widget _buildChatView() {
    final chatService = context.watch<ChatService>();
    final artery = context.watch<ArteryClient>();

    return Column(
      children: [
        if (artery.isRecording) _buildVoiceOverlay(artery),
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

  Widget _buildVoiceOverlay(ArteryClient artery) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFFfb4934).withOpacity(0.15), border: Border.all(color: const Color(0xFFfb4934), width: 1)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(children: [
            const Icon(Icons.graphic_eq, color: Color(0xFFfb4934), size: 16),
            const SizedBox(width: 8),
            const Text("V01C3_IN6R355_ACTIVE", style: TextStyle(color: Color(0xFFfb4934), fontSize: 10, fontWeight: FontWeight.bold)),
          ]),
          const SizedBox(height: 8),
          Text(artery.currentTranscription.isEmpty ? "LISTENING..." : artery.currentTranscription, style: const TextStyle(color: Color(0xFFfbf1c7), fontSize: 14, fontStyle: FontStyle.italic)),
        ],
      ),
    );
  }

  Widget _buildInputArtery(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: const BoxDecoration(color: Color(0xFF282828), border: Border(top: BorderSide(color: Color(0xFF3C3836)))),
      child: Row(
        children: [
          _tacticalIconButton(artery.isRecording ? Icons.stop : Icons.mic, const Color(0xFFFABD2F), () {
            artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream();
          }),
          const SizedBox(width: 12),
          Expanded(child: TextField(
            controller: _chatController,
            style: const TextStyle(color: Colors.white, fontSize: 16),
            decoration: const InputDecoration(hintText: "ENTER_DIRECTIVE...", border: InputBorder.none)
          )),
          const SizedBox(width: 12),
          _tacticalIconButton(Icons.bolt, const Color(0xFFFB4934), () {
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

  Widget _buildTasksView() {
    final taskService = context.watch<TaskService>();
    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: Row(children: [
            Expanded(child: TextField(
              controller: _taskController,
              style: const TextStyle(color: Colors.white),
              decoration: const InputDecoration(hintText: "NEW_OBJECTIVE...", labelText: "ADD_TASK"),
              onSubmitted: (val) {
                if (val.isNotEmpty) {
                  taskService.addTask(val);
                  _taskController.clear();
                }
              },
            )),
          ]),
        ),
        Expanded(
          child: ListView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            itemCount: taskService.tasks.length,
            itemBuilder: (context, index) {
              final task = taskService.tasks[index];
              return Dismissible(
                key: Key(task.id),
                onDismissed: (_) => taskService.deleteTask(task.id),
                background: Container(color: Colors.red.withOpacity(0.2), child: const Icon(Icons.delete, color: Colors.red)),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 8),
                  decoration: BoxDecoration(border: Border.all(color: const Color(0xFF3C3836)), color: const Color(0xFF282828)),
                  child: ListTile(
                    leading: Checkbox(value: task.isCompleted, onChanged: (_) => taskService.toggleTask(task.id)),
                    title: Text(task.title, style: TextStyle(color: task.isCompleted ? Colors.white24 : Colors.white)),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  // ─── 2. MEMORY_VIEW ──────────────────────────────────────────────────────

  Widget _buildMemoryView() {
    final memoryProvider = context.watch<MemoryProvider>();
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: const BoxDecoration(color: Color(0xFF32302f), border: Border(bottom: BorderSide(color: Color(0xFF3C3836)))),
          child: Row(children: [
            const Icon(Icons.history, color: Color(0xFF83a598), size: 16),
            const SizedBox(width: 8),
            const Text("MEMORY_SHARD_INGRESS", style: TextStyle(color: Color(0xFF83a598), fontSize: 10, fontWeight: FontWeight.bold)),
            const Spacer(),
            IconButton(icon: const Icon(Icons.sync, size: 16, color: Color(0xFFA89984)), onPressed: memoryProvider.fetchMemories),
          ]),
        ),
        Expanded(
          child: memoryProvider.isLoading 
            ? const Center(child: CircularProgressIndicator())
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: memoryProvider.memories.length,
                itemBuilder: (context, index) {
                  final m = memoryProvider.memories[index];
                  return Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 12),
                    decoration: BoxDecoration(border: Border(left: BorderSide(color: Color((m['reputation'] ?? 0) > 5 ? 0xFFb8bb26 : 0xFFfb4934), width: 3)), color: const Color(0xFF282828)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(m['timestamp'] ?? 'DATETIME_UNKNOWN', style: const TextStyle(color: Color(0xFFA89984), fontSize: 8)),
                      const SizedBox(height: 4),
                      Text(m['content'] ?? 'NO_DATA', style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 14)),
                    ]),
                  );
                },
              ),
        ),
      ],
    );
  }

  // ─── 3. TERMINAL_VIEW (High-Density) ────────────────────────────────────

  Widget _buildTerminalView() {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final combined = [...vsb.packets, ...artery.logs].reversed.toList();

    return Column(
      children: [
        Expanded(
          child: Container(
            color: Colors.black,
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: combined.length,
              itemBuilder: (context, index) => Text(combined[index], style: const TextStyle(color: Color(0xFFB8BB26), fontSize: 11, fontFamily: 'monospace')),
            ),
          ),
        ),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12),
          color: const Color(0xFF1D2021),
          child: Row(children: [
            const Text("Σ:/>", style: TextStyle(color: Color(0xFFfb4934), fontWeight: FontWeight.bold)),
            const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: _terminalController,
              focusNode: _terminalFocus,
              style: const TextStyle(color: Colors.white, fontSize: 14, fontFamily: 'monospace'),
              decoration: const InputDecoration(border: InputBorder.none),
              onSubmitted: (val) {
                if (val.isNotEmpty) {
                  artery.sendJsonCommand('SYSTEM_RAW', val);
                  _terminalController.clear();
                }
              },
            )),
          ]),
        ),
      ],
    );
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  Widget _buildSideRail(Color primaryColor) {
    return Container(
      width: 72,
      decoration: const BoxDecoration(border: Border(right: BorderSide(color: Color(0xFF3C3836), width: 2)), color: Color(0xFF282828)),
      child: Column(children: [
        const SizedBox(height: 20),
        Container(width: 40, height: 40, decoration: BoxDecoration(border: Border.all(color: const Color(0xFFFB4934), width: 2)), child: const Center(child: Text("S", style: TextStyle(color: Color(0xFFFB4934), fontWeight: FontWeight.bold)))),
        const SizedBox(height: 40),
        ...List.generate(_navItems.length, (index) {
          final isSelected = _currentIndex == index;
          return GestureDetector(onTap: () => _onTabTapped(index), child: Container(height: 72, width: double.infinity, color: isSelected ? const Color(0xFF3C3836) : Colors.transparent, child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
            Icon(_navItems[index]['icon'], color: isSelected ? primaryColor : const Color(0xFFA89984), size: 28),
            const SizedBox(height: 4),
            Text(_navItems[index]['label'], style: TextStyle(color: isSelected ? primaryColor : const Color(0xFFA89984), fontSize: 8, fontWeight: FontWeight.bold)),
          ])));
        }),
        const Spacer(),
        const Padding(padding: EdgeInsets.only(bottom: 20), child: Icon(Icons.bolt, color: Color(0xFFB8BB26), size: 20)),
      ]),
    );
  }

  Widget _buildModernHeader(Color primaryColor) {
    return Container(
      padding: const EdgeInsets.all(20),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text("50V3R31GN_M4CH1N4", style: TextStyle(color: primaryColor, fontWeight: FontWeight.bold, letterSpacing: 3, fontSize: 20)),
          const Text("TACTICAL_COMMAND_DECK // v3.8.7", style: TextStyle(color: Color(0xFFA89984), fontSize: 10, fontWeight: FontWeight.bold)),
        ]),
        _buildContextRings(),
      ]),
    );
  }

  Widget _tacticalIconButton(IconData icon, Color color, VoidCallback onTap) {
    return GestureDetector(onTap: onTap, child: Container(width: 54, height: 54, decoration: BoxDecoration(border: Border.all(color: color, width: 2), color: color.withOpacity(0.05)), child: Icon(icon, color: color, size: 28)));
  }

  Widget _buildContextRings() {
    return Row(children: [
      _ring(0.85, const Color(0xFFFB4934)),
      const SizedBox(width: 12),
      _ring(0.42, const Color(0xFFB8BB26)),
      const SizedBox(width: 12),
      _ring(0.12, const Color(0xFF83A598)),
    ]);
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(width: 24, height: 24, child: CircularProgressIndicator(value: progress, strokeWidth: 4, color: color, backgroundColor: const Color(0xFF3C3836)));
  }
}
