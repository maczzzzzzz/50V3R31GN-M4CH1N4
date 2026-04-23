import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../models/chat_message.dart';
import 'main_layout.dart';

class ChatScreen extends StatefulWidget {
  const ChatScreen({super.key});

  @override
  State<ChatScreen> createState() => _ChatScreenState();
}

class _ChatScreenState extends State<ChatScreen> {
  final TextEditingController _controller = TextEditingController();
  final ScrollController _scrollController = ScrollController();

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isNotEmpty) {
      context.read<ChatService>().sendMessage(text);
      _controller.clear();
      _scrollToBottom();
    }
  }

  void _scrollToBottom() {
    Future.delayed(const Duration(milliseconds: 100), () {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final chatService = context.watch<ChatService>();
    final primaryColor = Theme.of(context).primaryColor;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('HERMES // CHAT'),
            const Spacer(),
            if (chatService.isSyncing)
              const SizedBox(
                width: 16,
                height: 16,
                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
              ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: chatService.syncWithNodeC,
          ),
          IconButton(
            icon: const Icon(Icons.delete_sweep),
            onPressed: chatService.clearHistory,
          ),
        ],
      ),
      body: Stack(
        children: [
          Positioned.fill(child: IgnorePointer(child: CustomPaint(painter: ScanLinePainter(color: primaryColor)))),
          Column(
            children: [
              Expanded(
                child: ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16.0),
                  itemCount: chatService.messages.length,
                  itemBuilder: (context, index) {
                    final msg = chatService.messages[index];
                    final isUser = msg.sender == 'USER';
                    return Align(
                      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.symmetric(vertical: 4.0),
                        padding: const EdgeInsets.all(12.0),
                        decoration: BoxDecoration(
                          color: isUser ? primaryColor.withValues(alpha: 0.1) : Colors.black54,
                          border: Border.all(color: primaryColor.withValues(alpha: 0.3)),
                          borderRadius: BorderRadius.circular(8.0),
                        ),
                        child: Column(
                          crossAxisAlignment: isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                          children: [
                            Text(msg.text, style: const TextStyle(fontSize: 16)),
                            const SizedBox(height: 4),
                            Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Text(
                                  TimeOfDay.fromDateTime(msg.timestamp).format(context),
                                  style: const TextStyle(fontSize: 10, color: Colors.white24),
                                ),
                                if (isUser) ...[
                                  const SizedBox(width: 4),
                                  Icon(
                                    msg.isSynced ? Icons.cloud_done : Icons.cloud_off,
                                    size: 10,
                                    color: msg.isSynced ? primaryColor : Colors.white24,
                                  ),
                                ],
                              ],
                            ),
                          ],
                        ),
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
                        decoration: const InputDecoration(
                          hintText: 'ENTER QUERY...',
                        ),
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                    const SizedBox(width: 8),
                    IconButton(
                      icon: const Icon(Icons.send),
                      color: primaryColor,
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
