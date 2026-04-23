import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:uuid/uuid.dart';
import 'package:http/http.dart' as http;
import '../models/chat_message.dart';

class ChatService extends ChangeNotifier {
  List<ChatMessage> _messages = [];
  final _uuid = const Uuid();
  bool _isSyncing = false;

  List<ChatMessage> get messages => _messages;
  bool get isSyncing => _isSyncing;

  ChatService() {
    _loadHistory();
  }

  Future<void> _loadHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = prefs.getStringList('chat_history') ?? [];
    _messages = historyJson.map((m) => ChatMessage.fromJson(jsonDecode(m))).toList();
    notifyListeners();
  }

  Future<void> _saveHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyJson = _messages.map((m) => jsonEncode(m.toJson())).toList();
    await prefs.setStringList('chat_history', historyJson);
  }

  Future<void> sendMessage(String text) async {
    final userMsg = ChatMessage(
      id: _uuid.v4(),
      sender: 'USER',
      text: text,
      timestamp: DateTime.now(),
    );
    
    _messages.add(userMsg);
    notifyListeners();
    await _saveHistory();

    // Trigger Hermes Response (Mocking the logic that would usually go to Node B/C)
    // In a real scenario, this would POST to Artery Manager
    Future.delayed(const Duration(seconds: 1), () async {
      final hermesMsg = ChatMessage(
        id: _uuid.v4(),
        sender: 'HERMES',
        text: 'Awaiting Artery Sync. Logic verified.',
        timestamp: DateTime.now(),
      );
      _messages.add(hermesMsg);
      notifyListeners();
      await _saveHistory();
      
      // Auto-sync attempt
      syncWithNodeC();
    });
  }

  Future<void> syncWithNodeC() async {
    if (_isSyncing) return;
    
    final prefs = await SharedPreferences.getInstance();
    final ip = prefs.getString('node_c_ip');
    final port = prefs.getString('node_c_port');
    if (ip == null || port == null) return;

    final unsynced = _messages.where((m) => !m.isSynced).toList();
    if (unsynced.isEmpty) return;

    _isSyncing = true;
    notifyListeners();

    try {
      final secure = prefs.getBool('secure_tunnel') ?? false;
      final protocol = secure ? 'https' : 'http';
      final url = '$protocol://$ip:$port/sync/chat';

      final response = await http.post(
        Uri.parse(url),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(unsynced.map((m) => m.toJson()).toList()),
      ).timeout(const Duration(seconds: 5));

      if (response.statusCode == 200) {
        // Mark all as synced
        for (var i = 0; i < _messages.length; i++) {
          if (!_messages[i].isSynced) {
            _messages[i] = _messages[i].copyWith(isSynced: true);
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
    _messages.clear();
    await _saveHistory();
    notifyListeners();
  }
}
