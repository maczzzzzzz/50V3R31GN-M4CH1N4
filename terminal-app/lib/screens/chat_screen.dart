import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../models/chat_message.dart';
import '../models/conversation.dart';
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
    final currentConversation = chatService.currentConversation;

    return Scaffold(
      appBar: AppBar(
        title: Text(currentConversation?.title ?? 'HERMES // CHAT'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment),
            onPressed: () => chatService.createNewConversation(),
          ),
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: chatService.syncWithNodeC,
          ),
        ],
      ),
      drawer: _buildConversationDrawer(context, chatService),
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
              if (chatService.isSyncing)
                const LinearProgressIndicator(minHeight: 2),
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

  Widget _buildConversationDrawer(BuildContext context, ChatService chatService) {
    final primaryColor = Theme.of(context).primaryColor;
    return Drawer(
      backgroundColor: Colors.black,
      child: Column(
        children: [
          DrawerHeader(
            decoration: BoxDecoration(color: primaryColor.withValues(alpha: 0.1)),
            child: Center(
              child: Text('LOG_ARCHIVE', style: TextStyle(color: primaryColor, fontSize: 24)),
            ),
          ),
          Expanded(
            child: ListView.builder(
              itemCount: chatService.conversations.length,
              itemBuilder: (context, index) {
                final conv = chatService.conversations[index];
                final isSelected = conv.id == chatService.currentConversation?.id;
                return ListTile(
                  title: Text(conv.title, style: TextStyle(color: isSelected ? primaryColor : Colors.white)),
                  subtitle: Text(
                    '${conv.messages.length} ENTRIES',
                    style: const TextStyle(fontSize: 10, color: Colors.white24),
                  ),
                  trailing: IconButton(
                    icon: const Icon(Icons.delete_outline, size: 18),
                    onPressed: () => chatService.deleteConversation(conv.id),
                  ),
                  onTap: () {
                    chatService.selectConversation(conv.id);
                    Navigator.pop(context);
                  },
                );
              },
            ),
          ),
          ListTile(
            leading: Icon(Icons.delete_sweep, color: primaryColor),
            title: const Text('PURGE_ALL_LOGS'),
            onTap: chatService.clearHistory,
          ),
        ],
      ),
    );
  }
}
