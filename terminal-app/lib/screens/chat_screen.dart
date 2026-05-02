import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/chat_service.dart';
import '../services/artery_client.dart';
import '../services/database_service.dart';
import '../models/chat_message.dart';
import '../models/conversation.dart';
import '../widgets/geometric_shard.dart';
import '../widgets/refinement_slate.dart';

/**
 * ◈ CHAT_SCREEN : HERMES_INGRESS — v3.8.25
 */

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
      final artery = context.read<ArteryClient>();
      context.read<ChatService>().sendMessage(text, artery);
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
    final accentColor = const Color(0xFFF36622);
    final currentConversation = chatService.currentConversation;

    return Scaffold(
      backgroundColor: const Color(0xFF0A0A0A),
      appBar: AppBar(
        title: Text(currentConversation?.title.toUpperCase() ?? 'HERMES_INGRESS'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_comment, size: 20),
            onPressed: () => chatService.createNewConversation(),
          ),
          IconButton(
            icon: const Icon(Icons.sync, size: 20),
            onPressed: chatService.syncWithNodeC,
          ),
        ],
      ),
      drawer: _buildClinicalDrawer(context, chatService),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              controller: _scrollController,
              padding: const EdgeInsets.all(24.0),
              itemCount: chatService.messages.length,
              itemBuilder: (context, index) {
                final msg = chatService.messages[index];
                final isUser = msg.sender == 'USER';
                return GeometricShard(
                  borderColor: isUser ? const Color(0xFFF36622) : const Color(0xFFC7A87A),
                  title: Text("::/${msg.sender.toUpperCase()}", style: TextStyle(color: isUser ? const Color(0xFFF36622) : const Color(0xFFC7A87A), fontSize: 9, fontWeight: FontWeight.black, letterSpacing: 2)),
                  subtitle: Text(msg.text, style: const TextStyle(fontSize: 15, color: Color(0xFFE5E5E5), height: 1.4)),
                  trailing: Text(
                    TimeOfDay.fromDateTime(msg.timestamp).format(context),
                    style: const TextStyle(fontSize: 8, color: Color(0xFF404040), fontWeight: FontWeight.black),
                  ),
                );
              },
            ),
          ),
          if (chatService.isSyncing)
            const LinearProgressIndicator(minHeight: 2, color: Color(0xFFF36622), backgroundColor: Colors.transparent),
          Container(
            padding: const EdgeInsets.all(16.0),
            decoration: const BoxDecoration(
              color: Color(0xFF161616),
              border: Border(top: BorderSide(color: Color(0xFF262626))),
            ),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _controller,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    decoration: const InputDecoration(
                      hintText: 'ENTER_DIRECTIVE',
                      border: InputBorder.none,
                      contentPadding: EdgeInsets.symmetric(horizontal: 12),
                    ),
                    onSubmitted: (_) => _sendMessage(),
                  ),
                ),
                const SizedBox(width: 16),
                _brutalistSendButton(_sendMessage, accentColor),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _brutalistSendButton(VoidCallback onPressed, Color color) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          border: Border.all(color: color, width: 2),
          color: color.withOpacity(0.05),
        ),
        child: Icon(Icons.bolt, color: color, size: 20),
      ),
    );
  }

  Widget _buildClinicalDrawer(BuildContext context, ChatService chatService) {
    return Drawer(
      backgroundColor: const Color(0xFF0F0F0F),
      child: Column(
        children: [
          const DrawerHeader(
            decoration: BoxDecoration(border: Border(bottom: BorderSide(color: Color(0xFF262626)))),
            child: Center(
              child: Text('LOG_ARCHIVE', style: TextStyle(color: Color(0xFFF36622), fontSize: 18, fontWeight: FontWeight.black, letterSpacing: 4, fontFamily: 'Space Grotesk')),
            ),
          ),
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: chatService.conversations.length,
              itemBuilder: (context, index) {
                final conv = chatService.conversations[index];
                final isSelected = conv.id == chatService.currentConversation?.id;
                return GeometricShard(
                  borderColor: isSelected ? const Color(0xFFF36622) : const Color(0xFF262626),
                  onTap: () {
                    chatService.selectConversation(conv.id);
                    Navigator.pop(context);
                  },
                  title: Text(conv.title.toUpperCase(), style: TextStyle(color: isSelected ? Colors.white : const Color(0xFFA3A3A3), fontSize: 12, fontWeight: FontWeight.black, letterSpacing: 1)),
                  subtitle: Text('${conv.messages.length} ENTRIES', style: const TextStyle(fontSize: 8, color: Color(0xFF404040), fontWeight: FontWeight.black)),
                );
              },
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: _brutalistDeleteButton(chatService.clearHistory),
          ),
        ],
      ),
    );
  }

  Widget _brutalistDeleteButton(VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        height: 50,
        decoration: BoxDecoration(
          border: Border.all(color: Colors.red, width: 1),
          color: Colors.red.withOpacity(0.05),
        ),
        child: const Center(
          child: Text("PURGE_ALL_LOGS", style: TextStyle(color: Colors.red, fontWeight: FontWeight.black, letterSpacing: 2, fontSize: 10)),
        ),
      ),
    );
  }
}
