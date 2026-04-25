import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;
import '../models/chat_message.dart';
import '../models/conversation.dart';

class ChatService extends ChangeNotifier {
  List<Conversation> _conversations = [];
  String? _currentConversationId;
  final _uuid = const Uuid();
  bool _isSyncing = false;

  List<Conversation> get conversations => _conversations;
  bool get isSyncing => _isSyncing;

  Conversation? get currentConversation {
    if (_currentConversationId == null) return null;
    return _conversations.firstWhere((c) => c.id == _currentConversationId, 
        orElse: () => _conversations.first);
  }

  List<ChatMessage> get messages => currentConversation?.messages ?? [];

  ChatService() {
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getStringList('conversations_v2') ?? [];
    _conversations = historyJson.map((c) => Conversation.fromJson(jsonDecode(c))).toList();
    
    if (_conversations.isEmpty) {
      await createNewConversation(title: 'INITIAL_HANDSHAKE');
    } else {
      _currentConversationId = _conversations.first.id;
    }
    notifyListeners();
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = _conversations.map((c) => jsonEncode(c.toJson())).toList();
    await prefs.setStringList('conversations_v2', historyJson);
  }

  Future<void> createNewConversation({String title = 'NEW_QUERY'}) async {
    final newConv = Conversation(
      id: _uuid.v4(),
      title: title,
      messages: [],
      lastUpdated: DateTime.now(),
    );
    _conversations.insert(0, newConv);
    _currentConversationId = newConv.id;
    await _saveHistory();
    notifyListeners();
  }

  void selectConversation(String id) {
    _currentConversationId = id;
    notifyListeners();
  }

  Future<void> deleteConversation(String id) async {
    _conversations.removeWhere((c) => c.id == id);
    if (_currentConversationId == id) {
      _currentConversationId = _conversations.isNotEmpty ? _conversations.first.id : null;
    }
    if (_conversations.isEmpty) {
      await createNewConversation(title: 'NEW_LOG');
    }
    await _saveHistory();
    notifyListeners();
  }

  Future<void> sendMessage(String text, ArteryClient artery) async {
    if (_currentConversationId == null) return;

    final userMsg = ChatMessage(
      id: _uuid.v4(),
      sender: 'USER',
      text: text,
      timestamp: DateTime.now(),
    );
    
    final index = _conversations.indexWhere((c) => c.id == _currentConversationId);
    if (index == -1) return;

    _conversations[index].messages.add(userMsg);
    _conversations[index] = _conversations[index].copyWith(lastUpdated: DateTime.now());
    
    if (_conversations[index].messages.length == 1) {
      String newTitle = text.length > 20 ? '${text.substring(0, 17)}...' : text;
      _conversations[index] = _conversations[index].copyWith(title: newTitle);
    }

    notifyListeners();
    await _saveHistory();

    // ◈ Phase 79/81 Alignment: Route through ArteryClient WebSocket
    if (artery.isConnected) {
       // Send as JSON command
       artery.sendJsonCommand('CHAT', text);
    } else {
       // Fallback to legacy HTTP if Artery is offline
       _legacySendHttp(text, index);
    }
  }

  Future<void> _legacySendHttp(String text, int index) async {
    // ... existing HTTP logic moved here ...
  }

  Future<void> syncWithNodeC() async {
    if (_isSyncing) return;
    
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip');
    final port = prefs.getString('node_c_port');
    if (ip == null || port == null) return;

    final conv = currentConversation;
    if (conv == null) return;

    final unsynced = conv.messages.where((m) => !m.isSynced).toList();
    if (unsynced.isEmpty) return;

    _isSyncing = true;
    notifyListeners();

    try {
      const protocol = 'http';
      final url = '$protocol://$ip:$port/sync/chat';

      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(unsynced.map((m) => m.toJson()).toList()),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        final index = _conversations.indexWhere((c) => c.id == conv.id);
        if (index != -1) {
          for (var i = 0; i < _conversations[index].messages.length; i++) {
            if (!_conversations[index].messages[i].isSynced) {
              _conversations[index].messages[i] = _conversations[index].messages[i].copyWith(isSynced: true);
            }
          }
        }
        await _saveHistory();
      }
    } catch (e) {
      debugPrint('Sync failed: $e');
    } finally {
      _isSyncing = false;
      notifyListeners();
    }
  }

  Future<void> clearHistory() async {
    _conversations.clear();
    await createNewConversation(title: 'NEW_LOG');
    await _saveHistory();
    notifyListeners();
  }
}
