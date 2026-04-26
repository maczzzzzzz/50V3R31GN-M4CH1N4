import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/task_service.dart';
import '../services/vsb_listener.dart';
import '../widgets/pretext_painter.dart';
import 'terminal_screen.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_DASHBOARD — PHASE 93.9 RE-GROUNDED
 * 
 * Total UI Remodel: High-density, tactical terminal HUD.
 * Fixes: Navigation hang, small text, and permission gaps.
 * Maintains: OMI base functionality (Voice, Transcripts, Tasks).
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
  final ScrollController _scrollController = ScrollController();

  final List<String> _tabs = ['HOME', 'TASKS', 'MEMORY', 'TERM', 'SETTINGS'];

  @override
  void dispose() {
    _pageController.dispose();
    _controller.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  void _onPageChanged(int index) {
    setState(() => _currentIndex = index);
  }

  void _onTabTapped(int index) {
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeInOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primaryColor = theme.primaryColor;
    final bgColor = theme.scaffoldBackgroundColor;

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ◈ MONOLITHIC_HEADER
            _buildHeader(primaryColor),

            // ◈ MAIN_VIEWPORT (PageView prevents hang)
            Expanded(
              child: PageView(
                controller: _pageController,
                onPageChanged: _onPageChanged,
                children: [
                  _buildChatView(),
                  _buildTasksView(),
                  _buildPlaceholder("MEMORY_SHARD"),
                  _buildTerminalView(),
                  _buildPlaceholder("SETTINGS_NODE"),
                ],
              ),
            ),

            // ◈ TACTICAL_NAV_BAR (Large Touch Targets)
            _buildBottomNav(primaryColor),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(Color primaryColor) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      decoration: const BoxDecoration(
        border: Border(bottom: BorderSide(color: Color(0xFF3C3836), width: 2)),
        color: Color(0xFF282828),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                "50V3R31GN_M4CH1N4",
                style: TextStyle(
                  color: primaryColor,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                  fontSize: 18,
                ),
              ),
              Text(
                "INTELLIGENCE_OS // ${_tabs[_currentIndex]}",
                style: const TextStyle(color: Color(0xFFA89984), fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ],
          ),
          _buildContextRings(),
        ],
      ),
    );
  }

  // ─── 0. CHAT_VIEW (Pretext) ──────────────────────────────────────────────

  Widget _buildChatView() {
    final chatService = context.watch<ChatService>();
    final artery = context.watch<ArteryClient>();

    return Column(
      children: [
        if (artery.isRecording) _buildTranscriptionOverlay(artery),
        Expanded(
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: ListView.builder(
              controller: _scrollController,
              itemCount: chatService.messages.length,
              itemBuilder: (context, index) {
                final msg = chatService.messages[index];
                return _buildPretextMessage(msg);
              },
            ),
          ),
        ),
        _buildInputArtery(artery),
      ],
    );
  }

  Widget _buildPretextMessage(msg) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            "::/${msg.sender.toUpperCase()}",
            style: const TextStyle(color: Color(0xFFFE8019), fontSize: 10, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 4),
          Text(
            msg.text,
            style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 16, height: 1.4),
          ),
        ],
      ),
    );
  }

  Widget _buildTranscriptionOverlay(ArteryClient artery) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFFB4934).withOpacity(0.1),
        border: Border.all(color: const Color(0xFFFB4934), width: 1),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        "⟨ V01C3_IN6R355 ⟩ : ${artery.currentTranscription}",
        style: const TextStyle(color: Color(0xFFFB4934), fontSize: 14, fontStyle: FontStyle.italic),
      ),
    );
  }

  Widget _buildInputArtery(ArteryClient artery) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: const BoxDecoration(
        color: Color(0xFF282828),
        border: Border(top: BorderSide(color: Color(0xFF3C3836), width: 2)),
      ),
      child: Row(
        children: [
          _buildTacticalButton(
            icon: artery.isRecording ? Icons.stop : Icons.mic,
            color: artery.isRecording ? Colors.red : const Color(0xFFFABD2F),
            onPressed: () => artery.isRecording ? artery.stopVoiceStream() : artery.startVoiceStream(),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: TextField(
              controller: _controller,
              style: const TextStyle(color: Colors.white, fontSize: 16),
              decoration: const InputDecoration(
                hintText: "ENTER_DIRECTIVE...",
                border: InputBorder.none,
                contentPadding: EdgeInsets.zero,
              ),
              onSubmitted: (_) => _handleSend(),
            ),
          ),
          _buildTacticalButton(
            icon: Icons.bolt,
            color: const Color(0xFFFB4934),
            onPressed: _handleSend,
          ),
        ],
      ),
    );
  }

  Widget _buildTacticalButton({required IconData icon, required Color color, required VoidCallback onPressed}) {
    return Container(
      width: 48,
      height: 48,
      decoration: BoxDecoration(
        border: Border.all(color: color, width: 1.5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: IconButton(
        icon: Icon(icon, color: color, size: 24),
        onPressed: onPressed,
        padding: EdgeInsets.zero,
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
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        final task = taskService.tasks[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          decoration: BoxDecoration(
            border: Border.all(color: const Color(0xFF3C3836)),
            color: const Color(0xFF282828).withOpacity(0.5),
          ),
          child: ListTile(
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            leading: Checkbox(
              value: task.isCompleted, 
              onChanged: (_) => taskService.toggleTask(task.id),
              visualDensity: VisualDensity.comfortable,
            ),
            title: Text(
              task.title, 
              style: TextStyle(
                color: task.isCompleted ? Colors.white24 : Colors.white,
                fontSize: 16,
              ),
            ),
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
      child: ListView.builder(
        itemCount: combined.length,
        padding: const EdgeInsets.all(12),
        itemBuilder: (context, index) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: Text(
              combined[index],
              style: const TextStyle(color: Color(0xFFB8BB26), fontSize: 12, fontFamily: 'monospace'),
            ),
          );
        },
      ),
    );
  }

  // ─── UTILS ───────────────────────────────────────────────────────────────

  Widget _buildBottomNav(Color primaryColor) {
    return Container(
      height: 70,
      decoration: const BoxDecoration(
        border: Border(top: BorderSide(color: Color(0xFF3C3836), width: 2)),
        color: Color(0xFF282828),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: List.generate(_tabs.length, (index) {
          final isSelected = _currentIndex == index;
          return Expanded(
            child: GestureDetector(
              onTap: () => _onTabTapped(index),
              behavior: HitTestBehavior.opaque,
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.square,
                    size: 16,
                    color: isSelected ? primaryColor : const Color(0xFFA89984),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    _tabs[index],
                    style: TextStyle(
                      color: isSelected ? primaryColor : const Color(0xFFA89984),
                      fontSize: 10,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildPlaceholder(String label) {
    return Center(
      child: Text(
        "::/$label\_OFFLINE",
        style: const TextStyle(color: Colors.white12, fontSize: 18, fontWeight: FontWeight.bold),
      ),
    );
  }

  Widget _buildContextRings() {
    return Row(
      children: [
        _ring(0.85, const Color(0xFFFB4934)),
        const SizedBox(width: 10),
        _ring(0.42, const Color(0xFFB8BB26)),
        const SizedBox(width: 10),
        _ring(0.12, const Color(0xFF83A598)),
      ],
    );
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(
      width: 24,
      height: 24,
      child: CircularProgressIndicator(
        value: progress, 
        strokeWidth: 3, 
        color: color, 
        backgroundColor: const Color(0xFF3C3836)
      ),
    );
  }
}
