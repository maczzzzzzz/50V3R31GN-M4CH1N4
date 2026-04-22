import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/artery_client.dart';
import 'main_layout.dart'; // For ScanLinePainter if needed, but we can just use the global one in MainLayout. 
// Wait, ChatScreen is pushed over MainLayout, so it needs its own ScanLinePainter.

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final List<String> _messages = [];

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      setState(() {
        _messages.add("USER: $text");
      });
      _controller.clear();
      
      // Mock hermes response via ArteryClient
      final artery = context.read<ArteryClient>();
      artery.addLog("::/HERMES_CMD : Received text query");
      
      Future.delayed(const Duration(seconds: 1), () {
        if (mounted) {
          setState(() {
            _messages.add("HERMES: Acknowledged. Query processing.");
          });
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('HERMES // CHAT'),
        backgroundColor: Colors.black,
      ),
      body: Stack(
        children: [
          Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: ScanLinePainter()))),
          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16.0),
                  itemCount: _messages.length,
                  itemBuilder: (context, index) {
                    final msg = _messages[index];
                    final isUser = msg.startsWith("USER:");
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4.0),
                        padding: const EdgeInsets.all(12.0),
                        decoration: BoxDecoration(
                          color: isUser ? const Color(0xFF00FF88).withValues(alpha: 0.2) : Colors.black54,
                          border: Border.all(color: const Color(0xFF00FF88).withValues(alpha: 0.5)),
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                        child: Text(msg, style: const TextStyle(fontSize: 16)),
                      ),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(8.0),
                color: Colors.black,
                child: Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _controller,
                        style: const TextStyle(color: Color(0xFF00FF88)),
                        decoration: InputDecoration(
                          hintText: 'ENTER QUERY...',
                          hintStyle: TextStyle(color: const Color(0xFF00FF88).withValues(alpha: 0.5)),
                          enabledBorder: const OutlineInputBorder(
                            borderSide: BorderSide(color: Color(0xFF00FF88)),
                          ),
                          focusedBorder: const OutlineInputBorder(
                            borderSide: BorderSide(color: Color(0xFF00FF88)),
                          ),
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.send),
                      color: const Color(0xFF00FF88),
                      onPressed: _sendMessage,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
