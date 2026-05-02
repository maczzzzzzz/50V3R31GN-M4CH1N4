import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../widgets/pretext_painter.dart';
import 'dart:ui' as ui;

/**
 * PRETEXT_SCREEN — PHASE 92, TASK 4
 * 
 * Monolithic Mobile HUD using low-level Pretext rendering.
 * Achieves 100% design parity with the Pretext Shroud (Next.js).
 */

class PretextScreen extends StatefulWidget {
  const PretextScreen({super.key});

  @override
  State<PretextScreen> createState() => _PretextScreenState();
}

class _PretextScreenState extends State<PretextScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  @override
  Widget build(BuildContext context) {
    final chatService = context.watch<ChatService>();
    final primaryColor = const Color(0xFFFB4934); // Clinical Red
    final bgColor = const Color(0xFF1D2021); // Clinical Dark

    return Scaffold(
      backgroundColor: bgColor,
      body: SafeArea(
        child: Column(
          children: [
            // ◈ MONOLITHIC_HEADER
            Container(
              padding: const EdgeInsets.all(16),
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
                        "50V3R31GN_M4CH1N4 // HUD_V2",
                        style: TextStyle(
                          color: primaryColor,
                          fontWeight: ui.FontWeight.bold,
                          letterSpacing: 2.0,
                          fontSize: 12,
                        ),
                      ),
                      const Text(
                        "MOBILE_PRETEXT_ARTERY",
                        style: TextStyle(color: Color(0xFFA89984), fontSize: 8),
                      ),
                    ],
                  ),
                  _buildContextRings(),
                ],
              ),
            ),

            // ◈ PRETEXT_FLOW_ZONE (The Terminal)
            Expanded(
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(12),
                child: ListView.builder(
                  controller: _scrollController,
                  itemCount: chatService.messages.length,
                  itemBuilder: (context, index) {
                    final msg = chatService.messages[index];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8.0),
                      child: CustomPaint(
                        size: const ui.Size(double.infinity, 60), // Dynamic height TODO
                        painter: PretextPainter(
                          text: "::/${msg.sender} : ${msg.text}",
                          style: const TextStyle(
                            color: Color(0xFFEBDBB2),
                            fontSize: 14,
                            fontFamily: 'monospace',
                          ),
                        ),
                      ),
                    );
                  },
                ),
              ),
            ),

            // ◈ INPUT_ARTERY
            Container(
              padding: const EdgeInsets.all(12),
              decoration: const BoxDecoration(
                border: Border(top: BorderSide(color: Color(0xFF3C3836))),
                color: Color(0xFF282828),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _controller,
                      style: const TextStyle(color: Color(0xFFEBDBB2), fontSize: 12),
                      decoration: const InputDecoration(
                        hintText: "ENTER_DIRECTIVE...",
                        hintStyle: TextStyle(color: Color(0xFF665C54)),
                        border: InputBorder.none,
                      ),
                      onSubmitted: (val) => _handleSend(),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.bolt, color: primaryColor),
                    onPressed: _handleSend,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleSend() {
    if (_controller.text.isEmpty) return;
    final artery = context.read<ArteryClient>();
    context.read<ChatService>().sendMessage(_controller.text, artery);
    _controller.clear();
    // Scroll logic...
  }

  Widget _buildContextRings() {
    return Row(
      gap: 8,
      children: [
        _ring(0.85, const Color(0xFFFB4934)), // Node A
        _ring(0.42, const Color(0xFFB8BB26)), // Node B
        _ring(0.12, const Color(0xFF83A598)), // Node C
      ],
    );
  }

  Widget _ring(double progress, Color color) {
    return SizedBox(
      width: 20,
      height: 20,
      child: CircularProgressIndicator(
        value: progress,
        strokeWidth: 2,
        color: color,
        backgroundColor: const Color(0xFF3C3836),
      ),
    );
  }
}

extension on Row {
  Widget gap(double width) => Row(children: children.expand((c) => [c, SizedBox(width: width)]).toList()..removeLast());
}
