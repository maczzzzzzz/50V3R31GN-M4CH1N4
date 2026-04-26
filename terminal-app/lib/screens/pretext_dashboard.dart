import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/task_service.dart';
import '../services/vsb_listener.dart';
import '../widgets/pretext_painter.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_DASHBOARD — PHASE 92, TASK 4
 * 
 * Total UI Remodel: Monolithic, high-density terminal HUD.
 * Maintains all companion functionality: Voice, Tasks, Terminal, Memory.
 */

class PretextDashboard extends StatefulWidget {
  const PretextDashboard({super.key});

  @override
  State<PretextDashboard> createState() => _PretextDashboardState();
}

class _PretextDashboardState extends State<PretextDashboard> {
  int _currentIndex = 0;
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  final List<String> _tabs = ['HOME', 'TASKS', 'MEMORY', 'TERM', 'SETTINGS'];

  @override
  Widget build(BuildContext context) {
    final primaryColor = const Color(0xFFFB4934); // Gruvbox Red
    final bgColor = const Color(0xFF1D2021); // Gruvbox Dark

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ◈ MONOLITHIC_HEADER (Persistent)
            _buildHeader(primaryColor),

            // ◈ MAIN_VIEWPORT
            Expanded(
              child: _buildActiveTab(),
            ),

            // ◈ TACTICAL_NAV_BAR
            _buildBottomNav(primaryColor),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(Color primaryColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFF3C3836))),
        color: Color(0xFF282828),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "50V3R31GN_M4CH1N4 // ${_tabs[_currentIndex]}",
                style: TextStyle(
                  color: primaryColor,
                  fontWeight: ui.FontWeight.bold,
                  letterSpacing: 2.0,
                  fontSize: 12,
                ),
              ),
              const Text(
                "INTELLIGENCE_OS_v3.8.7",
                style: TextStyle(color: Color(0xFFA89984), fontSize: 8),
              ),
            ],
          ),
          _buildContextRings(),
        ],
      ),
    );
  }

  Widget _buildActiveTab() {
    switch (_currentIndex) {
      case 0: return _buildChatView();
      case 1: return _buildTasksView();
      case 3: return _buildTerminalView();
      default: return Center(child: Text("::/SHARD_${_tabs[_currentIndex]}_STUB", style: const TextStyle(color: Colors.white24)));
    }
  }

  // ─── 0. CHAT_VIEW (Pretext) ──────────────────────────────────────────────

  Widget _buildChatView() {
    final chatService = context.watch<ChatService>();
    final artery = context.watch<ArteryClient>();

    return Column(
      children: [
        if (artery.isRecording) _buildTranscriptionOverlay(artery),
        Expanded(
          child: ListView.builder(
            controller: _scrollController,
            itemCount: chatService.messages.length,
            itemBuilder: (context, index) {
              final msg = chatService.messages[index];
              return _buildPretextMessage(msg);
            },
          ),
        ),
        _buildInputArtery(artery),
      ],
    );
  }

  Widget _buildPretextMessage(msg) {
    // ◈ Swipe-to-Fork Gesture Implementation
    return GestureDetector(
      onHorizontalDragEnd: (details) {
        if (details.primaryVelocity! < -500) {
          debugPrint("::/SWIPE_TO_FORK : Reasoning Branch Triggered");
          // TODO: Invoke ContextDAG.fork RPC
        }
      },
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: CustomPaint(
          size: const ui.Size(double.infinity, 50),
          painter: PretextPainter(
            text: "::/${msg.sender} : ${msg.text}",
            style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 13, fontFamily: 'monospace'),
          ),
        ),
      ),
    );
  }

  Widget _buildTranscriptionOverlay(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.all(8),
      color: const Color(0xFFFB4934).withOpacity(0.1),
      child: Text(
        "⟨ TRANSCRIPTION ⟩ : ${artery.currentTranscription}",
        style: const TextStyle(color: Color(0xFFFB4934), fontSize: 10, fontStyle: ui.FontStyle.italic),
      ),
    );
  }

  Widget _buildInputArtery(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: const Color(0xFF282828),
      child: Row(
        children: [
          IconButton(
            icon: Icon(artery.isRecording ? Icons.stop : Icons.mic, color: artery.isRecording ? Colors.red : const Color(0xFFFABD2F)),
            onPressed: () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
          ),
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white, fontSize: 12),
              decoration: const InputDecoration(hintText: "ENTER_QUERY...", border: InputBorder.none),
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.bolt, color: Color(0xFFFB4934)),
            onPressed: _handleSend,
          ),
        ],
      ),
    );
  }

  void _handleSend() {
    if (_controller.text.isEmpty) return;
    context.read<ChatService>().sendMessage(_controller.text, context.read<ArteryClient>());
    _controller.clear();
  }

  // ─── 1. TASKS_VIEW ───────────────────────────────────────────────────────

  Widget _buildTasksView() {
    final taskService = context.watch<TaskService>();
    return ListView.builder(
      itemCount: taskService.tasks.length,
      itemBuilder: (context, index) {
        final task = taskService.tasks[index];
        return ListTile(
          leading: Checkbox(value: task.isCompleted, onChanged: (_) => taskService.toggleTask(task.id)),
          title: Text(task.title, style: TextStyle(color: task.isCompleted ? Colors.white24 : Colors.white)),
        );
      },
    );
  }

  // ─── 3. TERMINAL_VIEW (Pretext Logs) ─────────────────────────────────────

  Widget _buildTerminalView() {
    final vsb = context.watch<VsbListener>();
    final artery = context.watch<ArteryClient>();
    final combined = [...vsb.packets, ...artery.logs].reversed.toList();

    return ListView.builder(
      itemCount: combined.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 2),
          child: CustomPaint(
            size: const ui.Size(double.infinity, 20),
            painter: PretextPainter(
              text: combined[index],
              style: const TextStyle(color: Color(0xFFB8BB26), fontSize: 10, fontFamily: 'monospace'),
            ),
          ),
        );
      },
    );
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  Widget _buildBottomNav(Color primaryColor) {
    return BottomNavigationBar(
      currentIndex: _currentIndex,
      onTap: (i) => setState(() => _currentIndex = i),
      backgroundColor: const Color(0xFF282828),
      selectedItemColor: primaryColor,
      unselectedItemColor: const Color(0xFFA89984),
      selectedFontSize: 8,
      unselectedFontSize: 8,
      type: BottomNavigationBarType.fixed,
      items: _tabs.map((t) => BottomNavigationBarItem(icon: const Icon(Icons.square, size: 12), label: t)).toList(),
    );
  }

  Widget _buildContextRings() {
    return Row(
      children: [
        _ring(0.85, const Color(0xFFFB4934)),
        const SizedBox(width: 8),
        _ring(0.42, const Color(0xFFB8BB26)),
        const SizedBox(width: 8),
        _ring(0.12, const Color(0xFF83A598)),
      ],
    );
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(
      width: 16,
      height: 16,
      child: CircularProgressIndicator(value: progress, strokeWidth: 1.5, color: color, backgroundColor: const Color(0xFF3C3836)),
    );
  }
}
